# Acumen Business Suite — Client Deliverables Summary

> **How to use this document:** Open this file in GitHub, VS Code, or any text editor and replace every `[...]` placeholder below with your details before sending to the client or attaching to an invoice.

---

## Document details (edit these fields)

| Field | Your entry |
|-------|------------|
| **Developer / Vendor name** | `[YOUR FULL NAME]` |
| **Developer / Company** | `[YOUR COMPANY NAME — optional]` |
| **Developer email** | `[YOUR EMAIL]` |
| **Developer phone** | `[YOUR PHONE — optional]` |
| **Client name** | `[CLIENT FULL NAME]` |
| **Client organization** | `[CLIENT COMPANY NAME]` |
| **Client email** | `[CLIENT EMAIL — optional]` |
| **Project title** | Acumen Business Suite |
| **Live app URL** | `[YOUR NETLIFY URL — e.g. https://your-site.netlify.app]` |
| **Document date** | `[DD Month YYYY]` |
| **Invoice / reference #** | `[INVOICE NUMBER — optional]` |
| **Agreed amount (KES)** | `[AMOUNT]` |

---

**Document purpose:** This document describes the features, improvements, and production-readiness work delivered on the Acumen application so the client can review scope, verify value received, and process payment against agreed deliverables.

**Project:** Acumen (Sales & Operations Web Application)  
**Platform:** React + Vite web application, hosted on Netlify  
**Shared data backend:** Supabase (cross-device synchronization)  
**Primary market context:** Kenya (currency, locations, maps)

**Repository:** `acumen-octo-palm-tree` (GitHub)  
**Prepared by:** `[YOUR FULL NAME]` for `[CLIENT COMPANY NAME]`  
**Date:** `[DD Month YYYY]`

---

## 1. Executive Summary

The Acumen application was enhanced from a demo-oriented sales tool into a **production-ready business operations platform** suitable for real daily use by administrators and sales representatives in Kenya.

Delivered work spans **business logic**, **user experience**, **mapping and live tracking**, **data reliability across devices**, **administration controls**, and **deployment configuration**. The application remains accessible via a secure web link (no Play Store requirement for initial rollout).

---

## 2. Core Business Features Delivered

### 2.1 Kenyan Shilling (KES) Currency

- Replaced USD-style display with proper **Kenyan Shilling formatting** across the app.
- Central currency formatter (`lib/formatCurrency.ts`) used in orders, products, dashboard, clients, LPO views, and forms.
- Product pricing and order totals reflect realistic KES values for local operations.

### 2.2 Kenya Locations & Territories

- Added structured **Kenyan counties and towns** data (`data/kenyanLocations.ts`).
- Integrated location selection for:
  - Sales representative territories
  - Client addresses (with address suggestions)
  - User profile and admin user management
- `WorkLocationPicker` component for consistent county/town/address capture.

### 2.3 Google Maps & Live Location

- Interactive **Google Maps** integration for client locations and field visibility (`components/ClientMap.tsx`).
- **Live GPS tracking** for clocked-in sales representatives:
  - Automatic location updates while on shift
  - Admin map view of active rep positions
  - Manual location search with geocoding (Google + OpenStreetMap fallback)
- Geolocation hook with continuous watch mode (`hooks/useGeolocation.ts`).
- Setup scripts and environment documentation for Maps API configuration.

### 2.4 Orders & Sales Workflow

- **Draft order review** before posting (edit, post, or discard).
- Order ID generation **without leading zeros** (e.g. `ORD-1`, `ORD-2`).
- **Product search** in order form to avoid long scrolling.
- Order create/edit flows with stock adjustment on placement and updates.

### 2.5 Products & Inventory

- Manual product add/edit.
- **CSV/Excel import** with improved parsing (quoted fields, optional IDs/descriptions, price normalization).
- **Admin-only product delete** with confirmation.
- Import fixes for common “row mismatch” and duplicate ID issues.

### 2.6 Clients & Tasks

- Client management with Kenyan address support.
- Client import capability.
- Visit logging, supplier fields, and map-linked locations.
- Task assignment, status updates, and deletion by role.

### 2.7 User & Access Management

- Full **User Management** portal for admins:
  - Create users (name, username, password, PIN, role, territory)
  - Edit user details (name, username, avatar, territory)
  - Security updates (password/PIN)
  - Activate/deactivate accounts
  - Delete users (with safeguards)
  - Per-user preferences (theme, notifications, default page)
- Role-based access (Admin vs Sales Representative).
- Login improvements (password visibility toggle, disabled-account messaging).

### 2.8 App Branding (White-Label Controls)

- Admin settings to customize:
  - **App name**
  - **Logo** (URL or file import up to 2MB)
  - Reset to default branding
- Branding reflected on login screen and sidebar.
- Branding persisted locally and via shared backend.

### 2.9 Theming

- Global dark mode support (`index.css`) with consistent overrides across light utility classes.
- User-level theme preference (light / dark / system).
- Login page blue branding preserved while app supports full dark theme.

---

## 3. Data Sync & Production Readiness

### 3.1 Cross-Device Synchronization (Supabase)

- Migrated shared state from Netlify Blobs (blocked on free tier env vars) to **Supabase REST API**.
- Shared application state includes:
  - Users, clients, products, orders, tasks
  - Clock logs, live locations, branding, reset version
- Load, save, and merge logic for multi-device consistency (`lib/sharedAppState.ts`).
- SQL setup script provided (`scripts/supabase-app-state.sql`).

### 3.2 Reliable Save Behavior (Critical Fixes)

- **Immediate persistence** for high-risk admin actions:
  - Branding updates
  - Product deletion
  - User create/edit/delete
- Prevention of **rollback bugs** where newer local changes were overwritten by older shared snapshots.
- User list merge logic so newly created users remain visible and can log in.
- Login screen merges local + shared users (not overwrite-only).

### 3.3 Production Data Controls

- **No mock/demo data seeding in production** (`import.meta.env.PROD` guard).
- **Reset version** mechanism to clear cached operational data across devices while preserving user accounts.
- Local storage sync across browser tabs for products and core entities.

---

## 4. Deployment & Environment Deliverables

| Item | Description |
|------|-------------|
| Netlify hosting | Live web deployment pipeline |
| Environment template | `.env.example` with required `VITE_` variables |
| Google Maps setup | `scripts/setup-google-maps.ps1` |
| Netlify + Maps guide | `scripts/setup-netlify-live.ps1` |
| Supabase schema | `scripts/supabase-app-state.sql` |
| Git repository | Version-controlled history of all changes pushed to `main` |

**Required environment variables for production:**

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GOOGLE_MAPS_API_KEY`

---

## 5. Technical Quality & Maintenance

- TypeScript types extended for new domains (`UserWorkLocation`, `LiveLocation`, `AppBranding`, etc.).
- Improved CSV import utilities (`lib/excelApi.ts`).
- Error handling and fallbacks for offline/shared-state failures.
- Multiple iterative fixes based on live client testing feedback (maps, branding, dark theme, user persistence).

---

## 6. Recommended Client Rollout (No Play Store Required)

For immediate business use, the client can:

1. Use the **Netlify live URL** as the official app link.
2. Have staff open the link on mobile and choose **Add to Home screen**.
3. Operate with real admin-created users and production data in Supabase.
4. Optionally add a custom domain later (e.g. `app.companyname.co.ke`).

Play Store distribution is **optional** and not required for legitimate paid delivery of this phase.

---

## 7. Out of Scope (Unless Agreed Separately)

The following were not part of the delivered web-application phase unless separately contracted:

- Native Android APK / iOS App Store packaging
- Payment gateway integration (M-Pesa, card billing, invoicing)
- SMS/email notification delivery infrastructure
- Custom backend auth server (current model uses app-managed users + Supabase state)
- Ongoing 24/7 support SLA or hosting cost coverage

---

## 8. Deliverables Checklist for Payment Approval

| # | Deliverable | Status |
|---|-------------|--------|
| 1 | KES currency across app | Delivered |
| 2 | Kenyan counties/towns & territories | Delivered |
| 3 | Google Maps + live rep tracking | Delivered |
| 4 | Supabase cross-device sync | Delivered |
| 5 | Production data guards & reset | Delivered |
| 6 | Order draft/edit + product search | Delivered |
| 7 | Product import fixes + admin delete | Delivered |
| 8 | User management (CRUD + security) | Delivered |
| 9 | App branding (name/logo) | Delivered |
| 10 | Dark theme consistency | Delivered |
| 11 | Persistence/rollback fixes | Delivered |
| 12 | Deployment scripts & documentation | Delivered |
| 13 | GitHub `main` branch updates | Delivered |

---

## 9. Client Sign-Off

By signing below, the client confirms that the deliverables listed in this document have been provided as described and accepted for payment processing under the agreed project terms.

**Client name:** `[CLIENT FULL NAME]`  

**Client organization:** `[CLIENT COMPANY NAME]`  

**Client signature:** _______________________________  

**Client sign-off date:** _______________________________  

**Developer / Vendor:** `[YOUR FULL NAME]`  

**Developer / Company:** `[YOUR COMPANY NAME — optional]`  

**Amount agreed (KES):** `[AMOUNT]`  

**Payment reference / invoice #:** `[INVOICE NUMBER]`  

---

## 10. Notes for Invoice Wording (Optional)

Suggested line item summary for invoice:

> *Development and deployment of Acumen Business Suite enhancements including Kenya localization (KES, counties/towns), Google Maps live sales tracking, Supabase multi-device synchronization, admin user/product/order management, branding controls, production data safeguards, and deployment configuration for Netlify production use.*

---

*This document reflects work completed in the Acumen codebase and deployment pipeline as of May 2026. For technical change history, refer to Git commit messages on the `main` branch.*
