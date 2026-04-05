# Complete Backend Engineering Roadmap: Junior to Principal Architect

---

## Stage 0: Mindset Shift Before You Start

The difference between an average developer and a principal engineer is not knowing more syntax. It is **thinking in systems**, **reasoning about tradeoffs**, and **owning outcomes** rather than just writing code.

Every stage below is about building a new layer of thinking, not just adding skills.

---

## Stage 1: Foundations — What Every Strong Backend Engineer Must Master

These are non-negotiable. Weak foundations create a ceiling you will hit at the senior level.

### 1.1 Data Structures & Algorithms

You do not need to be a competitive programmer. You need to understand **how data is stored and accessed** because these decisions appear in every real system you build.

**What you actually need:**

| Structure | Why it matters in backend work |
|---|---|
| Arrays / Slices | Memory locality, iteration performance |
| Hash maps | O(1) lookups — used in caches, session stores, routing tables |
| Trees (B-Tree, B+Tree) | How PostgreSQL indexes work internally |
| Heaps / Priority queues | Job schedulers, rate limiters |
| Graphs | Dependency resolution, permission graphs, social networks |
| Linked lists | Understanding queue implementations |

**Algorithm knowledge you need:**
- Sorting and why it matters (database ORDER BY internals)
- Binary search (range queries, pagination)
- BFS/DFS (permission trees, graph traversal)
- Complexity analysis — O(n) thinking for query and API design

**You do NOT need:** competitive-programming-level dynamic programming or advanced graph algorithms unless your domain requires it.

**Practice target:** Solve LeetCode medium problems cleanly. Focus on hash maps, trees, and graphs.

---

### 1.2 Operating Systems Fundamentals

Backend code runs on an OS. Not understanding this means you cannot debug production issues.

**Processes vs Threads vs Coroutines**
- A process has its own memory space (isolated)
- A thread shares memory within a process (faster but requires synchronization)
- A coroutine/goroutine is a lightweight cooperative unit (Go's model, Node's event loop)

**The Event Loop (critical for Node.js/JavaScript engineers)**
- JavaScript is single-threaded. The event loop is what makes async code work.
- Understand: call stack, event queue, microtask queue, macrotask queue
- Know why blocking the event loop is catastrophic
- Know the difference between `setTimeout`, `Promise`, and `process.nextTick` execution order

**File descriptors, sockets, I/O**
- Every connection to your server is a file descriptor
- OS has a limit (ulimit) — production servers hitting this is a real failure mode
- Blocking I/O vs non-blocking I/O vs async I/O

**Virtual memory, heap, stack**
- Stack: function call frames, fixed size, fast
- Heap: dynamic allocation, garbage collected in JS/Go
- Memory leaks happen when you hold references longer than needed

**Signals and process management**
- SIGTERM, SIGKILL — graceful shutdown handling
- How process managers (PM2, systemd) restart services
- Why your server must handle SIGTERM cleanly before being killed

---

### 1.3 Networking Fundamentals

Every API call, database query, and service-to-service communication is networking. You must own this.

**The OSI model in practice (what actually matters):**

```
Application Layer (L7)  — HTTP, gRPC, WebSocket
Transport Layer (L4)    — TCP, UDP
Network Layer (L3)      — IP, routing
```

**TCP — why it matters for backend engineers:**
- TCP is connection-oriented: 3-way handshake (SYN → SYN-ACK → ACK)
- TCP guarantees delivery and order — at a cost
- Each database connection, HTTP/1.1 connection = a TCP connection
- Connection pooling exists because TCP handshakes are expensive
- TCP TIME_WAIT — why your server might run out of ports under high load

**HTTP — master every layer:**

HTTP/1.1:
- Request/response cycle, headers, methods, status codes
- Keep-alive connections (persistent TCP connection)

HTTP/2:
- Multiplexing: multiple requests over one TCP connection
- Header compression (HPACK)
- Critical for high-throughput APIs

HTTP/3 (QUIC):
- Built on UDP, not TCP
- Eliminates head-of-line blocking
- Faster handshakes

**Headers you must understand:**
- `Content-Type`, `Accept` — content negotiation
- `Authorization` — authentication
- `Cache-Control`, `ETag`, `Last-Modified` — caching
- `X-Request-ID` — distributed tracing
- `Connection`, `Keep-Alive` — connection management
- CORS headers — cross-origin security

**TLS/HTTPS:**
- TLS handshake adds latency — understand certificate validation
- TLS termination at load balancer vs end-to-end
- mTLS (mutual TLS) — service-to-service authentication in microservices

**DNS:**
- A record (domain → IP)
- CNAME (alias)
- TTL — why DNS changes take time to propagate
- How service discovery works (internal DNS in Kubernetes)

**Load Balancing:**
- L4 load balancing: routes by IP/port, fast, no HTTP awareness
- L7 load balancing: routes by HTTP headers/path/cookie, smarter
- Algorithms: Round-robin, Least connections, IP hash (sticky sessions)
- Health checks — how load balancers detect dead instances

---

### 1.4 Database Fundamentals

**Relational model:**
- Tables, rows, columns, constraints (PK, FK, UNIQUE, CHECK, NOT NULL)
- ACID properties — every interview, every design discussion
  - **Atomicity**: transaction succeeds fully or rolls back entirely
  - **Consistency**: DB moves from one valid state to another
  - **Isolation**: concurrent transactions don't interfere
  - **Durability**: committed data survives crashes (WAL — Write-Ahead Log)

**SQL mastery:**
- JOINs (INNER, LEFT, RIGHT, FULL — know when to use each)
- Aggregations (GROUP BY, HAVING)
- Window functions (`ROW_NUMBER`, `RANK`, `LAG`, `LEAD`, `SUM OVER`)
- CTEs and subqueries
- `EXPLAIN ANALYZE` — reading query execution plans

**Indexing fundamentals:**
- B-Tree index (default in PostgreSQL) — great for equality and range queries
- Hash index — equality only
- Composite indexes — column order matters (leftmost prefix rule)
- Partial indexes — index a subset of rows
- Expression indexes — index on a computed value
- Covering indexes — query served entirely from index (no heap access)

**Isolation levels:**
- Read Uncommitted → dirty reads possible
- Read Committed → no dirty reads, but non-repeatable reads possible (PostgreSQL default)
- Repeatable Read → snapshot of data at transaction start
- Serializable → full transaction ordering (expensive)

---

### 1.5 API Design Principles

**REST fundamentals:**
- Resources, not actions (`/users/123`, not `/getUser?id=123`)
- HTTP methods as semantic verbs
- Status codes mean something — use them correctly
- Statelessness — server does not store client state between requests

**What makes an API production-ready:**
- Versioning (`/v1/`, `/v2/`) — never break existing clients
- Pagination — never return unbounded lists
- Filtering and sorting — server-side, not client-side
- Consistent error format across all endpoints
- Idempotency — especially for mutations (PUT, DELETE, POST with idempotency keys)
- Rate limiting
- Input validation at the boundary

**gRPC:**
- Protocol Buffers (binary, strongly typed, faster than JSON)
- HTTP/2 based
- Streaming support (unary, server stream, client stream, bidirectional)
- Used extensively for internal service communication (Google, Uber)
- Code generation from `.proto` files

**GraphQL (when it fits):**
- Client specifies exactly what data it needs
- Solves over-fetching and under-fetching
- Best for: BFF (Backend For Frontend) patterns, complex client-driven queries
- Watch out for: N+1 query problem, authorization per field, caching complexity

---

### 1.6 Concurrency and Parallelism

**JavaScript/Node.js — Single-threaded event loop:**
- Concurrency via async/await (non-blocking I/O)
- CPU-bound work blocks the loop — offload to worker threads or separate service
- `Promise.all` — parallel async operations
- Race conditions still exist in async code (check-then-act patterns)

**Go — goroutines and channels:**
- Goroutines are lightweight (2KB stack vs 1MB for OS threads)
- The Go scheduler is M:N (many goroutines to fewer OS threads)
- Channels for communication between goroutines (`chan`)
- `sync.Mutex`, `sync.RWMutex` for shared state
- `context.Context` for cancellation and timeouts — use it everywhere

**General concurrency concepts:**
- Race conditions — two operations on shared state without synchronization
- Deadlocks — two operations waiting on each other
- Starvation — a goroutine/thread never gets CPU time
- Optimistic vs Pessimistic locking (applies to databases too)
- Connection pooling — reusing connections to limit concurrency overhead

---

### 1.7 Memory and Performance

- **Cache locality** — accessing sequential memory is faster than random access
- **Garbage collection** — understand GC pauses (critical for latency-sensitive services in Go/Node)
- **Memory leaks** — closures holding references, event listeners not removed, growing caches
- **Profiling tools** — `pprof` (Go), `clinic.js` / `0x` (Node), `perf` (Linux)
- **Latency vs throughput** — these often conflict; know which one your system optimizes for
- **Amdahl's Law** — adding parallelism has diminishing returns; serial portions become the bottleneck

---

## Stage 2: Intermediate Backend Engineering

### 2.1 Writing Production-Quality Code

Production code is code that others can:
1. Read and understand without asking you
2. Modify without breaking hidden assumptions
3. Debug at 3am without your help

**Principles:**

**Single Responsibility** — each function/module does one thing. If you need "and" to describe it, split it.

**Explicit over implicit** — do not rely on hidden state or global variables. Pass dependencies explicitly.

**Error handling is not optional:**
```typescript
// Wrong — silent failure
const user = await findUser(id).catch(() => null);

// Right — explicit handling with context
const user = await findUser(id);
if (!user) {
  throw new NotFoundError(`User ${id} not found`);
}
```

**Command-Query Separation (CQS)** — functions either change state OR return data, not both.

**Fail fast** — validate inputs at boundaries immediately. Do not let bad data travel deep into the system.

**Immutability where possible** — reduces bugs in concurrent code and makes state changes explicit.

---

### 2.2 Project Architecture

For a typical backend service:

```
src/
├── routes/           # HTTP layer only — parse request, call service, return response
│   └── api/v1/
├── services/         # Business logic — no HTTP knowledge here
├── repositories/     # Database access — no business logic here
├── domain/           # Types, entities, value objects
├── infrastructure/   # External: DB clients, message queues, email, S3
├── middleware/        # Auth, rate limiting, request logging
├── config/           # Environment config, validated at startup
└── errors/           # Custom error types
```

**The key principle:** each layer only knows about layers below it. Routes call services. Services call repositories. Repositories call DB. Never the other direction.

**Why this matters at scale:**
- You can swap a repository's PostgreSQL implementation for a different store without touching business logic
- You can test services in isolation by mocking repositories
- New engineers immediately understand where code belongs

---

### 2.3 Dependency Injection

Avoid this:
```typescript
// Service creates its own dependency — untestable, tightly coupled
export class UserService {
  private db = new Database(process.env.DB_URL);
}
```

Do this:
```typescript
// Dependencies injected — testable, loosely coupled
export class UserService {
  constructor(private readonly userRepo: UserRepository) {}
}
```

In Go:
```go
type UserService struct {
    repo UserRepository // interface, not concrete type
}

func NewUserService(repo UserRepository) *UserService {
    return &UserService{repo: repo}
}
```

---

### 2.4 Testing Strategy

```
Unit tests (70%)        — test pure functions, business logic in isolation
Integration tests (20%) — test service + real database, real dependencies
E2E tests (10%)         — test complete user flows through the API
```

**What to test:**
- Business logic (every branch, every edge case)
- Validation rules
- Error handling paths

**What not to test:**
- Framework behavior (Express routing works — trust it)
- Database connection itself
- Simple getters/setters

**Test properties (FIRST):**
- **F**ast — milliseconds, not seconds
- **I**solated — tests do not share state, do not depend on order
- **R**epeatable — same result every run
- **S**elf-validating — pass or fail, no manual inspection
- **T**imely — written with or before the code

**Database testing:** use a real test database (Docker container). Do not mock the database in integration tests — you will miss index behavior, constraint violations, and transaction edge cases.

---

## Stage 3: Senior Backend Engineer Skills

### 3.1 How Senior Engineers Approach Features

When a product manager gives you a feature, here is the professional process:

**Step 1: Requirements Analysis**

Ask these questions before writing a line of code:
- What is the actual user problem being solved?
- What are the functional requirements (what it must do)?
- What are the non-functional requirements (performance, availability, consistency)?
- What scale does this need to handle now, and in 12 months?
- What are the failure modes — what happens when it breaks?
- Are there regulatory or compliance requirements?

**Step 2: System Design Thinking**

Before designing the solution, map the problem:
- Who are the actors? What are the data flows?
- What data needs to be stored and what is its access pattern?
- What services/systems does this interact with?
- Where are the bottlenecks likely to be?
- What is the consistency requirement? (strong consistency vs eventual consistency)

**Step 3: Database Modeling**

- Design the schema to match your access patterns
- Avoid premature normalization — denormalize where read performance matters
- Consider what queries will run most frequently and design indexes for them
- Define constraints at the database level (not just application level)

**Step 4: API Design**

- Design the API contract before implementing
- Write the OpenAPI spec first — forces you to think through the shape
- Consider backward compatibility — existing clients cannot break
- Consider idempotency for mutation operations
- Think about pagination, filtering, sorting from the start

**Step 5: Scalability Considerations**

At each step, ask:
- What happens at 10x current load?
- What is the bottleneck? (CPU, memory, I/O, DB connections, external API rate limits)
- Can this be cached? What is the invalidation strategy?
- Is this operation parallelizable?

**Step 6: Edge Cases**

Think through:
- What if the user sends unexpected input?
- What if a downstream service is down?
- What if this operation is called concurrently by multiple requests?
- What if the process crashes mid-operation? (partial state)
- What if the database connection drops during a transaction?
- What if the operation succeeds but the response fails to reach the client? (idempotency)

**Step 7: Deployment and Monitoring**

- What metrics will tell you this feature is working correctly?
- What logs should be emitted (and at what level)?
- What alerts should be configured?
- Is this behind a feature flag for gradual rollout?
- What is the rollback plan if this feature causes issues?

---

### 3.2 Observability

Senior engineers instrument their code. You cannot debug what you cannot observe.

**Three pillars:**

**Logs:**
- Use structured logging (JSON) not plain strings
- Log at the right level: DEBUG (dev), INFO (business events), WARN (unexpected but recoverable), ERROR (action required)
- Include request ID, user ID, and correlation IDs in every log line
- Never log sensitive data (passwords, tokens, PII)

**Metrics:**
- Request rate, error rate, latency (p50, p95, p99) — the "golden signals"
- Business metrics: orders created per minute, payment success rate
- Infrastructure metrics: CPU, memory, DB connection pool usage
- Use Prometheus + Grafana (industry standard)

**Traces:**
- Distributed tracing shows the path of a request through multiple services
- OpenTelemetry is the standard (vendor-neutral)
- A trace ID follows a request from the API gateway through every downstream service
- Critical for debugging latency issues in microservices

**Alerting:** alert on symptoms (high error rate, high latency) not causes (CPU usage). Users care about their experience, not your CPU.

---

## Stage 4: System Design & Large Scale Systems

### 4.1 Monolith vs Microservices

**Start with a monolith.** This is not a controversial opinion — it is what successful companies actually did.

**Monolith advantages:**
- Simple deployment
- Simple debugging (one process, one log stream)
- Simple transactions (one database)
- No network latency between "services"
- Easy to refactor (rename a function vs change an API contract)

**When to move to microservices:**
- Independent scaling requirements
- Independent deployment velocity (different teams, different cadences)
- Strong bounded context boundaries are well understood
- Organizational scale (Conway's Law — your architecture reflects your org structure)

**Microservices real costs:**
- Distributed transactions (no ACID across services)
- Network failures between services
- Distributed tracing and debugging
- Service discovery, load balancing, mTLS
- Operational complexity

**The right pattern:** modular monolith — well-defined internal module boundaries in a single deployable. Extract services only when you have a proven, justified need.

---

### 4.2 Caching Strategies

**Cache levels:**

```
Client-side cache (browser)
    ↓
CDN cache (Cloudflare, CloudFront)
    ↓
Application cache (Redis, Memcached)
    ↓
Database query cache
    ↓
Database buffer pool (PostgreSQL shared_buffers)
```

**Caching patterns:**

**Cache-aside (Lazy loading):**
```
1. Check cache
2. If miss → query DB → write to cache → return
3. If hit → return cached value
```

**Write-through:**
```
1. Write to cache AND DB simultaneously
```
Cache always consistent, but higher write latency.

**Write-behind (Write-back):**
```
1. Write to cache
2. Async write to DB
```
Fastest writes, but risk of data loss.

**Cache invalidation strategies:**
- TTL (time-based expiration) — simple but can serve stale data
- Event-based invalidation — invalidate when the underlying data changes
- Cache-aside with versioned keys

**Cache stampede / thundering herd:**
When cache expires and many requests simultaneously miss and hit the DB. Solutions:
- Probabilistic early expiration
- Mutex/lock on cache miss
- Background refresh before expiration

---

### 4.3 Message Queues and Async Processing

**When to use a queue:**
- Decoupling producer from consumer
- Handling traffic spikes (queue absorbs bursts)
- Retrying failed operations
- Fan-out (one event → many consumers)
- Long-running jobs (email sending, PDF generation, data exports)

**Key concepts:**

**At-least-once vs exactly-once delivery:**
- At-least-once: message may be delivered multiple times — your consumer must be idempotent
- Exactly-once: much harder, requires distributed coordination — avoid if possible

**Consumer groups:** multiple consumers reading from same queue, each gets different messages (horizontal scaling of consumers)

**Dead letter queue (DLQ):** messages that fail repeatedly are moved here for inspection and manual intervention.

**Backpressure:** if consumers fall behind, the queue grows. You need monitoring and autoscaling strategies.

**Tools:** RabbitMQ (complex routing), Kafka (high-throughput log streaming, retention), Redis Streams (simple), SQS (AWS managed simplicity).

---

### 4.4 Event-Driven Architecture

**Events vs Commands vs Queries:**
- **Command:** "Do this thing" — directed at a specific service (`CreateOrder`)
- **Event:** "This thing happened" — broadcast to anyone interested (`OrderCreated`)
- **Query:** "Tell me about this" — returns data, no side effects

**Event sourcing:**
- Instead of storing current state, store every event that led to that state
- Current state is derived by replaying events
- Benefits: full audit log, time travel, easy event-driven integration
- Costs: complexity, eventual consistency, event schema evolution

**Outbox pattern (critical for microservices):**
```
Problem: Write to DB AND publish event atomically?
Solution:
1. Write business data + event to same DB transaction (outbox table)
2. Separate process reads outbox and publishes to message broker
3. Delete from outbox after successful publish
```
This guarantees you never lose an event due to process crash between DB write and broker publish.

---

### 4.5 Scalability Patterns

**Horizontal scaling (scale out):**
- Add more instances of the same service
- Requires stateless services (no session state stored locally)
- Use a load balancer to distribute traffic

**Vertical scaling (scale up):**
- Add more CPU/memory to existing instance
- Simpler but has hard limits and creates a single point of failure

**Database read replicas:**
- Route read queries to replicas, writes to primary
- Replication lag means replicas may be slightly behind

**Database sharding:**
- Split data across multiple DB instances by a shard key
- Eliminates cross-shard JOINs — design queries around shard key
- Extremely complex to manage — avoid until truly necessary

**CQRS (Command Query Responsibility Segregation):**
- Separate write model (normalized, consistent) from read model (denormalized, optimized)
- Read model updated asynchronously from events
- Enables very fast reads at the cost of eventual consistency

---

### 4.6 Reliability Patterns

**Circuit Breaker:**
```
CLOSED   → requests pass through normally
OPEN     → requests fail immediately after threshold of failures
HALF-OPEN → let one request through to test if downstream recovered
```

**Retry with exponential backoff + jitter:**
```
attempt 1: wait 1s
attempt 2: wait 2s
attempt 3: wait 4s
attempt 4: wait 8s + random jitter
```
Always add jitter. Always set a maximum number of retries.

**Timeout — set them everywhere:**
- Every outbound call needs a timeout
- No timeout = thread/goroutine held forever

**Bulkhead:**
- Isolate failures — separate connection pools for different dependencies
- If one downstream service is slow, it should not starve other operations

**Graceful degradation:**
- When a non-critical dependency fails, return a degraded but functional response
- Example: recommendation service is down → return empty recommendations, not a 500 error

**SLO, SLA, SLI:**
- **SLI** (Service Level Indicator): the measurement (p99 latency = 200ms)
- **SLO** (Service Level Objective): the target (p99 latency < 500ms for 99.9% of requests)
- **SLA** (Service Level Agreement): the contract with consequences
- Design your monitoring around your SLOs

---

## Stage 5: PostgreSQL and Database Mastery

### 5.1 Schema Design

**Naming conventions:**
- Tables: plural snake_case (`users`, `order_items`)
- Primary key: `id` (UUID or BIGSERIAL)
- Foreign keys: `{table_singular}_id` (`user_id`, `order_id`)
- Timestamps: `created_at`, `updated_at` on every table
- Use `deleted_at` (soft delete) over hard delete for most entities

**UUID vs BIGSERIAL:**
- BIGSERIAL: sequential, compact (8 bytes), predictable
- UUID v4: random, 16 bytes, unpredictable (good for security), causes index fragmentation
- UUID v7: time-ordered UUID — the best of both worlds (use this in new systems)

**Soft deletes:**
```sql
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
CREATE INDEX ON users (deleted_at) WHERE deleted_at IS NULL;
-- Always filter WHERE deleted_at IS NULL in your queries
```

---

### 5.2 Indexing Strategy

**How B-Tree indexes work:**
- PostgreSQL stores index as a sorted tree
- Range queries, equality queries, ORDER BY, DISTINCT — all benefit
- The planner decides whether to use an index

**Composite index column order:**
```sql
-- This index supports:
-- WHERE user_id = ?
-- WHERE user_id = ? AND status = ?
-- WHERE user_id = ? AND status = ? AND created_at > ?
-- Does NOT efficiently support: WHERE status = ?
CREATE INDEX ON orders (user_id, status, created_at);
```
Put the highest-cardinality, most-frequently-filtered column first.

**Partial indexes — highly underused:**
```sql
-- Only index active users (much smaller index)
CREATE INDEX ON users (email) WHERE active = true;

-- Only index unprocessed jobs
CREATE INDEX ON jobs (created_at) WHERE processed_at IS NULL;
```

**Always index foreign keys.** PostgreSQL does not do this automatically. Without this, every `UPDATE` or `DELETE` on the parent table does a sequential scan of the child table.

**EXPLAIN ANALYZE — read this fluently:**
```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM orders WHERE user_id = 123 AND status = 'pending';
```
Look for:
- `Seq Scan` on large tables — you may need an index
- High `rows` estimates being wrong — statistics may be stale (`ANALYZE`)
- `Nested Loop` vs `Hash Join` vs `Merge Join` — understand when each is used
- Buffer hits vs reads — high reads mean data not in cache

---

### 5.3 Query Optimization

**N+1 queries — kill them:**
```typescript
// N+1: 1 query for orders + N queries for users
const orders = await db.query('SELECT * FROM orders');
for (const order of orders) {
  order.user = await db.query('SELECT * FROM users WHERE id = $1', [order.user_id]);
}

// Correct: 1 JOIN
const orders = await db.query(`
  SELECT o.*, u.name, u.email
  FROM orders o
  JOIN users u ON u.id = o.user_id
`);
```

**Pagination — cursor-based over offset:**
```sql
-- Offset pagination (bad for large offsets — scans and discards rows)
SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 10000;

-- Cursor-based pagination (O(log n) regardless of page number)
SELECT * FROM orders WHERE id > $last_seen_id ORDER BY id LIMIT 20;
```

**Window functions for complex analytics:**
```sql
SELECT
  user_id,
  SUM(amount) as total_revenue,
  RANK() OVER (ORDER BY SUM(amount) DESC) as revenue_rank
FROM orders
GROUP BY user_id;
```

**Batch operations:**
```sql
-- Never INSERT in a loop. Batch it.
INSERT INTO events (user_id, type, created_at)
VALUES
  ($1, $2, $3),
  ($4, $5, $6),
  ($7, $8, $9);
```

---

### 5.4 Transactions and Locking

**SELECT FOR UPDATE — pessimistic lock:**
```sql
BEGIN;
SELECT balance FROM accounts WHERE id = $1 FOR UPDATE;
-- Now no other transaction can modify this row
UPDATE accounts SET balance = balance - $2 WHERE id = $1;
COMMIT;
```

**Optimistic locking with version column:**
```sql
-- Read with version
SELECT id, balance, version FROM accounts WHERE id = $1;

-- Update only if version hasn't changed
UPDATE accounts
SET balance = $new_balance, version = version + 1
WHERE id = $1 AND version = $expected_version;
-- If 0 rows updated, someone else modified it — retry
```

**Advisory locks — application-level distributed locks:**
```sql
SELECT pg_advisory_lock(12345);       -- blocking
SELECT pg_try_advisory_lock(12345);   -- non-blocking, returns bool
SELECT pg_advisory_unlock(12345);
```

**Write skew (requires SERIALIZABLE):**
```
TX1 reads: is anyone on-call? yes (Alice). removes Bob from on-call.
TX2 reads: is anyone on-call? yes (Bob). removes Alice from on-call.
Result: nobody on call.
This anomaly is invisible to Read Committed and Repeatable Read.
Use SERIALIZABLE or explicit locking for such scenarios.
```

---

### 5.5 Scaling PostgreSQL

**Connection pooling (PgBouncer):**
- PostgreSQL creates a process per connection — expensive at scale
- PgBouncer multiplexes many app connections to fewer DB connections
- Transaction pooling mode: connection returned to pool after each transaction
- Caveat: cannot use session-level features in transaction pooling mode (prepared statements, temp tables, advisory locks)

**Read replicas:**
- PostgreSQL streaming replication via WAL
- Route SELECTs to replicas, writes to primary
- Replication lag: replicas may be milliseconds to seconds behind

**Partitioning:**
```sql
-- Range partitioning by date
CREATE TABLE events (
  id BIGSERIAL,
  created_at TIMESTAMPTZ NOT NULL
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2025_q1 PARTITION OF events
  FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
```
Benefits: partition pruning, easier archival, smaller indexes per partition.

---

## Stage 6: Engineering Practices at Top Companies

### 6.1 Design Documents

Before writing significant code, write a design document. The format varies, but the purpose is the same: **think through the problem before committing to an implementation.**

```markdown
## Problem Statement
What problem are we solving? Why does it need solving now?

## Background
Context a reader needs to understand the problem.

## Goals and Non-Goals
Goals: what success looks like
Non-goals: explicitly what we are NOT trying to solve

## Proposed Solution
High-level design, architecture diagram, data model

## Alternative Solutions Considered
Why did we reject other approaches?

## Data Model
Schema changes, data migrations

## API Design
Endpoint contracts, request/response shapes

## Scalability
How does this behave at 10x load?

## Security
Auth, authorization, data sensitivity

## Observability
Metrics, logs, alerts, dashboards

## Rollout Plan
Feature flags, gradual rollout, rollback plan

## Open Questions
What is still uncertain? What needs a decision?
```

---

### 6.2 Code Reviews

**As a reviewer, look for:**
1. Correctness — does it do what it says?
2. Edge cases — are inputs validated? Are error paths handled?
3. Performance implications — N+1 queries, missing indexes, blocking operations
4. Security — injection vulnerabilities, improper authorization, exposed secrets
5. Testability — can this be tested? Are tests included?
6. Readability — will the next engineer understand this in 6 months?

**As the author:**
- Keep PRs small (< 400 lines of logic change)
- Provide context — what problem does this solve? Link to the design doc
- Self-review first before requesting review
- Respond to every comment

---

### 6.3 Production Readiness Checklist

```
[ ] Error handling — all failure paths are handled
[ ] Logging — meaningful logs at appropriate levels
[ ] Metrics — custom metrics for business-critical operations
[ ] Alerts — alerts configured for anomalies
[ ] Load testing — validated at expected peak load
[ ] Database — indexes in place, migrations tested on production-scale data
[ ] Feature flag — can be disabled without a deploy
[ ] Rollback plan — documented and tested
[ ] Runbook — how to debug common issues with this feature
[ ] Security review — auth, input validation, sensitive data handling
```

---

## Stage 7: How to Think Like a Principal Engineer

### 7.1 Decision-Making Framework

**1. Clarify the actual problem (not the proposed solution)**
Someone asks: "Should we use Kafka or RabbitMQ?"
A principal engineer first asks: "What problem are we trying to solve? What are our scale requirements? Do we need message replay? What is our operational capability?"

**2. Enumerate the options (including doing nothing)**

**3. Define the evaluation criteria**
- Performance requirements
- Operational complexity
- Team familiarity
- Cost
- Long-term maintainability

**4. Analyze tradeoffs explicitly**
No option is purely better. Document what each option gains and sacrifices.

**5. Make a recommendation with a clear rationale**
Do not end with "it depends." State what you recommend given the constraints you have analyzed.

**6. Document the decision (Architecture Decision Record)**

---

### 7.2 Architecture Decision Records (ADR)

```markdown
# ADR-0042: Use cursor-based pagination for the orders API

## Status: Accepted

## Context
The orders table is growing to ~50M rows. Offset-based pagination degrades
at high page numbers (O(n) scan). Page 5000 × 20 rows requires scanning
100,000 rows.

## Decision
Implement cursor-based pagination using the order's `created_at` and `id`
as the cursor. This provides O(log n) performance regardless of page number.

## Consequences
- Cannot jump to arbitrary pages
- Requires the client to store the cursor between requests
- Performance is stable at any scale

## Alternatives Considered
- Keyset pagination via id only: simpler but ties pagination order to insertion order
- Offset pagination: simpler to implement but does not scale
```

---

### 7.3 Speed vs Maintainability

**Move fast when:**
- You are in early exploration / prototyping
- The code will be thrown away
- Business risk of slowness outweighs technical debt

**Invest in quality when:**
- Core domain logic (read 1000 times, modified 100 times)
- Shared infrastructure used by many teams
- Security-critical paths
- Performance-critical hot paths

**The right question is not "fast or quality?" — it is "what is the cost of changing this later?"**

---

## Stage 8: What Separates Each Level

| Level | Scope | Primary Value |
|---|---|---|
| **Junior** | Assigned tasks | Makes it work |
| **Mid-level** | Features | Works independently, considers edge cases |
| **Senior** | Complex features end-to-end | Balances delivery with long-term health |
| **Staff** | Cross-team initiatives | Sets standards, translates business to architecture |
| **Principal** | Organization-wide strategy | Technical vision, systemic problem identification |
| **Architect** | Company-wide technical direction | Build vs buy, reference architecture, business alignment |

**The key shifts:**
- Junior → Mid: stops needing guidance on execution
- Mid → Senior: starts seeing problems before they happen
- Senior → Staff: scope expands beyond one team
- Staff → Principal: accountable for outcomes, not just contributions
- Principal → Architect: defines what the technology should be, not just how

---

## Stage 9: Projects That Build Real Engineering Skill

These simulate actual production challenges, not simple CRUD apps.

### Project 1: URL Shortener (with full production thinking)
**Production thinking:**
- 100M URLs, 10B redirects/day — what is the bottleneck?
- Cache the hot URLs (top 20% serve 80% of traffic)
- Analytics pipeline (async, don't slow down redirects)
- Sharding the database by short code prefix
- Expiration and cleanup jobs

### Project 2: Rate Limiter Service
- Implement token bucket and sliding window algorithms
- Make it work distributed (Redis-backed)
- Handle edge cases: what if Redis is down?
- API to configure per-user, per-route limits

### Project 3: Distributed Job Queue
- Producer/consumer with retry logic
- Priority queues
- Dead letter queue
- Visibility timeout (job claimed but not completed → retry)
- Dashboard showing queue depth, consumer lag

### Project 4: Multi-tenant SaaS Backend
- Tenant isolation (row-level security vs separate schemas vs separate DBs)
- Per-tenant rate limiting
- Tenant-aware caching
- Async data export with signed URL delivery

### Project 5: Event-Driven Order Processing System
- Order service → payment service → inventory service → notification service
- Outbox pattern for reliable event publishing
- Handle partial failures (payment succeeded, inventory failed)
- Saga pattern for distributed transactions
- Event replay for debugging and recovery

### Project 6: Real-time Notification System
- WebSocket connections (thousands of concurrent)
- Pub/sub fan-out
- Presence detection (who is online)
- Message persistence and delivery receipts
- Scale across multiple server instances (Redis pub/sub for cross-instance delivery)

---

## Stage 10: Books and Resources

### Essential Books

**Foundations:**
- **"Designing Data-Intensive Applications"** — Martin Kleppmann. The single most important book for backend engineers. Read it twice.
- **"Computer Networks: A Top-Down Approach"** — Kurose & Ross
- **"The Linux Command Line"** — William Shotts

**Systems Design:**
- **"System Design Interview Vol 1 & 2"** — Alex Xu. Practical, concrete examples.
- **"Software Architecture: The Hard Parts"** — Ford, Richards
- **"Building Microservices"** — Sam Newman
- **"Fundamentals of Software Architecture"** — Ford & Richards

**Databases:**
- **"PostgreSQL: Up and Running"** — Regina Obe
- **"High Performance MySQL"** — indexing and optimization knowledge transfers to PostgreSQL
- **"Database Internals"** — Alex Petrov. How databases actually work.

**Engineering Craft:**
- **"A Philosophy of Software Design"** — John Ousterhout
- **"The Pragmatic Programmer"** — Hunt & Thomas
- **"Staff Engineer"** — Will Larson
- **"An Elegant Puzzle"** — Will Larson

**Distributed Systems:**
- **"Understanding Distributed Systems"** — Roberto Vitillo. Modern and practical.
- **"Distributed Systems"** — Maarten Van Steen

### Online Resources
- **martinfowler.com** — patterns, microservices, event sourcing
- **High Scalability blog** — real architecture teardowns
- **ByteByteGo** — system design concepts with excellent visuals
- **The Morning Paper** — research papers summarized accessibly
- **PostgreSQL documentation** — one of the best pieces of technical documentation ever written

### Papers Worth Reading
- **"The Google File System"** (2003) — foundational distributed storage
- **"Bigtable"** (2006) — NoSQL architecture thinking
- **"Dynamo: Amazon's Highly Available Key-Value Store"** (2007) — consistency vs availability
- **"MapReduce"** (2004) — distributed computation
- **"Spanner: Google's Globally Distributed Database"** (2012) — distributed SQL

---

## Stage 11: Daily and Weekly Practice Routine

### Daily (45–60 minutes)

**Morning (20 min):**
Read one of:
- A chapter from the books listed above
- A blog post from martinfowler.com or High Scalability
- A section of PostgreSQL documentation

**During work:**
- When you make any technical decision, pause and write one sentence about why
- When you encounter a bug, write down the root cause before you fix it
- When a query is slow, run `EXPLAIN ANALYZE` before blindly adding an index

**Evening (20 min, 3x/week):**
- Implement one small concept from what you read
- Do one LeetCode medium problem (focus on hash maps, trees, graphs)

### Weekly (2–3 hours)

**One deep project session:**
Work on one of the production-scale projects listed above. Design before you code. Write the design doc first.

**One architecture teardown:**
Pick a system you use (Stripe, Shopify, Discord, Netflix). Read their engineering blog. Ask: "How would I have built this? Why did they make different choices?"

**One EXPLAIN ANALYZE session:**
Look at the actual queries your project generates. Find the slowest one. Understand the execution plan. Optimize it.

### Monthly
- Review your ADRs and design documents from the past month
- Pick one production incident or bug and write a post-mortem style analysis
- Identify one concept you still cannot explain clearly — that is the next area to study

---

## The Core Mental Model to Internalize

A principal engineer looks at any system and immediately asks:

1. **What can fail here?** (resilience thinking)
2. **What happens at 10x load?** (scalability thinking)
3. **How will someone debug this at 3am?** (operability thinking)
4. **What decision will be hard to change later?** (reversibility thinking)
5. **What is the simplest design that satisfies the requirements?** (complexity thinking)

The goal is not to make perfect systems. The goal is to make systems whose **failure modes are understood and tolerable**, whose **complexity matches the problem**, and that can be **evolved safely as requirements change**.