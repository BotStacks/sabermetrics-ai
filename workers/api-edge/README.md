# Sabermetrics staging API edge (PRD-1197)

Isolated Cloudflare Worker gateway for staging. Separate from the production
`sabermetrics-ai` assets Worker on `sabermetrics.ai`.

## Behavior

- Exact-origin CORS allowlist (`ALLOWED_ORIGINS`)
- Request IDs on every response
- Streaming body passthrough to `ORIGIN` (sandbox-api)
- `Cache-Control: no-store` for auth, widget session/chat, webhooks, `/v1/*`
- Optional Turnstile on `/widget/session` and `/auth/*` only (never webhooks/SSE chat)
- Optional rate-limit binding and `x-sabermetrics-edge` shared secret

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

Optional secrets before enforcing abuse controls:

- `EDGE_SHARED_SECRET` — forwarded as `x-sabermetrics-edge`
- `TURNSTILE_SECRET` — server-side Turnstile for `/widget/session` and `/auth/*`

## Origin bypass note

`sandbox-api.botstacks.ai` remains publicly reachable until Authenticated Origin
Pulls or an origin-side shared-secret check is enabled. The Worker sets
`x-sabermetrics-edge` when `EDGE_SHARED_SECRET` is configured; platform must
enforce that header before claiming bypass protection is complete.
