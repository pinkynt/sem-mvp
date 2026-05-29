# SEM Frontend Data Integration

The permit-holder UI now talks to parking API routes instead of mocked arrays. Frontend code imports only DTO contracts and browser fetchers; Supabase admin access stays server-side.

## Quick Path

1. UI imports DTOs from `src/contracts/parking.ts`.
2. UI calls browser-safe functions from `src/features/parking/api.ts`.
3. API routes under `src/app/api/parking/**` call `src/server/parking/domain.ts`.
4. The server domain uses the Supabase admin client and MercadoPago QR helpers.
5. Demo mutation routes require `x-sem-demo-key` matching server-side `SEM_DEMO_API_KEY`.

## Boundaries

| Layer | Allowed imports | Must not import |
|-------|-----------------|-----------------|
| UI pages/components | `src/contracts`, `src/features` | `src/server`, Supabase clients |
| Feature fetchers | `src/contracts` | `src/server`, Supabase clients |
| API routes | `src/server`, `src/contracts` | Client components |
| Server domain | Supabase admin, MercadoPago server modules | Browser-only modules |

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/parking/permit-holder/home` | Dashboard, tariffs, active sessions, recent payments |
| `POST` | `/api/parking/quote` | Quote prepaid payments |
| `POST` | `/api/parking/payments` | Create prepaid cash or digital payment |
| `GET` | `/api/parking/payments/[id]` | Poll payment status and receipt |
| `POST` | `/api/parking/sessions` | Open a postpaid parking session |
| `POST` | `/api/parking/sessions/[id]/quote-close` | Quote closing an active session |
| `POST` | `/api/parking/sessions/[id]/close` | Close an active session with cash or digital payment |

## Demo Mutation Guard

All parking `POST` routes use Supabase service-role access, so they are explicitly guarded for the MVP demo:

| Setting | Use |
|---------|-----|
| `SEM_DEMO_API_KEY` | Server-only required key for parking mutation routes |
| `NEXT_PUBLIC_SEM_DEMO_API_KEY` | Optional browser demo key forwarded as `x-sem-demo-key` by `src/features/parking/api.ts` |
| `SEM_DEMO_PERMIT_HOLDER_LEGAJO` | Server-side demo permit holder file number, defaulting to `DEMO-001` |

This is not real user authentication. A public browser key can protect against accidental open calls, but it is visible to anyone using the deployed app. For a public deployment, use a server action/proxy or real auth session before exposing mutation routes.

## DTO Summary

| DTO | Use |
|-----|-----|
| `ParkingDashboardDto` | Home screen data bundle |
| `VehicleTariffDto` | Vehicle cards and hourly rates |
| `ParkingQuoteDto` | Final server-priced amount before confirmation |
| `CreateParkingPaymentResponse` | Cash receipt or MercadoPago QR payload |
| `ParkingPaymentStatusDto` | Digital payment polling result |
| `ParkingSessionDto` | Active and opened postpaid sessions |

## Examples

```ts
import { getPermitHolderHome, quoteParkingPayment } from "@/features/parking/api";

const dashboard = await getPermitHolderHome();
const quote = await quoteParkingPayment({
  vehicleKind: "auto",
  method: "digital",
  durationMinutes: 60,
});
```

## Rules For Agents And Frontend Work

- Keep `src/contracts/**` free of Supabase and server imports.
- Keep browser fetchers in `src/features/parking/api.ts`; do not call API routes ad hoc from components unless there is a clear reason.
- Quote on the server before confirming money movement.
- Normalize license plates on the server; UI formatting is presentation only.
- Digital payments are pending until MercadoPago webhook confirmation updates `payment_gateway_refs` and `payments`.
- Only MercadoPago QR orders with paid/accredited status confirm SEM payments. Pending, created, expired, cancelled, failed, and refunded provider states must not create a confirmed receipt.
- QR Mercado Pago is the only supported digital flow in the MVP. Do not show or document Tarjeta as implemented until a distinct card flow exists.
- The old `parking_payment_tickets` table remains compatibility-only and is not the main UI flow.
