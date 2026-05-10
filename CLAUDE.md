# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Development server
npm run build      # Static export to out/
npm run lint       # ESLint check
```

### Deploy
```bash
# Deploy app (always use --project flag)
firebase deploy --only hosting:larabakery --project larabakery-d98a0

# Deploy Cloud Functions
firebase deploy --only functions --project larabakery-d98a0
```

> `larabakery.web.app` is the real site. The `.firebaserc` target `larabakery` maps to site `larabakery`. Never deploy without `--only hosting:larabakery` or the redirect site (`larabakery-default`) will also rebuild.

## Architecture

**Next.js 16 App Router + Firebase** — fully static export (`output: "export"` in `next.config.ts`). All data fetching is client-side via Firestore SDK. No SSR.

### Data flow

```
Firebase Auth (Google) → AuthProvider (context) → useAuth() hook
Firestore → lib/firebase-store.ts (all CRUD) → page/component state
```

- `lib/firebase-store.ts` is the single data layer — all Firestore reads/writes go through it.
- `lib/data.ts` holds TypeScript types (`Product`, `Order`, `OrderStatus`, `PaymentStatus`), utility functions (`formatCurrency`, `orderTotal`, `formatStatus`), and mock fallback data used when Firestore has no products.
- Admin emails are hardcoded in `lib/firebase-store.ts` — role is determined by email match, not a Firestore field.

### Route protection

- Customer pages (`/pedido`, `/mis-pedidos`): redirect to `/login` if no auth (handled inside each page).
- Admin pages (`/admin/**`): wrapped in `AdminGuard` component which blocks non-logged-in users and non-admin emails.

### Static export constraints

- Dynamic routes (`/admin/pedidos/[id]`, `/productos/[id]`) require `generateStaticParams()` — they export placeholder shells and load real data client-side on mount.
- `images: { unoptimized: true }` in `next.config.ts` is required for `<Image>` to work with static export.
- All `NEXT_PUBLIC_*` env vars are baked into the build — changing them requires a full rebuild and redeploy.

### Firestore schema

| Collection | Key fields |
|---|---|
| `users/{uid}` | name, email, role (`customer`\|`admin`) |
| `products/{id}` | name, price, isAvailable, isFeatured, variants[], imageUrl |
| `orders/{LB-YYMMDD-NN}` | status, paymentStatus, deliveryMethod, items (subcollection) |
| `orders/{id}/items/{itemId}` | productId, productName, quantity, unitPrice |
| `product_costs/{productId}` | ingredients, packaging, labor, other, total_cost |
| `counters/orders` | date (YYMMDD), count — drives sequential order IDs |

Order IDs follow the format `LB-YYMMDD-NN` (e.g. `LB-260509-03`). All dates use `America/Bogota` timezone.

### Cloud Functions

`functions/src/index.ts` — single trigger `notifyAdminOnNewOrder` fires on `orders/{orderId}` creation and sends an email to hardcoded admin addresses via nodemailer/Gmail.

### Environment variables

All `NEXT_PUBLIC_*` — no server-side secrets in the Next.js app:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
NEXT_PUBLIC_WHATSAPP_URL       # Full wa.me URL for the business WhatsApp
NEXT_PUBLIC_PAYMENT_NEQUI      # Nequi phone number shown post-order
NEXT_PUBLIC_PAYMENT_NAME       # Name shown on Nequi payment card
```

### Color palette

Inline Tailwind values follow this scheme (no config file, Tailwind v4):

| Token | Hex |
|---|---|
| cream background | `#fbf4e7` / `#fff9f3` |
| cocoa (headings) | `#3b2924` |
| warm gray (body) | `#74635c` |
| rose accent | `#c9657e` |
| green (success) | `#2fbf71` |
| peach (highlight) | `#ffd3bc` |
