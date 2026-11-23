# Sabermetrics staging API edge (PRD-1197)

Isolated Cloudflare Worker gateway for staging. Separate from the production
`sabermetrics-ai` assets Worker on `sabermetrics.ai`.

## Behavior

- Exact-origin CORS allowlist (`ALLOWED_ORIGINS`)
- Request IDs on every response
- Streaming body passthrough to `ORIGIN`
- `Cache-Control: no-store` for auth, GraphQL, account, widget session/chat, webhooks, `/v1/*`
- Optional Turnstile on `/widget/session` and `/auth/*` only (never webhooks/SSE chat)
- Optional rate-limit binding and `x-sabermetrics-edge` shared secret

## Origin isolation (host-scoped API gate)

The shared BotStacks hostname `sandbox-api.botstacks.ai` must **not** require
`x-sabermetrics-edge` (that would break BotStacks clients). Bypass denial uses a
dedicated origin host:

| Item | Value |
| --- | --- |
| Worker `ORIGIN` (when enforcing) | `https://sabermetrics-sandbox-api.botstacks.ai` |
| API `SABERMETRICS_EDGE_ENFORCE_HOSTS` | `sabermetrics-sandbox-api.botstacks.ai` |
| API `SABERMETRICS_EDGE_GATE_MODE` | `off` until activation; then `enforce_hosts` |

API middleware trusts connection `Host` only (not `Origin` / `X-Forwarded-Host`).

## Tests

```bash
npm run test:api-edge
```

## Deploy (staging only)

```bash
npm run deploy:api-edge
```

Uses `workers.dev` (`sabermetrics-api-edge-staging.*.workers.dev`) by default.
Do not attach `sabermetrics.ai` production hostnames.

## Secrets (presence only — never paste values)

| Side | Variable | Where |
| --- | --- | --- |
| Worker | `EDGE_SHARED_SECRET` | Cloudflare Worker secrets (`wrangler secret put EDGE_SHARED_SECRET`) |
| API | `SABERMETRICS_EDGE_SHARED_SECRET` | Infisical `botstacks-sandbox-yugk` / Staging / `/sandbox-api` |

Values must match. See platform-deploy `docs/SABERMETRICS-EDGE-SECRET-CHECKLIST.md`
for the approved activation order (API image → Ingress/DNS → Infisical → ESO →
Worker secret+ORIGIN → flip `GATE_MODE`).

## Verify after enforce_hosts

- Direct `POST https://sabermetrics-sandbox-api.botstacks.ai/graphql` → **403**
- Same via this Worker (allowlisted Origin) → **200**
- Direct `POST https://sandbox-api.botstacks.ai/graphql` → **200** (BotStacks)
