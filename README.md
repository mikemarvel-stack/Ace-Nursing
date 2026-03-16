# AceNursing

A full-stack e-commerce platform for premium nursing study materials. Students browse, purchase, and instantly download PDF study guides, flashcards, and reference materials. Payments are handled via PayPal, files are stored privately on AWS S3, and order confirmations with download links are delivered by email.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Seed the Database](#seed-the-database)
  - [Run Locally](#run-locally)
- [Docker](#docker)
- [Testing](#testing)
- [API Reference](#api-reference)
- [PayPal Integration](#paypal-integration)
- [AWS S3 Setup](#aws-s3-setup)
- [Email Setup](#email-setup)
- [Admin Panel](#admin-panel)
- [Security](#security)
- [Deployment](#deployment)
- [Environment Variable Reference](#environment-variable-reference)

---

## Features

**Customer-facing**
- Browse and search nursing study materials by category, price, and rating
- Slide-in cart with persistent state across sessions
- 2-step checkout with PayPal (sandbox + live)
- Instant PDF download after payment — files auto-download on the order confirmation page
- Download links emailed to the customer and valid for 30 days
- User accounts with order history and re-download access
- Product reviews and ratings
- Contact form, FAQ, and policy pages

**Admin panel** (`/admin`)
- Dashboard with revenue stats and recent orders
- Upload products directly to AWS S3 (PDF + cover image)
- Manage and edit the product catalogue
- View and update order statuses
- Real-time notifications for new orders, signups, and contact messages
- Expand contact messages inline and reply via email in one click

**Platform**
- JWT authentication with role-based access control
- Structured JSON logging with daily log rotation (Winston)
- OpenTelemetry tracing support
- AWS Secrets Manager integration for production secrets
- GitHub Actions CI — backend tests + frontend build on every push
- Docker Compose for local development and production

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router 6, Zustand, Vite |
| Payments | PayPal JS SDK (`@paypal/react-paypal-js`) + PayPal REST API |
| Backend | Node.js 20, Express 4, Mongoose 8 |
| Database | MongoDB (local or Atlas) |
| Storage | AWS S3 — private bucket with signed URLs |
| Email | Resend |
| Auth | JWT (Bearer token, 7-day expiry) |
| Logging | Winston + daily rotate file |
| Tracing | OpenTelemetry (optional, OTLP HTTP export) |
| CI | GitHub Actions |
| Deployment | Render (backend) + Vercel (frontend) / Docker Compose |

---

## Project Structure

```
acenursing/
├── .github/
│   └── workflows/
│       └── ci.yml              # Backend tests + frontend build
├── backend/
│   ├── __tests__/              # Jest integration tests
│   ├── config/
│   │   ├── aws.js              # S3 client setup
│   │   └── paypal.js           # PayPal REST API helpers
│   ├── middleware/
│   │   ├── auth.js             # protect / restrictTo / optionalAuth / signToken
│   │   └── requestLogger.js    # Structured HTTP request logging
│   ├── models/
│   │   ├── User.js             # User schema, bcrypt hashing, purchases
│   │   ├── Product.js          # Product schema, auto-slug, reviews
│   │   ├── Order.js            # Order schema, auto order number
│   │   └── Notification.js     # Admin notification schema
│   ├── routes/
│   │   ├── auth.js             # Register, login, profile, password reset
│   │   ├── products.js         # CRUD, search, pagination, reviews
│   │   ├── payments.js         # PayPal create/capture, download tokens, signed URLs
│   │   ├── orders.js           # Admin order management
│   │   ├── upload.js           # S3 file upload (PDF + image)
│   │   └── notifications.js    # Admin notifications + public contact endpoint
│   ├── scripts/
│   │   └── seed.js             # Seed 12 sample products + admin user
│   ├── utils/
│   │   ├── email.js            # Resend email templates
│   │   ├── logger.js           # Winston logger
│   │   ├── notifications.js    # createNotification helper
│   │   ├── s3.js               # S3 upload / signed URL / delete helpers
│   │   ├── secrets.js          # AWS Secrets Manager loader
│   │   └── telemetry.js        # OpenTelemetry init/shutdown
│   ├── .env.example
│   ├── Dockerfile
│   └── server.js               # Express app entry point
│
└── frontend/
    ├── public/
    │   └── favicon.svg
    └── src/
        ├── components/
        │   ├── Navbar.jsx          # Sticky nav, cart badge, auth state
        │   ├── Footer.jsx          # Links, social, payment badges
        │   ├── Layout.jsx          # Public page wrapper (Navbar + Footer)
        │   ├── CartDrawer.jsx      # Slide-in cart
        │   ├── ProductCard.jsx     # Shop grid card
        │   └── AdminLayout.jsx     # Admin sidebar + topbar
        ├── pages/
        │   ├── HomePage.jsx        # Hero, featured products, testimonials
        │   ├── ShopPage.jsx        # Full shop with search, filters, pagination
        │   ├── ProductPage.jsx     # Product detail + reviews
        │   ├── CheckoutPage.jsx    # 2-step checkout + PayPal Buttons
        │   ├── OrderSuccessPage.jsx # Confirmation + auto-download + fallback fetch
        │   ├── LoginPage.jsx       # Login + Register tabs
        │   ├── AccountPage.jsx     # Order history + profile settings
        │   ├── ContactPage.jsx     # Contact form → admin notifications
        │   ├── FAQPage.jsx         # Frequently asked questions
        │   ├── PolicyPage.jsx      # Privacy, terms, refund policies
        │   └── admin/
        │       ├── AdminDashboard.jsx   # Stats, revenue chart, recent orders
        │       ├── AdminUpload.jsx      # Upload product files to S3
        │       ├── AdminProducts.jsx    # Manage product catalogue
        │       ├── AdminOrders.jsx      # View and update orders
        │       └── AdminNotifications.jsx # Notifications with inline contact messages
        ├── api.js          # Axios instance + all API method groups
        ├── store.js        # Zustand cart store (persisted) + auth store
        ├── main.jsx        # App entry — Router, PayPal Provider, ErrorBoundary
        └── index.css       # Global styles and CSS design tokens
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- MongoDB (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A [PayPal Developer](https://developer.paypal.com) sandbox app
- An [AWS account](https://aws.amazon.com) with an S3 bucket
- A [Resend](https://resend.com) account with a verified domain

### Installation

```bash
git clone https://github.com/your-username/acenursing.git
cd acenursing
npm install
```

This installs dependencies for both `backend/` and `frontend/` via the root `postinstall` script.

### Environment Variables

**Backend** — copy the example and fill in your values:

```bash
cp backend/.env.example backend/.env
```

**Frontend** — create `frontend/.env`:

```bash
cp frontend/.env.example frontend/.env
```

See the full [Environment Variable Reference](#environment-variable-reference) at the bottom of this file.

### Seed the Database

```bash
cd backend
npm run seed
```

Creates 12 sample products and a default admin account. The credentials are printed to the console when the seed script runs.

> ⚠️ Change the admin password immediately after first login. The seed script refuses to run when `NODE_ENV=production`.

### Run Locally

Start both servers concurrently from the repo root:

```bash
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api |
| Health check | http://localhost:5000/api/health |

Or run them separately:

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

---

## Docker

```bash
# Build and start all services (backend + frontend + MongoDB)
docker-compose up --build

# Run in background
docker-compose up -d

# Seed the database after containers start
docker-compose exec backend node scripts/seed.js

# Stop everything
docker-compose down
```

> The Compose setup uses named volumes for `node_modules` to avoid dependency issues when mounting the local source tree.

---

## Testing

### Backend

```bash
cd backend
npm test
```

Tests run against an in-memory MongoDB instance (via `mongodb-memory-server`) so no real database is needed. Coverage is collected automatically into `backend/coverage/`.

### CI

GitHub Actions runs on every push and pull request to `main`:

- **Backend job** — installs dependencies and runs Jest
- **Frontend job** — installs dependencies and runs `vite build`

Workflow file: `.github/workflows/ci.yml`

---

## API Reference

All endpoints are prefixed with `/api`.

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Create a new customer account |
| POST | `/login` | — | Login, returns JWT |
| POST | `/admin-login` | — | Admin-only login |
| GET | `/me` | JWT | Get current user profile |
| PATCH | `/update-profile` | JWT | Update name, email, phone |
| POST | `/forgot-password` | — | Send password reset email |
| POST | `/reset-password/:token` | — | Reset password with token |

### Products — `/api/products`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | — | List products (search, category, sort, pagination) |
| GET | `/featured` | — | Get featured products |
| GET | `/:id` | — | Get single product by ID or slug |
| POST | `/` | Admin | Create product |
| PATCH | `/:id` | Admin | Update product |
| DELETE | `/:id` | Admin | Delete product |
| POST | `/:id/reviews` | JWT | Add a review |
| GET | `/admin/all` | Admin | Get all products including inactive |

### Payments — `/api/payments`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/paypal/create-order` | Optional | Create PayPal order + internal order record |
| POST | `/paypal/capture` | Optional | Capture payment, generate download tokens |
| GET | `/download/:token` | — | Validate token and redirect to signed S3 URL |
| GET | `/orders` | JWT | Get current user's order history |

### Orders — `/api/orders` (Admin)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Admin | List all orders with filters and pagination |
| GET | `/stats` | Admin | Revenue and order count statistics |
| GET | `/:id` | Admin | Get single order detail |
| PATCH | `/:id` | Admin | Update order status |

### Upload — `/api/upload` (Admin)

| Method | Path | Description |
|---|---|---|
| POST | `/product-full` | Upload PDF + cover image together |
| POST | `/pdf` | Upload PDF only |
| POST | `/image` | Upload cover image only |
| DELETE | `/file` | Delete a file from S3 by key |

### Notifications — `/api/notifications`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/contact` | — | Submit a contact form message |
| GET | `/` | Admin | Get latest 50 notifications + unread count |
| PATCH | `/:id/read` | Admin | Mark notification as read |
| PATCH | `/read-all` | Admin | Mark all notifications as read |
| DELETE | `/:id` | Admin | Delete a notification |

---

## PayPal Integration

### Sandbox Testing

1. Go to [developer.paypal.com](https://developer.paypal.com) and create a sandbox app
2. Copy the `Client ID` and `Secret` into `backend/.env`
3. Set `PAYPAL_MODE=sandbox`
4. Use a sandbox buyer account to test the full checkout flow

### Going Live

1. Set `PAYPAL_MODE=live` in `backend/.env`
2. Replace sandbox credentials with live credentials from the PayPal dashboard
3. Update `VITE_PAYPAL_CLIENT_ID` in `frontend/.env` with the live client ID

---

## AWS S3 Setup

1. Create a private S3 bucket (e.g. `acenursing-materials`) in your chosen region
2. Block all public access on the bucket
3. Create an IAM user with a scoped policy (see below) — do **not** use `AmazonS3FullAccess`
4. Add the IAM credentials to `backend/.env`

### Recommended IAM Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::acenursing-materials/*"
    }
  ]
}
```

Files are never publicly accessible. All downloads use pre-signed URLs that expire after 1 hour (download endpoint) or 30 days (emailed links).

### Optional: AWS Secrets Manager

To keep secrets out of `.env` entirely:

1. Store your secrets as a JSON object in AWS Secrets Manager (e.g. secret name `acenursing/prod`)
2. Set `USE_AWS_SECRETS=true` and `AWS_SECRETS_NAME=acenursing/prod` in `.env`
3. Provide AWS credentials via environment variables or an IAM role

The app merges Secrets Manager values into `process.env` at startup without overriding values already set in `.env`.

---

## Email Setup

1. Sign up at [resend.com](https://resend.com)
2. Add and verify your sending domain (e.g. `acenursing.com`)
3. Create an API key and set it as `RESEND_API_KEY` in `backend/.env`
4. Set `FROM_EMAIL=orders@acenursing.com`

Emails sent automatically:

| Trigger | Recipient | Content |
|---|---|---|
| Successful order | Customer | Order confirmation + download links |
| New registration | Customer | Welcome email |
| Password reset request | Customer | Reset link (expires 1 hour) |
| New order | Admin | Order alert with summary |

---

## Admin Panel

Access the admin panel at `/admin`. Requires an account with `role: admin`.

| Page | Path | Description |
|---|---|---|
| Dashboard | `/admin` | Revenue stats, order counts, recent activity |
| Products | `/admin/products` | Edit, activate/deactivate, delete products |
| Upload | `/admin/upload` | Upload new products (PDF + cover image) to S3 |
| Orders | `/admin/orders` | View all orders, update status |
| Notifications | `/admin/notifications` | Orders, signups, contact messages with inline reply |

---

## Security

| Feature | Detail |
|---|---|
| Authentication | JWT Bearer tokens, 7-day expiry |
| Password hashing | bcrypt, cost factor 12 |
| Rate limiting | 300 req/15 min global · 20 req/15 min on auth routes |
| Input sanitization | `express-mongo-sanitize` prevents NoSQL injection |
| HTTP headers | Helmet with Content-Security-Policy (PayPal domains whitelisted) |
| CORS | Restricted to `FRONTEND_URL` in production |
| File downloads | Private S3 bucket, signed URLs only — never public |
| Price validation | Total calculated server-side; client prices are ignored |
| Order ownership | Logged-in users can only capture their own orders |
| Contact form | Server-side length limits on all fields |
| Seed script | Exits immediately if `NODE_ENV=production` |
| Error boundary | React `ErrorBoundary` catches render crashes app-wide |

---

## Deployment

The project is configured for deployment on **Render** (backend) and **Vercel** (frontend).

### Render (Backend)

A `render.yaml` is included. Connect your GitHub repo in the Render dashboard and it will auto-detect the configuration. Set the secret environment variables (`MONGODB_URI`, `JWT_SECRET`, `PAYPAL_CLIENT_SECRET`, etc.) in the Render dashboard under **Environment**.

### Vercel (Frontend)

A `vercel.json` is included with SPA rewrite rules. Import the repo in Vercel, set the root directory to `frontend/`, and add:

```
VITE_API_URL=https://your-backend.onrender.com/api
VITE_PAYPAL_CLIENT_ID=your_live_paypal_client_id
```

### Production Checklist

- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` is at least 32 random characters
- [ ] `PAYPAL_MODE=live` with live credentials
- [ ] `FRONTEND_URL` set to your actual domain
- [ ] S3 bucket has public access blocked
- [ ] IAM user has a scoped policy (not `FullAccess`)
- [ ] Admin password changed from the seed default
- [ ] `RESEND_API_KEY` set with a verified sending domain

---

## Environment Variable Reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Min 32-character random string |
| `JWT_EXPIRES_IN` | — | Token expiry (default: `7d`) |
| `PAYPAL_CLIENT_ID` | ✅ | PayPal app client ID |
| `PAYPAL_CLIENT_SECRET` | ✅ | PayPal app secret |
| `PAYPAL_MODE` | ✅ | `sandbox` or `live` |
| `AWS_ACCESS_KEY_ID` | ✅ | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | ✅ | IAM user secret key |
| `AWS_REGION` | ✅ | S3 bucket region (e.g. `us-east-1`) |
| `AWS_S3_BUCKET` | ✅ | S3 bucket name |
| `RESEND_API_KEY` | ✅ | Resend API key |
| `FROM_EMAIL` | ✅ | Sender address (e.g. `orders@acenursing.com`) |
| `FRONTEND_URL` | ✅ | Frontend origin for CORS + email links |
| `PORT` | — | Server port (default: `5000`) |
| `NODE_ENV` | — | `development` or `production` |
| `TRUST_PROXY` | — | Set `true` when behind a reverse proxy |
| `ENFORCE_HTTPS` | — | Set `true` to redirect HTTP → HTTPS |
| `USE_AWS_SECRETS` | — | Set `true` to load secrets from AWS Secrets Manager |
| `AWS_SECRETS_NAME` | — | Secret name in Secrets Manager (e.g. `acenursing/prod`) |
| `OTEL_ENABLED` | — | Set `true` to enable OpenTelemetry tracing |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | — | OTLP collector endpoint |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Backend API base URL (e.g. `http://localhost:5000/api`) |
| `VITE_PAYPAL_CLIENT_ID` | ✅ | PayPal client ID (sandbox or live) |

---

## Support

Email: support@acenursing.com
