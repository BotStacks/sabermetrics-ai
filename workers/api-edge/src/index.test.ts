import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyUpstreamEdgeHeaders,
  corsHeaders,
  isNoCachePath,
  needsTurnstile,
  parseAllowedOrigins,
} from "./index.ts";

describe("parseAllowedOrigins", () => {
  it("trims and drops empties", () => {
    const set = parseAllowedOrigins(
      " https://sabermetrics-staging.webflow.io , ,http://localhost:5173 ",
    );
    assert.equal(set.size, 2);
    assert.ok(set.has("https://sabermetrics-staging.webflow.io"));
    assert.ok(set.has("http://localhost:5173"));
  });
});

describe("corsHeaders", () => {
  it("emits exact-origin Allow-Origin only for allowlisted origins", () => {
    const allowed = parseAllowedOrigins(
      "https://sabermetrics-staging.webflow.io",
    );
    const ok = corsHeaders("https://sabermetrics-staging.webflow.io", allowed);
    assert.equal(
      ok["Access-Control-Allow-Origin"],
      "https://sabermetrics-staging.webflow.io",
    );
    assert.equal(ok["Access-Control-Allow-Credentials"], "true");

    const denied = corsHeaders("https://evil.example", allowed);
    assert.deepEqual(denied, {});
  });
});

describe("isNoCachePath", () => {
  it("covers auth, GraphQL, chat, SSE-related, billing and Stripe paths", () => {
    assert.equal(isNoCachePath("/auth/login"), true);
    assert.equal(isNoCachePath("/graphql"), true);
    assert.equal(isNoCachePath("/graphql/"), true);
    assert.equal(isNoCachePath("/widget/chat"), true);
    assert.equal(isNoCachePath("/webhooks/stripe/sabermetrics"), true);
    assert.equal(isNoCachePath("/v1/chat/completions"), true);
    assert.equal(isNoCachePath("/internal/sabermetrics/answers/authorize"), true);
    assert.equal(isNoCachePath("/billing/portal"), true);
    assert.equal(isNoCachePath("/stripe/checkout"), true);
    assert.equal(isNoCachePath("/account/me"), true);
    assert.equal(isNoCachePath("/sabermetrics/ask"), true);
    assert.equal(isNoCachePath("/sabermetrics/bootstrap"), true);
    assert.equal(isNoCachePath("/sabermetrics/me"), true);
    assert.equal(isNoCachePath("/healthz"), false);
  });
});

describe("needsTurnstile", () => {
  it("requires Turnstile for session/auth POST only", () => {
    assert.equal(needsTurnstile("/widget/session", "POST"), true);
    assert.equal(needsTurnstile("/auth/signup", "POST"), true);
    assert.equal(needsTurnstile("/widget/chat", "POST"), false);
    assert.equal(needsTurnstile("/webhooks/stripe/sabermetrics", "POST"), false);
    assert.equal(needsTurnstile("/widget/session", "GET"), false);
  });
});

describe("applyUpstreamEdgeHeaders", () => {
  it("forwards shared secret as x-sabermetrics-edge and drops host", () => {
    const headers = applyUpstreamEdgeHeaders(
      new Headers({ host: "sabermetrics-api-edge-staging.botstacks.workers.dev" }),
      "rid-1",
      "sabermetrics-api-edge-staging.botstacks.workers.dev",
      "test-secret",
    );
    assert.equal(headers.get("x-sabermetrics-edge"), "test-secret");
    assert.equal(headers.get("x-request-id"), "rid-1");
    assert.equal(
      headers.get("x-forwarded-host"),
      "sabermetrics-api-edge-staging.botstacks.workers.dev",
    );
    assert.equal(headers.get("host"), null);
  });

  it("omits edge header when secret unset", () => {
    const headers = applyUpstreamEdgeHeaders(new Headers(), "rid-2", "edge", undefined);
    assert.equal(headers.get("x-sabermetrics-edge"), null);
  });
});
