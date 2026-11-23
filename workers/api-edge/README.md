# Sabermetrics staging API edge (PRD-1197)

Isolated Cloudflare Worker gateway for staging. Separate from the production
`sabermetrics-ai` assets Worker on `sabermetrics.ai`.

## Behavior

- Exact-origin CORS allowlist (`ALLOWED_ORIGINS`)
- Request IDs on every response
- Streaming body passthrough to `ORIGIN` (sandbox-api)
- `Cache-Control: no-store` for auth, GraphQL, account, widget session/chat, webhooks, `/v1/*`
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

Optional secrets before enforcing abuse controls (presence only — never paste
values into chat, tickets, or logs):

| Side | Variable | Where |
| --- | --- | --- |
| Worker | `EDGE_SHARED_SECRET` | Cloudflare Worker secrets for `sabermetrics-api-edge-staging` (`wrangler secret put EDGE_SHARED_SECRET`) |
| API | `SABERMETRICS_EDGE_SHARED_SECRET` | Infisical project `botstacks-sandbox-yugk`, env Staging, path `/sandbox-api`, then ExternalSecret absolute remoteRef |

Values must match. After Infisical + Worker secrets exist, project the API key
via platform-deploy ExternalSecret and refresh ESO before claiming origin bypass
is closed.

## Origin bypass note

`sandbox-api.botstacks.ai` remains publicly reachable until
`SABERMETRICS_EDGE_SHARED_SECRET` is set on the running API (middleware from
platform #915). Unset → gate is a no-op. Direct `POST /graphql` without
`x-sabermetrics-edge` returning 200 means the gate is off.
