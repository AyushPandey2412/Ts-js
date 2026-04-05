# Last Mile Processing Queue — Implementation Notes

## Overview

The Last Mile Processing Queue (LMPQ) manages shipments after they arrive at the warehouse and before final customer delivery. Orders flow through these statuses:

```
ARRIVED → READY_FOR_DISPATCH → MANIFESTED
    ↓              ↓
 ON_HOLD       (dispatched)
    ↓
READY_FOR_DISPATCH (via Ship Now)
```

---

## Database Table

**`last_mile_items`** — one row per order item in the last mile queue.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key (`lmpq_item_id` in API responses) |
| `shipment_id` | uuid | Links to `hawb_shipments.hawb_id` |
| `order_id` | uuid | Links to `orders` |
| `order_item_id` | uuid | Links to `order_items` (unique) |
| `status` | enum | `ARRIVED`, `READY_FOR_DISPATCH`, `ON_HOLD`, `MANIFESTED`, `PROBLEM`, `MFN_COLLECTED` |
| `warehouse_weight_kg` | numeric | Weight entered by warehouse staff (in kg) |
| `carrier_partner` | varchar | Courier name assigned at Ship Now |
| `awb_number` | varchar | Auto-generated AWB (format: `LM` + 10-digit ts + 4 random digits) |
| `hold_reason` | text | Reason entered when placed on hold |
| `hold_at` | timestamp | When the hold was applied |
| `status_updated_at` | timestamp | Last status change timestamp |

---

## File Structure

```
service-master/src/
  features/last-mile-processing-queue.ts/
    last-mile.service.ts       ← SQL queries & business logic
    last-mile.controller.ts    ← Request handling & validation
  routes/api/v1/last-mile/
    index.ts                   ← Route registration

client/src/
  utils/services/
    lastmile.service.ts        ← Axios API calls + TypeScript interfaces
  hooks/lastmile/
    useLastMile.ts             ← React Query hooks
  views/LastMile/
    LastMileTable.tsx          ← Main page component (tabs + grid)
    Gridrerenders.tsx          ← AG Grid column definitions (display only)
    action.tsx                 ← AG Grid action column cells + printShippingLabel
    Modals/
      ShipNow.tsx              ← Carrier selection modal
      OrderOnHoldModal.tsx     ← Hold reason modal
      MfnCollectionModal.tsx
      OrderOnHoldModal.tsx
```

---

## API Endpoints

| Method | Path | Controller | Status |
|---|---|---|---|
| `GET` | `/last-mile/orders` | `getLastMileOrdersController` | ✅ Working |
| `POST` | `/last-mile/ship-now` | `shipNowController` | ✅ Working |
| `PATCH` | `/last-mile/hold` | `holdOrderController` | ✅ Working |

All routes are protected with `fastify.authenticate`.

---

## Backend

### `LastMileService.getLastMileItems(options)`

Fetches paginated last mile items with full joins.

**Joins:**
- `hawb_shipments h` — HAWB/MAWB numbers, carrier name, arrival dates
- `orders o` — order number, date, customer name
- `seller_accounts sa` — sales channel, org-level auth (`sa.organization_id = :org_id`)
- `order_items oi` — product name, SKU, ASIN, quantity

**Filters:**
- `status` — filters by `lmpq_status` enum (maps from frontend tab)
- `search` — searches `order_number`, `customer_name`, `product_name`, `sku`, `asin`, `hawb_number`, `mawb_number`
- `start_date` / `end_date` — filters `l.created_at`

**Query params accepted by controller:**
```
page, limit, search, status, start_date, end_date, sort
```

> **Key fix:** Controller previously read `tab` instead of `status`. Fixed to read `status` directly, which is what the frontend sends.

---

### `LastMileService.shipNow(options)`

Updates a single `last_mile_items` row:

```sql
SET
  status = 'READY_FOR_DISPATCH',
  carrier_partner = :carrier_partner,
  warehouse_weight_kg = :warehouse_weight_kg,
  awb_number = :awb_number,       -- auto-generated
  status_updated_at = NOW(),
  updated_at = NOW()
```

**AWB Generation:**
```ts
// Format: LM + last 10 digits of Date.now() + 4 random digits
// Example: LM74923810142847
private static generateAwb(): string {
  const ts = Date.now().toString().slice(-10)
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `LM${ts}${rand}`
}
```

**Auth:** Uses `FROM orders JOIN seller_accounts WHERE organization_id = :org_id` to ensure the item belongs to the caller's org.

**Request body:**
```json
{
  "lmpq_item_id": "uuid",
  "carrier_partner": "Blue Dart",
  "warehouse_weight_kg": 0.5
}
```

**Response:** Returns updated row with `id`, `status`, `carrier_partner`, `warehouse_weight_kg`, `awb_number`.

---

### `LastMileService.holdOrder(options)`

Updates a single `last_mile_items` row:

```sql
SET
  status = 'ON_HOLD',
  hold_reason = :reason,
  hold_at = NOW(),
  status_updated_at = NOW(),
  updated_at = NOW()
```

**Request body:**
```json
{
  "lmpq_item_id": "uuid",
  "reason": "Shipment flagged by customs..."
}
```

**Response:** Returns updated row with `id`, `status`, `hold_reason`, `hold_at`.

---

## Frontend

### TypeScript Interfaces (`lastmile.service.ts`)

```ts
export interface ShipNowPayload {
  lmpq_item_id: string       // row.lmpq_item_id from the grid
  carrier_partner: string    // courier name from useCouriersList()
  warehouse_weight_kg: number // grams entered / 1000
}

export interface HoldOrderPayload {
  lmpq_item_id: string
  reason: string
}

export type LastMileStatus =
  | 'ARRIVED'
  | 'READY_FOR_DISPATCH'
  | 'ON_HOLD'
  | 'MANIFESTED'
  | 'PROBLEM'
  | 'MFN_COLLECTED'
```

---

### React Query Hooks (`useLastMile.ts`)

| Hook | Type | Purpose |
|---|---|---|
| `useLastMileOrders(status, page, limit, search, start_date, end_date, enabled)` | Query | Fetches orders by status with pagination |
| `useShipNow()` | Mutation | Calls `POST /last-mile/ship-now`, invalidates `last-mile-orders` cache, shows toast |
| `useHoldOrder()` | Mutation | Calls `PATCH /last-mile/hold`, invalidates `last-mile-orders` cache, shows toast |

---

### Tab → Status Mapping (`LastMileTable.tsx`)

```ts
const tabToStatusMap = {
  0: 'ARRIVED',           // Arrived Shipment
  1: 'READY_FOR_DISPATCH',// Ready for Dispatch
  2: null,                // Manifest (uses ManifestView, no orders API)
  3: 'PROBLEM',           // Problem with Order
  4: 'ON_HOLD',           // Order on Hold
}
```

The API query is disabled for the Manifest tab (`enabled: !isManifestTab`).

---

### Action Columns (`action.tsx`)

#### Arrived Shipment tab (case 0)

Each row renders `ArrivedActionsCell`:

1. **WeightInput** — enter weight in grams, confirm with ✓ button or Enter key. Ship Now stays disabled until weight is confirmed.
2. **Ship Now** — disabled until weight confirmed. Calls `onShipNow(row, weightGrams)` → opens `ShipNowModal`.
3. **Order on Hold** — calls `onHold(row)` → opens `OrderOnHoldModal`.
4. **Problem with Order** — not yet implemented.
5. **MFN Collection** — opens `MfnCollectionModal`.

#### Ready for Dispatch tab (case 1)

Each row has:

1. **Print Shipping Label** — calls `printShippingLabel(row)` which opens a new browser window with a formatted label and triggers `window.print()`.
2. **Download Invoice** — not yet implemented (console.log placeholder).
3. **Re-assign Courier** — calls `onReassignCourier(row)` → opens `ShipNowModal` with existing `warehouse_weight_kg` pre-filled (converted to grams).

#### Order on Hold tab (case 4)

Each row renders `OnHoldActionsCell`:

1. **WeightInput** — same as Arrived tab.
2. **Ship Now** — disabled until weight confirmed. Calls `onShipNow(row, weightGrams)` → opens `ShipNowModal`.

---

### `printShippingLabel(row)` utility

Opens a new popup window with a print-ready HTML shipping label containing:

- AWB number (large, prominent)
- Order number
- Customer name
- Carrier
- Weight (kg)
- Product name, SKU, quantity

Calls `window.print()` on load. Used in both:
- Ready for Dispatch → "Print Shipping Label" button
- ShipNow Modal → "Print Shipping Label" button on success step

---

### ShipNow Modal (`ShipNow.tsx`)

**Props:**
```ts
{ open, onClose, row: any | null, weightGrams: string }
```

**Step 1 — LIST:**
- Shows weight summary: `X kg (Y g)`
- Loads courier list from `useCouriersList()` (from `useHawb.ts` hook — fetches from couriers API, returns `courier_name[]`)
- Each courier card has a "Ship Now" button
- On click: calls `useShipNow` mutation with `{ lmpq_item_id, carrier_partner, warehouse_weight_kg }`

**Step 2 — SUCCESS:**
- Shows confirmation: *"assigned to [Courier]. AWB: LMxxxxxxxxxx"*
- Footer: **Cancel** | **I'll do it later** | **Print Shipping Label**

**Note:** The AWB is extracted from the mutation response (`res?.data?.awb_number`).

---

### OrderOnHoldModal (`OrderOnHoldModal.tsx`)

**Props:**
```ts
{ open, onClose, row: any | null }
```

- Text area for hold reason
- Continue button: disabled while `isPending` or reason is empty
- On Continue: calls `useHoldOrder` mutation with `{ lmpq_item_id: row.lmpq_item_id, reason }`
- On success: resets reason field and closes modal

---

### State in `LastMileTable.tsx`

```ts
// Ship Now modal
const [shipNowRow, setShipNowRow] = useState<any | null>(null)
const [shipNowWeight, setShipNowWeight] = useState('')
const [openShipNow, setOpenShipNow] = useState(false)

// Hold modal
const [holdRow, setHoldRow] = useState<any | null>(null)
const [openOrderOnHold, setOpenOrderOnHold] = useState(false)
```

**Arrived tab `onShipNow`:**
```ts
onShipNow: (row, weight) => {
  setShipNowRow(row)
  setShipNowWeight(weight)       // weight already in grams from WeightInput
  setOpenShipNow(true)
}
```

**Ready tab `onReassignCourier`:**
```ts
onReassignCourier: (row) => {
  setShipNowRow(row)
  setShipNowWeight(String(Number(row.warehouse_weight_kg) * 1000))  // kg → grams
  setOpenShipNow(true)
}
```

**Arrived tab `onHold`:**
```ts
onHold: (row) => {
  setHoldRow(row)
  setOpenOrderOnHold(true)
}
```

---

## What Is NOT Yet Implemented

| Feature | Location | Notes |
|---|---|---|
| Download Invoice | Ready for Dispatch actions | Placeholder `console.log` |
| Problem with Order action | Arrived actions | Button exists, no handler |
| Release Hold | On Hold tab | Backend method not written |
| Manifest generation | Manifest tab | `ManifestView` component exists, all manifest controllers are TODOs |
| MFN Collection details | Arrived actions | Modal exists, controller is TODO |
| Bulk Ship Now | SelectedItemsBar (Ready tab) | Only `console.log`s selected order IDs |
