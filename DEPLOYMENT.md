# Dearli web/API deployment

Deploy this repository to the existing Vercel project serving `dearli.vercel.app`.
Keep the existing server-only Supabase environment values. The Android origin is
`https://localhost`; `MOBILE_ALLOWED_ORIGINS` defaults to that exact value. If this
variable is set in Vercel, include that origin. It is an origin, not the API host.

After deployment, OPTIONS on `/api/surprises` and `/api/surprises/media` with Origin
`https://localhost` and requested headers `content-type,x-request-id` must return
204 and permit those exact headers/origin. Admin routes remain same-origin.

Verification commands (Node 24):

```
npm ci
npm run lint
npm run build
node --test tests/backend.test.mjs
```

Backend tests use isolated in-memory persistence and synthetic credentials, never
the production database. Browser regressions in `tests/browser.cjs` require an
externally supplied Playwright module (`DEARLI_PLAYWRIGHT_MODULE`), Chrome and a
running built-site preview (`DEARLI_TEST_URL`).

No database migration runs during deploy. The existing surprises/storage setup
continues to work. The optional owner dashboard requires the additional
`admin_sessions` table in `supabase/schema.sql` and an owner bcrypt hash supplied
only through server environment configuration. Do not expose it via VITE variables.

The Android project and tested debug APK are maintained separately. Automatic
Android App Links still require a deployed assetlinks.json for the intended
signing certificate. This deployment does not establish release/Play readiness.
