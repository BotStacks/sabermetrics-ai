/**
 * Sabermetrics staging API edge (PRD-1197).
 *
 * Isolated Worker gateway in front of sandbox-api. Does not change the
 * production sabermetrics-ai assets Worker on sabermetrics.ai.
 */

export interface Env {
  ORIGIN: string;
  ALLOWED_ORIGINS: string;
  EDGE_SHARED_SECRET?: string;
  TURNSTILE_SECRET?: string;
  /** Upstream fetch timeout in ms (default 55000). */
  UPSTREAM_TIMEOUT_MS?: string;
  RATE_LIMITER?: {
    limit: (opts: { key: string }) => Promise<{ success: boolean }>;
  };
}

export const NO_CACHE_PREFIXES = [
  "/webhooks/",
  "/auth/",
  "/widget/session",
  "/widget/chat",
  "/widget/handoff",
  "/widget/skill",
  "/v1/",
  "/billing/",
  "/stripe/",
] as const;

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
  // API gateway: deny embedding and restrict to same-origin scripts/styles.
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
};

export function parseAllowedOrigins(raw: string | undefined): Set<string> {
  return new Set(
    (raw || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export function isNoCachePath(pathname: string): boolean {
  return NO_CACHE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p),
  );
}

export function corsHeaders(
  origin: string | null,
  allowed: Set<string>,
): Record<string, string> {
  if (!origin || !allowed.has(origin)) {
    return {};
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers":
      "content-type, authorization, x-widget-session, x-request-id, stripe-signature, cf-turnstile-response",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function needsTurnstile(pathname: string, method: string): boolean {
  if (method !== "POST") return false;
  if (pathname.startsWith("/webhooks/")) return false;
  if (pathname === "/widget/chat") return false;
  return pathname === "/widget/session" || pathname.startsWith("/auth/");
}

function requestId(req: Request): string {
  return req.headers.get("x-request-id") || crypto.randomUUID();
}

async function verifyTurnstile(
  token: string,
  secret: string,
  ip: string | null,
): Promise<boolean> {
  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (ip) body.set("remoteip", ip);
  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body },
  );
  if (!res.ok) return false;
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}

function jsonError(
  status: number,
  code: string,
  rid: string,
  cors: Record<string, string>,
): Response {
  return new Response(JSON.stringify({ error: code }), {
    status,
    headers: {
      "content-type": "application/json",
      "x-request-id": rid,
      ...SECURITY_HEADERS,
      ...cors,
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const allowed = parseAllowedOrigins(env.ALLOWED_ORIGINS);
    const rid = requestId(request);
    const cors = corsHeaders(origin, allowed);

    if (request.method === "OPTIONS") {
      if (origin && !allowed.has(origin)) {
        return new Response("origin not allowed", {
          status: 403,
          headers: SECURITY_HEADERS,
        });
      }
      return new Response(null, {
        status: 204,
        headers: { ...SECURITY_HEADERS, ...cors },
      });
    }

    // Browser calls must present an allowlisted Origin. Non-browser tools
    // (Stripe webhooks, health probes) omit Origin.
    if (origin && !allowed.has(origin)) {
      return jsonError(403, "origin_not_allowed", rid, {});
    }

    if (env.RATE_LIMITER) {
      const ip = request.headers.get("cf-connecting-ip") || "unknown";
      const key = `${ip}:${url.pathname}`;
      const { success } = await env.RATE_LIMITER.limit({ key });
      if (!success) {
        return jsonError(429, "rate_limited", rid, cors);
      }
    }

    if (env.TURNSTILE_SECRET && needsTurnstile(url.pathname, request.method)) {
      const token =
        request.headers.get("cf-turnstile-response") ||
        request.headers.get("x-turnstile-token");
      if (!token) {
        return jsonError(400, "turnstile_required", rid, cors);
      }
      const ok = await verifyTurnstile(
        token,
        env.TURNSTILE_SECRET,
        request.headers.get("cf-connecting-ip"),
      );
      if (!ok) {
        return jsonError(403, "turnstile_failed", rid, cors);
      }
    }

    const upstream = new URL(url.pathname + url.search, env.ORIGIN);
    const headers = new Headers(request.headers);
    headers.set("x-request-id", rid);
    headers.set("x-forwarded-host", url.host);
    if (env.EDGE_SHARED_SECRET) {
      headers.set("x-sabermetrics-edge", env.EDGE_SHARED_SECRET);
    }
    headers.delete("host");

    const timeoutMs = Number(env.UPSTREAM_TIMEOUT_MS || "55000");
    const timeoutSignal =
      Number.isFinite(timeoutMs) && timeoutMs > 0
        ? AbortSignal.timeout(timeoutMs)
        : undefined;
    const signal =
      request.signal && timeoutSignal
        ? AbortSignal.any([request.signal, timeoutSignal])
        : request.signal || timeoutSignal;

    const init: RequestInit = {
      method: request.method,
      headers,
      redirect: "manual",
      signal,
    };
    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = request.body;
      // @ts-expect-error duplex is required for streaming bodies in Workers
      init.duplex = "half";
    }

    let upstreamRes: Response;
    try {
      upstreamRes = await fetch(upstream, init);
    } catch (err) {
      const aborted =
        (err instanceof Error && err.name === "AbortError") ||
        (err instanceof DOMException && err.name === "AbortError") ||
        request.signal?.aborted;
      if (aborted) {
        return jsonError(499, "client_cancelled_or_timeout", rid, cors);
      }
      return jsonError(502, "origin_unreachable", rid, cors);
    }

    const outHeaders = new Headers(upstreamRes.headers);
    outHeaders.set("x-request-id", rid);
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
      outHeaders.set(k, v);
    }
    for (const [k, v] of Object.entries(cors)) {
      outHeaders.set(k, v);
    }
    if (isNoCachePath(url.pathname)) {
      outHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate");
      outHeaders.set("Pragma", "no-cache");
    }
    // Never leak Cloudflare/origin debug headers that could expose internals.
    outHeaders.delete("cf-ray");
    outHeaders.delete("server");

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      statusText: upstreamRes.statusText,
      headers: outHeaders,
    });
  },
};
