# Naati Nest — Project Status & Development Log

> **Last Updated:** 2026-04-06
> **Project:** Naati Nest — Authentic Non-Veg Cuisine Ordering App (AirMenu-inspired)
> **Location:** `C:\Users\MANU\Documents\Antigravity Projects\naatinest`
> **GitHub:** https://github.com/Manu-Socialeo/Naati-Nest

---

## How to Resume Work

If this file exists, **read it first** before doing anything. It contains the full project context, what's been built, what's pending, and exact next steps.

**This IS the source of truth** — not terminal history or chat logs.

---

## Supabase Configuration

**Project URL:** `https://hrmvomnlrhqbahjzejhl.supabase.co`
**Credentials stored in:** `.env.local` (already configured)

**Schema file:** `supabase_schema.sql` — run this in Supabase SQL Editor

### Schema Tables:
- `profiles` — customer/staff/admin profiles with `admin_pin`
- `categories` — menu categories with `sort_order`
- `menu_items` — menu items with `sort_order`, `available_from`, `available_until`
- `restaurant_settings` — restaurant config
- `orders` — orders with `scheduled_for`, `tip_amount`, `table_id`, `coupon_code`, `coupon_discount`
- `tables` — QR code tables with `label`, `is_active`
- `order_ratings` — customer food/service ratings + feedback
- `banners` — promotional banners with scheduling

### Storage Buckets:
- `menu-photos` — menu item photos
- `banners` — banner images

---

## ALL FEATURES BUILT ✅ (Complete — 25 items)

### Core (Phase 1)
1. ✅ Supabase-only backend — all localStorage fallbacks removed
2. ✅ Admin Dashboard — 4 tabs: Orders | Analytics | Menu | QR Codes
3. ✅ Orders tab — status/payment filters, search, real-time bell notification, auto-print toggle, bill printing
4. ✅ Analytics tab — KPI cards, time period filters, revenue chart, orders-by-hour chart, most/least sold items, category donut, payment/order type splits, orders table with CSV export, customer data export for ads
5. ✅ Menu Management — add/edit/delete items, photo upload, toggle bestseller/today's special/availability, manage categories, **dnd-kit drag-to-reorder** (professional smooth drag & drop with `@dnd-kit/core`), time availability
6. ✅ Food photos — unique Unsplash images for every item
7. ✅ Customer ticket-style real-time status (Confirmed → Cooking → Ready → Done)
8. ✅ Admin notification bell for new orders

### Phase 2
9. ✅ Kitchen Display System (KDS) — full-screen live order view at `/kitchen`, urgency colors, sound alerts
10. ✅ QR Code Generator — per table QR codes in Admin Dashboard → QR tab, **card-style print layout** (90mm × 120mm with Naati Nest branding, table label, "SCAN TO ORDER"), download as PNG, individual print (reprint as needed for damaged cards)
11. ✅ Promotional Banners — admin creates banners with title, subtitle, image, link, date range; carousel on landing page
12. ✅ Tip System — optional tip during checkout (₹20/₹50/₹100 presets + custom amount)
13. ✅ Pre-Order / Schedule Orders — schedule orders for future date/time
14. ✅ Admin PIN Security — 4-digit PIN required for admin login (default: `1234`)
15. ✅ Time-Based Menu Availability — items show/hide based on `available_from` and `available_until` times
16. ✅ Customer Ratings & Feedback — interactive star ratings (food + service) with optional text feedback
17. ✅ Customer CRM — profile stats showing total orders, total spent, favourite item
18. ✅ Build Chunk Optimization — manualChunks splits bundle into 5 chunks
19. ✅ Push Notifications — browser notifications when tab is in background
20. ✅ Auto-Print Toggle — admin can switch auto-print on/off. OFF = only takeaway auto-prints. ON = all orders auto-print
21. ✅ Coupon Code System — `naatinest10` for ₹10 off at checkout
22. ✅ Customer Data Export — CSV with name, phone, order count, total spent, last order date for ads/retargeting

### Phase 3 (Latest)
23. ✅ **dnd-kit Drag & Drop** — Replaced broken HTML5 drag/drop with `@dnd-kit/core` + `@dnd-kit/sortable`. Smooth pointer-based dragging with 8px activation threshold, keyboard support, proper sort_order persistence to Supabase
24. ✅ **QR Card Print Layout** — Professional 90mm × 120mm printable card with green border, gradient background, Naati Nest logo, QR code, table label, "SCAN TO ORDER" text
25. ✅ **Table Confirmation Banner** — When customer scans QR code, menu page shows sticky green banner: "📍 Table #5 — Dine-in" so they know they're ordering from the right table

### Phase 4 (Latest — QR Rebuild)
26. ✅ **Professional QR Code Generator** — Complete rebuild inspired by AirMenu. Features:
    - **Add Table Modal** — Clean modal with table number, optional label, and live QR preview
    - **Bulk Add Tables** — Generate up to 50 QR codes at once with custom prefix (e.g. "Table 1" → "Table 50")
    - **3 Print Modes** — Card (90×120mm), Sticker (70×70mm circular), All Tables sheet (3-column grid)
    - **Copy Menu Link** — One-click copy of the unique menu URL for each table
    - **Active/Inactive Toggle** — Show/hide tables without deleting
    - **Edit Table Modal** — Change number, label with QR preview
    - **Stats Dashboard** — Total tables, active, inactive, QR codes ready at a glance
    - **Search & Filter** — Quick search by table name or number
    - **Professional Card Design** — Naati Nest branding, gradient background, green border, "SCAN TO ORDER"

### Phase 5 (2026-04-06 — Quick QR Generator)
27. ✅ **Quick QR Generator** — Instant QR generation without needing database tables. Located at top of Admin → QR Codes tab.
    - Enter table number → QR generates instantly client-side
    - Optional label field (e.g. "Window Seat", "VIP")
    - Shows live URL that QR links to
    - **5 action buttons:** Print Card, Print Sticker, Download Card, Download Sticker, Copy Link
    - QR links to `/menu?table=N` — when scanned, opens the **live, real-time updated menu** from Supabase
    - Works without any database setup
    - Same professional card/sticker designs as database QR codes

### Phase 6 (2026-04-06 — QR Tab Complete Rebuild)
28. ✅ **QR Tab Complete UX/UI Rebuild** — Eliminated duplicate flows and jumbled interface. New design:
    - **Section 1: "Generate QR Code"** (green header) — Single input row: Table Number + Label + "Bulk Add Tables" button. Type number → QR appears instantly. 5 action buttons: Print Card, Print Sticker, Download Card, Download Sticker, Copy Link. "Save to Database" button appears only if table not yet saved (connects QR to order tracking).
    - **Section 2: "Saved Tables"** — Tables stored in Supabase. Compact cards with Print, Download, Link, Edit, Hide/Show, Delete. Search bar. "Print All" button in header.
    - **Removed:** Separate "Add Table" modal, duplicate stats cards row, print mode selection modal, scattered action buttons
    - **Simplified flow:** Generate → Print/Download → Optionally save to DB for order tracking
    - Bulk Add moved inline as a button in the generate section
    - Direct print on click (no intermediate modal)
    - Cleaner, more compact table cards
    - Git repo initialized and pushed to GitHub: https://github.com/Manu-Socialeo/Naati-Nest
    - Fixed index.html merge conflicts from git rebase
    - Added dist/ to .gitignore
    - Vercel deployment ready (vercel.json configured, build passes)

---

## File Structure

```
naatinest/
├── .env.example              # Template with Supabase + PhonePe vars
├── .env.local                # ACTUAL credentials (DO NOT COMMIT)
├── supabase_schema.sql       # Full DB schema + RLS + triggers + storage
├── PROJECT_STATUS.md         # THIS FILE
├── src/
│   ├── App.tsx               # Routes
│   ├── main.tsx
│   ├── vite-env.d.ts         # TypeScript env var types
│   ├── lib/
│   │   ├── supabase.ts       # Supabase client
│   │   ├── types.ts          # All interfaces
│   │   ├── utils.ts
│   │   ├── AuthContext.tsx
│   │   ├── CartContext.tsx
│   │   └── LanguageContext.tsx
│   ├── pages/
│   │   ├── LandingPage.tsx   # Banner carousel
│   │   ├── LoginPage.tsx     # Admin PIN login
│   │   ├── MenuPage.tsx      # Time availability, table banner
│   │   ├── CartPage.tsx      # Tips, scheduled orders, coupons
│   │   ├── OrderTrackingPage.tsx
│   │   ├── OrderHistoryPage.tsx # Ratings + CRM stats
│   │   ├── AdminDashboard.tsx  # 4 tabs: Orders | Analytics | Menu | QR
│   │   ├── KitchenDisplayPage.tsx
│   │   └── NotFoundPage.tsx
│   └── components/
│       ├── ErrorBoundary.tsx
│       ├── OfflineBanner.tsx
│       └── ui/
│           ├── Button.tsx
│           ├── Card.tsx
│           ├── Input.tsx
│           ├── Badge.tsx
│           └── Skeleton.tsx
├── vite.config.ts            # manualChunks for bundle splitting
└── package.json
```

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page with banner carousel |
| `/login` | Name + phone + PIN login |
| `/menu` | Full menu with search, filters, time availability, table banner |
| `/cart` | Cart with tips, schedule orders, coupon codes, payment |
| `/orders` | Customer order history with ratings + CRM |
| `/order-tracking/:id` | Real-time order status |
| `/admin` | Admin dashboard (4 tabs) |
| `/kitchen` | Kitchen Display System (full-screen) |

---

## Admin Dashboard Tabs

1. **Orders** — Quick stats, status/payment filters, search, real-time notifications, print bills, auto-print toggle
2. **Analytics** — KPI cards, period filters, revenue chart, hourly chart, most/least sold, category donut, payment/type splits, CSV export, customer data export for ads
3. **Menu** — Category management, add/edit/delete items, photo upload, toggle availability/bestseller/today's special, **dnd-kit drag-to-reorder**, time availability
4. **QR Codes** — Add tables, generate QR codes, **card-style print** (90mm × 120mm), download PNG, edit labels, delete tables

---

## Key Decisions

1. **Supabase-only** — No localStorage for orders/data
2. **Admin PIN** — 4-digit PIN (`1234`) for admin login
3. **No WhatsApp** — In-app notifications only
4. **Ticket-style status** — Visual progress steps for customers
5. **dnd-kit drag & drop** — Professional library replacing broken HTML5 drag/drop
6. **KDS separate page** — Full-screen at `/kitchen` for kitchen display
7. **QR codes via API** — Uses `api.qrserver.com` for QR generation
8. **QR card print** — Individual print per table (reprint as needed for damaged cards)
9. **Table banner** — Green sticky banner on menu page when QR scanned
10. **Auto-print** — OFF by default. Takeaway orders always print. Dine-in shows on screen only.
11. **Coupon code** — `naatinest10` for ₹10 off. Hardcoded, can be extended to DB later.
12. **Consolidated QR** — Removed duplicate `/qr-generator` route. QR management only in Admin Dashboard → QR tab.

---

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # TypeScript type check
```

---

## Known Issues

1. **No Supabase tables created yet** — Schema SQL needs to be run in Supabase SQL Editor
2. **PhonePe payment is mocked** — setTimeout fake success
3. **Admin PIN is hardcoded** — `1234` in LoginPage.tsx, should move to env var or DB
4. **Coupon code is hardcoded** — `naatinest10` in CartPage.tsx, should move to DB for dynamic management

---

*This file should be updated after every significant change or session.*
