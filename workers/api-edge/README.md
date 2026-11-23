# Sabermetrics staging API edge (PRD-1197)

Isolated Cloudflare Worker gateway for staging. Separate from the production
`sabermetrics-ai` assets Worker on `sabermetrics.ai`.

## Behavior

- Exact-origin CORS allowlist (`ALLOWED_ORIGINS`)
- Request IDs on every response
- Streaming body passthrough to `ORIGIN`
- `Cache-Control: no-store` for auth, GraphQL, account, widget session/chat, webhooks, `/v1/*`
- Optional Turnstile on `/widget/session` and `/auth/*` only (never webhooks/SSE chat)
- Optional rate-limit binding (`RATE_LIMITER`, 120 req/min/location per IP+path) and `x-sabermetrics-edge` shared secret

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

### Safe ORIGIN flip (no routing loop)

1. DNS `A sabermetrics-sandbox-api → 143.244.212.56` (proxied) must exist and resolve.
2. Wait until origin presents a Let's Encrypt cert for that hostname (not the
   Kubernetes Fake Certificate). Zone SSL `full` tolerates the fake cert for
   smoke, but LE Ready is required before `enforce_hosts`.
3. Set Worker `ORIGIN=https://sabermetrics-sandbox-api.botstacks.ai`.
4. **Do not** add a Worker route on `sabermetrics-sandbox-api.botstacks.ai` —
   that hostname is the API origin. Keep this Worker on `workers.dev` (or a
   separate edge hostname). Routing the Worker onto its own ORIGIN causes an
   orange-to-orange loop.
5. If ORIGIN was flipped before DNS existed, Worker returns Cloudflare **530
   Origin DNS error** — temporarily set ORIGIN back to
   `https://sandbox-api.botstacks.ai` until steps 1–2 pass.

## Tests

```bash
npm run test:api-edge
```

## Deploy (staging only — requires approval)

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
- Same via this Worker (allowlisted Origin) → **200** + `Cache-Control: no-store…`
- Direct `POST https://sandbox-api.botstacks.ai/graphql` → **200** (BotStacks)
- Evil Origin via Worker → **403** `origin_not_allowed`
- Burst above rate limit → **429** `rate_limited` (approximate per CF location)
