# Campus Reuse Implementation Plan

## Product shape

Campus Reuse will be a responsive student marketplace with a public discovery experience, authenticated student workspace, and protected admin operations. The first release will be a coherent full-stack application rather than a set of disconnected screens: the React client talks to a typed Express REST API, the API owns authorization and business rules, and persistence is isolated behind a repository layer.

## Environment-aligned implementation choices

- **Frontend:** React + Vite + TypeScript, React Router, Tailwind CSS, Axios, React Hook Form, Zod and Lucide icons.
- **Backend:** Node.js + Express + TypeScript, centralized error handling, JWT/bcrypt application auth, rate limiting, Helmet and CORS.
- **Persistence:** the managed Webdev project exposes a shared MySQL-compatible `DATABASE_URL`, so this implementation uses Drizzle ORM/MySQL for reliable operation in the current environment while keeping the schema/domain naming compatible with the requested marketplace models. The repository boundary keeps an external MongoDB/Mongoose adapter straightforward for a later deployment that explicitly supplies `MONGODB_URI`.
- **External services:** Cloudinary and Razorpay are optional runtime integrations. Their server-only configuration is represented in `.env.example`; the app exposes clearly labeled development fallbacks when those credentials are absent, without pretending that a real upload or payment has completed.
- **Serving:** one Express process serves the API and Vite production output; Vite dev middleware provides the Preview experience on port 3000.
- **Validation:** TypeScript diagnostics, frontend/backend builds, API smoke tests and targeted unit tests.

## Project structure

```text
campusreuse/
  frontend/
    src/
      components/       reusable layout, cards, forms and feedback
      pages/            home, marketplace, details, sell, dashboards, auth
      services/         API client and domain calls
      types/            shared client domain types
      lib/              auth state, formatting and query helpers
      styles/           Tailwind-compatible global styles
  backend/
    src/
      db/               Drizzle schema, migrations and seed helpers
      middleware/       auth, validation, security and error handling
      routes/           auth, products, student, admin, wishlist, orders/requests
      services/         business workflows, notifications and integrations
      index.ts          Express/Vite server entrypoint
    .env.example
  public/
    manus-routes.json
  docs/
    deployment.md
  plan.md
  TODO.md
  package.json
  tsconfig.json
  vite.config.ts
  app.config.ts
```

## Design direction

Three possible styles were considered: **Forest Commons editorial marketplace** (0.07), **Quiet campus utility** (0.06), and **Emerald bento commerce** (0.04). The chosen direction is **Forest Commons editorial marketplace**.

- **Design movement:** modern editorial commerce with a campus-community feel, balancing strong typographic hierarchy with calm utility surfaces.
- **Core principles:** trustworthy by default, information-rich but scannable, warm rather than sterile, and action-oriented without pressure.
- **Color philosophy:** deep forest green signals stewardship and trust; emerald accents make actions feel optimistic; warm off-white keeps the marketplace approachable and lets product photos lead.
- **Layout paradigm:** an asymmetric editorial shell: a compact rail/navigation layer, wide hero copy beside a marketplace signal panel, and filter/listing content arranged as a flowing catalog rather than a rigid centered grid.
- **Signature elements:** a leaf-and-book brand mark, quiet green status pills, and thin “campus ledger” divider rules for metadata.
- **Interaction philosophy:** every action gives immediate, legible feedback; save, filter and approval actions are reversible where possible; destructive or privileged actions are explicitly labeled.
- **Animation:** short 160–220ms ease-out transitions, subtle card lift on hover, restrained fade/slide-in for panels, and no animation that delays task completion.
- **Typography:** Inter for interface clarity with a serif display face for editorial headlines; strong numeric styling for prices and dashboard metrics.
- **Brand essence:** the trusted student marketplace for keeping good academic resources in circulation. Personality: practical, generous, grounded.
- **Brand voice:** direct and encouraging. Example lines: “Good materials deserve another semester.” and “List it once. Keep it in circulation.”
- **Wordmark & logo:** a compact open-book/leaf glyph paired with the Campus Reuse wordmark, used consistently in the header and auth surfaces.
- **Signature brand color:** `#15543B` forest green.

## Delivery sequence

1. Establish the workspace, diagnostics, shared styles, route manifest and API/server shell.
2. Add database schema/repository, seed-safe demo data, auth and authorization middleware.
3. Build public marketplace search/filter/sort/pagination and product details.
4. Build listing submission, image preview/validation and pending moderation flow.
5. Build student dashboard, wishlist, notifications and purchase/request workflows.
6. Build admin dashboard, moderation, user management and analytics views.
7. Add optional Cloudinary/Razorpay adapters, environment documentation and tests.
8. Run diagnostics/build/API tests, fix regressions, checkpoint the project and report exact commands plus any credential-gated limitations.
