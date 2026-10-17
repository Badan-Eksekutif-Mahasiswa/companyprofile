# Company profile on Railway

Create a separate service from the companyprofile repository, in the same Railway
project as SIT. Use root `/` and config file `/railway.json`. The Dockerfile builds
with Node 22 and runs Next.js in production on `0.0.0.0` and Railway's `PORT`.
Remove conflicting custom build/start commands in the service settings.

## Branches

Use `dev` for staging. After acceptance, merge into the branch chosen for
production and configure that branch in the service's Source settings. A push to
`dev` should update staging only. Keep staging and production SIT URLs separate.

## Railway variables

| Variable | When | Value |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Build and runtime | Final public HTTPS company-profile URL; required by Docker build |
| `NEXT_PUBLIC_YOUTUBE_VIDEO_ID` | Build | Optional video ID, default `R5XbD1vjXlg` |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | Build and runtime | Optional public-media base for existing frontend media URLs |
| `SIT_API_URL` | Runtime | `https://<public-sit-host>/api/website/v1` without final slash |
| `NEWS_PREVIEW_TOKEN` | Runtime | Optional secret used for authenticated article previews |

Define these variables before deploying. Railway exposes referenced public build
arguments to the Docker build; changing `NEXT_PUBLIC_*` requires a rebuild.
Keep API credentials/service-role keys out of build arguments and public variables.
The SIT API returns public URLs for its protected R2 delivery endpoint, so its
private bucket does not need to be made public for articles.

The existing Supabase fallback is optional. With `SIT_API_URL` set, article reads
use SIT. Do not copy SIT database credentials, Firebase Admin keys, or R2 write
credentials into this frontend service.

## Verification and current data coverage

1. Deploy SIT and verify its API first.
2. Set the final site URL and the SIT API base, then deploy this service.
3. `/api/health` must return `200` with `{"status":"ok"}`. This endpoint checks
   Next.js only; it does not claim that SIT is reachable.
4. Open `/`, `/kabinet`, `/news`, and a published article. Check public media URLs,
   metadata/share URLs, and mobile layout. Confirm content refresh after publishing.

Home statistics, home news, hero programs and cabinet/unit profiles read published
SIT content. Cabinets are addressed by ID, not year. Home, cabinet and division API
routes render at runtime so the Railway build does not freeze local placeholder
content or prevent newly published division slugs from loading.

Cabinet/profile JSON remains a fallback when SIT is not configured, no cabinet is
published, or the cabinet API fails. Publish the cabinet and profiles in SIT before
launch and verify that official content is displayed, not the fallback. News uses
SIT when configured and otherwise retains its existing Supabase/example fallback.
Do not treat a successful healthcheck as proof that all CMS fields are connected.

Start with one instance. Later, coordinate the Next.js cache before adding replicas.
Local `.env` files and node_modules are excluded from Docker; runtime variables
come from Railway. The `data/` directory is included because existing loaders read
it from the filesystem.

Local verification: run `npm test`, `npm run lint`, `npm run build`, then
`npm run test:smoke`. The smoke test starts a temporary mock CMS and production
server on loopback ports; it does not write to SIT or Supabase.

References: [Railway Next.js](https://docs.railway.com/guides/nextjs),
[Next.js 14 deployment](https://nextjs.org/docs/14/app/building-your-application/deploying).
