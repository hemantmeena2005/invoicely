# ⚡ Invoicely - Modern Invoice Management SaaS

A full-stack modern invoice management and billing SaaS application built with Next.js 14, **Supabase (PostgreSQL)**, **Brevo (Sendinblue)** email automation, and **NPCI UPI Instant Payment Integration** with **0% gateway fees**.

---

## 🚀 Key Features

- **⚡ Instant NPCI UPI Payment Engine**:
  - Dynamic QR codes generated on-the-fly for any Indian Rupee (₹) invoice balance.
  - Compatible with Google Pay, PhonePe, Paytm, BHIM, CRED, and all Indian banking apps.
  - Direct 1-tap mobile deep-links for seamless checkout on smartphones.
  - Option to upload custom standalone printed merchant QR codes.
  - Scannable UPI QR codes embedded directly on downloadable PDF receipts.
- **🌐 Public Client Payment Portal (`/pay/[id]`)**:
  - Secure, no-auth payment link for external clients who receive invoices via email or message.
  - Real-time invoice review, line-item breakdown, UPI payment confirmation, card checkout, and PDF receipt download.
- **📧 Brevo (Sendinblue) Transactional Emails**:
  - Dispatches professional HTML invoice emails & payment reminders (300 free emails/day).
  - High-conversion **"View & Pay Invoice"** button linking directly to the client payment portal.
  - Attaches high-resolution base64 PDF receipts.
  - Adaptive sender identity (displays the logged-in user's name with direct `replyTo` support).
- **🕒 Transaction History & Audit Trail (`/history`)**:
  - Dedicated financial ledger tracking all settled invoices, amounts, timestamps, and payment methods.
  - Brevo email delivery audit logs with message IDs.
  - Search, date filtering (`All Time`, `Last 30 Days`, `Last 7 Days`), and 1-click **CSV Export**.
- **⚙️ Profile & Payment Settings (`/settings`)**:
  - Custom UPI ID (VPA) management with quick-handle shortcuts (`@oksbi`, `@okhdfcbank`, `@paytm`, `@ybl`).
  - Profile photo / avatar uploader.
  - Business profile details (company name, phone number, tax location).
  - Live interactive client payment preview card.
- **📊 Analytics & Overview Dashboard**:
  - Real-time revenue metrics, status distributions, top client rankings, and zero-layout-shift skeleton loaders.
- **🔐 1-Click Demo & NextAuth Authentication**:
  - 1-click instant demo access with optional UPI handle onboarding.
  - Google OAuth integration support.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 14 (App Router)](https://nextjs.org/) + React 18 |
| **Language** | TypeScript |
| **Styling** | Vanilla CSS + Tailwind CSS |
| **Database** | [Supabase (PostgreSQL)](https://supabase.com/) |
| **Email Service** | [Brevo (Sendinblue)](https://www.brevo.com/) (REST API & SMTP Relay) |
| **UPI Payments** | Standard NPCI UPI URI Specification + `qrcode` engine |
| **PDF Engine** | `pdf-lib` |
| **Authentication** | [NextAuth.js](https://next-auth.js.org/) |

---

## 💳 How UPI Payments Work

- **Where does the money go?**
  - The money transfers **instantly and directly into your bank account** linked to your UPI ID (configured in Settings or defaulting to `NEXT_PUBLIC_DEFAULT_UPI_ID`).
- **Fees**: **0% Gateway Fees** (100% direct bank-to-bank settlement).
- **Client Experience**: The client visits the secure payment link (`/pay/[id]`), scans the dynamic QR code on desktop or taps "Open in UPI App" on mobile. Their Google Pay / PhonePe / Paytm app opens with your payee name and exact invoice amount pre-filled.
- **Custom QR Code**: Users can upload their own static merchant/personal QR code image in `/settings` if they prefer.

---

## 📦 Getting Started Locally

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/invoice-generator.git
cd invoice-generator
npm install
```

### 2. Configure Environment Variables
Create `.env.local` in the root directory:
```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=invoicely_super_secure_secret_key_123

# Supabase (PostgreSQL)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# Brevo (Sendinblue) Email
BREVO_API_KEY=xsmtpsib-...
BREVO_SMTP_LOGIN=ba9960001@smtp-brevo.com
BREVO_SENDER_EMAIL=your-verified-email@gmail.com
BREVO_SENDER_NAME="Your Name or Business"

# UPI Payments
NEXT_PUBLIC_DEFAULT_UPI_ID=yourname@oksbi
```

### 3. Run the Supabase SQL Schema
Copy and run the contents of [`supabase_schema.sql`](./supabase_schema.sql) in your **Supabase SQL Editor** to create the tables (`users`, `clients`, `invoices`) and indexes.

### 4. Start the Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🌐 Deploying to Vercel (Production)

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Deploy Invoicely to production"
   git push origin main
   ```
2. Go to **[Vercel Dashboard](https://vercel.com/)** $\rightarrow$ **"Add New Project"** $\rightarrow$ Import your repo.
3. In **Environment Variables**, paste all the keys from your `.env.local` (set `NEXTAUTH_URL` to your production domain `https://your-app.vercel.app`).
4. Click **Deploy**.

---

## 📄 License
MIT License © 2026 Invoicely Team.