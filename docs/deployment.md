# Campus Reuse deployment guide

## Local Windows

Install Node.js 20+ and pnpm 11, clone the repository, run `pnpm install`, create `.env` from `backend/.env.example`, set `DATABASE_URL` and a strong `JWT_SECRET`, then run `pnpm dev`. Use `pnpm check`, `pnpm test` and `pnpm build` before pushing changes. The app uses relative `/api/v1` browser requests, so frontend and backend remain same-origin in the production container.

## Database

The current project is wired to the managed MySQL-compatible `DATABASE_URL` supplied by Webdev. For an external host, create a MySQL/TiDB database, require TLS where the provider expects it, and set the full connection URL. On startup the application runs additive `CREATE TABLE IF NOT EXISTS` statements for users, products, wishlist items, notifications, orders, exchange requests, rental requests and reports. It never drops tables or overwrites existing rows. If you are deploying with MongoDB Atlas instead, replace the repository implementation with the same domain contract and Mongoose collections; the current environment does not provide a MongoDB URI, so this working build uses the managed MySQL capability.

## Cloudinary

Create a Cloudinary account and set the three `CLOUDINARY_*` backend variables. Listing image previews are posted to the server and uploaded to Cloudinary using a signed upload request. The browser never receives the API secret. Without these variables, local data-URL previews are stored as the listing image value for development only; configure Cloudinary before public use.

## Razorpay test mode

Create Razorpay test keys and set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` only on the server. The API creates the order server-side, attaches the Razorpay order ID, and verifies both the HMAC signature and the payment's captured/authorized status through the Razorpay API. Never set the secret in `VITE_*` variables. Webhook delivery should be configured after selecting the Razorpay events and shared webhook secret for the target host.

## Container hosting

```bash
docker build -t campus-reuse .
docker run --rm -p 3000:3000 --env-file .env campus-reuse
```

The container listens on `PORT` (default `3000`) and exposes `/health`. Configure a health check against that path, provide environment variables through protected hosting settings, and attach persistent MySQL/TiDB storage rather than writing application data to the container filesystem.

## Frontend/backend hosting

A single container is the simplest deployment: Express serves the compiled Vite output and `/api/v1` routes. If you split the frontend and backend, set `VITE_API_URL` to the backend origin, set the backend `CLIENT_URL` to the frontend origin, enable credentials in the hosting CORS policy, and use HTTPS so the `webdev_app_session` cookie can be `SameSite=None; Secure` in embedded Preview/cross-site contexts.

## Troubleshooting

- `DATABASE_URL` errors: confirm the URL scheme is `mysql://`, credentials are valid and the provider allows TLS connections.
- Login works locally but not in an embedded HTTPS preview: keep the exact `webdev_app_session` cookie name and set the production/Preview secure cookie path; browser third-party-cookie restrictions can still require opening the Preview in a top-level tab.
- Listings stay pending: this is intentional. Log in with a backend-seeded admin account and approve them in `/admin`.
- Checkout says Razorpay is unavailable: add the two server-side Razorpay test variables and restart the backend. Orders are not marked paid without verification.
- Images remain local preview URLs: Cloudinary variables are not configured, so the development fallback is active. Configure Cloudinary before production.
