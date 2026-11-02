# Campus Reuse

Campus Reuse is a full-stack university marketplace for buying, selling, exchanging and renting academic materials. The app ships with a responsive React/Vite client, an Express/TypeScript REST API, a managed MySQL repository, JWT/bcrypt authentication, admin moderation, student dashboards, wishlist and notifications, and optional Cloudinary/Razorpay adapters.

## What is implemented

The public marketplace includes live database-backed listing cards, search across title/author/subject/course/department/brand, combined filters, sorting, pagination, empty/loading/error states, product detail pages and wishlist actions. Students can register, log in, manage a profile, submit listings with validation and up to six local previews, view pending/approved/rejected listings, see notifications and activity, create purchase/exchange/rental requests, and review transaction history. All new listings begin in `PENDING` status.

The admin workspace includes database-backed overview metrics, moderation queues, approval/rejection with saved reasons, student search/status management, category distribution and monthly analytics views. Admin privileges are assigned on the server and are not controlled by a client selector. API routes are protected by role-aware middleware.

Razorpay and Cloudinary are implemented as server-only, credential-gated adapters. Without those credentials, the app keeps local image previews and records a pending purchase order but explicitly reports that checkout is unavailable; it never marks an order paid from a browser-only response.

## Run locally

```bash
pnpm install
pnpm dev
```

The development server listens on `http://localhost:3000`, initializes additive database tables, and seeds the first catalog only when the products table is empty. Run checks with:

```bash
pnpm check
pnpm test
pnpm build
```

The current managed environment supplies a MySQL-compatible `DATABASE_URL`. For a standalone deployment, copy `backend/.env.example` to `.env`, provide a MySQL/TiDB URL, set a strong `JWT_SECRET`, and configure `ADMIN_EMAIL` and `ADMIN_PASSWORD`. The first development-only seed fallback is `admin@campusreuse.local` / `CampusReuse!2026`; replace it before any public deployment. The seeded demo student is `aarav.demo@campusreuse.local` / `Student!2026`.

## Integrations

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` to upload data-URL previews to Cloudinary before saving the listing. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to create test orders, verify HMAC signatures and confirm captured payments through Razorpay's server API. Keep these values only on the backend; `VITE_RAZORPAY_KEY_ID` is the only browser-safe client value.

## Deployment

The repository includes `Dockerfile` and [docs/deployment.md](docs/deployment.md). The container runs the compiled Express server and serves the Vite output from the same origin. Use `/health` for an unauthenticated readiness check. Keep `DATABASE_URL`, auth secrets, Cloudinary credentials and Razorpay secrets in the hosting provider's protected environment configuration.

## Repository map

- `frontend/src/` contains the React pages, reusable shell/components, API client, auth context and visual system.
- `backend/src/db/` contains the MySQL schema initialization, seed-safe repository and domain operations.
- `backend/src/routes/` contains auth, marketplace, student, admin, payment, wishlist, exchange and rental endpoints.
- `backend/src/services/` contains password/session and external integration adapters.
- `backend/src/tests/` contains API smoke tests run by `pnpm test`.
- `public/manus-routes.json` declares the complete page route set for Preview tooling.
