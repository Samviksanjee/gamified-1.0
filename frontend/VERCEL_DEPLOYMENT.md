# Deploying the GamifiEd frontend on Vercel

The frontend is a static Vite/React single-page app. It calls the FastAPI backend at `https://api.avinyaa.tech` directly from the browser using a Bearer JWT. It never talks to the Hostinger database. The Docker/nginx setup (`Dockerfile`, `nginx.conf`) is separate and unchanged.

## Verified facts

| Item | Value | How it was checked |
|---|---|---|
| API prefix | `/api/v1` | `https://api.avinyaa.tech/openapi.json` lists 167 paths. 164 are under `/api/v1`. The others are `/`, `/api` and `/webhooks/whatsapp`. |
| Production API URL | `https://api.avinyaa.tech/api/v1` | Same as above. |
| Auth | `Authorization: Bearer <jwt>` kept in `localStorage` (`gamified_token`). No cookies. | `src/api.js` and the `HTTPBearer` scheme in the OpenAPI spec. |
| File URLs | Backend returns root-relative paths, `/uploads/puzzles/...` and `/media/sequencing/...`. They are served from the backend root, not under `/api/v1`. | Backend source (`app/main.py`, `app/lib/storage.py`). |
| CORS on the backend today | `http://localhost:5173` is allowed. An unknown origin (a Vercel domain) is rejected with 400 on preflight. | A real `OPTIONS` preflight was sent to `/api/v1/auth/login`. |

The CORS result means **the Vercel site will not work until you add its origin to the backend** (see section 13).

## 1. Prerequisites

- A GitHub account with access to `Samviksanjee/GamifiEd`.
- A Vercel account (a Hobby account is enough).
- Admin access to the KVM VPS to edit the backend environment file.
- Access to the DNS panel where `avinyaa.tech` is managed (Hostinger), only needed for a custom domain.
- Node 18.18+ or 20 locally, only if you want to test the build first.

## 2. GitHub repository preparation

1. Commit these frontend changes: `frontend/vercel.json`, `frontend/.gitignore`, `frontend/.env.example`, `frontend/.env.development.example`, `frontend/vite.config.js`, `frontend/src/**`, and this file.
2. Do not commit `.env`, `.env.local` or `.env.production`. `frontend/.gitignore` blocks them. Only `*.example` files are tracked.
3. Push to the branch Vercel will deploy (usually `main`).

## 3. Vercel account setup

Sign in at https://vercel.com with **Continue with GitHub**. When asked, allow the Vercel GitHub app access to the `GamifiEd` repository (a single repository is enough).

## 4. Import the repository

Vercel dashboard, **Add New > Project**, pick `GamifiEd`, **Import**.

## 5. Root Directory (monorepo)

The Git repository root contains `backend/`, `frontend/`, `docs/` and more. The Vite app is in `frontend/`. The Vercel project root is **not** the repository root.

Set **Root Directory = `frontend`** (click **Edit** next to Root Directory). Leave "Include source files outside of the Root Directory" at its default.

## 6. Framework

**Framework Preset: Vite.** Vercel normally detects it. `vercel.json` also sets `"framework": "vite"`.

## 7. Build settings

| Setting | Value |
|---|---|
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

These match `vercel.json`, so the defaults are fine. Do not add serverless functions. This is a static site.

## 8. Environment variables

Under **Environment Variables** add, for **Production** (and **Preview** if you use preview deployments):

| Name | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://api.avinyaa.tech/api/v1` |

Optional:

| Name | Purpose |
|---|---|
| `VITE_ASSET_BASE_URL` | Origin that serves `/uploads` and `/media`. Defaults to the origin of `VITE_API_BASE_URL` (`https://api.avinyaa.tech`). Set it only if files come from a different host. |
| `VITE_API_TIMEOUT_MS` | Normal request timeout in milliseconds. Default 60000. Uploads and AI generation always allow at least 300000. |

Rules:

- Every `VITE_*` value is embedded in the public JavaScript bundle. Never put JWT secrets, database passwords or private API keys in them.
- Changing a variable only affects new builds. Redeploy after editing.
- On Vercel the build fails with a clear message if `VITE_API_BASE_URL` is missing, not `https://`, or points at localhost. This stops a silent fall back to a relative `/api/v1`, which Vercel cannot serve.

## 9. First deployment

Click **Deploy**. The build takes about a minute. Vercel shows a URL like `https://gamified-xxxx.vercel.app`. Note it. You need it for the CORS step. It is your **Vercel production domain**.

A successful build does not mean the app works. Complete sections 13 and 14.

## 10. Custom domain (optional)

Vercel project, **Settings > Domains > Add**, enter for example `app.avinyaa.tech` (a subdomain is easiest). Vercel then displays the DNS record it requires.

## 11. Hostinger DNS configuration

In Hostinger **Domains > avinyaa.tech > DNS / Nameservers > DNS Records**:

| Type | Name | Value |
|---|---|---|
| `CNAME` | `app` | The value Vercel displays (commonly `cname.vercel-dns.com`) |

For an apex domain (`avinyaa.tech` itself) Vercel typically asks for an `A` record to `76.76.21.21`. Use whatever Vercel shows for your project.

Do not touch the existing record that points `api` at your VPS. Do not add a record named `app` if one already exists. Edit it instead. Wait for Vercel to show **Valid Configuration**. HTTPS certificates are issued automatically.

## 12. Verify the build locally (optional)

```
cd frontend
npm install
npm run test -- --run
VERCEL=1 VITE_API_BASE_URL=https://api.avinyaa.tech/api/v1 npm run build
```

On PowerShell set `$env:VERCEL='1'; $env:VITE_API_BASE_URL='https://api.avinyaa.tech/api/v1'` first.

## 13. Backend CORS verification (required, manual)

Browsers block cross-origin calls unless FastAPI allows the frontend origin. The backend currently reads its allowed origins from the `CORS_ORIGINS` environment variable (a comma-separated string, see `backend/app/core/config.py`). Its default is `http://localhost:5173,http://localhost:3000`.

On the VPS, set (replace with your real domains):

```
CORS_ORIGINS=http://localhost:5173,https://gamified-xxxx.vercel.app,https://app.avinyaa.tech
```

Then restart the backend service.

Requirements:

- Origins must be exact: scheme, host and (if any) port. No trailing slash, no path, no `*` wildcard (the backend sends credentials headers, and a wildcard is not valid with them).
- Include every origin users will open: the Vercel production domain, the custom domain, and `http://localhost:5173` for development. Preview deployment URLs (`*-git-branch-*.vercel.app`) are not allowed unless you add each one.
- Allowed methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`. Allowed headers: `Authorization, Content-Type`. The current backend already answers a preflight with `Allow-Methods: DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT` and echoes the requested headers, so only the origin list needs to change.
- Do not set `Content-Type` yourself on file uploads. The browser adds the multipart boundary. The frontend already does this.

Test from any terminal (replace the origin):

```
curl -i -X OPTIONS https://api.avinyaa.tech/api/v1/auth/login \
  -H "Origin: https://gamified-xxxx.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,content-type"
```

Expected: `200` and `access-control-allow-origin: https://gamified-xxxx.vercel.app`. A `400 Disallowed CORS origin` means the origin is not in `CORS_ORIGINS` yet.

Also confirm that nginx (or whatever fronts FastAPI on the VPS) does not strip CORS headers, and that large uploads are not blocked (`client_max_body_size`).

## 14. Production testing

Open the Vercel URL with the browser DevTools Network tab open.

1. Log in as a teacher. The `login` request goes to `https://api.avinyaa.tech/api/v1/auth/login` and returns 200. A "Cannot reach the GamifiEd server" message with a CORS error in the console means section 13 is not done.
2. Refresh on `/dashboard`, `/classes`, `/admin` and `/play/a/1`. Each must load the app, not a 404.
3. Check student, teacher and Super Admin logins. Each lands on its own area and cannot open the others' pages.
4. First-login password change, and an invitation link (`/accept-invitation?...`).
5. Upload a sequencing document and a puzzle image.
6. Open a puzzle and a sequencing/quiz activity. Images must load from `https://api.avinyaa.tech/uploads/...` or `/media/...`. If they 404, confirm those backend paths exist.
7. Download a Super Admin report (CSV/XLSX).
8. Log out, then expire or alter the token in localStorage. The next request returns 401 and sends you to `/`.

## 15. Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| Build fails with `VITE_API_BASE_URL must be set...` | Variable missing or not `https://`. Fix it in Vercel settings and redeploy. |
| "Cannot reach the GamifiEd server" and a CORS error in the console | Origin missing from `CORS_ORIGINS`, or the backend was not restarted. |
| Requests go to `https://<vercel-domain>/api/v1/...` and return 404 | The variable was added after the build. Redeploy. |
| 404 on refresh at a deep link | `vercel.json` is not in the root directory (`frontend`). Check Root Directory. |
| Images broken | Open the image URL directly. If it is `https://api.avinyaa.tech/uploads/...` and returns 404, the file is missing on the VPS. If it points at the Vercel domain, the redeploy did not pick up the new build. |
| Mixed content blocked | Some value uses `http://`. Use `https://` everywhere. |
| 401 right after login | Token not saved or backend clock/secret changed. Clear site data and log in again. |
| "The server took too long to respond" | The request exceeded the timeout (60 s normal, 300 s uploads/generation). Check backend health. |
| Preview deployment fails CORS | Add that preview URL to `CORS_ORIGINS`, or test on the production domain only. |

## 16. Future updates and automatic deployments

Every push to the production branch triggers a Vercel build and deploy. Pushes to other branches and pull requests create preview deployments. Vercel keeps the previous deployment live until the new build succeeds. To redeploy without a code change (for example after editing an environment variable): **Deployments > ... > Redeploy**.

Docker deployment is unaffected: `docker build` still works without `VITE_API_BASE_URL`, using the same-origin `/api/v1` proxied by `nginx.conf`.

## 17. Rollback

Vercel project, **Deployments**, choose the last good deployment, **... > Promote to Production** (or **Instant Rollback**). It takes effect immediately without a rebuild. Then fix the problem on a branch and push again.

If the problem is backend-side (for example a bad `CORS_ORIGINS` value), restore the previous value on the VPS and restart the backend. No frontend rollback is needed.

## Known notes

- `src/components/PuzzleGame.jsx` and `CrosswordGame.jsx` contain `localhost` defaults for `VITE_PUZZLE_GAME_URL` and `VITE_CROSSWORD_GAME_URL`. Nothing imports them, so they are not in the production bundle. Left untouched.
- The build reports a bundle larger than 500 kB. This existed before and is only a warning.
