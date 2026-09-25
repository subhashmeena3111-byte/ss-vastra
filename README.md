# ✨ SS VASTRA - Luxury Ethnic & Contemporary Fashion

A full-stack luxury fashion and bridal wear e-commerce application built with React 19, TypeScript, Tailwind CSS, Node.js/Express, Cloud SQL (PostgreSQL), Google Drive media integration, and Firebase Authentication.

---

## 🌟 Key Features

- **Storefront & Catalog:**
  - Interactive category rows (Bridal Lehengas, Royal Sherwanis, Designer Sarees, Kurtas, Anarkalis, Indowestern).
  - Search, price filters, category filters, and quick view modals.
  - Size selectors (XS, S, M, L, XL, XXL) and detailed outfit specifications.
  - Cart drawer with live discount coupon codes (`FESTIVE20`, `WELCOME10`).
  - Cash on Delivery (COD) and Online Payment options with automated order receipt creation.

- **Order Tracking & Account:**
  - Live customer order tracking via 10-character Order ID (e.g. `ORD-849201`).
  - Visual status progress bar (Order Placed ➔ Confirmed ➔ Processing ➔ Shipped ➔ Delivered).
  - Customer login/signup with order history.

- **Admin Management Portal (`/admin`):**
  - Secure role-based admin credentials and session management.
  - Live Analytics: Total Revenue, Total Orders, Delivered Orders, and Product Counts.
  - Real-time Order Management: Change statuses, view customer notes, and generate PDF/Printable GST Invoices with 1 click.
  - Product Catalog CRUD: Add new outfits, edit prices, manage inventory stocks, and set categories.
  - Cloud Drive Image Manager: Direct image upload and sync to dedicated Google Drive folders.

- **Integrations:**
  - **Database:** PostgreSQL (Cloud SQL) via Drizzle ORM.
  - **Storage:** Google Workspace Drive for product image management.
  - **WhatsApp Direct Connect:** Floating instant chat widget with pre-filled inquiries.
  - **PWA Ready:** Installable on Android, iOS, and Desktop.

---

## 🚀 Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Framer Motion
- **Backend:** Node.js, Express.js, TypeScript (`tsx`)
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** JWT, BCrypt, Firebase Admin SDK
- **Media Storage:** Google Drive API Integration

---

## 🛠️ Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/subhashmeena3111-byte/ss-vastra.git
   cd ss-vastra
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Copy `.env.example` to `.env` and fill in your database credentials and API keys.

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

5. **Auto-Sync to GitHub:**
   ```bash
   npm run sync:git
   ```

---

© 2026 SS VASTRA. All rights reserved.
