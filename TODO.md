# Campus Reuse Delivery TODO

## Workspace and runtime
- [ ] The project has separate `frontend/` and `backend/` source areas, a root toolchain, a route manifest at `GET /manus-routes.json`, and a development server listening on the configured port.
- [ ] TypeScript/JavaScript/JSON/CSS diagnostics are registered and actionable errors are resolved before delivery.
- [ ] The root README and deployment guide explain local Windows development, database setup, Cloudinary, Razorpay test mode, GitHub, frontend/backend hosting, production variables and troubleshooting.

## Authentication and authorization
- [ ] Students can register, log in, log out, retrieve their current profile, update profile information, request a password reset and complete a reset flow with validated credentials.
- [ ] The unified login supports student and administrator entry points, but administrator privileges are backend-assigned and verified; selecting Admin in a client form never grants administrator access.
- [ ] Passwords are hashed, sessions/tokens are protected, protected routes enforce authentication and role checks, suspended accounts are denied, and security middleware covers Helmet, CORS, rate limiting, input validation and centralized errors.

## Marketplace discovery
- [ ] Only approved and active products are publicly visible.
- [ ] Listing cards display image, title, author/brand, category, subject, department, semester, original price, selling price, discount, condition, transaction type, seller, details action and wishlist action.
- [ ] Search covers title, author, subject, course, department and brand; category, department, semester, condition, transaction type, minimum price and maximum price filters combine correctly.
- [ ] Sorting supports price low-to-high, high-to-low, recently added, oldest first and most popular, with pagination, loading, empty, error and clear-filter states.
- [ ] Product details show the gallery, full description and metadata, seller and campus handover location, plus Buy Now, Exchange Request, Rental Request, wishlist and report actions.

## Listing submission and moderation
- [ ] Students can submit title, description, category, subject, course, department, semester, author/brand, original price, selling price, condition, Sale/Exchange/Rental type, campus location and up to six images.
- [ ] Required fields and price rules validate on the client and server; image previews can be removed; duplicate submission is prevented; success/error and upload progress are visible.
- [ ] New listings are stored as `PENDING`; students cannot publish their own listings.
- [ ] Admins can view all/pending/approved/rejected listings and photos, approve, reject with a saved reason, suspend or delete fraudulent listings, view history and notify the seller.

## Student workspace
- [ ] Student dashboard metrics come from persisted data: total, active, pending and rejected listings, purchases, sales and recent activity.
- [ ] Student sections exist for profile, listings, purchases, sales, saved items, notifications, transaction history and settings.
- [ ] Wishlist add/remove and notification read-state changes persist through the API.

## Transactions and requests
- [ ] Sale checkout validates current product availability and server-side price, creates a payment order, verifies the payment signature/status on the server, prevents duplicates, records order/payment history and handles failures.
- [ ] Razorpay secret material is server-only; webhook verification is supported where credentials are configured, and credential absence is clearly surfaced as unavailable rather than silently marked paid.
- [ ] Exchange and rental flows have create/view/approve/reject/status-update endpoints and persist requester, recipient/product, dates, amount and status.
- [ ] Listing, approval, rejection, purchase/payment, exchange/rental and account events create persisted notifications.

## Admin workspace and reporting
- [ ] Admin overview shows database-backed students, listings, pending/approved/rejected counts, transactions, sales value and recent activity.
- [ ] Admin user management supports search, profile/listing review, suspend/reactivate and reported-user review.
- [ ] Analytics views use persisted information for monthly registrations/listings, category distribution, monthly transactions and sales performance.

## Verification and delivery
- [ ] Automated tests cover registration, student/admin login, unauthorized admin access, product submission/filtering/approval/rejection, wishlist, payment order/verification, exchange and rental.
- [ ] Frontend integration calls the backend API for every required action; no fake dashboard statistics or fake product listings are presented as live database data.
- [ ] The application builds and runs locally without errors, and the final report lists implemented behavior, tested behavior, credential-gated limitations and exact run commands.
