# 🎓 AceNursing – Full-Stack E-Commerce Platform

Premium nursing study materials platform with instant PDF delivery, PayPal checkout, AWS S3 storage, and a full admin panel.

---

## ⚡ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6, Zustand, PayPal JS SDK |
| Backend | Node.js, Express 4, MongoDB/Mongoose |
| Payments | PayPal REST API (sandbox + live) |
| Storage | AWS S3 (PDFs + cover images) |
| Email | Resend (order confirmations + download links) |
| Auth | JWT (HTTP headers) |
| Deployment | Docker + Docker Compose / Nginx |

---

## 🚀 Quick Start (Local Dev)

### 1. Clone & Install

```bash
# Install dependencies for backend + frontend
npm install
```

> Tip: this runs `npm install` in both `backend/` and `frontend/` (via `postinstall`).

### 2. Configure Environment

**Backend** — copy `.env.example` to `.env` and fill in:

```bash
cp backend/.env.example backend/.env
```

Required variables:
```env
MONGODB_URI=mongodb://localhost:27017/acenursing
JWT_SECRET=your_min_32_char_secret_here
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_paypal_sandbox_secret
PAYPAL_MODE=sandbox
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=acenursing-materials
RESEND_API_KEY=re_your_key
FROM_EMAIL=orders@acenursing.com
FRONTEND_URL=http://localhost:3000
ADMIN_SETUP_KEY=any_secret_string
```

### Optional: AWS Secrets Manager
If you want to keep secrets out of `.env`, you can load them from AWS Secrets Manager.

1. Set `USE_AWS_SECRETS=true` in your `.env`.
2. Set `AWS_SECRETS_NAME` to the secret name (e.g. `acenursing/dev`).
3. Provide AWS credentials via environment variables or IAM role.

The app will merge secrets into `process.env` but will not override values already set explicitly in `.env`.

**Frontend** — create `.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
```

### 3. Seed the Database

```bash
cd backend
npm run seed
```

This creates 12 sample products and an admin account:
- **Email:** admin@acenursing.com
- **Password:** Admin@acenursing2025

> ⚠️ Change the admin password immediately after first login!

### 4. Start Development Servers

#### Option A — npm dev (recommended)
From the repo root, start both backend and frontend concurrently:

```bash
npm run dev
```

Then:
- Frontend: http://localhost:3000
- API: http://localhost:5000/api

#### Option B — Docker dev
If you prefer Docker, start everything with:

```bash
docker-compose up --build
```

> Tip: run `docker-compose down` to stop everything.
>
> **Note:** the Compose setup now uses named volumes for `node_modules` to avoid missing dependencies when mounting the local source tree.

#### Health check (use for monitoring / container health)

```bash
curl http://localhost:5000/api/health
```

> If you want to run each service separately, you can still run:
>
> ```bash
> cd backend && npm run dev
> cd frontend && npm run dev
> ```

---

## 🐳 Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d

# Seed database (after containers start)
docker-compose exec backend node scripts/seed.js

# Stop all
docker-compose down
```

---

## 📐 Project Structure

```
acenursing/
├── backend/
│   ├── config/
│   │   ├── aws.js          # S3 client
│   │   └── paypal.js       # PayPal API helpers
│   ├── middleware/
│   │   └── auth.js         # JWT protect / restrictTo
│   ├── models/
│   │   ├── User.js         # User schema + auth methods
│   │   ├── Product.js      # Product schema + slug
│   │   └── Order.js        # Order schema + order number
│   ├── routes/
│   │   ├── auth.js         # Register, login, profile
│   │   ├── products.js     # CRUD + reviews
│   │   ├── payments.js     # PayPal create/capture + downloads
│   │   ├── orders.js       # Admin order management
│   │   └── upload.js       # S3 file upload (PDF + image)
│   ├── scripts/
│   │   └── seed.js         # DB seed with sample data
│   ├── utils/
│   │   ├── email.js        # Resend email templates
│   │   └── s3.js           # S3 upload/download helpers
│   └── server.js           # Express app entry point
│
└── frontend/
    └── src/
        ├── components/
        │   ├── Navbar.jsx        # Sticky nav with auth
        │   ├── Footer.jsx        # Links, social, payments
        │   ├── Layout.jsx        # Page wrapper
        │   ├── CartDrawer.jsx    # Slide-in cart
        │   ├── ProductCard.jsx   # Shop grid card
        │   └── AdminLayout.jsx   # Admin sidebar layout
        ├── pages/
        │   ├── HomePage.jsx      # Hero, featured, testimonials
        │   ├── ShopPage.jsx      # Full shop with filters
        │   ├── ProductPage.jsx   # Detail + reviews
        │   ├── CheckoutPage.jsx  # 2-step + PayPal Buttons
        │   ├── OrderSuccessPage.jsx  # Confirmation + downloads
        │   ├── LoginPage.jsx     # Login + Register
        │   ├── AccountPage.jsx   # Orders + profile
        │   └── admin/
        │       ├── AdminDashboard.jsx  # Stats + recent orders
        │       ├── AdminUpload.jsx     # Upload products to S3
        │       ├── AdminProducts.jsx   # Manage product list
        │       └── AdminOrders.jsx     # View + update orders
        ├── api.js          # Axios + all API methods
        ├── store.js        # Zustand cart + auth stores
        ├── main.jsx        # React Router + PayPal Provider
        └── index.css       # Global styles + design tokens
```

---

## 🧪 Running Tests

### Backend

From the repo root (or inside `backend/`):

```bash
cd backend
npm test
```

### CI

A GitHub Actions workflow is included at `.github/workflows/ci.yml` that runs backend tests and builds the frontend on every push and pull request.

## 💳 PayPal Integration

### Sandbox Testing

1. Go to [developer.paypal.com](https://developer.paypal.com)
2. Create a sandbox app to get `client_id` and `secret`
3. Use sandbox buyer account to test payments
4. Test card: `4032039534213337` / any future expiry / any CVV

### Go Live

1. Change `PAYPAL_MODE=live` in `.env`
2. Replace sandbox credentials with live ones from PayPal dashboard
3. Update `VITE_PAYPAL_CLIENT_ID` with live client ID

---

## ☁️ AWS S3 Setup

1. Create an S3 bucket (e.g., `acenursing-materials`)
2. Set bucket policy to allow private reads (signed URLs for downloads)
3. Create an IAM user with `AmazonS3FullAccess` (or scoped policy)
4. Add credentials to `.env`

### S3 Bucket Policy (restrict public access, use signed URLs):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyPublicAccess",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::acenursing-materials/*",
      "Condition": {
        "StringNotEquals": {
          "aws:PrincipalArn": "arn:aws:iam::YOUR_ACCOUNT_ID:user/acenursing-api"
        }
      }
    }
  ]
}
```

---

## 📧 Email Setup (Resend)

1. Sign up at [resend.com](https://resend.com)
2. Add and verify your domain (e.g., `acenursing.com`)
3. Create API key and add to `.env` as `RESEND_API_KEY`
4. Set `FROM_EMAIL=orders@acenursing.com`

Emails sent:
- ✅ Order confirmation with download links
- 🎓 Welcome email on registration
- 🔐 Password reset link
- 📊 Admin new-order alert

---

## 🔒 Security Features

- JWT authentication with 7-day expiry
- Password hashing with bcrypt (cost factor 12)
- Rate limiting (300 req/15min global, 20 req/15min auth)
- MongoDB query sanitization (express-mongo-sanitize)
- Helmet HTTP security headers
- CORS restricted to frontend origin
- Signed S3 URLs for private file downloads (30-day links)
- Server-side price validation (never trust client-sent prices)
- Admin role gating on all sensitive routes

---

## 🌐 Production Deployment

### Environment
- Set `NODE_ENV=production` 
- Use a strong `JWT_SECRET` (min 32 chars, random)
- Set `FRONTEND_URL` to your actual domain
- Use `PAYPAL_MODE=live`

### Recommended Hosting
- **Backend:** Railway, Render, AWS EC2, DigitalOcean App Platform
- **Frontend:** Vercel, Netlify, or Nginx on same server
- **Database:** MongoDB Atlas (free tier available)
- **Files:** AWS S3 (already integrated)

---

## 📞 Support

Email: support@acenursing.com  
Admin portal: yourdomain.com/admin
