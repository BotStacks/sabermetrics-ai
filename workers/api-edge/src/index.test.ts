import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
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
  it("covers auth, chat, SSE-related, billing and Stripe paths", () => {
    assert.equal(isNoCachePath("/auth/login"), true);
    assert.equal(isNoCachePath("/widget/chat"), true);
    assert.equal(isNoCachePath("/webhooks/stripe/sabermetrics"), true);
    assert.equal(isNoCachePath("/v1/chat/completions"), true);
    assert.equal(isNoCachePath("/billing/portal"), true);
    assert.equal(isNoCachePath("/stripe/checkout"), true);
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
