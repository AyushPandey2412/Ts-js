# BullMQ — Complete Beginner Guide
# Queues, Workers, Schedulers & Cron Jobs

---

## What Problem Does BullMQ Solve?

Imagine a user clicks "Search products" on your website.
Your server calls Amazon API, waits, then returns data. That's fine for 1 page.

But what if Amazon has 13 pages of results?
You can't make the user wait for 13 API calls (could take 30+ seconds).

**Solution:** Do page 0 immediately → return response to user → do pages 1-12 in the background.

That "background work" is what BullMQ handles.

```
Without BullMQ:
User request → API call 1 → API call 2 → ... → API call 13 → respond (30s wait)

With BullMQ:
User request → API call 1 → respond immediately (0.5s)
                                ↓ background
                          API call 2, 3, 4... (user doesn't wait)
```

BullMQ uses **Redis** as its backbone — jobs are stored in Redis, workers pull from Redis.

---

## The 3 Core Concepts

```
┌─────────────┐     adds job     ┌─────────────┐     picks up job     ┌─────────────┐
│             │ ───────────────► │             │ ───────────────────► │             │
│  Your Code  │                  │    QUEUE    │                      │   WORKER    │
│  (service)  │                  │  (Redis)    │                      │  (executes) │
│             │ ◄─────────────── │             │ ◄─────────────────── │             │
└─────────────┘    job added     └─────────────┘     job done         └─────────────┘

SCHEDULER = automatic job adder (adds jobs on a cron schedule)
```

| Concept | What it is | Real-world analogy |
|---------|-----------|-------------------|
| **Queue** | A list of jobs waiting to be done | A todo list on a whiteboard |
| **Worker** | Code that reads from the queue and does the work | An employee reading the whiteboard |
| **Scheduler** | Automatically adds jobs at set times | A manager who adds tasks every morning |
| **Job** | One unit of work with data attached | One task on the whiteboard with instructions |

---

## Part 1: Queue

A Queue is just a named list stored in Redis. You push jobs into it. Workers pull from it.

### Creating a Queue

```typescript
// src/queues/email.queue.ts
import { Queue } from "bullmq";
import { getRedisConnection } from "config/redis";

// The queue name — this is what workers listen to
export const EMAIL_QUEUE = "email.send";

export function EmailQueue() {
  return new Queue(EMAIL_QUEUE, {
    connection: getRedisConnection(), // Redis connection
  });
}
```

That's it. A queue is just a name + Redis connection.

### Adding a Job to the Queue

```typescript
// In your service / controller
const queue = EmailQueue();

// Add one job
await queue.add(
  "SEND_WELCOME_EMAIL",   // job name (label — helps identify job type)
  {                        // job DATA — anything you want to pass to the worker
    userId: "abc-123",
    email:  "user@example.com",
    name:   "John",
  }
);
```

### Adding a Job with Options

```typescript
await queue.add(
  "SEND_WELCOME_EMAIL",
  { userId: "abc-123", email: "user@example.com" },
  {
    delay:   5000,        // wait 5 seconds before processing
    attempts: 3,          // retry up to 3 times if it fails
    backoff: {
      type:  "exponential",
      delay: 2000,        // wait 2s, then 4s, then 8s between retries
    },
    removeOnComplete: true,   // delete job from Redis after success
    removeOnFail:    false,   // keep job in Redis after failure (for debugging)
  }
);
```

### Adding Many Jobs at Once (bulk)

```typescript
await queue.addBulk([
  { name: "SEND_EMAIL", data: { userId: "1" }, opts: { delay: 1000 } },
  { name: "SEND_EMAIL", data: { userId: "2" }, opts: { delay: 2000 } },
  { name: "SEND_EMAIL", data: { userId: "3" }, opts: { delay: 3000 } },
]);
// All 3 added in one Redis operation — much faster than 3 separate adds
```

---

## Part 2: Worker

A Worker listens to a queue name and runs a function for each job.

### Creating a Worker

```typescript
// src/workers/email.worker.ts
import { Worker } from "bullmq";
import { getRedisConnection } from "config/redis";
import { EMAIL_QUEUE } from "queues/email.queue";

export const emailWorker = new Worker(
  EMAIL_QUEUE,            // ← must match the queue name exactly

  async (job) => {        // ← this function runs for every job
    // job.data = whatever you passed when adding the job
    const { userId, email, name } = job.data;

    console.log(`Sending welcome email to ${email}`);

    // do your actual work here
    await sendEmail(email, `Welcome ${name}!`);

    // return value is stored as the job result
    return { sent: true, email };
  },

  {
    connection:  getRedisConnection(),  // same Redis as queue
    concurrency: 5,    // process up to 5 jobs at the same time
  }
);
```

### Worker Events (Know What's Happening)

```typescript
// Job completed successfully
emailWorker.on("completed", (job, result) => {
  console.log(`✅ Job ${job.id} done:`, result);
  // result = whatever your worker function returned
});

// Job failed (after all retries exhausted)
emailWorker.on("failed", (job, error) => {
  console.error(`❌ Job ${job?.id} failed:`, error.message);
});

// Job started processing
emailWorker.on("active", (job) => {
  console.log(`🔄 Job ${job.id} started`);
});
```

### Concurrency — How Many Jobs Run at Once?

```typescript
// concurrency: 1  → only 1 job at a time (sequential)
// concurrency: 5  → up to 5 jobs running simultaneously
// concurrency: 10 → up to 10 jobs running simultaneously

new Worker(QUEUE_NAME, handler, {
  connection: redis,
  concurrency: 5,
})
```

Use concurrency: 1 when:
- Jobs share a resource (same DB table, same external API with rate limits)
- Order matters

Use concurrency > 1 when:
- Jobs are independent
- You want faster throughput

### Rate Limiter — Slow Down the Worker

```typescript
new Worker(QUEUE_NAME, handler, {
  connection: redis,
  concurrency: 3,
  limiter: {
    max:      10,    // max 10 jobs
    duration: 1000,  // per 1000ms (1 second)
    // = max 10 jobs/second
  },
})
```

---

## Part 3: Scheduler (Cron Jobs)

A Scheduler automatically adds jobs to a queue on a schedule — like a cron job.

### Cron Pattern Cheatsheet

```
"* * * * *"
 │ │ │ │ └── Day of week (0=Sun, 1=Mon ... 6=Sat)
 │ │ │ └──── Month (1-12)
 │ │ └────── Day of month (1-31)
 │ └──────── Hour (0-23)
 └────────── Minute (0-59)

Examples:
"0 */2 * * *"    → every 2 hours (00:00, 02:00, 04:00, ...)
"0 9 * * *"      → every day at 9:00 AM
"0 9 * * 1"      → every Monday at 9:00 AM
"*/5 * * * *"    → every 5 minutes
"0 0 * * *"      → every day at midnight
"0 0 1 * *"      → first day of every month at midnight
"30 8 * * 1-5"   → Mon-Fri at 8:30 AM
```

Use https://crontab.guru to test your patterns.

### Setting Up a Scheduled Job (Repeatable Job)

```typescript
// src/schedulers/email.scheduler.ts
import { EmailQueue } from "queues/email.queue";

export async function registerDailyDigestScheduler() {
  const queue = EmailQueue();

  await queue.add(
    "SEND_DAILY_DIGEST",   // job name
    {},                     // job data (empty — worker will load data itself)
    {
      repeat: {
        pattern: "0 9 * * *",    // every day at 9 AM
        tz:      "Asia/Kolkata", // timezone
      },
      jobId:           "daily-digest-scheduler",  // unique ID prevents duplicates
      removeOnComplete: true,
      removeOnFail:    false,
    }
  );

  console.log("Daily digest scheduler registered");
}
```

### Registering the Scheduler on App Startup

```typescript
// src/schedulers/index.ts
import { registerDailyDigestScheduler } from "./email.scheduler";

export async function registerAllSchedulers() {
  await registerDailyDigestScheduler();
  // add more schedulers here
}
```

```typescript
// src/app.ts (or wherever your app starts)
import { registerAllSchedulers } from "schedulers";

async function startApp() {
  await registerAllSchedulers();
  // ... rest of app startup
}
```

---

## Part 4: Full End-to-End Example

Let's build a complete "send daily report email to all users" feature.

### Step 1 — Queue

```typescript
// src/queues/report.queue.ts
import { Queue } from "bullmq";
import { getRedisConnection } from "config/redis";

export const REPORT_QUEUE = "report.daily";

export function ReportQueue() {
  return new Queue(REPORT_QUEUE, {
    connection: getRedisConnection(),
  });
}
```

### Step 2 — Worker

```typescript
// src/workers/report.worker.ts
import { Worker } from "bullmq";
import { getRedisConnection } from "config/redis";
import { REPORT_QUEUE } from "queues/report.queue";
import { sequelize } from "config/database";
import { QueryTypes } from "sequelize";

export const reportWorker = new Worker(
  REPORT_QUEUE,

  async (job) => {
    console.log(`[ReportWorker] Job ${job.id} started`);

    // Step 1: Load all active users
    const users = await sequelize.query(
      `SELECT id, email, name FROM users WHERE is_active = true`,
      { type: QueryTypes.SELECT }
    );

    let sent   = 0;
    let failed = 0;

    // Step 2: Send report to each user
    for (const user of users) {
      try {
        await sendDailyReportEmail(user.email, user.name);
        sent++;
      } catch (err) {
        // one failure does not stop others
        failed++;
        console.error(`Failed to send to ${user.email}:`, err.message);
      }
    }

    return { sent, failed, total: users.length };
  },

  {
    connection:  getRedisConnection(),
    concurrency: 1, // one report job at a time
  }
);

reportWorker.on("completed", (job, result) => {
  console.log(`✅ Daily report done:`, result);
  // { sent: 95, failed: 2, total: 97 }
});

reportWorker.on("failed", (job, err) => {
  console.error(`❌ Report job ${job?.id} failed:`, err.message);
});
```

### Step 3 — Scheduler

```typescript
// src/schedulers/report.scheduler.ts
import { ReportQueue } from "queues/report.queue";

export async function registerDailyReportScheduler() {
  const queue = ReportQueue();

  await queue.add(
    "SEND_DAILY_REPORT",
    {},  // empty — worker loads users itself
    {
      repeat: {
        pattern: "0 8 * * *",     // every day at 8 AM
        tz:      "Asia/Kolkata",
      },
      jobId:            "daily-report-scheduler",
      removeOnComplete:  true,
      removeOnFail:     false,
    }
  );

  console.log("⏱ Daily report scheduler registered (every day at 8 AM IST)");
}
```

### Step 4 — Register on Startup

```typescript
// src/schedulers/index.ts
import { registerDailyReportScheduler } from "./report.scheduler";

export async function registerAllSchedulers() {
  await registerDailyReportScheduler();
}
```

### What Happens at Runtime

```
App starts
  └─► registerAllSchedulers()
        └─► registerDailyReportScheduler()
              └─► queue.add("SEND_DAILY_REPORT", {}, { repeat: "0 8 * * *" })
                    BullMQ stores this repeatable job in Redis

Every day at 8 AM IST:
  BullMQ automatically adds a new job to "report.daily" queue
        │
        ▼
  reportWorker picks it up
        │
        ▼
  Loads all users from DB → sends emails → returns { sent, failed, total }
        │
        ▼
  Job marked as complete — removed from Redis (removeOnComplete: true)

Next day at 8 AM → repeats automatically
```

---

## Part 5: Job Lifecycle

Every job goes through these states:

```
Added to queue
      │
      ▼
  WAITING  ← job sitting in queue, no worker free yet
      │
      ▼  (worker picks it up)
  ACTIVE   ← worker is running the job right now
      │
      ├──► COMPLETED  ← worker function returned successfully
      │
      └──► FAILED     ← worker function threw an error
               │
               ├──► WAITING (retry)   ← if attempts remaining
               │
               └──► FAILED (final)    ← all retries exhausted
```

If you set `delay: 5000`, the job goes through:

```
Added → DELAYED (waiting 5 seconds) → WAITING → ACTIVE → COMPLETED/FAILED
```

---

## Part 6: Common Patterns

### Pattern 1: Fire and Forget (don't wait for result)

```typescript
// Add job to queue — don't await the job itself, just the enqueue
queue.add("SEND_EMAIL", { email: "user@example.com" }).catch(console.error);

// Return response to user immediately — email sends in background
return { success: true };
```

### Pattern 2: Staggered Delays (rate limiting without a limiter)

```typescript
// Instead of hammering an API with 10 calls at once,
// spread them out 1 second apart

const jobs = users.map((user, index) => ({
  name: "SEND_EMAIL",
  data: { email: user.email },
  opts: { delay: index * 1000 },  // user[0]: 0ms, user[1]: 1000ms, user[2]: 2000ms...
}));

await queue.addBulk(jobs);
```

### Pattern 3: One Job Per Org (isolation)

```typescript
// Worker: never let one org's failure kill others
for (const org of orgs) {
  try {
    await processOrg(org);
  } catch (err) {
    console.error(`Org ${org.id} failed:`, err.message);
    // continue to next org — don't rethrow
  }
}
```

### Pattern 4: Chunking Large Work

```typescript
// Don't process 1000 items in one loop — chunk them
const CHUNK_SIZE = 30;

for (let i = 0; i < items.length; i += CHUNK_SIZE) {
  const chunk = items.slice(i, i + CHUNK_SIZE);
  await processChunk(chunk);
  await sleep(2000); // rate limit: 2s between chunks
}
```

---

## Part 7: Folder Structure Convention

```
src/
├── queues/
│   ├── email.queue.ts          ← Queue definition + name constant
│   ├── report.queue.ts
│   └── index.ts                ← exports all queues
│
├── workers/
│   └── worker-helper/
│       ├── email.worker.ts     ← Worker logic
│       ├── report.worker.ts
│       └── index.ts            ← starts all workers
│
└── schedulers/
    ├── email.scheduler.ts      ← registerXxxScheduler() function
    ├── report.scheduler.ts
    └── index.ts                ← registerAllSchedulers() → called on app start
```

**Naming convention:**
- Queue file: `<feature>.queue.ts`
- Worker file: `<feature>.worker.ts`
- Scheduler file: `<feature>.scheduler.ts`
- Queue name string: `"<feature>.<action>"` (e.g. `"email.send"`, `"report.daily"`)

---

## Part 8: How to Add a New Cron Job (Step by Step)

Let's say you want to run a cleanup job every Sunday at 2 AM.

**Step 1 — Create the queue**
```typescript
// src/queues/cleanup.queue.ts
import { Queue } from "bullmq";
import { getRedisConnection } from "config/redis";

export const CLEANUP_QUEUE = "cleanup.weekly";

export function CleanupQueue() {
  return new Queue(CLEANUP_QUEUE, { connection: getRedisConnection() });
}
```

**Step 2 — Create the worker**
```typescript
// src/workers/worker-helper/cleanup.worker.ts
import { Worker } from "bullmq";
import { getRedisConnection } from "config/redis";
import { CLEANUP_QUEUE } from "queues/cleanup.queue";

export const cleanupWorker = new Worker(
  CLEANUP_QUEUE,
  async (job) => {
    // your cleanup logic here
    await deleteOldLogs();
    await purgeExpiredSessions();
    return { done: true };
  },
  { connection: getRedisConnection(), concurrency: 1 }
);

cleanupWorker.on("completed", (job, result) => console.log("✅ Cleanup done", result));
cleanupWorker.on("failed", (job, err) => console.error("❌ Cleanup failed", err.message));
```

**Step 3 — Create the scheduler**
```typescript
// src/schedulers/cleanup.scheduler.ts
import { CleanupQueue } from "queues/cleanup.queue";

export async function registerWeeklyCleanupScheduler() {
  const queue = CleanupQueue();

  await queue.add(
    "WEEKLY_CLEANUP",
    {},
    {
      repeat:  { pattern: "0 2 * * 0", tz: "Asia/Kolkata" }, // Sunday 2 AM IST
      jobId:   "weekly-cleanup-scheduler",
      removeOnComplete: true,
      removeOnFail:    false,
    }
  );

  console.log("⏱ Weekly cleanup scheduler registered");
}
```

**Step 4 — Register it**
```typescript
// src/schedulers/index.ts
import { registerWeeklyCleanupScheduler } from "./cleanup.scheduler";

export async function registerAllSchedulers() {
  await registerWeeklyCleanupScheduler();
  // ... existing schedulers
}
```

**Step 5 — Register worker in workers index**
```typescript
// src/workers/index.ts
import "./worker-helper/cleanup.worker";
// ... existing workers
```

Done. The cleanup now runs automatically every Sunday at 2 AM.

---

## Part 9: Quick Reference

### Queue methods
```typescript
queue.add(name, data, opts)          // add one job
queue.addBulk([{ name, data, opts }]) // add many jobs at once
queue.getJobs(["waiting", "active"])  // inspect jobs
queue.pause()                         // pause the queue
queue.resume()                        // resume the queue
```

### Worker options
```typescript
{
  connection:  redis,
  concurrency: 5,        // max parallel jobs
  limiter: {
    max:      10,        // max jobs
    duration: 1000,      // per N milliseconds
  },
}
```

### Job options
```typescript
{
  delay:    5000,        // wait before processing (ms)
  attempts: 3,           // total tries (1 original + 2 retries)
  backoff: {
    type:  "exponential" | "fixed",
    delay: 2000,         // base delay between retries
  },
  priority: 1,           // lower number = higher priority
  removeOnComplete: true,
  removeOnFail:    false,
  repeat: {              // makes it a recurring job
    pattern: "0 9 * * *",
    tz:      "Asia/Kolkata",
  },
  jobId: "unique-id",    // prevents duplicate scheduled jobs
}
```

### Cron quick reference
```
Every minute          : "* * * * *"
Every 5 minutes       : "*/5 * * * *"
Every hour            : "0 * * * *"
Every 2 hours         : "0 */2 * * *"
Every day at 9 AM     : "0 9 * * *"
Every weekday at 9 AM : "0 9 * * 1-5"
Every Sunday at 2 AM  : "0 2 * * 0"
Every month on 1st    : "0 0 1 * *"
```

---

## Summary: The Mental Model

```
YOUR CODE                      REDIS                      WORKER
─────────                      ─────                      ──────

queue.add(job) ──────────────► [job1, job2, job3]
                                       │
                                       └──────────────────► picks up job1
                                                            runs your function
                                                            returns result
                                       ┌──────────────────── job1 complete
                               [job2, job3]

SCHEDULER:
cron fires every 2h ─────────► queue.add(job) ──────────► worker picks it up
```

- **Queue** = the inbox (stored in Redis)
- **Worker** = the employee who processes the inbox
- **Scheduler** = the alarm clock that puts tasks in the inbox automatically
- **Job** = one task in the inbox, with data attached
- **Redis** = the whiteboard everyone reads from and writes to
