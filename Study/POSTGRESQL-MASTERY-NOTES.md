# PostgreSQL Mastery Notes
### Based on Your AdminCRM2 Codebase — Production + Interview Guide

---

## Table of Contents

1. [Project DB Architecture Overview](#1-project-db-architecture-overview)
2. [Part 1 — All DB Interactions Found in Your Code](#2-part-1--all-db-interactions-found-in-your-code)
3. [Part 2 — Every Query Explained](#3-part-2--every-query-explained)
4. [Part 3 — Patterns Detected in Your Code](#4-part-3--patterns-detected-in-your-code)
5. [Part 4 — Categorized Query Reference](#5-part-4--categorized-query-reference)
6. [Part 5 — What is Missing (Full PostgreSQL Gaps)](#6-part-5--what-is-missing)
7. [Part 6 — Upgrade Your Code](#7-part-6--upgrade-your-code)
8. [Part 7 — Interview Questions](#8-part-7--interview-questions)
9. [Part 8 — Production Behavior Analysis](#9-part-8--production-behavior-analysis)

---

## 1. Project DB Architecture Overview

### Services and Their DB Role

| Service | DB Pattern | Key Tables |
|---|---|---|
| `seller-management-system/auth` | Raw SQL via Sequelize | users, registration_requests, organizations, user_organizations, warehouses |
| `seller-management-system/service-master` | Raw SQL + TypeScript | orders, order_items, purchase_orders, bills, hawb_shipments, vendors, products |
| `supplier-management-system/usa-auth` | Raw SQL via Sequelize | users, registration_requests, organizations (same schema as seller) |
| `supplier-management-system/usa-service-master` | Raw SQL + Sequelize-TypeScript ORM models | customers, vendors, stores, permissions, orders, order_items |
| `notification-service` | Raw SQL via Sequelize | message_dispatches, message_queue_movements, message_delivery_logs |

### Connection Pool (All Services)

```typescript
// src/config/database.ts — same in all 4 backend services
pool: {
  max: 5,        // max 5 connections per service instance
  min: 1,
  acquire: 30000,
  idle: 10000,
  evict: 10000,  // removes idle clients to avoid leaks
},
dialectOptions: {
  statement_timeout: 60000,           // kills queries running > 60s
  idle_in_transaction_session_timeout: 30000, // kills idle transactions > 30s
}
```

**What this means:** Each service can hold at most 5 Postgres connections. If all 5 are busy and a 6th request comes in, it waits up to 30 seconds (acquire timeout) then throws an error.

### Multi-Tenant Schema Design

Your project uses PostgreSQL schema-per-tenant isolation:

```
public schema       → shared: users, organizations, registration_requests
{org_schema} schema → tenant-specific: orders, order_items, purchase_orders, vendors, etc.
```

Example from your code:
```typescript
// schema comes from JWT token → org context → query
`SELECT * FROM ${schema}.orders WHERE order_id = :order_id`
```

The schema name is validated before use:
```typescript
// utils/validateSchema.ts
validateAndQuoteSchema(schema) // returns safeSchema with quotes, prevents injection
```

---

## 2. Part 1 — All DB Interactions Found in Your Code

### Seller Auth Service

| Function | File | Query Type | Description |
|---|---|---|---|
| `getActiveUserByEmail` | user.repository.js | SELECT | Login: fetch user by email |
| `getActiveUserById` | user.repository.js | SELECT | Auth middleware: fetch user by ID |
| `findRegistrationRequest` | user.repository.js | SELECT | Check if email already registered |
| `insertRegistrationRequest` | user.repository.js | INSERT | New user signup request |
| `getAllRegistrationRequests` | user.repository.js | SELECT + LEFT JOIN | Admin panel: list all requests |
| `findRegistrationRequestById` | user.repository.js | SELECT + FOR UPDATE | Lock row before approval |
| `generateOrganizationCode` | user.repository.js | SELECT (stored proc) | Call PG function |
| `createOrganizationWithoutSchema` | user.repository.js | SELECT (stored proc) | Call PL/pgSQL function |
| `createOrganizationAdminUser` | user.repository.js | CTE + INSERT | Complex user creation |
| `linkUserToOrganization` | user.repository.js | INSERT | Link user to org with access level |
| `updateRegistrationStatus` | user.repository.js | UPDATE | Mark request APPROVED |
| `markSetupPending` | user.repository.js | UPDATE | Trigger schema creation flow |
| `rejectRegistrationRequestInDB` | user.repository.js | UPDATE + RETURNING | Reject request |
| `updateOrganizationProfileRepo` | user.repository.js | UPDATE (dynamic) | Update org profile |
| `insertWarehouse` | user.repository.js | INSERT | Create first warehouse |
| `markSetupCompleted` | user.repository.js | UPDATE | Complete setup flag |
| `getOrganizationSchema` | user.repository.js | SELECT | Get schema_name for tenant |
| `updateUserById` | user.repository.js | UPDATE (dynamic SET) | Update user fields |

### Seller Service Master

| Function | File | Query Type | Description |
|---|---|---|---|
| `createFromSalesOrder` | purchase.service.ts | Transaction + INSERT | PO from sales order |
| `getBillDetails` | bill.service.ts | SELECT + JOINs + COUNT | Paginated bills list |
| `bulkInsertBills` | bill.service.ts | Bulk INSERT (loop) | Insert multiple bills |
| `validateOrderContext` | orders.service.ts | SELECT | Validate seller account |
| `bulkCreateOrders` | orders.service.ts | Worker bulk INSERT | CSV order import |
| Various services | *.service.ts | Raw SQL | shipments, inventory, PO tracking, etc. |

### Notification Service

| Function | File | Query Type | Description |
|---|---|---|---|
| `dispatchMessage` | message.service.ts | Transaction: INSERT + loop INSERT + UPDATE | Fan-out dispatch |
| `listMessageDispatches` | message.service.ts | SELECT + subqueries + pagination | List with filters |
| `getMessageDispatchDetail` | message.service.ts | SELECT + 2 extra queries | Full detail page |
| `getMessageDispatchById` | message.service.ts | SELECT + LEFT JOIN LATERAL | Worker fetch |
| `logAttempt` | message.service.ts | INSERT | Track delivery attempt |
| `logQueueMovement` | message.service.ts | INSERT | Track queue state |
| `finalizeDispatchIfNeeded` | message.service.ts | SELECT + GROUP BY + UPDATE | Finalize status |

---

## 3. Part 2 — Every Query Explained

---

### Query 1 — Simple SELECT with WHERE (Login)

```sql
-- file: seller-auth/features/user-authentication/user.repository.js
SELECT user_id, email, phone, password_hash, email_verified, is_super_admin
FROM public.users
WHERE email = :email AND is_active = true
```

**Simple explanation:** Find a user by their email address, but only if their account is active. Used at login.

**Deep technical explanation:**
- Uses named placeholder `:email` — Sequelize escapes this to prevent SQL injection
- `is_active = true` filters soft-deleted or suspended accounts
- Returns one row since email is (should be) unique
- No ORDER BY or LIMIT — assumes email is unique indexed

**Query type:** SELECT
**Filters:** WHERE with equality + boolean
**Performance:** Fast if `email` has a unique index. Without index = full table scan.

**Index suggestion:**
```sql
CREATE UNIQUE INDEX idx_users_email ON public.users(email) WHERE is_active = true;
-- Partial index: only indexes active users, smaller and faster
```

---

### Query 2 — SELECT with IN + Status Filter (Registration check)

```sql
-- file: user.repository.js
SELECT request_id, request_status, email_verified
FROM public.registration_requests
WHERE email = :email
AND request_status IN ('PENDING', 'APPROVED')
```

**Simple explanation:** Before letting someone register, check if they already have an active or pending request.

**Deep technical explanation:**
- `IN ('PENDING', 'APPROVED')` — PostgreSQL converts this to `= 'PENDING' OR = 'APPROVED'`
- For 2-3 values, IN is as fast as OR
- For large IN lists (100+ values), consider a JOIN to a temp table instead

**Query type:** SELECT
**Filters:** WHERE + IN clause
**Performance:** Needs composite index on `(email, request_status)`

**Index suggestion:**
```sql
CREATE INDEX idx_reg_requests_email_status
ON public.registration_requests(email, request_status);
```

---

### Query 3 — INSERT with RETURNING

```sql
-- file: user.repository.js
INSERT INTO public.registration_requests (
  email, phone, company_name, country, state,
  password_hash, ip_address, user_agent, request_status, requested_at
)
VALUES (
  :email, :phone, :company_name, :country, :state,
  :password_hash, :ip_address, :user_agent, 'PENDING', NOW()
)
RETURNING request_id, email
```

**Simple explanation:** Register a new user — save their details and get back the ID immediately.

**Deep technical explanation:**
- `RETURNING` is PostgreSQL-specific. It avoids a second `SELECT` to get the inserted row's ID.
- `NOW()` is evaluated at query time — gets current transaction timestamp
- Password is already hashed before reaching this query (bcrypt in service layer)

**Query type:** INSERT
**Returns:** Inserted row's ID without extra round-trip

**Optimization note:** This is already optimal. `RETURNING` is the correct pattern.

---

### Query 4 — SELECT FOR UPDATE (Pessimistic Lock)

```sql
-- file: user.repository.js — findRegistrationRequestById
SELECT request_id, full_name, email, phone, company_name, gstin, country, state, pan_number
FROM public.registration_requests
WHERE request_id = :requestId
FOR UPDATE
```

**Simple explanation:** When an admin approves a registration, lock that row so no other admin can approve it at the same time.

**Deep technical explanation:**
- `FOR UPDATE` acquires a **row-level exclusive lock** on the selected row
- Any other transaction trying to SELECT FOR UPDATE or UPDATE the same row will wait
- Lock is held until your transaction commits or rolls back
- This prevents double-approval: if two admins click "approve" at the same time, only one gets the lock
- This must be run inside an explicit `sequelize.transaction()` to be useful

**Query type:** SELECT (with lock)
**Concurrency:** Prevents race conditions on approval workflow

**Risk:** If the transaction is slow (email sending, API calls inside the transaction), the lock is held longer → other requests queue up.

**Better pattern:** Do the lock, do only DB work, commit the transaction, then send emails outside.

---

### Query 5 — CTE + INSERT (Complex User Creation)

```sql
-- file: user.repository.js — createOrganizationAdminUser
WITH base_data AS (
  SELECT
    :newOrganizationId::uuid AS org_id,
    LOWER(REGEXP_REPLACE(full_name, '[^a-zA-Z0-9]+', '_', 'g')) AS base_username,
    email, full_name, phone, password_hash,
    :adminUserId::uuid AS created_by
  FROM public.registration_requests
  WHERE request_id = :requestId
),
unique_username AS (
  SELECT
    b.*,
    CASE
      WHEN NOT EXISTS (SELECT 1 FROM public.users u WHERE u.username = b.base_username)
        THEN b.base_username
      ELSE b.base_username || '_' || SUBSTRING(MD5(RANDOM()::text) FOR 4)
    END AS final_username
  FROM base_data b
)
INSERT INTO public.users (
  default_organization_id, username, email, password_hash,
  first_name, phone, is_active, email_verified, created_at, created_by
)
SELECT org_id, final_username, email, password_hash, full_name, phone, TRUE, TRUE, NOW(), created_by
FROM unique_username
RETURNING user_id, username, email;
```

**Simple explanation:** Create the admin user for a new organization. Generate a unique username from their name, handle duplicates automatically, all in one query.

**Deep technical explanation:**
- **CTE 1 (`base_data`):** Reads registration data, generates base username using regex replacement
- **CTE 2 (`unique_username`):** Uses `CASE` + `EXISTS` to check if username already taken. If taken, appends 4 random hex chars using `MD5(RANDOM()::text)`
- **Final INSERT...SELECT:** Inserts from the CTE result set
- `RETURNING` returns the created user info
- All of this is one atomic operation — no race condition between check and insert

**Pattern:** CTE → INSERT...SELECT
**Performance concern:** `NOT EXISTS (SELECT 1 FROM public.users WHERE username = ...)` is a subquery inside the CTE. Needs index on `users.username`.

**Index needed:**
```sql
CREATE UNIQUE INDEX idx_users_username ON public.users(username);
```

---

### Query 6 — LEFT JOIN + ORDER BY (Admin List)

```sql
-- file: user.repository.js — getAllRegistrationRequests
SELECT
  rr.request_id, rr.email, rr.phone, rr.company_name, rr.business_type,
  rr.request_status, rr.requested_at, rr.email_verified, rr.rejection_reason, rr.ip_address,
  org.organization_id, org.schema_name
FROM public.registration_requests rr
LEFT JOIN public.organizations org
  ON rr.created_organization_id = org.organization_id
ORDER BY rr.requested_at DESC
```

**Simple explanation:** Admin dashboard — show all registration requests with their organization info if approved.

**Deep technical explanation:**
- `LEFT JOIN` — includes ALL registration requests even if `created_organization_id` is NULL (pending requests have no org yet)
- `INNER JOIN` would exclude pending requests — wrong for this use case
- `ORDER BY requested_at DESC` — newest first
- **No LIMIT** — this fetches ALL rows. At 10,000+ registrations, this will be slow.

**Performance issue:** No pagination. Full table scan + sort.

**Fix:**
```sql
-- Add pagination
SELECT ... FROM public.registration_requests rr
LEFT JOIN public.organizations org ON rr.created_organization_id = org.organization_id
ORDER BY rr.requested_at DESC
LIMIT :limit OFFSET :offset;

-- Add index
CREATE INDEX idx_reg_requests_requested_at ON public.registration_requests(requested_at DESC);
```

---

### Query 7 — Stored Procedure Call

```sql
-- file: user.repository.js
SELECT generate_org_code() AS org_code
```

```sql
SELECT * FROM public.create_organization_without_schema(
  :p_user_id, :p_org_code, :p_org_name, :p_org_email,
  :p_org_gstin, :p_org_pan, :p_org_phone, :p_org_approval_status
)
```

**Simple explanation:** Call a PostgreSQL function to generate a unique org code and create an organization record.

**Deep technical explanation:**
- `generate_org_code()` is a PL/pgSQL function that likely uses a sequence or generates from existing data
- `create_organization_without_schema()` is a stored procedure doing multi-step DB logic inside Postgres
- Benefit: DB-side logic is atomic, reduces round-trips
- Risk: Business logic hidden in DB is harder to test, version, and debug

---

### Query 8 — Dynamic UPDATE with Optional Fields

```sql
-- file: user.repository.js — updateOrganizationProfileRepo
UPDATE public.organizations
SET
  address_line1 = :address_line1,
  -- ...other fields...
  company_logo_url = :company_logo_url  -- only added if logo was provided
  updated_at = NOW(),
  updated_by = :user_id
WHERE organization_id = :organization_id
RETURNING organization_id;
```

**App code building this query:**
```javascript
const logoUpdateClause = company_logo_url ? `, company_logo_url = :company_logo_url` : '';
// Then injected into SQL string
```

**Simple explanation:** Update org profile. Only update the logo URL if a new logo was uploaded.

**Deep technical explanation:**
- Dynamic SQL construction — the clause is conditionally appended
- **Security concern:** The schema name is interpolated, but this function only appends to SET clause, not table name — lower risk
- `RETURNING` confirms the row was found and updated
- `NOW()` is transaction-safe timestamp

**Risk:** Dynamic SQL string concatenation can lead to injection if the conditional value comes from user input. Here `company_logo_url` is a URL from S3 — still should be sanitized.

---

### Query 9 — Transaction: INSERT + loop INSERT + UPDATE (Notification Dispatch)

```typescript
// file: notification-service/src/features/message/message.service.ts
return sequelize.transaction(async (t) => {
  // Step 1: Insert dispatch intent
  const [dispatch] = await sequelize.query(`
    INSERT INTO message_dispatches (source_service, channels, event_type, ...)
    VALUES (:source_service, ARRAY[:channels]::notification_channel[], ...)
    RETURNING id;
  `, { transaction: t });

  // Step 2: Loop and insert per channel
  for (const channel of payload.channels) {
    await sequelize.query(`
      INSERT INTO message_queue_movements (message_dispatch_id, channel, queue_name, status)
      VALUES (:message_dispatch_id, :channel, :queue_name, 'ENQUEUED');
    `, { transaction: t });
  }

  // Step 3: Update status
  await sequelize.query(`
    UPDATE message_dispatches SET status = 'PROCESSING' WHERE id = :id
  `, { transaction: t });
});
```

**Simple explanation:** When a notification is triggered, create one master record, then create one tracking record per channel (email, SMS, WhatsApp), all atomically.

**Deep technical explanation:**
- All 3 steps are wrapped in one transaction — if any fails, all roll back
- `ARRAY[:channels]::notification_channel[]` — casts a JS array to a PostgreSQL custom ENUM array type
- `::jsonb` casts — ensures JSON is stored correctly typed
- The loop inside a transaction is a **sequential DB call per channel** — 3 channels = 3 round-trips

**Performance issue:** Loop of DB calls inside transaction. For 3-4 channels, fine. For bulk operations, bad.

**Better pattern — single INSERT:**
```sql
INSERT INTO message_queue_movements (message_dispatch_id, channel, queue_name, status)
SELECT :dispatch_id, unnest(ARRAY[:channels]::text[]), 'notification:' || lower(unnest(ARRAY[:channels]::text[])), 'ENQUEUED';
```

---

### Query 10 — Complex SELECT with Subqueries + GREATEST (Notification List)

```sql
-- file: notification-service/src/features/message/message.service.ts
SELECT
  md.id, md.source_service, md.event_type, md.reference_id, md.user_id, md.status,
  md.created_at, md.updated_at,

  ARRAY(
    SELECT DISTINCT mdl.channel
    FROM message_delivery_logs mdl
    WHERE mdl.message_dispatch_id = md.id
  ) AS channels,

  (
    SELECT MAX(mdl.attempt)
    FROM message_delivery_logs mdl
    WHERE mdl.message_dispatch_id = md.id
  ) AS latest_attempt,

  GREATEST(
    md.updated_at,
    COALESCE((SELECT MAX(created_at) FROM message_delivery_logs WHERE message_dispatch_id = md.id), md.updated_at),
    COALESCE((SELECT MAX(created_at) FROM message_queue_movements WHERE message_dispatch_id = md.id), md.updated_at)
  ) AS last_activity_at

FROM message_dispatches md
WHERE md.status = :status
ORDER BY last_activity_at DESC
LIMIT :limit OFFSET :offset
```

**Simple explanation:** List notifications with their delivery channels, latest retry count, and the last time anything happened to them — sorted newest activity first.

**Deep technical explanation:**
- **Correlated subqueries** — for each row in `message_dispatches`, 3 separate subqueries run against `message_delivery_logs` and `message_queue_movements`
- `GREATEST(...)` — PostgreSQL function returning the largest value from a set, used here to find the most recent activity timestamp
- `COALESCE(...)` — returns first non-NULL value, handles case where logs don't exist yet
- `ARRAY(SELECT ...)` — builds a PostgreSQL array from subquery results

**Performance problem:** Correlated subqueries run once PER ROW. At 10,000 dispatches with limit 50 → still runs 50 × 3 = 150 subqueries per page load.

**Better pattern — JOIN LATERAL:**
```sql
SELECT
  md.*,
  latest_logs.channels,
  latest_logs.latest_attempt,
  latest_activity.last_activity_at
FROM message_dispatches md
LEFT JOIN LATERAL (
  SELECT
    ARRAY_AGG(DISTINCT channel) AS channels,
    MAX(attempt) AS latest_attempt
  FROM message_delivery_logs
  WHERE message_dispatch_id = md.id
) latest_logs ON TRUE
LEFT JOIN LATERAL (
  SELECT GREATEST(
    MAX(mdl.created_at),
    MAX(mqm.created_at)
  ) AS last_activity_at
  FROM message_delivery_logs mdl
  FULL JOIN message_queue_movements mqm ON mqm.message_dispatch_id = mdl.message_dispatch_id
  WHERE mdl.message_dispatch_id = md.id
) latest_activity ON TRUE
ORDER BY last_activity_at DESC
LIMIT :limit OFFSET :offset;
```

---

### Query 11 — LEFT JOIN LATERAL (Single Message Fetch for Worker)

```sql
-- file: notification-service/src/features/message/message.service.ts — getMessageDispatchById
SELECT
  md.*,
  mdl.attempt AS log_attempt
FROM message_dispatches md
LEFT JOIN LATERAL (
  SELECT attempt
  FROM message_delivery_logs
  WHERE message_dispatch_id = md.id
  ORDER BY attempt DESC
  LIMIT 1
) mdl ON TRUE
WHERE md.id = :id
LIMIT 1
```

**Simple explanation:** Fetch a dispatch record and the latest retry attempt number in one query.

**Deep technical explanation:**
- `LEFT JOIN LATERAL` — like a subquery that can reference the outer row. Runs the subquery for each outer row but with access to outer columns.
- `ON TRUE` — always join the lateral result (LEFT means keep even if no rows match)
- More efficient than correlated subquery because it's explicit and optimizable by the planner
- `ORDER BY attempt DESC LIMIT 1` — gets only the highest attempt number

**This is already the correct pattern.** Good use of LATERAL.

---

### Query 12 — GROUP BY + BOOL_OR (Finalize Dispatch Status)

```sql
-- file: notification-service/src/features/message/message.service.ts — finalizeDispatchIfNeeded
SELECT
  channel,
  MAX(attempt) AS latest_attempt,
  BOOL_OR(status = 'SUCCESS') AS has_success
FROM message_delivery_logs
WHERE message_dispatch_id = :id
GROUP BY channel
```

**Simple explanation:** For each notification channel, check if any delivery attempt succeeded, and what the latest attempt number was.

**Deep technical explanation:**
- `GROUP BY channel` — one row per channel
- `MAX(attempt)` — highest attempt number per channel (e.g., 3 = tried 3 times)
- `BOOL_OR(status = 'SUCCESS')` — PostgreSQL aggregate: returns TRUE if ANY row in the group has `status = 'SUCCESS'`
- This replaces multiple queries checking each channel individually

**Performance:** Needs index on `(message_dispatch_id, channel)` for this GROUP BY to be fast.

```sql
CREATE INDEX idx_delivery_logs_dispatch_channel
ON message_delivery_logs(message_dispatch_id, channel);
```

---

### Query 13 — Paginated SELECT with Dynamic WHERE + COUNT (Bills)

```sql
-- file: seller-service-master/src/features/bill/bill.service.ts
SELECT DISTINCT ON (b.bill_id)
  b.bill_id, b.hawb_id, b.bill_number, b.boe_date,
  b.total_invoice_value, b.basic_customs_duty, b.igst, b.total_duty_paid,

  ROUND((b.basic_customs_duty / NULLIF(b.assessable_value_inr, 0)) * 100, 2) AS basic_customs_duty_percent,
  ROUND((b.igst / NULLIF(b.assessable_value_inr + b.basic_customs_duty, 0)) * 100, 2) AS igst_percent,

  json_build_object(
    'vendor_name', v.vendor_name,
    'vendor_type', v.vendor_type,
    'carrier_name', hb.carrier_name
  ) AS vendor_details

FROM {schema}.bills b
LEFT JOIN {schema}.hawb_shipments hb ON b.hawb_id = hb.hawb_id
LEFT JOIN {schema}.purchase_orders po ON po.po_id = b.hawb_id
LEFT JOIN {schema}.vendors v ON po.vendor_id = v.vendor_id

WHERE b.deleted_at IS NULL
  AND v.organization_id = :orgId
  AND b.clearance_status = :status        -- optional
  AND b.bill_number ILIKE :search         -- optional
  AND b.boe_date >= :fromDate             -- optional
  AND b.boe_date <= :toDate               -- optional

ORDER BY b.bill_id, b.boe_date DESC
LIMIT :limit OFFSET :offset;
```

**Simple explanation:** Get a paginated list of bills with vendor info, filterable by status, date range, bill number, and search.

**Deep technical explanation:**
- `DISTINCT ON (b.bill_id)` — PostgreSQL-specific: returns only the first row per `bill_id` after the ORDER BY. Used to deduplicate if a bill joins to multiple POs.
- `NULLIF(value, 0)` — returns NULL instead of 0, preventing division by zero
- `ROUND(..., 2)` — rounds to 2 decimal places
- `json_build_object(...)` — builds a JSON object inline, avoiding extra application-level grouping
- `ILIKE` — case-insensitive LIKE, PostgreSQL-specific
- Dynamic WHERE built in application code by appending conditions

**Performance concerns:**
- `ILIKE :search` = `LIKE '%search%'` — cannot use a standard B-tree index. Requires `pg_trgm` extension.
- `LEFT JOIN vendors` then filtering `WHERE v.organization_id = :orgId` effectively makes it an INNER JOIN — confusing and potentially slow.

**Index suggestions:**
```sql
-- For date range queries
CREATE INDEX idx_bills_boe_date ON {schema}.bills(boe_date DESC);
-- For status filter
CREATE INDEX idx_bills_clearance_status ON {schema}.bills(clearance_status);
-- For search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_bills_number_trgm ON {schema}.bills USING gin(bill_number gin_trgm_ops);
```

---

### Query 14 — Bulk INSERT with Loop-Built Placeholders (Bills)

```typescript
// file: bill.service.ts — bulkInsertBills
bills.forEach((bill, index) => {
  values.push(`(:hawb_id_${index}, :bill_number_${index}, :boe_date_${index}, ...)`);
  replacements[`hawb_id_${index}`] = bill.hawb_id;
  replacements[`bill_number_${index}`] = bill.bill_number;
  // ... 19 fields per bill
});

const query = `INSERT INTO ${schema}.bills (...) VALUES ${values.join(', ')}`;
```

**Simple explanation:** Insert multiple bills at once by building one big INSERT with many value rows.

**Deep technical explanation:**
- Builds a single `INSERT INTO ... VALUES (row1), (row2), (row3)...` query
- Better than N individual INSERTs (avoids N round-trips)
- Problem: for 1000 bills = 19,000 named parameters. Some DB drivers have a parameter limit (~65,000 for Postgres, but Sequelize may cap lower).
- Memory usage: the query string grows with each bill — at 10,000 bills, the string is huge.

**Better pattern — UNNEST bulk insert:**
```sql
INSERT INTO {schema}.bills (hawb_id, bill_number, boe_date, ...)
SELECT
  unnest(:hawb_ids::uuid[]),
  unnest(:bill_numbers::text[]),
  unnest(:boe_dates::date[]),
  ...
```

```typescript
// In TypeScript:
const hawb_ids = bills.map(b => b.hawb_id);
const bill_numbers = bills.map(b => b.bill_number);
// Pass arrays, not N×fields
await sequelize.query(unnestQuery, { replacements: { hawb_ids, bill_numbers, ... } });
```

This sends arrays to Postgres and lets it handle the row expansion — much faster, no parameter explosion.

---

### Query 15 — Transaction with Full Approval Workflow (Auth)

```javascript
// file: auth.service.js — approveRegistration (reconstructed from repository calls)
const transaction = await sequelize.transaction();
try {
  // 1. Lock the registration request row
  const reqInfo = await findRegistrationRequestById(requestId, transaction);

  // 2. Generate unique org code via DB function
  const orgCode = await generateOrganizationCode(transaction);

  // 3. Create organization record via stored procedure
  const org = await createOrganizationWithoutSchema(orgData, transaction);

  // 4. Create admin user via CTE + INSERT
  const user = await createOrganizationAdminUser({ newOrganizationId: org.id, adminUserId, requestId }, transaction);

  // 5. Link user to organization
  await linkUserToOrganization(user.user_id, org.id, transaction);

  // 6. Mark registration as APPROVED
  await updateRegistrationStatus(requestId, org.id, adminUserId, transaction);

  // 7. Mark setup as pending
  await markSetupPending(org.id, transaction);

  await transaction.commit();
} catch (err) {
  await transaction.rollback();
  throw err;
}
```

**Simple explanation:** Approving a registration is a 7-step process. If any step fails, everything rolls back — no half-created organizations.

**Deep technical explanation:**
- 7 sequential DB operations in one transaction
- Each passes the `transaction` object so all run on the same connection
- `FOR UPDATE` lock on step 1 prevents concurrent approvals
- All or nothing: if step 4 fails, steps 1-3 are rolled back
- **Risk:** Long transaction (7 DB calls) holds locks. If an external API call (email) were inside, it could hold the lock for seconds.

---

## 4. Part 3 — Patterns Detected in Your Code

### Pattern 1: Pagination (LIMIT/OFFSET)

**Found in:** `bill.service.ts`, `message.service.ts`, `orders.service.ts`, `getAllRegistrationRequests`

```typescript
// Standard pattern across your codebase
const offset = (page - 1) * limit;
const safePage = Math.max(page, 1);
const safePerPage = Math.min(Math.max(limit, 1), 100); // max 100 per page

// Query
LIMIT :limit OFFSET :offset

// Count for total pages
SELECT COUNT(*) AS total FROM ... WHERE ...

// Return
return {
  data,
  total: Number(count.total),
  page,
  limit,
  pages: Math.ceil(Number(count.total) / limit),
};
```

**How it works:** Skip `(page-1)*limit` rows, return next `limit` rows. Run a separate COUNT query to know total.

**Problem at scale:** At page 1000 with limit 20, PostgreSQL scans 20,020 rows to skip 20,000. Slow.

**Better — Cursor-based pagination (see Part 6)**

---

### Pattern 2: Dynamic WHERE Builder

**Found in:** `bill.service.ts`, `message.service.ts`, `orders.service.ts`, `vendor.service.ts`

```typescript
const whereClauses: string[] = [];
const replacements: Record<string, any> = {};

if (filters?.status) {
  whereClauses.push(`md.status = :status`);
  replacements.status = filters.status;
}

if (filters?.search) {
  whereClauses.push(`source_service ILIKE :search OR event_type ILIKE :search`);
  replacements.search = `%${search}%`;
}

const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
```

**How it works:** Build the WHERE clause string conditionally, add matching parameters to replacements.

**Risk:** If any clause ever uses string interpolation (not `:named`), it opens SQL injection. Your code uses named params — correct.

---

### Pattern 3: Multi-Tenant Schema Interpolation

**Found in:** Every service-master query

```typescript
// Middleware extracts schema from JWT
const schema = req.orgContext.schema; // e.g., "org_abc123"

// validateAndQuoteSchema() double-quotes and validates
const { safeSchema } = validateAndQuoteSchema(schema);

// Usage
`SELECT * FROM ${safeSchema}.orders WHERE ...`
```

**How it works:** Each organization has its own Postgres schema. The schema name comes from the JWT token, is validated (regex check, no special chars), then interpolated into SQL.

**Security:** `validateAndQuoteSchema` is critical — it prevents `'; DROP TABLE orders; --` style attacks via schema name.

---

### Pattern 4: Status Filtering (Enum-like)

**Found in:** `registration_requests`, `message_dispatches`, `orders`, `purchase_orders`

```sql
-- Status values are string enums in your tables
WHERE request_status IN ('PENDING', 'APPROVED')
WHERE order_status = 'UNSHIPPED'
WHERE md.status = 'PROCESSING'
```

**Pattern:** Status columns act as state machines. Your queries filter by state.

**Index pattern:**
```sql
-- Low-cardinality columns (few distinct values) with B-tree index
-- Only useful if one status is rare (e.g., 'FAILED' = 5% of rows)
CREATE INDEX idx_dispatches_status ON message_dispatches(status)
  WHERE status IN ('PENDING', 'PROCESSING'); -- partial index
```

---

### Pattern 5: Worker → BullMQ → DB

**Found in:** `bulk_order_import.worker.ts`, `bulkOrderImport` → `OrderService.bulkCreateOrders`

```typescript
// Queue producer (API route)
await BULK_ORDER_IMPORT_QUEUE.add('import', { file, uploaded_by, org_context });

// Worker (separate process)
export const bulkOrderImport = new Worker(
  BULK_ORDER_IMPORT_QUEUE,
  async (job) => {
    const { file, uploaded_by, org_context } = job.data;
    return OrderService.bulkCreateOrders(job.id, file, uploaded_by, org_context);
  },
  { connection: redis, concurrency: 2 }
);
```

**How it works:**
1. API receives CSV file, saves to disk, adds job to Redis queue
2. Worker picks up job asynchronously
3. Worker reads CSV, processes rows, inserts to DB
4. Result stored in Redis job data

**DB impact:** Worker does DB work outside the HTTP request lifecycle. Good for long operations. Bad if worker crashes mid-insert.

---

### Pattern 6: RETURNING Clause Usage

**Found in:** insert functions throughout auth and service-master

```sql
INSERT INTO public.users (...) VALUES (...) RETURNING user_id, username, email;
INSERT INTO public.registration_requests (...) VALUES (...) RETURNING request_id, email;
UPDATE public.registration_requests SET ... RETURNING email, full_name, company_name;
```

**Why this matters:** Without RETURNING, you'd need a second SELECT to get the inserted/updated row's data. RETURNING eliminates that round-trip.

---

### Pattern 7: API → Service → DB Flow

```
HTTP Request
  → Route handler (fastify route)
    → Controller (validates, extracts orgContext from JWT)
      → Service (business logic, builds SQL)
        → sequelize.query() or ORM method
          → PostgreSQL
        ← Returns rows
      ← Returns domain objects
    ← Returns HTTP response
```

Your codebase follows this pattern consistently. The `orgContext` (schema + org_id) is extracted once in middleware and passed down.

---

## 5. Part 4 — Categorized Query Reference

### Category 1: Basic Queries

```sql
-- SELECT one row
SELECT user_id, email FROM public.users WHERE email = :email AND is_active = true;

-- INSERT one row
INSERT INTO public.registration_requests (email, ...) VALUES (:email, ...) RETURNING request_id;

-- UPDATE one row
UPDATE public.organizations SET setup_completed = TRUE WHERE organization_id = :org_id;

-- DELETE (not found in your code — you use soft deletes)
UPDATE {schema}.bills SET deleted_at = NOW() WHERE bill_id = :bill_id;
```

---

### Category 2: Filtering and Searching

```sql
-- Exact match
WHERE clearance_status = :status

-- IN list
WHERE request_status IN ('PENDING', 'APPROVED')

-- Case-insensitive search
WHERE bill_number ILIKE :search   -- :search = '%term%'

-- Date range
WHERE boe_date >= :fromDate AND boe_date <= :toDate

-- NULL check
WHERE deleted_at IS NULL
```

---

### Category 3: Pagination

```sql
-- Offset pagination (your current approach)
SELECT * FROM {schema}.orders
ORDER BY created_at DESC
LIMIT :limit OFFSET :offset;

-- Always pair with COUNT
SELECT COUNT(*) AS total FROM {schema}.orders WHERE ...;
```

---

### Category 4: Sorting

```sql
-- Single column
ORDER BY rr.requested_at DESC

-- Multiple columns (DISTINCT ON requires this)
ORDER BY b.bill_id, b.boe_date DESC

-- Dynamic sort by last activity
ORDER BY last_activity_at DESC
```

---

### Category 5: Joins

```sql
-- LEFT JOIN (keep all from left, match from right if exists)
FROM registration_requests rr
LEFT JOIN organizations org ON rr.created_organization_id = org.organization_id

-- Multiple LEFT JOINs
FROM {schema}.bills b
LEFT JOIN {schema}.hawb_shipments hb ON b.hawb_id = hb.hawb_id
LEFT JOIN {schema}.purchase_orders po ON po.po_id = b.hawb_id
LEFT JOIN {schema}.vendors v ON po.vendor_id = v.vendor_id

-- JOIN LATERAL (correlated join, references outer row)
LEFT JOIN LATERAL (
  SELECT attempt FROM message_delivery_logs
  WHERE message_dispatch_id = md.id
  ORDER BY attempt DESC LIMIT 1
) mdl ON TRUE
```

---

### Category 6: Aggregations

```sql
-- COUNT
SELECT COUNT(*) AS total FROM message_dispatches WHERE status = :status;

-- MAX
SELECT MAX(attempt) AS latest_attempt FROM message_delivery_logs WHERE message_dispatch_id = :id;

-- GROUP BY + aggregate
SELECT channel, MAX(attempt) AS latest_attempt, BOOL_OR(status = 'SUCCESS') AS has_success
FROM message_delivery_logs
WHERE message_dispatch_id = :id
GROUP BY channel;

-- GREATEST (returns max of multiple expressions)
GREATEST(md.updated_at, COALESCE(MAX(mdl.created_at), md.updated_at)) AS last_activity_at

-- JSON aggregation
json_build_object('vendor_name', v.vendor_name, 'email', v.email) AS vendor_details
```

---

### Category 7: Transactions

```javascript
// Pattern 1: Manual transaction (your auth service)
const transaction = await sequelize.transaction();
try {
  await step1(transaction);
  await step2(transaction);
  await transaction.commit();
} catch (err) {
  await transaction.rollback();
  throw err;
}

// Pattern 2: Callback transaction (your notification service)
return sequelize.transaction(async (t) => {
  await step1(t);
  await step2(t); // auto-commits on success, auto-rollbacks on throw
});
```

---

### Category 8: Bulk Operations

```sql
-- Current: loop-built INSERT (bill.service.ts)
INSERT INTO {schema}.bills (hawb_id, bill_number, ...)
VALUES (:hawb_id_0, :bill_number_0, ...), (:hawb_id_1, :bill_number_1, ...), ...

-- Better: UNNEST arrays
INSERT INTO {schema}.bills (hawb_id, bill_number, ...)
SELECT unnest(:hawb_ids::uuid[]), unnest(:bill_numbers::text[]), ...

-- Best for large datasets: COPY
COPY {schema}.bills (hawb_id, bill_number, ...) FROM STDIN WITH (FORMAT CSV)
```

---

### Category 9: Worker / Queue DB Usage

```typescript
// Worker fetches from DB, processes, writes back
const worker = new Worker(QUEUE_NAME, async (job) => {
  // 1. Read job data from Redis
  const { file, org_context } = job.data;

  // 2. Parse file
  const rows = await parseCSV(file);

  // 3. DB operations (bulk insert)
  await OrderService.bulkCreateOrders(rows, org_context);

  // 4. Mark job complete (Redis)
  return { success: true, count: rows.length };
}, { connection: redis, concurrency: 2 });
```

---

### Category 10: Error Handling

```javascript
// Pattern in your code: catch + rollback + rethrow
try {
  const transaction = await sequelize.transaction();
  await doWork(transaction);
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error; // Let route handler return 500
}
```

**Missing:** Specific error handling for:
- `SequelizeUniqueConstraintError` → return 409 Conflict
- `SequelizeForeignKeyConstraintError` → return 400 Bad Request
- `SequelizeConnectionError` → return 503 Service Unavailable

---

### Category 11: Performance Patterns

| Pattern | Found In | Good/Bad |
|---|---|---|
| Named placeholders `:param` | All files | Good — prevents SQL injection |
| Connection pool max: 5 | All configs | Careful — may exhaust under load |
| RETURNING to avoid re-select | Auth service | Good |
| Correlated subqueries per row | message.service.ts | Bad at scale |
| Loop INSERT for bulk | bill.service.ts | Bad for large datasets |
| FOR UPDATE on approval | user.repository.js | Good — prevents race condition |
| No LIMIT on getAllRegistrations | user.repository.js | Bad — no pagination |
| Dynamic WHERE builder | Multiple | Good pattern |
| Schema validation before interpolation | validateSchema.ts | Good — SQL injection prevention |

---

## 6. Part 5 — What is Missing

### Missing 1: Indexes

**What it is:** A data structure that makes lookups fast. Like an index in a book — you don't read every page to find a topic.

**Why it matters:** Without indexes, PostgreSQL reads every row (sequential scan). At 1M rows, a query without an index can take seconds.

**Types:**
- **B-tree** (default) — for `=`, `<`, `>`, `BETWEEN`, `ORDER BY`
- **GIN** — for arrays, JSONB, full-text search
- **GiST** — for geometric data, full-text
- **Partial** — index only a subset of rows (`WHERE is_active = true`)
- **Composite** — index multiple columns together

**What your project needs:**

```sql
-- Users table (auth)
CREATE UNIQUE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_active_email ON public.users(email) WHERE is_active = true;

-- Registration requests
CREATE INDEX idx_reg_email_status ON public.registration_requests(email, request_status);
CREATE INDEX idx_reg_requested_at ON public.registration_requests(requested_at DESC);

-- Orders (per schema)
CREATE INDEX idx_orders_seller_account ON {schema}.orders(seller_account_id);
CREATE INDEX idx_orders_status ON {schema}.orders(order_status);
CREATE INDEX idx_orders_created_at ON {schema}.orders(created_at DESC);
CREATE INDEX idx_orders_number ON {schema}.orders(order_number) WHERE order_number IS NOT NULL;

-- Bills
CREATE INDEX idx_bills_boe_date ON {schema}.bills(boe_date DESC);
CREATE INDEX idx_bills_status ON {schema}.bills(clearance_status);
CREATE INDEX idx_bills_deleted ON {schema}.bills(deleted_at) WHERE deleted_at IS NULL;

-- Message dispatches
CREATE INDEX idx_dispatches_status ON message_dispatches(status);
CREATE INDEX idx_dispatches_created ON message_dispatches(created_at DESC);
CREATE INDEX idx_delivery_logs_dispatch ON message_delivery_logs(message_dispatch_id, channel);

-- ILIKE search (needs trigram extension)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_bills_number_trgm ON {schema}.bills USING gin(bill_number gin_trgm_ops);
CREATE INDEX idx_dispatches_service_trgm ON message_dispatches USING gin(source_service gin_trgm_ops);
```

---

### Missing 2: EXPLAIN ANALYZE

**What it is:** Shows PostgreSQL's execution plan — how it will run your query, what indexes it uses, how many rows it scans.

**Why it matters:** You cannot optimize what you cannot see. EXPLAIN ANALYZE shows the actual time taken per step.

**How to use:**

```sql
EXPLAIN ANALYZE
SELECT * FROM message_dispatches
WHERE status = 'PENDING'
ORDER BY created_at DESC
LIMIT 10;
```

**Output explained:**
```
Limit (cost=100.0..100.1 rows=10) (actual time=2.345..2.356 rows=10 loops=1)
  -> Sort (cost=100.0..102.5 rows=1000) (actual time=2.340..2.342 rows=10)
       Sort Key: created_at DESC
       -> Seq Scan on message_dispatches (actual time=0.010..1.200 rows=1000 loops=1)
            Filter: (status = 'PENDING')
            Rows Removed by Filter: 9000
```

- `Seq Scan` = full table scan = bad (add index)
- `Index Scan` = using index = good
- `actual time` = real time in milliseconds
- `rows=10000 Rows Removed by Filter: 9990` = scanning too many rows

**Add to your workflow:** Before deploying any new query, run EXPLAIN ANALYZE on it.

---

### Missing 3: Query Optimization Patterns

**N+1 Problem — Found in your notification list:**
```typescript
// BAD: for each dispatch, 3 more queries
for (const dispatch of dispatches) {
  const logs = await getLogs(dispatch.id);    // query per row
  const movements = await getMovements(dispatch.id); // query per row
}
// 50 dispatches = 150 extra queries
```

**Fix — JOIN everything:**
```sql
SELECT md.*, mdl.channels, mdl.latest_attempt
FROM message_dispatches md
LEFT JOIN LATERAL (
  SELECT ARRAY_AGG(DISTINCT channel) AS channels, MAX(attempt) AS latest_attempt
  FROM message_delivery_logs WHERE message_dispatch_id = md.id
) mdl ON TRUE
LIMIT 50;
```

---

### Missing 4: Transaction Isolation Levels

**What it is:** Controls what concurrent transactions can see from each other.

**Levels:**

| Level | Dirty Read | Non-repeatable Read | Phantom Read |
|---|---|---|---|
| READ UNCOMMITTED | Possible | Possible | Possible |
| READ COMMITTED (PG default) | Prevented | Possible | Possible |
| REPEATABLE READ | Prevented | Prevented | Possible |
| SERIALIZABLE | Prevented | Prevented | Prevented |

**Your code uses:** READ COMMITTED (Postgres default)

**Where you need REPEATABLE READ:** The registration approval workflow — you read the request, then write org, then write user. Between steps, another transaction could modify the request. `FOR UPDATE` handles this, but explicit REPEATABLE READ adds another layer.

```javascript
// Set isolation level in Sequelize
const transaction = await sequelize.transaction({
  isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ
});
```

---

### Missing 5: CTEs (Common Table Expressions)

**What it is:** Named subqueries you can reference multiple times in one query. Makes complex queries readable.

**You already use it** in `createOrganizationAdminUser`. Here's more you could do:

```sql
-- Example: Get orders with their item count and vendor info in one query
WITH order_summary AS (
  SELECT o.order_id, o.order_number, o.order_status,
         COUNT(oi.item_id) AS item_count,
         SUM(oi.quantity) AS total_qty
  FROM {schema}.orders o
  LEFT JOIN {schema}.order_items oi ON oi.order_id = o.order_id
  GROUP BY o.order_id, o.order_number, o.order_status
),
vendor_info AS (
  SELECT po.order_id, v.vendor_name
  FROM {schema}.purchase_orders po
  JOIN {schema}.vendors v ON v.vendor_id = po.vendor_id
)
SELECT os.*, vi.vendor_name
FROM order_summary os
LEFT JOIN vendor_info vi ON vi.order_id = os.order_id
WHERE os.order_status = 'PROCESSING'
ORDER BY os.order_id DESC
LIMIT 20;
```

---

### Missing 6: Window Functions

**What it is:** Aggregates that work over a "window" of rows without collapsing them into one row.

**Why it matters:** Ranking, running totals, lag/lead comparisons — without self-joins.

**Examples relevant to your project:**

```sql
-- Rank vendors by total PO value
SELECT
  vendor_name,
  total_po_value,
  RANK() OVER (ORDER BY total_po_value DESC) AS vendor_rank
FROM (
  SELECT v.vendor_name, SUM(po.total_amount) AS total_po_value
  FROM {schema}.vendors v
  JOIN {schema}.purchase_orders po ON po.vendor_id = v.vendor_id
  GROUP BY v.vendor_name
) sub;

-- Running total of orders per day
SELECT
  order_date,
  daily_count,
  SUM(daily_count) OVER (ORDER BY order_date) AS running_total
FROM (
  SELECT DATE(created_at) AS order_date, COUNT(*) AS daily_count
  FROM {schema}.orders
  GROUP BY DATE(created_at)
) sub;

-- Get latest attempt per channel (instead of correlated subquery)
SELECT DISTINCT ON (message_dispatch_id, channel)
  message_dispatch_id, channel, attempt, status
FROM message_delivery_logs
ORDER BY message_dispatch_id, channel, attempt DESC;
```

---

### Missing 7: JSONB Operations

**What it is:** PostgreSQL's binary JSON type — stored efficiently, indexable, queryable.

**You already use JSONB** for `payload`, `recipient`, `attachments`, `meta` columns.

**What you're missing — querying inside JSONB:**

```sql
-- Your current: store JSON, never query inside it
meta::jsonb

-- What you could do: filter by JSONB field
SELECT * FROM {schema}.orders
WHERE meta->>'shipping_method' = 'EXPRESS';

-- JSONB contains operator
SELECT * FROM {schema}.orders
WHERE meta @> '{"is_gift": true}'::jsonb;

-- JSONB array contains
SELECT * FROM message_dispatches
WHERE channels @> ARRAY['EMAIL']::notification_channel[];

-- Index for JSONB queries
CREATE INDEX idx_orders_meta ON {schema}.orders USING gin(meta);
```

---

### Missing 8: Full-Text Search

**What it is:** PostgreSQL's built-in text search — much better than ILIKE for searching content.

**Your current approach:**
```sql
WHERE source_service ILIKE :search OR event_type ILIKE :search
-- Problems: slow without trgm index, doesn't rank results
```

**Full-text search alternative:**
```sql
-- Add tsvector column
ALTER TABLE message_dispatches
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(source_service, '') || ' ' || coalesce(event_type, ''))
) STORED;

-- Index it
CREATE INDEX idx_dispatches_fts ON message_dispatches USING gin(search_vector);

-- Query with ranking
SELECT *, ts_rank(search_vector, query) AS rank
FROM message_dispatches, to_tsquery('english', :search) query
WHERE search_vector @@ query
ORDER BY rank DESC;
```

---

### Missing 9: Connection Pooling (PgBouncer)

**What it is:** A middleware that sits between your app and PostgreSQL, pooling database connections.

**Your current setup:** Each service holds max 5 connections directly.

**Problem at scale:** 4 services × 3 instances each × 5 connections = 60 connections to Postgres. PostgreSQL default max is 100. At 20 instances, you hit the limit.

**PgBouncer solution:**
```
App instances (many) → PgBouncer (10-50 connections) → PostgreSQL (100 max)
```

PgBouncer reuses a small number of actual PG connections for many app connections.

**Config example (pgbouncer.ini):**
```ini
[databases]
mydb = host=localhost port=5432 dbname=csms_production

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
```

---

### Missing 10: Cursor-Based Pagination

**What it is:** Instead of OFFSET (skip N rows), use a cursor (last seen ID or timestamp) to fetch next page.

**Why OFFSET is slow:**
```sql
-- At page 1000, limit 20:
-- PostgreSQL reads 20,020 rows, discards 20,000 → returns 20
SELECT * FROM orders ORDER BY created_at DESC LIMIT 20 OFFSET 20000;
```

**Cursor-based (fast at any page):**
```sql
-- First page
SELECT * FROM {schema}.orders
ORDER BY created_at DESC, order_id DESC
LIMIT 20;

-- Next page (pass last row's created_at + order_id as cursor)
SELECT * FROM {schema}.orders
WHERE (created_at, order_id) < (:last_created_at, :last_order_id)
ORDER BY created_at DESC, order_id DESC
LIMIT 20;
```

**API response:**
```json
{
  "data": [...],
  "next_cursor": "2024-01-15T10:30:00Z__uuid-here",
  "has_more": true
}
```

---

### Missing 11: Partitioning

**What it is:** Split one large table into smaller physical partitions while keeping one logical table.

**Why it matters for your project:** Your `orders`, `bills`, `message_dispatches` tables will grow indefinitely.

**Range partitioning by date:**
```sql
-- Create partitioned table
CREATE TABLE {schema}.orders (
  order_id UUID,
  order_date DATE,
  ...
) PARTITION BY RANGE (order_date);

-- Create partitions per year
CREATE TABLE {schema}.orders_2024
  PARTITION OF {schema}.orders
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE {schema}.orders_2025
  PARTITION OF {schema}.orders
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

**Benefit:** Queries with `WHERE order_date BETWEEN ...` only scan the relevant partition.

---

### Missing 12: Materialized Views

**What it is:** A cached query result stored as a table, refreshed on demand.

**Use case in your project:** Dashboard summary data that doesn't need to be real-time.

```sql
-- Create
CREATE MATERIALIZED VIEW seller_order_summary AS
SELECT
  sa.seller_account_id,
  sa.account_name,
  COUNT(o.order_id) AS total_orders,
  SUM(o.total_amount) AS total_revenue,
  COUNT(CASE WHEN o.order_status = 'SHIPPED' THEN 1 END) AS shipped_count
FROM {schema}.seller_accounts sa
LEFT JOIN {schema}.orders o ON o.seller_account_id = sa.seller_account_id
GROUP BY sa.seller_account_id, sa.account_name;

-- Index the view
CREATE INDEX ON seller_order_summary(seller_account_id);

-- Refresh (schedule this)
REFRESH MATERIALIZED VIEW CONCURRENTLY seller_order_summary;
```

---

## 7. Part 6 — Upgrade Your Code

### Upgrade 1: Fix Pagination in getAllRegistrationRequests

**Current (no pagination):**
```javascript
async function getAllRegistrationRequests() {
  return sequelize.query(`
    SELECT ... FROM registration_requests rr
    LEFT JOIN organizations org ON ...
    ORDER BY rr.requested_at DESC
  `, { type: QueryTypes.SELECT });
}
```

**Fixed:**
```javascript
async function getAllRegistrationRequests({ page = 1, limit = 20, status } = {}) {
  const offset = (page - 1) * limit;
  const whereClause = status ? `AND rr.request_status = :status` : '';

  const [data, [{ total }]] = await Promise.all([
    sequelize.query(`
      SELECT rr.request_id, rr.email, rr.phone, rr.company_name,
             rr.request_status, rr.requested_at, rr.email_verified,
             org.organization_id, org.schema_name
      FROM public.registration_requests rr
      LEFT JOIN public.organizations org ON rr.created_organization_id = org.organization_id
      WHERE 1=1 ${whereClause}
      ORDER BY rr.requested_at DESC
      LIMIT :limit OFFSET :offset
    `, { replacements: { limit, offset, status }, type: QueryTypes.SELECT }),

    sequelize.query(`
      SELECT COUNT(*)::int AS total
      FROM public.registration_requests rr
      WHERE 1=1 ${whereClause}
    `, { replacements: { status }, type: QueryTypes.SELECT })
  ]);

  return { data, total, page, limit, pages: Math.ceil(total / limit) };
}
```

---

### Upgrade 2: Replace Loop Bulk Insert with UNNEST

**Current (bill.service.ts):**
```typescript
// Builds 19,000+ named params for 1000 bills
bills.forEach((bill, index) => {
  values.push(`(:hawb_id_${index}, :bill_number_${index}, ...)`);
  replacements[`hawb_id_${index}`] = bill.hawb_id;
  // ...19 fields per bill
});
```

**Fixed:**
```typescript
static async bulkInsertBills(schema: string, bills: any[], transaction: Transaction) {
  if (!bills.length) return;

  // Split into arrays
  const hawb_ids = bills.map(b => b.hawb_id ?? null);
  const bill_numbers = bills.map(b => b.bill_number);
  const boe_dates = bills.map(b => b.boe_date);
  const total_invoice_values = bills.map(b => b.total_invoice_value);
  // ... other arrays

  await sequelize.query(`
    INSERT INTO ${schema}.bills (
      hawb_id, bill_number, boe_date, total_invoice_value, ...
    )
    SELECT
      unnest(:hawb_ids::uuid[]),
      unnest(:bill_numbers::text[]),
      unnest(:boe_dates::date[]),
      unnest(:total_invoice_values::numeric[]),
      ...
    ON CONFLICT (bill_number) DO NOTHING
  `, {
    replacements: { hawb_ids, bill_numbers, boe_dates, total_invoice_values },
    type: QueryTypes.INSERT,
    transaction
  });
}
```

---

### Upgrade 3: Fix Notification List Correlated Subqueries

**Current:** 3 correlated subqueries per row in `listMessageDispatches`

**Fixed with JOIN LATERAL:**
```sql
SELECT
  md.id, md.source_service, md.event_type, md.status, md.created_at,
  COALESCE(log_summary.channels, '{}') AS channels,
  COALESCE(log_summary.latest_attempt, 0) AS latest_attempt,
  GREATEST(
    md.updated_at,
    COALESCE(log_summary.last_log_at, md.updated_at),
    COALESCE(mqm_summary.last_movement_at, md.updated_at)
  ) AS last_activity_at
FROM message_dispatches md
LEFT JOIN LATERAL (
  SELECT
    ARRAY_AGG(DISTINCT channel) AS channels,
    MAX(attempt) AS latest_attempt,
    MAX(created_at) AS last_log_at
  FROM message_delivery_logs
  WHERE message_dispatch_id = md.id
) log_summary ON TRUE
LEFT JOIN LATERAL (
  SELECT MAX(created_at) AS last_movement_at
  FROM message_queue_movements
  WHERE message_dispatch_id = md.id
) mqm_summary ON TRUE
WHERE md.status = :status
ORDER BY last_activity_at DESC
LIMIT :limit OFFSET :offset;
```

---

### Upgrade 4: Add Specific Error Handling

```typescript
// In your service layer
import { UniqueConstraintError, ForeignKeyConstraintError, ConnectionError } from 'sequelize';

try {
  await sequelize.query(`INSERT INTO ...`, { ... });
} catch (error) {
  if (error instanceof UniqueConstraintError) {
    throw new AppError('DUPLICATE_ENTRY', 'This record already exists', 409);
  }
  if (error instanceof ForeignKeyConstraintError) {
    throw new AppError('INVALID_REFERENCE', 'Referenced record does not exist', 400);
  }
  if (error instanceof ConnectionError) {
    throw new AppError('DB_UNAVAILABLE', 'Database is temporarily unavailable', 503);
  }
  throw error; // unknown error → 500
}
```

---

### Upgrade 5: Cursor-Based Pagination for Orders

```typescript
// New pagination for orders list
static async listOrders(schema: string, orgId: string, params: {
  limit?: number;
  cursor?: { created_at: string; order_id: string } | null;
  status?: string;
}) {
  const { limit = 20, cursor, status } = params;

  const whereClauses = [`sa.organization_id = :org_id`];
  const replacements: any = { org_id: orgId, limit };

  if (status) {
    whereClauses.push(`o.order_status = :status`);
    replacements.status = status;
  }

  if (cursor) {
    whereClauses.push(`(o.created_at, o.order_id) < (:cursor_created_at, :cursor_order_id)`);
    replacements.cursor_created_at = cursor.created_at;
    replacements.cursor_order_id = cursor.order_id;
  }

  const data = await sequelize.query<any>(`
    SELECT o.order_id, o.order_number, o.order_status, o.total_amount, o.created_at
    FROM ${schema}.orders o
    JOIN ${schema}.seller_accounts sa ON o.seller_account_id = sa.seller_account_id
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY o.created_at DESC, o.order_id DESC
    LIMIT :limit
  `, { replacements, type: QueryTypes.SELECT });

  const lastRow = data[data.length - 1];
  const nextCursor = data.length === limit && lastRow
    ? { created_at: lastRow.created_at, order_id: lastRow.order_id }
    : null;

  return { data, next_cursor: nextCursor, has_more: !!nextCursor };
}
```

---

### Upgrade 6: Add Required Indexes

```sql
-- Run these once per tenant schema (wrap in a migration)

-- Auth service
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_reg_requests_email_status ON public.registration_requests(email, request_status);
CREATE INDEX IF NOT EXISTS idx_reg_requests_date ON public.registration_requests(requested_at DESC);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_msg_dispatches_status ON message_dispatches(status) WHERE status IN ('PENDING', 'PROCESSING');
CREATE INDEX IF NOT EXISTS idx_msg_dispatches_created ON message_dispatches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_dispatch_channel ON message_delivery_logs(message_dispatch_id, channel);
CREATE INDEX IF NOT EXISTS idx_queue_movements_dispatch ON message_queue_movements(message_dispatch_id);

-- Per-schema (orders, bills)
CREATE INDEX IF NOT EXISTS idx_orders_seller ON {schema}.orders(seller_account_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON {schema}.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON {schema}.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bills_deleted ON {schema}.bills(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bills_boe_date ON {schema}.bills(boe_date DESC);
```

---

## 8. Part 7 — Interview Questions

### Level 1 — Based on Your Code

**Q1:** Your `getAllRegistrationRequests` has no LIMIT. What happens at 100,000 registrations?

> PostgreSQL reads all 100,000 rows into memory, sends them all to Node.js, which tries to serialize them all to JSON. The HTTP response could be 50MB+, the query could take 10+ seconds, and the Node.js process could run out of memory. Add LIMIT/OFFSET or cursor pagination.

**Q2:** Why does `findRegistrationRequestById` use `FOR UPDATE`?

> Without FOR UPDATE, two admin users clicking "approve" simultaneously could both read the same PENDING request, both proceed, and create two organizations for one registration. FOR UPDATE locks the row in the first transaction — the second transaction waits. When the first commits (status → APPROVED), the second reads the updated row and can check the status before proceeding.

**Q3:** Why does your `dispatchMessage` function use `sequelize.transaction(async (t) => ...)`?

> The dispatch creates 1 master record + N channel movement records in one atomic operation. If fan-out fails halfway (email inserted, SMS failed), the dispatch would be in an inconsistent state. The transaction guarantees all or nothing — if any insert throws, all inserts are rolled back.

**Q4:** What does `RETURNING` do in your INSERT queries? Why is it better than a separate SELECT?

> RETURNING returns the inserted/updated row data directly from the write operation. Without it, you'd need INSERT then SELECT — two round-trips. RETURNING is one round-trip, and is atomic (you get exactly what was inserted, even if another query modified the row between INSERT and SELECT).

**Q5:** Your connection pool is max: 5. You have 4 services. What's the maximum connections to PostgreSQL?

> 4 services × max 5 = 20 connections. If each service has 3 running instances (e.g., PM2 or Docker replicas), it becomes 4 × 3 × 5 = 60 connections. PostgreSQL's default `max_connections` is 100. At 6 instances per service, you'd hit 120 — over the limit.

---

### Level 2 — PostgreSQL Concepts

**Q6:** What is the difference between a B-tree index and a GIN index? When would you use each?

> B-tree is for equality and range queries on scalar values (`=`, `<`, `>`, `BETWEEN`, `IN`). GIN (Generalized Inverted Index) is for complex types where a single value can match multiple index entries — JSONB, arrays, full-text search vectors. Your `meta JSONB` column would need a GIN index for `@>` operator queries. Your `bill_number ILIKE '%search%'` needs a GIN index with `pg_trgm`.

**Q7:** What is `DISTINCT ON` and how does it work?

> `DISTINCT ON (col)` returns the first row for each distinct value of `col`, after applying ORDER BY. The ORDER BY must start with the same column(s) as DISTINCT ON. Your bills query uses `DISTINCT ON (b.bill_id)` with `ORDER BY b.bill_id, b.boe_date DESC` — this returns the row with the latest `boe_date` for each `bill_id`.

**Q8:** Explain READ COMMITTED vs REPEATABLE READ in PostgreSQL.

> READ COMMITTED (default): each statement sees data committed before that statement began. If transaction A updates a row, and transaction B's SELECT runs after A commits, B sees the update — even if B started before A's UPDATE. REPEATABLE READ: each statement sees data committed before the transaction began. If A commits during B's transaction, B still sees the old data for the rest of its transaction. REPEATABLE READ prevents "non-repeatable reads" — reading the same row twice and getting different values.

**Q9:** What is a deadlock and how could it happen in your registration approval flow?

> A deadlock is when two transactions each hold a lock the other needs, and both wait forever. In your code: Transaction A locks registration_request row X (FOR UPDATE) then tries to lock organizations row Y. Transaction B locked organizations row Y first, then tries to lock registration_request row X. Neither can proceed. PostgreSQL detects this and aborts one transaction. Prevention: always acquire locks in the same order across all code paths.

**Q10:** What is `EXPLAIN ANALYZE` and what does "Seq Scan" mean?

> `EXPLAIN ANALYZE` shows the actual query execution plan with real timing. "Seq Scan" means PostgreSQL read every row in the table — a full table scan. This is fine for small tables (< 1000 rows) but slow for large ones. It means no usable index exists for the filter. Adding an index changes Seq Scan to "Index Scan" or "Bitmap Index Scan".

**Q11:** What is a CTE and how is it different from a subquery?

> A CTE (WITH clause) is a named temporary result set defined at the top of a query. Both CTEs and subqueries produce intermediate results. Key differences: (1) CTEs are named and can be referenced multiple times in the same query. (2) CTEs improve readability for complex queries. (3) In older PostgreSQL (<12), CTEs were "optimization fences" — the planner couldn't push conditions inside them. In PostgreSQL 12+, the planner can inline CTEs. Your `createOrganizationAdminUser` CTE is a good example.

---

### Level 3 — System Design

**Q12:** Your system has 500 organizations each with 100,000 orders. How would you design the storage?

> With 50 million total orders, a single orders table would be huge. Options: (1) **Schema-per-tenant** (your current approach) — each org has its own orders table. Pros: natural isolation, easy tenant deletion. Cons: schema management overhead, cross-tenant queries impossible. (2) **Partition by org_id** — one physical table, partitioned by organization. Pros: simpler management, cross-tenant analytics possible. Cons: more complex queries, shared table means one org's heavy load affects others. (3) **Partition by date within each schema** — combine both approaches for the heaviest tables.

**Q13:** Your bulk order import processes 50,000 rows from a CSV file in a worker. Design this for production.

> Current approach (map + loop INSERT) is wrong for 50,000 rows. Production approach: (1) Parse CSV → validate → batch into groups of 1,000. (2) For each batch, use a single `INSERT ... SELECT unnest(...)` or `COPY` command. (3) Use a database transaction per batch, not one transaction for all 50,000 rows (long transaction = held locks + memory). (4) Track progress in Redis — store processed count and last processed row. (5) Make it idempotent — use `ON CONFLICT (order_number) DO NOTHING` so re-running the import doesn't create duplicates. (6) If a batch fails, retry only that batch.

**Q14:** Your notification system needs to handle 1 million messages per day. What breaks first?

> (1) **Connection pool exhaustion**: 5 connections per service, high concurrency → workers wait for connections. Fix: PgBouncer in transaction mode. (2) **message_delivery_logs table growth**: 1M dispatches × 3 channels × 3 retry attempts = 9M rows/day, 3.3B rows/year. Fix: partition by month, archive old partitions. (3) **Correlated subqueries in listMessageDispatches**: at 1M rows, even the COUNT query is slow. Fix: maintain a separate summary/cache table. (4) **Index bloat**: high insert rate causes B-tree indexes to bloat. Fix: schedule `VACUUM ANALYZE` regularly.

---

## 9. Part 8 — Production Behavior Analysis

### 8.1 Performance at Scale

**At 10K rows (current state):** Everything works. Queries complete in <100ms. No issues visible.

**At 1M rows:**

| Query | Behavior | Fix Needed |
|---|---|---|
| `getAllRegistrationRequests` (no LIMIT) | Fetches 1M rows, likely OOM or timeout | Add pagination, add index |
| `getBillDetails` with ILIKE | Scans entire bills table per search | Add pg_trgm index |
| `listMessageDispatches` with correlated subqueries | 50 rows × 3 subqueries each = 150 extra queries, each scanning 1M rows | JOIN LATERAL + indexes |
| `COUNT(*)` for pagination | PostgreSQL must scan the filtered set | Add covering index or maintain count separately |

**At 10M rows:**

| Issue | Impact |
|---|---|
| OFFSET pagination at page 5000 | Scans 100,000+ rows to skip them |
| No index on `boe_date` range queries | Full table scan on 10M bill rows |
| Connection pool exhausted during bulk import | Requests fail with "too many clients" |
| `message_delivery_logs` without partitioning | 30M+ rows, slow even with index |

---

### 8.2 Indexing Strategy for Your Project

**Critical indexes (must have before 10K rows):**

```sql
-- Seller auth (immediate)
CREATE UNIQUE INDEX ON public.users(email);
CREATE INDEX ON public.registration_requests(email, request_status);

-- Per-tenant orders (immediate)
CREATE INDEX ON {schema}.orders(seller_account_id, created_at DESC);
CREATE INDEX ON {schema}.orders(order_status, created_at DESC);

-- Notifications (immediate)
CREATE INDEX ON message_dispatches(status, created_at DESC);
CREATE INDEX ON message_delivery_logs(message_dispatch_id);
```

**Trade-offs of indexing:**
- Every index slows down INSERT/UPDATE/DELETE (index must be maintained)
- Indexes use disk space
- Too many indexes on write-heavy tables (orders, delivery_logs) can hurt throughput
- Rule of thumb: index columns used in WHERE, JOIN ON, and ORDER BY

---

### 8.3 Concurrency and Locks

**Your `FOR UPDATE` on registration approval:**
- Good: prevents double approval
- Risk: if email sending happens inside the transaction, lock is held for the duration of the SMTP call (could be 2-5 seconds)
- Fix: commit the transaction first, then send email asynchronously

**Deadlock scenario in your code:**
```
Transaction A (approve registration X):
  1. LOCK registration_requests WHERE request_id = X
  2. INSERT INTO organizations (tries to insert row Y)

Transaction B (another admin approves different registration, same time):
  1. LOCK registration_requests WHERE request_id = Z
  2. INSERT INTO organizations (tries to insert row Y, because org_code sequence contention)
```
PostgreSQL will detect and kill one transaction. The application should retry on deadlock error.

```typescript
// Retry pattern for deadlocks
async function withDeadlockRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      if (err.original?.code === '40P01' && attempt < maxRetries - 1) {
        // 40P01 = deadlock detected
        await new Promise(r => setTimeout(r, 100 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

### 8.4 Transactions in Production

**Where transactions are essential in your code:**

| Operation | Risk Without Transaction | Status |
|---|---|---|
| Registration approval (7 steps) | Org created without user, or user created without org | Has transaction |
| Notification dispatch (3 steps) | Dispatch exists but no queue movements | Has transaction |
| PO creation from sales order | Order status updated but PO not created | Has transaction |
| Order cancellation | Order status changed but cancel record missing | Has transaction |
| Bulk order import | 20,000 rows inserted, 1 fails — partial import | Missing transaction per batch |

**Risk of long transactions:**
```
Your registration approval transaction:
  1. SELECT FOR UPDATE (instant)
  2. SELECT generate_org_code() (instant)
  3. CALL create_organization_without_schema() (maybe 100ms)
  4. CTE INSERT user (50ms)
  5. INSERT user_organizations (instant)
  6. UPDATE registration_requests (instant)
  7. UPDATE organizations (instant)

Total: ~200ms transaction holding locks
If SMTP call were inside: transaction could hold locks for 2-5 seconds
```

---

### 8.5 Worker / Queue Behavior at Scale

**Current bulk_order_import worker:**
```typescript
// Concurrency: 2 workers
// Each worker calls OrderService.bulkCreateOrders
// That function reads CSV and does individual INSERTs or loop-built INSERT
```

**Problems at scale:**
1. **Memory:** A 50,000 row CSV parsed entirely into memory = ~50MB per job. With 2 concurrent workers = 100MB just for CSV data.
2. **One giant transaction:** If bulkCreate uses one transaction for all 50,000 rows, it holds locks for the entire duration. If it fails at row 49,000, all work is lost.
3. **DB overload:** 2 workers each doing 50,000 inserts exhausts the connection pool instantly.

**Production-grade bulk import pattern:**
```typescript
async function bulkCreateOrders(jobId: string, file: string, uploadedBy: string, orgContext: OrgContext) {
  const BATCH_SIZE = 500;
  const rows = await parseCSV(file);

  const results = { success: 0, failed: 0, errors: [] };

  // Process in batches of 500
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const transaction = await sequelize.transaction();

    try {
      // UNNEST bulk insert for the batch
      await insertOrderBatch(batch, orgContext, transaction);
      await transaction.commit();
      results.success += batch.length;

      // Update progress in Redis
      await redis.set(`job:${jobId}:progress`, i + batch.length);
    } catch (err) {
      await transaction.rollback();
      results.failed += batch.length;
      results.errors.push({ batch: i, error: err.message });
      // Continue with next batch — don't abort entire import
    }
  }

  return results;
}
```

---

### 8.6 Connection Handling

**What happens with 100 concurrent API requests:**
```
100 requests arrive simultaneously
Each tries to acquire a DB connection from pool (max: 5)
5 get connections immediately
95 wait (acquire timeout: 30 seconds)
If all 5 connections are busy for 30+ seconds → 95 requests fail with SequelizeConnectionAcquireTimeoutError
```

**Mitigation strategies:**
1. **PgBouncer** — one instance serves many app connections, maintains few real PG connections
2. **Increase pool size carefully** — but PG can only handle ~100-200 connections total
3. **Async/non-blocking queries** — avoid holding connections for non-DB work (file I/O, HTTP calls between queries)
4. **Queue heavy operations** — don't let API routes run 50,000-row imports inline

---

### 8.7 Failure Scenarios

**Scenario 1: DB goes down mid-transaction**

```
Your registration approval:
Steps 1-4 complete, then DB crashes.
Transaction is never committed → all changes rolled back automatically (PostgreSQL guarantees this).
User gets a 503 or connection error.
They retry → flow starts fresh. ✓
```

**Scenario 2: Partial bulk import**

```
Bulk order import: inserting 50,000 rows
Row 49,000 fails (duplicate order_number)
Current code: entire insert fails, 0 rows saved
User must re-upload entire CSV. ✗

Fix: batch inserts with ON CONFLICT DO NOTHING, track which rows failed with reason
```

**Scenario 3: Worker crashes mid-job**

```
BullMQ worker processing bulk import
Worker crashes at 25,000 rows
Job state in Redis: still ACTIVE
On restart: BullMQ retries the job from the beginning
Without idempotency: rows 1-25,000 are inserted again → duplicates

Fix: ON CONFLICT (order_number) DO NOTHING in INSERT
Or: Store last processed row index, resume from there
```

**Idempotent insert pattern:**
```sql
INSERT INTO {schema}.orders (order_number, ...)
VALUES (:order_number, ...)
ON CONFLICT (order_number) DO NOTHING
RETURNING order_id;
-- If order_number already exists, skip. No error. No duplicate.
```

---

### 8.8 Scaling Strategies

**Vertical scaling (bigger server):** Increase RAM and CPU. Helps query performance. PostgreSQL benefits from RAM for caching (shared_buffers, work_mem). Limit: eventually you hit the biggest machine.

**Read replicas:** Route `SELECT` queries to replicas, `INSERT/UPDATE/DELETE` to primary.

```typescript
// Two Sequelize instances
const primaryDB = new Sequelize({ host: 'primary.db.host', ... });
const replicaDB = new Sequelize({ host: 'replica.db.host', ... });

// Reads → replica
const orders = await replicaDB.query(`SELECT ...`);

// Writes → primary
await primaryDB.query(`INSERT ...`);
```

**Table partitioning for orders:**
```sql
-- Partition orders by year
CREATE TABLE {schema}.orders_2025 PARTITION OF {schema}.orders
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Automatic partition pruning: queries with WHERE order_date BETWEEN '2025-01-01' AND '2025-12-31'
-- only scan the 2025 partition
```

---

### 8.9 Monitoring and Debugging

**Slow query log — add to postgresql.conf:**
```conf
log_min_duration_statement = 1000  # log queries taking > 1 second
log_statement = 'none'             # don't log all statements
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

**Find slow queries from pg_stat_statements:**
```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find top 10 slowest queries
SELECT
  round(total_exec_time::numeric, 2) AS total_ms,
  calls,
  round(mean_exec_time::numeric, 2) AS avg_ms,
  round(stddev_exec_time::numeric, 2) AS stddev_ms,
  left(query, 100) AS query
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Find missing indexes:**
```sql
-- Tables with many sequential scans (needs index)
SELECT
  schemaname, tablename,
  seq_scan, seq_tup_read,
  idx_scan, idx_tup_fetch,
  round(seq_scan::numeric / NULLIF(seq_scan + idx_scan, 0) * 100, 1) AS pct_seq_scan
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC
LIMIT 20;
```

**Check connection usage:**
```sql
SELECT count(*), state, wait_event_type, wait_event
FROM pg_stat_activity
WHERE datname = 'csms_production'
GROUP BY state, wait_event_type, wait_event;
```

**Check index usage:**
```sql
-- Indexes never used (candidates for removal)
SELECT indexrelname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexrelname NOT LIKE 'pg_%'
ORDER BY indexrelname;
```

**Check table bloat:**
```sql
-- Tables that need VACUUM
SELECT
  schemaname, tablename,
  n_dead_tup, n_live_tup,
  round(n_dead_tup::numeric / NULLIF(n_live_tup + n_dead_tup, 0) * 100, 1) AS dead_pct,
  last_autovacuum, last_autoanalyze
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY dead_pct DESC;
```

---

## Quick Reference Cheat Sheet

```
Connection pool:          max: 5, acquire: 30s, idle: 10s
Statement timeout:        60 seconds
Idle transaction timeout: 30 seconds

Your schemas:
  public          → shared tables (users, orgs, registrations)
  {org_schema}    → tenant tables (orders, bills, vendors, warehouses)

Key patterns:
  1. SELECT + FOR UPDATE       → pessimistic lock before update
  2. INSERT + RETURNING        → get ID without extra SELECT
  3. CTE + INSERT SELECT       → complex atomic inserts
  4. Dynamic WHERE builder     → flexible filtering with named params
  5. sequelize.transaction()   → wrap multi-step writes
  6. validateAndQuoteSchema()  → prevent schema name injection
  7. LIMIT/OFFSET pagination   → works but slow at deep pages
  8. Loop-built bulk INSERT    → works but doesn't scale

Things to add:
  1. Indexes on every filter/sort column
  2. pg_trgm for ILIKE search
  3. Cursor pagination for high-volume lists
  4. UNNEST for bulk inserts
  5. PgBouncer for connection pooling
  6. Partition orders/bills by date
  7. EXPLAIN ANALYZE before deploying queries
  8. pg_stat_statements for slow query monitoring
```

---

*Notes generated from: seller-management-system, supplier-management-system, notification-service*
*Covers: user.repository.js, purchase.service.ts, bill.service.ts, orders.service.ts, message.service.ts, bulk_order_import.worker.ts, database.ts configs*
