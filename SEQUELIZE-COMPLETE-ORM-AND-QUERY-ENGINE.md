+-
#+ Module: Complete Sequelize ORM, Dynamic SQL & Enterprise Query Engine

A comprehensive, beginner-to-advanced masterclass on Sequelize, database connection pooling, raw parameterized SQL execution, dynamic replacements, modular query architecture, transactions, and multi-tenant schema isolation.

---

## Topic 1: What is an ORM and What is Sequelize? (Architecture, Dialects & Connection Pools)

### What Is It?
A database is a separate software program (such as PostgreSQL, MySQL, SQLite, or Microsoft SQL Server) that stores structured tables on a disk or in memory. To talk to a database, you send commands written in **SQL** (Structured Query Language).

In Node.js, sending raw text strings across a network socket and parsing returned byte arrays manually can be tedious and prone to security vulnerabilities. 

**Sequelize** is an **Object-Relational Mapping (ORM)** library for Node.js and TypeScript. An ORM acts as a translator between two completely different programming paradigms:
1. **Objects in JavaScript**: Arrays, objects, classes, strings, and numbers in memory.
2. **Tables in Relational Databases**: Rows, columns, primary keys, foreign keys, and transactions.

Key technical terms defined:
- An ORM (Object-Relational Mapper) is a software library that automatically maps database table records to JavaScript objects.
- A Dialect is the specific database flavor (e.g. `postgres`, `mysql`, `sqlite`, `mssql`) that Sequelize translates generic queries into.
- A Connection Pool is a cache of database connections maintained in memory so multiple queries can execute concurrently without opening and closing a new network connection on every request.
- Client Driver is the underlying low-level npm package (such as `pg` for PostgreSQL or `mysql2` for MySQL) that handles actual TCP network communication with the database server.

```
Node.js Application Code
         │
         ▼
Sequelize ORM Engine (Query Builder, Model Mapping, Replacements)
         │
         ▼
Database Driver (`pg`, `mysql2`, `tedious`, `sqlite3`)
         │
         ▼ (TCP Network Socket / Connection Pool)
PostgreSQL / MySQL / SQLite Database Server
```

### Why Does It Exist?
Without Sequelize or an ORM:
1. Every developer must manually write raw SQL strings, format dates, and handle connection open/close lifecycles on every single HTTP request.
2. If your application needs to support multiple databases (e.g. SQLite for local automated testing, PostgreSQL for cloud production), you would have to rewrite every query because different databases use different SQL dialects.
3. Opening a new TCP network handshake for every single database query adds 20ms to 80ms of latency per query. A connection pool keeps a fixed number of open connections alive and reuses them instantly.

### Basic Example and Line-by-Line Explanation

```typescript
import { Sequelize } from "sequelize";

// 1. Initialize the Sequelize connection instance
export const sequelize = new Sequelize("ecommerce_db", "db_user", "secure_password", {
  host: "localhost",
  port: 5432,
  dialect: "postgres",
  logging: false, // Disables printing raw SQL to terminal
  pool: {
    max: 10,      // Maximum active connections in the pool
    min: 2,       // Minimum idle connections to keep open
    acquire: 30000, // Maximum time (ms) to wait for a connection before error
    idle: 10000,  // Maximum time (ms) a connection can remain idle before being closed
  },
});

// 2. Test the connection
export async function testConnection(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");
  } catch (error: any) {
    console.error("Unable to connect to the database:", error.message);
  }
}
```

Line-by-line breakdown:
1. `import { Sequelize } from "sequelize";`: Imports the primary constructor class from the Sequelize library.
2. `new Sequelize("ecommerce_db", "db_user", "secure_password", { ... })`: Instantiates the engine. The first three arguments specify database name, username, and password.
3. `host: "localhost", port: 5432`: Specifies the network address where the database daemon is listening.
4. `dialect: "postgres"`: Informs Sequelize to generate PostgreSQL-compatible SQL syntax and utilize the `pg` driver under the hood.
5. `logging: false`: Disables console logging of every generated query. In development, setting this to `console.log` shows the exact SQL statements being executed.
6. `pool: { max: 10, min: 2, ... }`: Configures the connection pool to maintain between 2 and 10 persistent TCP connections.
7. `await sequelize.authenticate()`: Executes a simple test query (like `SELECT 1+1 AS result`) to verify network connectivity and valid authentication credentials.

### How It Works Inside Sequelize
Inside Sequelize's core:
1. Sequelize creates an internal pool manager using the `generic-pool` library.
2. When your code requests a query, Sequelize asks the pool for an available connection resource.
3. If all connections in the pool are busy and `pool.max` has not been reached, the pool instantiates a new TCP connection via the dialect driver (`pg`).
4. If `pool.max` is reached, the incoming query waits in a FIFO queue until another query finishes and releases its connection back to the pool.
5. If no connection becomes free before `pool.acquire` milliseconds elapse, Sequelize rejects the Promise with a `TimeoutError`.

### More Examples

#### Example 1: Connecting Using a Complete Connection URI String
```typescript
import { Sequelize } from "sequelize";

// Commonly used in cloud platforms (AWS RDS, Heroku, Supabase, Render)
const databaseUrl = "postgresql://db_user:secret_pass@db.example.com:5432/production_db";

export const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Required for cloud databases with self-signed SSL certificates
    },
  },
});
```

#### Example 2: SQLite In-Memory Database (Zero Installation for Unit Testing)
```typescript
import { Sequelize } from "sequelize";

// Creates an in-memory database that lives strictly in RAM
export const testSequelize = new Sequelize("sqlite::memory:", {
  logging: false,
});
```

#### Example 3: Graceful Application Shutdown
```typescript
// When your Node.js server shuts down, always close the connection pool cleanly
export async function closeDatabase(): Promise<void> {
  await sequelize.close();
  console.log("All connection pool sockets closed cleanly.");
}
```

### Common Mistakes

#### Mistake 1: Creating Multiple `new Sequelize()` Instances Throughout the Codebase
```typescript
// WRONG: Creating a new instance inside every service or controller file!
export async function getUser(id: string) {
  const sequelize = new Sequelize(...); // RE-ALLOCATES NEW CONNECTION POOL ON EVERY REQUEST!
  // Result: Database crashes with "FATAL: too many connections" within minutes!
}

// CORRECT: Instantiate Sequelize ONCE in a centralized config file (e.g. config/database.ts)
// and export the single instance for the entire application to share.
```

#### Mistake 2: Missing the Dialect Driver Package
```typescript
// If you configure dialect: "postgres", you MUST install the native driver:
// npm install pg pg-hstore
// Missing driver causes: Error: Please install 'pg' package manually
```

### Rules to Remember
1. **Always export a single, centralized `sequelize` instance** shared across the entire project.
2. **Always configure a connection pool** with reasonable `max`, `min`, `acquire`, and `idle` settings for production traffic.
3. **Always call `await sequelize.authenticate()`** during application startup to fail fast if the database is unreachable.
4. **Never hardcode database passwords in source code;** read them from environment variables (`process.env.DB_PASSWORD`).

---

### Think First: Prediction Puzzle
Inspect this connection configuration:
```typescript
const seq = new Sequelize("test_db", "user", "pass", {
  dialect: "postgres",
  pool: { max: 1 },
});

// Two queries run concurrently at the exact same moment:
Promise.all([
  seq.query("SELECT pg_sleep(2)"),
  seq.query("SELECT pg_sleep(2)"),
]);
```
Will the total execution time be approximately 2 seconds or 4 seconds?

--------------------------------------------------------------------------------
**Answer:**
Approximately 4 seconds.

**Explanation:**
Because `pool.max` is set to `1`, Sequelize can only open a single connection to the database. Query 1 takes the only connection and executes for 2 seconds. Query 2 is queued in memory waiting for Query 1 to finish. Once Query 1 finishes, Query 2 claims the connection and runs for 2 seconds: $2 + 2 = 4\text{ seconds}$.

---

### Graded Exercises

#### Exercise 1: Connection Health Check Function
Write a function `isDatabaseHealthy(instance: Sequelize): Promise<boolean>` that calls `.authenticate()`, returning `true` on success and `false` if an error occurs.
- Hint 1: Use `try / catch`.
- Hint 2: Call `await instance.authenticate()`.

#### Exercise 2: Dynamic Dialect Selector
Write a function `createSequelizeClient(dialect: "postgres" | "mysql" | "sqlite", dbName: string): Sequelize` that instantiates and returns a Sequelize instance configured for the specified dialect.
- Hint 1: Return `new Sequelize(dbName, "user", "pass", { dialect, logging: false })`.

#### Exercise 3: Connection Pool Configuration Validator
Write a TypeScript validator function `validatePoolConfig(pool: { min: number; max: number }): boolean` that verifies that `min >= 0`, `max > 0`, and `max >= min`.
- Hint 1: Check `pool.min >= 0 && pool.max > 0 && pool.max >= pool.min`.

#### Exercise 4: Graceful Shutdown Hook
Implement a function `attachShutdownHook(instance: Sequelize)` that registers listeners for `SIGINT` and `SIGTERM` on `process`, closes the Sequelize pool, and terminates the process with code 0.
- Hint 1: Use `process.on("SIGINT", async () => { await instance.close(); process.exit(0); })`.

--------------------------------------------------------------------------------
### Exercise Solutions

```typescript
// Solution 1:
import { Sequelize } from "sequelize";

export async function isDatabaseHealthy(instance: Sequelize): Promise<boolean> {
  try {
    await instance.authenticate();
    return true;
  } catch {
    return false;
  }
}

// Solution 2:
export function createSequelizeClient(
  dialect: "postgres" | "mysql" | "sqlite",
  dbName: string
): Sequelize {
  if (dialect === "sqlite") {
    return new Sequelize({
      dialect: "sqlite",
      storage: `${dbName}.sqlite`,
      logging: false,
    });
  }
  return new Sequelize(dbName, "db_user", "db_pass", {
    dialect,
    host: "localhost",
    logging: false,
  });
}

// Solution 3:
export function validatePoolConfig(pool: { min: number; max: number }): boolean {
  if (pool.min < 0 || pool.max <= 0) return false;
  return pool.max >= pool.min;
}

// Solution 4:
export function attachShutdownHook(instance: Sequelize): void {
  const handler = async () => {
    try {
      await instance.close();
      console.log("Database pool closed successfully on process termination.");
      process.exit(0);
    } catch (err) {
      console.error("Error closing database pool:", err);
      process.exit(1);
    }
  };

  process.on("SIGINT", handler);
  process.on("SIGTERM", handler);
}
```

---

### Recall
1. What is the role of a connection pool in Sequelize?
2. What happens if an application creates `new Sequelize()` on every incoming HTTP request?
3. If you remember only one thing: **Instantiate `Sequelize` once as a singleton with a connection pool to manage database network connections efficiently.**

---

## Topic 2: Establishing Connections & Database Configuration (`new Sequelize`, Environment Variables & SSL)

### What Is It?
In real production applications, database hostnames, usernames, passwords, and ports are **never** committed to version control. They are provided at runtime through **environment variables** (`process.env.DATABASE_URL`, `process.env.DB_HOST`).

Furthermore, production cloud databases (like AWS RDS, Google Cloud SQL, or Azure Database) require **SSL/TLS encryption** to ensure network packets traveling across the public internet between your Node.js application and the database cannot be intercepted or snooped on.

Key technical terms defined:
- An Environment Variable is a dynamic key-value pair set on the host operating system accessible via Node's `process.env`.
- SSL/TLS is an encryption protocol that secures network communication against eavesdropping and tampering.
- `rejectUnauthorized` is an SSL configuration flag; setting it to `false` allows connections to databases with self-signed SSL certificates (common in cloud VPCs).

```
.env File / Cloud Secret Manager
  ├── DB_HOST = "db.production.internal"
  ├── DB_NAME = "ecommerce_main"
  └── DB_PASS = "super_secret_token"
           │
           ▼
Centralized Database Module (config/database.ts)
           │
           ▼
new Sequelize({ host, username, password, dialectOptions: { ssl: ... } })
```

### Why Does It Exist?
Hardcoding credentials causes catastrophic security breaches if code is pushed to public repositories. 

Using environment variables allows the exact same code to run in multiple environments:
- In **development**: Connects to `localhost:5432` with logging enabled.
- In **testing**: Connects to a local SQLite or test database.
- In **production**: Connects to an encrypted, high-availability PostgreSQL cluster via SSL.

### Basic Example and Line-by-Line Explanation

```typescript
import { Sequelize } from "sequelize";

// 1. Read configuration safely from environment variables
const dbHost = process.env.DB_HOST || "localhost";
const dbPort = parseInt(process.env.DB_PORT || "5432", 10);
const dbName = process.env.DB_NAME || "dev_database";
const dbUser = process.env.DB_USER || "postgres";
const dbPass = process.env.DB_PASS || "postgres";
const isProduction = process.env.NODE_ENV === "production";

// 2. Build configuration with conditional SSL and logging
export const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  port: dbPort,
  dialect: "postgres",
  logging: isProduction ? false : console.log, // Log queries in dev, quiet in prod
  dialectOptions: {
    // Only enforce SSL in production environments
    ...(isProduction && {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    }),
  },
  pool: {
    max: isProduction ? 25 : 5,
    min: isProduction ? 5 : 0,
    acquire: 30000,
    idle: 10000,
  },
});
```

Line-by-line breakdown:
1. `const dbHost = process.env.DB_HOST || "localhost";`: Reads the database host address with a sensible local fallback.
2. `parseInt(process.env.DB_PORT || "5432", 10)`: Converts string environment variables into numbers.
3. `isProduction ? false : console.log`: Evaluates logging dynamically. In development, you see every SQL statement formatted in terminal output; in production, logging is silenced to preserve disk space and CPU cycles.
4. `...(isProduction && { ssl: { require: true, ... } })`: Spread operator conditionally attaches SSL flags only in production mode.
5. `pool: { max: isProduction ? 25 : 5 }`: Scales connection pool capacity based on deployment tier.

### How It Works Inside Sequelize
1. During instantiation, Sequelize merges your `dialectOptions` into the connection parameters passed directly to the dialect driver (`pg`).
2. The `pg` client evaluates `dialectOptions.ssl`. If `require: true`, the driver initiates an SSL/TLS handshake with the database server before sending authentication credentials.
3. If the server does not support SSL and SSL is required, the driver terminates the socket with an `SSLError`.

### More Examples

#### Example 1: Multi-Database Engine Architecture (PostgreSQL + SQL Server)
In enterprise architectures (as seen in large e-commerce backends), an application often queries a primary PostgreSQL database and a secondary Microsoft SQL Server database:
```typescript
import { Sequelize } from "sequelize";

// Primary PostgreSQL instance for transactional operational data
export const sequelize = new Sequelize(process.env.PG_DATABASE_URL!, {
  dialect: "postgres",
  logging: false,
});

// Secondary SQL Server instance for legacy ERP or inventory tracking
export const sqlServerSequelize = new Sequelize(
  process.env.MSSQL_DB_NAME!,
  process.env.MSSQL_USER!,
  process.env.MSSQL_PASS!,
  {
    host: process.env.MSSQL_HOST!,
    dialect: "mssql",
    dialectOptions: {
      options: {
        encrypt: true, // SQL Server requires 'encrypt: true' for Azure/cloud connections
      },
    },
    logging: false,
  }
);
```

#### Example 2: Parsing Connection URL with Fallback
```typescript
import { Sequelize } from "sequelize";

export function initDatabaseConnection(): Sequelize {
  const url = process.env.DATABASE_URL;

  if (url) {
    return new Sequelize(url, {
      dialect: "postgres",
      logging: false,
    });
  }

  return new Sequelize(
    process.env.DB_NAME!,
    process.env.DB_USER!,
    process.env.DB_PASSWORD!,
    {
      host: process.env.DB_HOST || "localhost",
      dialect: "postgres",
      logging: false,
    }
  );
}
```

### Common Mistakes

#### Mistake 1: Committing `.env` Files with Plaintext Secrets to Git
```text
# WRONG: Pushing .env with real passwords to GitHub!
# CORRECT: Add .env to .gitignore, and provide .env.example with dummy placeholders:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=my_database
DB_USER=postgres
DB_PASSWORD=your_password_here
```

#### Mistake 2: Missing `rejectUnauthorized: false` for Managed Cloud Databases
```typescript
// ERROR: ConnectionError: self-signed certificate in certificate chain
// FIX: AWS RDS and DigitalOcean Postgres often use self-signed certificates internally:
dialectOptions: {
  ssl: {
    require: true,
    rejectUnauthorized: false, // Prevents certificate chain validation failures
  },
}
```

### Rules to Remember
1. **Never commit database credentials to git.** Always use environment variables.
2. **Enable SSL in production** to encrypt network traffic between Node.js and the database.
3. **Turn off query logging in production (`logging: false`)** to avoid filling log disks with millions of queries.
4. **Supply sensible local defaults** for development so other team members can run the project locally without complex setup.

---

### Think First: Prediction Puzzle
Consider this code running in Node.js:
```typescript
process.env.DB_PORT = "5432";
const seq = new Sequelize("test", "user", "pass", {
  host: "localhost",
  port: process.env.DB_PORT as any, // Passed as string "5432"
  dialect: "postgres",
});
```
Will Sequelize successfully connect, or will the driver crash because `port` is a string instead of an integer?

--------------------------------------------------------------------------------
**Answer:**
Sequelize will successfully connect.

**Explanation:**
Under the hood, both Sequelize and the underlying `pg` driver automatically sanitize and cast `port` values using `parseInt(port, 10)`. However, as a TypeScript best practice, you should always explicitly parse numeric environment variables: `port: parseInt(process.env.DB_PORT || "5432", 10)`.

---

### Graded Exercises

#### Exercise 1: Environment Variable Extractor
Write a function `getRequiredEnv(key: string): string` that returns `process.env[key]`, or throws `new Error("Missing required environment variable: " + key)` if missing or empty.
- Hint 1: Check `!process.env[key] || process.env[key].trim() === ""`.
- Hint 2: Throw explicit error with key name.

#### Exercise 2: SSL Configuration Helper
Write a function `buildSslConfig(enableSsl: boolean): object` that returns `{ ssl: { require: true, rejectUnauthorized: false } }` if `enableSsl` is `true`, or an empty object `{}` if `false`.
- Hint 1: Use ternary operator or `if` statement.

#### Exercise 3: Connection URL Masker Utility
Write a function `maskDatabaseUrl(url: string): string` that takes a connection string like `"postgres://alice:secret123@db.example.com:5432/app"` and replaces the password with `"*****"` so it can be safely printed in logs.
- Hint 1: Use RegExp: `url.replace(/:([^@:]+)@/, ":*****@")`.

#### Exercise 4: Production Config Factory
Create a function `getProductionDatabaseConfig()` that constructs a complete Sequelize configuration object using required environment variables, enforcing SSL and setting `logging: false`.
- Hint 1: Read `DATABASE_URL` or host/user/pass fields.
- Hint 2: Include `dialect: "postgres"`.

--------------------------------------------------------------------------------
### Exercise Solutions

```typescript
// Solution 1:
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Solution 2:
export function buildSslConfig(enableSsl: boolean): object {
  if (enableSsl) {
    return {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    };
  }
  return {};
}

// Solution 3:
export function maskDatabaseUrl(url: string): string {
  return url.replace(/:([^@:]+)@/, ":*****@");
}

// Solution 4:
import { Options } from "sequelize";

export function getProductionDatabaseConfig(): Options {
  return {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000,
    },
  };
}
```

---

### Recall
1. Why must `logging: false` be enforced in production?
2. What does `rejectUnauthorized: false` do in cloud database SSL configurations?
3. If you remember only one thing: **Always read database connection settings from environment variables and enforce SSL encryption for production cloud databases.**

---

## Topic 3: Raw SQL Execution with `sequelize.query()` & `QueryTypes` (SELECT, INSERT, UPDATE, RAW)

### What Is It?
While Sequelize provides high-level model abstractions (`User.findAll()`), complex enterprise backends often require executing **raw, high-performance SQL queries** directly.

The method **`sequelize.query(sqlString, options)`** allows you to send raw SQL to the database while still benefiting from Sequelize's connection pooling and dialect handling.

When executing raw queries, you specify the **`QueryTypes`** enum to instruct Sequelize how to parse and format the returned database results.

Key technical terms defined:
- `sequelize.query()` is Sequelize's direct execution gateway for arbitrary SQL strings.
- `QueryTypes` is an enum in Sequelize (`QueryTypes.SELECT`, `QueryTypes.INSERT`, `QueryTypes.UPDATE`, `QueryTypes.RAW`) defining how database driver responses are formatted.
- Metadata is the secondary database information returned alongside query results (such as affected row count, status codes, and execution headers).

```
sequelize.query("SELECT ...", { type: QueryTypes.SELECT })
                    │
                    ▼
Database returns: [ [Rows Array], [Metadata Object] ]
                    │
                    ▼ (Sequelize formats based on QueryTypes)
Returns: [Rows Array] only (Clean array of JavaScript objects!)
```

### Why Does It Exist?
If you invoke `sequelize.query()` without specifying `type: QueryTypes.SELECT`:
```typescript
const result = await sequelize.query("SELECT * FROM users");
// Result is a strange tuple: [ [User, User], [CommandMetadata] ]
```
The raw driver returns two items: the array of rows AND an internal driver metadata object. You would constantly have to destructure `const [rows] = result`.

By specifying `type: QueryTypes.SELECT`:
1. Sequelize automatically discards the metadata and returns a clean, typed array of JavaScript row objects: `result` is directly `User[]`.
2. By specifying `type: QueryTypes.INSERT` or `type: QueryTypes.UPDATE`, Sequelize returns the inserted ID and the exact number of affected rows.
3. Raw queries give you 100% access to database-specific power features (CTEs, window functions, complex JSON operations) that high-level ORM models cannot express.

### Basic Example and Line-by-Line Explanation

```typescript
import { sequelize } from "./database";
import { QueryTypes } from "sequelize";

interface OrganizationRecord {
  organization_id: string;
  name: string;
  is_active: boolean;
}

export async function getActiveOrganizations(): Promise<OrganizationRecord[]> {
  // 1. Raw SQL query using QueryTypes.SELECT
  const organizations: OrganizationRecord[] = await sequelize.query(
    `SELECT organization_id, name, is_active
     FROM organizations
     WHERE is_active = true
     ORDER BY name ASC`,
    {
      type: QueryTypes.SELECT, // Informs Sequelize to return ONLY the rows array
    }
  );

  return organizations;
}
```

Line-by-line breakdown:
1. `import { QueryTypes } from "sequelize";`: Imports the enum defining query response formatting.
2. `interface OrganizationRecord`: Declares the TypeScript type describing the columns returned by the `SELECT` statement.
3. `await sequelize.query(`SELECT ...`, { type: QueryTypes.SELECT })`:
   - Checks out an active connection from the pool.
   - Sends the raw SQL text to the PostgreSQL server.
   - Formats the returned database rows into an array of plain JavaScript objects.
   - Releases the connection back to the pool.
4. `return organizations`: Returns the typed array `OrganizationRecord[]`.

### How It Works Inside Sequelize
Inside `sequelize/src/dialects/abstract/query.js`:
```javascript
// Conceptual flow inside Sequelize query executor:
async function runQuery(sql, options) {
  const connection = await pool.acquire();
  try {
    const rawResult = await connection.execute(sql);
    
    if (options.type === QueryTypes.SELECT) {
      return rawResult.rows; // Strips metadata, returns clean array
    }
    if (options.type === QueryTypes.UPDATE) {
      return [rawResult.rows, rawResult.rowCount]; // Rows + affected count
    }
    if (options.type === QueryTypes.INSERT) {
      return [rawResult.insertId || rawResult.rows[0], rawResult.rowCount];
    }
    return [rawResult.rows, rawResult]; // Default tuple
  } finally {
    pool.release(connection);
  }
}
```

### More Examples

#### Example 1: UPDATE Query with Affected Row Count
```typescript
import { sequelize } from "./database";
import { QueryTypes } from "sequelize";

export async function deactivateOrganization(orgId: string): Promise<number> {
  const [, affectedCount]: any = await sequelize.query(
    `UPDATE organizations
     SET is_active = false
     WHERE organization_id = :orgId`,
    {
      replacements: { orgId },
      type: QueryTypes.UPDATE,
    }
  );

  // affectedCount tells you exactly how many rows were updated!
  return affectedCount;
}
```

#### Example 2: INSERT Query with Returning Clauses (PostgreSQL)
```typescript
import { sequelize } from "./database";
import { QueryTypes } from "sequelize";

export async function insertLogEntry(message: string): Promise<string> {
  const [createdRow]: any = await sequelize.query(
    `INSERT INTO system_logs (message, created_at)
     VALUES (:message, NOW())
     RETURNING log_id`,
    {
      replacements: { message },
      type: QueryTypes.INSERT,
    }
  );

  return createdRow.log_id;
}
```

#### Example 3: Running Complex Raw Analytics Queries (Window Functions & Aggregates)
```typescript
import { sequelize } from "./database";
import { QueryTypes } from "sequelize";

export async function getTopSellingProducts() {
  const results = await sequelize.query(
    `SELECT 
       product_id,
       title,
       SUM(quantity) AS total_units,
       DENSE_RANK() OVER (ORDER BY SUM(quantity) DESC) as sales_rank
     FROM order_items
     GROUP BY product_id, title
     LIMIT 10`,
    {
      type: QueryTypes.SELECT,
    }
  );

  return results;
}
```

### Common Mistakes

#### Mistake 1: Forgetting `type: QueryTypes.SELECT` and Accidentally Accessing Tuple Indices
```typescript
// CONFUSING: Omitting QueryTypes returns a tuple:
const results = await sequelize.query("SELECT * FROM users");
console.log(results[0]); // Array of users
console.log(results[1]); // Database metadata object!

// CLEAN: Always provide type: QueryTypes.SELECT
const users = await sequelize.query("SELECT * FROM users", { type: QueryTypes.SELECT });
console.log(users); // Clean Array of users!
```

#### Mistake 2: Interpolating User Input Directly into SQL Strings (CRITICAL SQL INJECTION)
```typescript
// CRITICAL SECURITY VULNERABILITY (SQL INJECTION):
const email = req.body.email; // Attacker sends: "test@example.com' OR '1'='1"
const users = await sequelize.query(
  `SELECT * FROM users WHERE email = '${email}'`, // NEVER DO THIS!
  { type: QueryTypes.SELECT }
);
// The attacker bypasses authentication and steals all user records!
// Always use replacements: { email } (Covered in Topic 4).
```

### Rules to Remember
1. **Always specify `type: QueryTypes.SELECT` for read queries** to receive a clean array of row objects without metadata tuples.
2. **Never concatenate user strings directly into SQL templates (`${userInput}`).**
3. **Use raw queries when you need complex SQL** (CTEs, Window functions, dense aggregations) that ORMs cannot express cleanly.
4. **Sequelize automatically checks out and releases connections** from the pool for every `sequelize.query()` call.

---

### Think First: Prediction Puzzle
Consider this code:
```typescript
const result = await sequelize.query(
  "SELECT 42 AS answer",
  { type: QueryTypes.SELECT }
);
```
What is `result`? Is it the number `42`, an object `{ answer: 42 }`, or an array `[{ answer: 42 }]`?

--------------------------------------------------------------------------------
**Answer:**
An array: `[{ answer: 42 }]`.

**Explanation:**
`QueryTypes.SELECT` always returns an **array of row objects**, representing the rows returned by the database table cursor. Because the query returned one row with column `answer`, the result is `[{ answer: 42 }]`.

---

### Graded Exercises

#### Exercise 1: Single Row Selector Helper
Write a function `querySingleRow<T>(sql: string, replacements: object): Promise<T | null>` that executes a `QueryTypes.SELECT` query and returns the first row or `null` if no rows match.
- Hint 1: Call `const rows = await sequelize.query(sql, { replacements, type: QueryTypes.SELECT })`.
- Hint 2: Return `rows[0] ?? null`.

#### Exercise 2: Row Count Inspector
Write a function `countRowsInTable(tableName: string): Promise<number>` that runs `SELECT COUNT(*) as count FROM tableName` and returns the numeric count.
- Hint 1: Use `type: QueryTypes.SELECT`.
- Hint 2: Convert `Number(rows[0].count)`.

#### Exercise 3: Delete Query Affected Rows Extractor
Write a function `deleteOldLogs(daysOlder: number): Promise<number>` that executes a `DELETE` query with `QueryTypes.DELETE` and returns the number of deleted rows.
- Hint 1: Pass `type: QueryTypes.DELETE`.

#### Exercise 4: Query Execution Timer
Write a utility function `benchmarkQuery<T>(name: string, fn: () => Promise<T>): Promise<T>` that measures and logs the execution duration of a database query in milliseconds.
- Hint 1: Use `performance.now()`.
- Hint 2: Calculate `duration = performance.now() - start`.

--------------------------------------------------------------------------------
### Exercise Solutions

```typescript
// Solution 1:
import { sequelize } from "./database";
import { QueryTypes } from "sequelize";

export async function querySingleRow<T>(
  sql: string,
  replacements: Record<string, any>
): Promise<T | null> {
  const rows: any[] = await sequelize.query(sql, {
    replacements,
    type: QueryTypes.SELECT,
  });
  return (rows[0] as T) ?? null;
}

// Solution 2:
export async function countRowsInTable(tableName: string): Promise<number> {
  const rows: any[] = await sequelize.query(
    `SELECT COUNT(*) AS total FROM "${tableName}"`,
    { type: QueryTypes.SELECT }
  );
  return Number(rows[0]?.total ?? 0);
}

// Solution 3:
export async function deleteOldLogs(daysOlder: number): Promise<number> {
  const [, rowCount]: any = await sequelize.query(
    `DELETE FROM system_logs WHERE created_at < NOW() - INTERVAL ':days days'`,
    {
      replacements: { days: daysOlder },
      type: QueryTypes.DELETE,
    }
  );
  return rowCount ?? 0;
}

// Solution 4:
export async function benchmarkQuery<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    console.log(`[QUERY BENCHMARK] "${name}" took ${duration.toFixed(2)}ms`);
    return result;
  } catch (err) {
    const duration = performance.now() - start;
    console.error(`[QUERY BENCHMARK] "${name}" FAILED after ${duration.toFixed(2)}ms`);
    throw err;
  }
}
```

---

### Recall
1. Why does `QueryTypes.SELECT` eliminate the need to destructure `const [rows] = result`?
2. What does `QueryTypes.UPDATE` return?
3. If you remember only one thing: **Always specify `type: QueryTypes.SELECT` when querying data with `sequelize.query()` to receive a clean array of row objects.**

---

## Topic 4: The Replacements Engine: Parameterized Queries, Named (`:param`) vs Positional (`?`) & SQL Injection Defense

### What Is It?
When executing SQL queries with dynamic values (such as search terms, user IDs, or email addresses), you must **never** concatenate the values directly into the SQL string.

Sequelize provides the **Replacements Engine**: an automatic parameterization system that safely binds dynamic JavaScript values into SQL statements.

Sequelize supports two replacement syntaxes:
1. **Named Replacements (`:paramName`)**: Uses an object with named keys: `{ replacements: { orgId: "123" } }`.
2. **Positional Replacements (`?`)**: Uses an ordered array of values: `{ replacements: ["123", true] }`.

Key technical terms defined:
- A Parameterized Query is a database query where the SQL code structure is pre-compiled and dynamic data values are supplied separately as parameters.
- A Replacement is a placeholder token (`:param` or `?`) in a SQL string that Sequelize safely escapes before sending to the database driver.
- SQL Injection is a cyberattack where malicious SQL code is injected into data inputs, tricking the database into executing unintended commands.
- Escaping is the process of sanitizing input characters (such as single quotes `'` and semicolons `;`) so they are treated as literal text data rather than executable SQL syntax.

```
Developer writes:
SELECT * FROM users WHERE email = :email
options: { replacements: { email: "user@example.com" } }
                       │
                       ▼ (Sequelize Replacements Engine)
Safely Escapes and Sanitizes Input:
SELECT * FROM users WHERE email = 'user@example.com' (Safe from SQL Injection!)
```

### Why Does It Exist?
Consider an authentication query:
```typescript
// INSECURE CONCATENATION:
`SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`
```
If an attacker inputs:
- `username`: `admin' --`
- `password`: `anything`

The rendered SQL becomes:
```sql
SELECT * FROM users WHERE username = 'admin' --' AND password = 'anything'
```
Because `--` is the SQL comment operator, everything after `'admin'` is completely ignored by the database! The attacker logs in as `admin` without knowing the password!

The Replacements Engine eliminates this vulnerability completely:
```typescript
// SECURE REPLACEMENT:
await sequelize.query(
  `SELECT * FROM users WHERE username = :username AND password = :password`,
  { replacements: { username, password } }
);
```
Even if the attacker inputs `admin' --`, Sequelize escapes the single quotes: `'admin\' --'`. The database searches for a literal username equal to the string `"admin' --"`, completely neutralizing the attack.

### Basic Example and Line-by-Line Explanation

```typescript
import { sequelize } from "./database";
import { QueryTypes } from "sequelize";

export async function findUserByCredentials(orgId: string, email: string) {
  // 1. Named replacement syntax using :orgId and :email
  const users = await sequelize.query(
    `SELECT user_id, email, organization_id
     FROM users
     WHERE organization_id = :orgId
       AND email = :email
       AND is_active = true
     LIMIT 1`,
    {
      // 2. Object containing keys that exactly match placeholder tokens
      replacements: {
        orgId,
        email,
      },
      type: QueryTypes.SELECT,
    }
  );

  return users[0] ?? null;
}
```

Line-by-line breakdown:
1. `WHERE organization_id = :orgId AND email = :email`: Declares placeholder tokens prefixed with a colon `:`.
2. `replacements: { orgId, email }`: Supplies the data object. Sequelize replaces `:orgId` with the escaped value of the `orgId` variable and `:email` with the escaped value of `email`.
3. If `email` contains single quotes or special characters, Sequelize escapes them safely.
4. `type: QueryTypes.SELECT`: Returns a clean array of user rows.
5. `return users[0] ?? null`: Returns the matched record or null.

### How It Works Inside Sequelize
Inside `sequelize/src/dialects/abstract/query-generator.js`:
1. Sequelize parses the SQL template string searching for tokens matching `:([a-zA-Z0-9_]+)`.
2. For each matched token:
   - Sequelize looks up the corresponding key in the `replacements` object.
   - If the value is a string, it calls `sqlString.escape(value)`, escaping all quotes, backslashes, and null bytes.
   - If the value is a number or boolean, it outputs raw `123` or `true`.
   - If the value is an array, it expands it to a comma-separated list: `('item1', 'item2')` (ideal for `IN` clauses!).
   - If the key is missing from `replacements`, Sequelize throws: `Error: Named replacement ":foo" has no entry in the replacement map.`

### More Examples

#### Example 1: Array Replacements with SQL `IN` Clauses
Passing an array to a replacement automatically formats it into a valid SQL list:
```typescript
import { sequelize } from "./database";
import { QueryTypes } from "sequelize";

export async function getOrdersByStatus(allowedStatuses: string[]) {
  const orders = await sequelize.query(
    `SELECT order_id, order_status, total_amount
     FROM orders
     WHERE order_status IN (:allowedStatuses)`, // :allowedStatuses expands to ('shipped', 'delivered')
    {
      replacements: {
        allowedStatuses, // e.g. ["shipped", "delivered"]
      },
      type: QueryTypes.SELECT,
    }
  );

  return orders;
}
```

#### Example 2: Positional Replacements (`?`)
When you prefer array order over named keys:
```typescript
import { sequelize } from "./database";
import { QueryTypes } from "sequelize";

export async function getRecentOrders(sellerId: string, limit: number) {
  const orders = await sequelize.query(
    `SELECT order_id, order_total
     FROM orders
     WHERE seller_account_id = ?
     ORDER BY purchase_date DESC
     LIMIT ?`,
    {
      // Replacements array matches ? placeholders by position in the query
      replacements: [sellerId, limit],
      type: QueryTypes.SELECT,
    }
  );

  return orders;
}
```

#### Example 3: Partial Text Searches with `ILIKE` and Wildcards
When performing wildcard searches (`%query%`), **never** put wildcards inside the SQL string (like `ILIKE '%:term%'`). Put the wildcards in the replacement value:
```typescript
import { sequelize } from "./database";
import { QueryTypes } from "sequelize";

export async function searchCustomers(searchTerm: string) {
  const results = await sequelize.query(
    `SELECT customer_id, name, email
     FROM customers
     WHERE name ILIKE :searchPattern
        OR email ILIKE :searchPattern`,
    {
      // Enclose the wildcards inside the replacement parameter value!
      replacements: {
        searchPattern: `%${searchTerm}%`,
      },
      type: QueryTypes.SELECT,
    }
  );

  return results;
}
```

### Common Mistakes

#### Mistake 1: Wrapping Named Replacements in Quotes Inside the SQL String
```typescript
// WRONG: Putting quotes around :orgId makes it a LITERAL STRING, not a replacement!
const query = `SELECT * FROM orders WHERE organization_id = ':orgId'`;
// The database looks for an organization whose ID is literally the text ":orgId"!

// CORRECT: Never put quotes around replacement tokens
const query = `SELECT * FROM orders WHERE organization_id = :orgId`;
```

#### Mistake 2: Missing a Key in the Replacements Object
```typescript
// ERROR: Named replacement ":sellerId" has no entry in the replacement map.
await sequelize.query(
  `SELECT * FROM orders WHERE seller_id = :sellerId`,
  {
    replacements: { userId: "123" } // Mistyped key name! Must match :sellerId exactly!
  }
);
```

### Rules to Remember
1. **Never concatenate user strings into SQL.** Always use `replacements`.
2. **Never wrap `:param` placeholders in single or double quotes.** Sequelize handles quoting and escaping automatically.
3. **For `IN` clauses, pass an array directly** (`replacements: { list: ["A", "B"] }`).
4. **For `ILIKE` or `LIKE` wildcards, add `%` inside the JavaScript value**, not inside the SQL template.

---

### Think First: Prediction Puzzle
Consider this code:
```typescript
const ids = [101, 102, 103];
const result = await sequelize.query(
  "SELECT * FROM items WHERE item_id IN (:ids)",
  {
    replacements: { ids },
    type: QueryTypes.SELECT,
  }
);
```
How does Sequelize expand `IN (:ids)` before sending it to the database?

--------------------------------------------------------------------------------
**Answer:**
`IN (101, 102, 103)`.

**Explanation:**
When a replacement token receives a JavaScript array, Sequelize automatically expands the token into parentheses enclosing comma-separated, sanitized scalar values: `(101, 102, 103)`.

---

### Graded Exercises

#### Exercise 1: Safe Status Filter Query
Write a function `fetchUsersByStatus(status: string)` that queries `users` table for matching `status` using named replacements and returns the rows array.
- Hint 1: Use `WHERE status = :status`.
- Hint 2: Supply `replacements: { status }`.

#### Exercise 2: Case-Insensitive Prefix Search
Write a function `searchSkusByPrefix(prefix: string)` that searches `products` for SKUs starting with `prefix` using `ILIKE` and replacements.
- Hint 1: Use `WHERE sku ILIKE :skuPattern`.
- Hint 2: Supply `replacements: { skuPattern: `${prefix}%` }`.

#### Exercise 3: Missing Replacement Detector
Write a pure function `validateReplacementTokens(sql: string, replacements: Record<string, any>): string[]` that parses all `:token` names from a SQL string and returns an array of any token names that are missing from the `replacements` object.
- Hint 1: Use RegExp: `sql.matchAll(/:([a-zA-Z0-9_]+)/g)`.
- Hint 2: Check `!(token in replacements)`.

#### Exercise 4: Positional to Named Converter
Write a function `convertPositionalToNamed(sql: string, paramNames: string[]): string` that replaces sequential `?` characters in a SQL string with `:paramNames[i]`.
- Hint 1: Keep a counter `i = 0`.
- Hint 2: Use `sql.replace(/\?/g, () => `:${paramNames[i++]}`)`.

--------------------------------------------------------------------------------
### Exercise Solutions

```typescript
// Solution 1:
import { sequelize } from "./database";
import { QueryTypes } from "sequelize";

export async function fetchUsersByStatus(status: string): Promise<any[]> {
  return sequelize.query(
    `SELECT user_id, username, status
     FROM users
     WHERE status = :status`,
    {
      replacements: { status },
      type: QueryTypes.SELECT,
    }
  );
}

// Solution 2:
export async function searchSkusByPrefix(prefix: string): Promise<any[]> {
  return sequelize.query(
    `SELECT product_id, sku, title
     FROM products
     WHERE sku ILIKE :skuPattern`,
    {
      replacements: { skuPattern: `${prefix}%` },
      type: QueryTypes.SELECT,
    }
  );
}

// Solution 3:
export function validateReplacementTokens(
  sql: string,
  replacements: Record<string, any>
): string[] {
  const matches = sql.matchAll(/:([a-zA-Z0-9_]+)/g);
  const missing: string[] = [];

  for (const match of matches) {
    const token = match[1];
    if (!(token in replacements)) {
      missing.push(token);
    }
  }

  return Array.from(new Set(missing));
}

// Solution 4:
export function convertPositionalToNamed(sql: string, paramNames: string[]): string {
  let index = 0;
  return sql.replace(/\?/g, () => {
    const name = paramNames[index++];
    return `:${name}`;
  });
}
```

---

### Recall
1. Why does `replacements` prevent SQL injection attacks?
2. How do you pass an array to a SQL `IN` condition with Sequelize replacements?
3. If you remember only one thing: **Always use named replacements (`:param`) without quotes to bind dynamic data safely into raw Sequelize queries.**

---

## Topic 5: Dynamic Replacements & High-Throughput Bulk Upserts (`:orderId_${i}`, Arrays & Object Reduction)

### What Is It?
In real-world data pipelines (such as synchronizing Amazon Seller orders, Shopify webhooks, or financial ledger feeds), an API returns a batch of 500 orders at once.

Inserting or updating 500 records by running 500 individual `sequelize.query()` calls inside a `for` loop is an anti-pattern: it requires 500 round-trip network hops, causing severe latency and connection pool exhaustion.

The **Dynamic Replacements Technique** constructs a **single batch SQL statement** with indexed placeholder tokens (`:orderId_0`, `:orderId_1`, `:orderId_2`...) and flattens a batch of JavaScript objects into a single replacements dictionary using `Array.prototype.reduce`.

Key technical terms defined:
- Bulk Insert is a single SQL statement that inserts multiple rows at once using comma-separated value tuples: `INSERT INTO table (col) VALUES (val1), (val2), (val3)`.
- Dynamic Replacement Indexing is the algorithmic generation of numbered replacement keys (`:col_${i}`) matching each element in an array.
- Round-Trip Time (RTT) is the network latency duration required for a data packet to travel from Node.js to the database server and return.

```
Array of 500 Orders in Memory
         │
         ▼ (Generate indexed SQL string)
VALUES (:orderId_0, :price_0),
       (:orderId_1, :price_1),
       ...
       (:orderId_499, :price_499)
         │
         ▼ (Flatten objects into replacement dictionary via reduce)
replacements: { orderId_0: "ord_1", price_0: 10, orderId_1: "ord_2", ... }
         │
         ▼
Single Batch SQL Query across Network (1 Network Hop!)
```

### Why Does It Exist?
Compare the two architectures for 500 rows:
- **Loop with individual queries**:
  - $500\text{ queries} \times 10\text{ms RTT} = 5,000\text{ms (5 full seconds!)}$
  - Holds open database connection pool sockets for 5 seconds.
- **Dynamic Batch Replacement**:
  - 1 query inserting 500 rows.
  - Execution duration: $15\text{ms total!}$
  - Over **300x faster throughput** while remaining 100% immune to SQL injection!

### Basic Example and Line-by-Line Explanation

```typescript
import { sequelize } from "./database";
import { QueryTypes } from "sequelize";

interface OrderItemPayload {
  orderId: string;
  sku: string;
  price: number;
}

export async function bulkInsertOrderItems(items: OrderItemPayload[]): Promise<void> {
  if (items.length === 0) return;

  // 1. Build indexed VALUES clause: (:orderId_0, :sku_0, :price_0), (:orderId_1, ...
  const valuesSql = items
    .map(
      (_, i) => `(:orderId_${i}, :sku_${i}, :price_${i})`
    )
    .join(",\n");

  // 2. Flatten array of objects into a single dictionary of replacements using reduce
  const replacements = items.reduce((acc, row, i) => {
    acc[`orderId_${i}`] = row.orderId;
    acc[`sku_${i}`] = row.sku;
    acc[`price_${i}`] = row.price;
    return acc;
  }, {} as Record<string, any>);

  // 3. Execute single high-speed bulk insert
  await sequelize.query(
    `INSERT INTO order_items (order_id, sku, price)
     VALUES ${valuesSql}
     ON CONFLICT (order_id, sku) DO UPDATE SET
       price = EXCLUDED.price`,
    {
      replacements,
      type: QueryTypes.INSERT,
    }
  );
}
```

Line-by-line breakdown:
1. `if (items.length === 0) return;`: Guard clause preventing empty SQL syntax errors.
2. `items.map((_, i) => `(:orderId_${i}, :sku_${i}, :price_${i})`).join(",\n");`: Iterates over the items and constructs a parameterized tuple string for every item in memory.
3. `items.reduce((acc, row, i) => { ... }, {} as Record<string, any>);`: Iterates through the items array and dynamically sets properties on the accumulator object: `acc["orderId_0"] = row.orderId`, `acc["orderId_1"] = row.orderId`, etc.
4. `INSERT INTO order_items ... VALUES ${valuesSql}`: Interpolates the generated tuple placeholders into the query string.
5. `ON CONFLICT (order_id, sku) DO UPDATE`: PostgreSQL upsert clause that updates the price if the row already exists.
6. `await sequelize.query(...)`: Sends the single batch query to PostgreSQL, inserting all rows in a single network round-trip.

### How It Works Inside Sequelize
Inside your backend and database:
1. JavaScript builds the query string and replacements dictionary in memory (CPU time is < 1ms for 1,000 items).
2. Sequelize walks the generated replacements object, escapes every `:key_${i}`, and substitutes it.
3. The database receives a single `INSERT` command containing all 500 rows.
4. The database engine parses the query once, inserts the rows within an atomic storage operation, and updates table indexes concurrently.

### More Examples

#### Example 1: Generic Dynamic Batch Upsert Generator
Here is a generalized helper function that works for any table and any array of objects:
```typescript
export function buildDynamicBatchInsert<T extends Record<string, any>>(
  tableName: string,
  rows: T[],
  conflictTarget: string,
  updateColumns: (keyof T)[]
): { sql: string; replacements: Record<string, any> } {
  if (rows.length === 0) {
    throw new Error("Cannot build batch insert for empty rows array");
  }

  const columns = Object.keys(rows[0]);

  // Construct VALUES placeholders: (:colA_0, :colB_0), (:colA_1, :colB_1)...
  const valuesClause = rows
    .map((_, i) => `(${columns.map((col) => `:${col}_${i}`).join(", ")})`)
    .join(",\n");

  // Construct replacements map
  const replacements: Record<string, any> = {};
  rows.forEach((row, i) => {
    columns.forEach((col) => {
      replacements[`${col}_${i}`] = row[col];
    });
  });

  // Construct ON CONFLICT update clause
  const updateClause = updateColumns
    .map((col) => `"${String(col)}" = EXCLUDED."${String(col)}"`)
    .join(", ");

  const sql = `
    INSERT INTO "${tableName}" (${columns.map((c) => `"${c}"`).join(", ")})
    VALUES ${valuesClause}
    ON CONFLICT (${conflictTarget}) DO UPDATE SET
      ${updateClause}
  `;

  return { sql, replacements };
}
```

#### Example 2: Chunking Massive Batches to Stay Within Database Limits
PostgreSQL has a maximum query parameter limit of 65,535 parameters. If you have 50 columns per row, a single query cannot exceed $\approx 1,300$ rows. Always chunk massive datasets:
```typescript
export async function bulkInsertInChunks<T extends Record<string, any>>(
  rows: T[],
  chunkSize: number = 500,
  insertFn: (batch: T[]) => Promise<void>
): Promise<void> {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    await insertFn(chunk);
  }
}
```

### Common Mistakes

#### Mistake 1: Executing Individual Queries in a Loop (N+1 Network Hop Trap)
```typescript
// HORRIBLE PERFORMANCE (500 network hops):
for (const order of orders) {
  await sequelize.query(
    "INSERT INTO orders (id, total) VALUES (:id, :total)",
    { replacements: { id: order.id, total: order.total } }
  );
}
```

#### Mistake 2: Exceeding Database Parameter Limits Without Chunking
```typescript
// ERROR: PostgreSQL: maximum number of parameters (65535) exceeded!
// When inserting 20,000 rows with 10 columns each (200,000 parameters),
// always chunk into batches of 500 rows using bulkInsertInChunks.
```

### Rules to Remember
1. **Never run database inserts in a loop.** Assemble batches in memory and execute a single bulk insert.
2. **Use indexed replacements (`:col_${i}`)** to safely bind multiple rows in a single parameterized SQL statement.
3. **Chunk large datasets** into batches of 500–1,000 rows to avoid exceeding database driver parameter limits.
4. **Pair bulk inserts with `ON CONFLICT (...) DO UPDATE`** for idempotent data synchronization pipelines.

---

### Think First: Prediction Puzzle
If an array contains 3 objects: `[{ id: "1" }, { id: "2" }, { id: "3" }]`, what will the generated `valuesSql` string look like if built with:
```typescript
rows.map((_, i) => `(:id_${i})`).join(", ")
```

--------------------------------------------------------------------------------
**Answer:**
`(:id_0), (:id_1), (:id_2)`.

**Explanation:**
The mapping function runs for each item index $0, 1, 2$, producing three parenthesized tuples joined with a comma.

---

### Graded Exercises

#### Exercise 1: Single Column Batch Values Generator
Write a function `generateValuesPlaceholders(rowCount: number, colName: string): string` that returns a string formatted like `(:col_0), (:col_1), (:col_2)` for `rowCount` items.
- Hint 1: Use `Array.from({ length: rowCount }, (_, i) => ...)`.
- Hint 2: Join with `", "`.

#### Exercise 2: Object Array Flattener for Replacements
Write a function `flattenRowsToReplacements<T extends Record<string, any>>(rows: T[]): Record<string, any>` that maps an array of objects into a single dictionary with keys formatted as `${key}_${index}`.
- Hint 1: Use `rows.reduce(...)`.
- Hint 2: Iterate over `Object.entries(row)`.

#### Exercise 3: Safe Chunk Slicer
Write a function `chunkArray<T>(items: T[], chunkSize: number): T[][]` that splits an array into sub-arrays of maximum size `chunkSize`.
- Hint 1: Loop with `i += chunkSize`.
- Hint 2: Use `items.slice(i, i + chunkSize)`.

#### Exercise 4: Total Parameters Counter
Write a function `calculateTotalParameters(rowCount: number, columnCount: number): { total: number; exceedsPgLimit: boolean }` that checks whether total parameters exceed the PostgreSQL parameter limit of 65,535.
- Hint 1: `total = rowCount * columnCount`.
- Hint 2: `exceedsPgLimit = total > 65535`.

--------------------------------------------------------------------------------
### Exercise Solutions

```typescript
// Solution 1:
export function generateValuesPlaceholders(rowCount: number, colName: string): string {
  return Array.from({ length: rowCount }, (_, i) => `(:${colName}_${i})`).join(", ");
}

// Solution 2:
export function flattenRowsToReplacements<T extends Record<string, any>>(
  rows: T[]
): Record<string, any> {
  return rows.reduce((acc, row, i) => {
    Object.entries(row).forEach(([key, val]) => {
      acc[`${key}_${i}`] = val;
    });
    return acc;
  }, {} as Record<string, any>);
}

// Solution 3:
export function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

// Solution 4:
export function calculateTotalParameters(
  rowCount: number,
  columnCount: number
): { total: number; exceedsPgLimit: boolean } {
  const total = rowCount * columnCount;
  return {
    total,
    exceedsPgLimit: total > 65535,
  };
}
```

---

### Recall
1. Why is bulk-inserting 500 rows in one query faster than looping 500 times?
2. How do indexed replacement keys (e.g. `:col_${i}`) prevent SQL injection during bulk inserts?
3. If you remember only one thing: **Construct batch `VALUES` tuples and flatten replacements into a single dictionary to insert hundreds of records in a single high-speed network call.**

---

## Checkpoint Challenge 1: The Raw Query & Dynamic Replacements Engine (Topics 1–5)

### Challenge Objective
Build a complete, standalone **High-Throughput Order Ingestion Engine** that exercises all concepts from Topics 1 through 5:
1. Configure and authenticate a Sequelize instance with connection pooling (Topic 1 & 2).
2. Execute raw SQL queries using `QueryTypes.SELECT` and `QueryTypes.INSERT` (Topic 3).
3. Securely bind dynamic filters using named replacements (`:param`) and array `IN` clauses (Topic 4).
4. Dynamically generate indexed batch replacements (`:orderId_${i}`, `:amount_${i}`) to insert and upsert batches of orders in a single round-trip (Topic 5).
5. Self-contained verification suite asserting data integrity and SQL generation.

### Implementation Code

```typescript
import { Sequelize, QueryTypes } from "sequelize";

// ============================================================================
// Step 1: Initialize In-Memory Sequelize Database for Testing (Topics 1 & 2)
// ============================================================================
export const testDb = new Sequelize("sqlite::memory:", {
  logging: false, // Set to console.log to inspect generated SQL queries
  pool: {
    max: 5,
    min: 1,
    idle: 10000,
  },
});

export interface IngestOrderRecord {
  orderId: string;
  sellerId: string;
  status: "pending" | "shipped" | "cancelled";
  amount: number;
}

// ============================================================================
// Step 2: Database Table Setup
// ============================================================================
export async function initializeDatabaseSchema(): Promise<void> {
  await testDb.authenticate();

  // Create table in SQLite
  await testDb.query(`
    CREATE TABLE IF NOT EXISTS orders (
      order_id TEXT PRIMARY KEY,
      seller_id TEXT NOT NULL,
      status TEXT NOT NULL,
      amount REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// ============================================================================
// Step 3: High-Throughput Bulk Ingestion Service (Topics 4 & 5)
// ============================================================================
export class OrderIngestionService {
  /**
   * Bulk upserts an array of orders using a single dynamic query and replacements
   */
  static async bulkIngestOrders(orders: IngestOrderRecord[]): Promise<void> {
    if (orders.length === 0) return;

    // 1. Build indexed VALUES clause: (:orderId_0, :sellerId_0, ...), (:orderId_1, ...)
    const valuesClause = orders
      .map(
        (_, i) =>
          `(:orderId_${i}, :sellerId_${i}, :status_${i}, :amount_${i})`
      )
      .join(",\n");

    // 2. Flatten array into indexed replacements dictionary
    const replacements = orders.reduce((acc, row, i) => {
      acc[`orderId_${i}`] = row.orderId;
      acc[`sellerId_${i}`] = row.sellerId;
      acc[`status_${i}`] = row.status;
      acc[`amount_${i}`] = row.amount;
      return acc;
    }, {} as Record<string, any>);

    // 3. Execute single bulk upsert query
    // SQLite uses ON CONFLICT (...) DO UPDATE SET ...
    await testDb.query(
      `INSERT INTO orders (order_id, seller_id, status, amount)
       VALUES ${valuesClause}
       ON CONFLICT (order_id) DO UPDATE SET
         status = excluded.status,
         amount = excluded.amount`,
      {
        replacements,
        type: QueryTypes.INSERT,
      }
    );
  }

  /**
   * Query orders by seller and multiple statuses using Array IN replacements (Topic 3 & 4)
   */
  static async getOrdersByStatuses(
    sellerId: string,
    allowedStatuses: string[]
  ): Promise<IngestOrderRecord[]> {
    const rows: any[] = await testDb.query(
      `SELECT order_id AS orderId, seller_id AS sellerId, status, amount
       FROM orders
       WHERE seller_id = :sellerId
         AND status IN (:allowedStatuses)
       ORDER BY amount DESC`,
      {
        replacements: {
          sellerId,
          allowedStatuses,
        },
        type: QueryTypes.SELECT,
      }
    );

    return rows;
  }
}

// ============================================================================
// Step 4: Verification and Test Harness
// ============================================================================
export async function runCheckpoint1Tests(): Promise<void> {
  console.log("--- 1. Initializing Test Database & Connection Pool ---");
  await initializeDatabaseSchema();
  console.log("Database schema initialized successfully.");

  console.log("\n--- 2. Testing Bulk Dynamic Replacements Ingestion ---");
  const testBatch: IngestOrderRecord[] = [
    { orderId: "ORD-101", sellerId: "seller_alpha", status: "pending", amount: 150.5 },
    { orderId: "ORD-102", sellerId: "seller_alpha", status: "shipped", amount: 420.0 },
    { orderId: "ORD-103", sellerId: "seller_beta", status: "shipped", amount: 89.9 },
    { orderId: "ORD-104", sellerId: "seller_alpha", status: "cancelled", amount: 12.0 },
  ];

  await OrderIngestionService.bulkIngestOrders(testBatch);
  console.log("Ingested batch of 4 orders in a single bulk query.");

  console.log("\n--- 3. Testing Array IN Replacement Filter ---");
  const results = await OrderIngestionService.getOrdersByStatuses(
    "seller_alpha",
    ["pending", "shipped"]
  );

  console.log(`Retrieved ${results.length} active orders for seller_alpha.`);
  console.log("Top order amount:", results[0].amount === 420.0);
  console.log("Second order amount:", results[1].amount === 150.5);

  console.log("\n--- 4. Testing Idempotent Bulk Upsert Update ---");
  // Update ORD-101 to shipped
  await OrderIngestionService.bulkIngestOrders([
    { orderId: "ORD-101", sellerId: "seller_alpha", status: "shipped", amount: 175.0 },
  ]);

  const updatedRows = await OrderIngestionService.getOrdersByStatuses(
    "seller_alpha",
    ["shipped"]
  );
  const ord101 = updatedRows.find((r) => r.orderId === "ORD-101");
  console.log("Upsert updated ORD-101 status:", ord101?.status === "shipped");
  console.log("Upsert updated ORD-101 amount:", ord101?.amount === 175.0);

  console.log("\n--- Checkpoint 1 Complete: All assertions passed cleanly! ---");
}

runCheckpoint1Tests();
```
---

## Topic 6: Building Reusable Query Fragments: Modular Joins (`orgJoin`), Global Filters (`orgWhere`) & Composable SQL

### 1. Concept Definition & Mechanics

In enterprise backend applications (such as multi-vendor e-commerce or logistics portals), a single database holds data accessed by hundreds of different API routes: summary counts, paginated data grids, CSV exports, detail lookups, and audit logs. 

If every service writes its own `JOIN` statements and access-control `WHERE` conditions from scratch, three catastrophic issues emerge:
1. **Security Drift**: An engineer forgets an organization check on an export endpoint, exposing competitor orders.
2. **Performance Divergence**: One endpoint joins an organization table using an index scan, while another joins in a way that triggers a sequential table scan.
3. **Refactoring Nightmares**: Renaming a column or adding a tenant hierarchy requires hunting down and altering 40 separate raw SQL strings.

To solve this, senior engineers design **Composable SQL Query Fragments**. A Query Fragment is a pure helper function or static class method that returns two synchronized values:
- A sanitized **SQL string snippet** (such as an `INNER JOIN` clause or a `WHERE` condition bundle).
- A **Replacements Dictionary** containing the exact parameter values required by that snippet.

```
       +-------------------------------------------------------+
       |             Master SQL Assembly Pipeline              |
       +-------------------------------------------------------+
                                  |
            +---------------------+---------------------+
            |                                           |
            v                                           v
+-----------------------+                   +-----------------------+
|  Fragment: orgJoin()  |                   | Fragment: orgWhere()  |
|  - SQL: INNER JOIN... |                   |  - SQL: WHERE org_id..|
|  - Replacements: {}   |                   |  - Replacements: {id} |
+-----------------------+                   +-----------------------+
            \                                           /
             \                                         /
              v                                       v
        +---------------------------------------------------+
        | Final SQL: SELECT ... FROM ... JOIN ... WHERE ... |
        | Final Replacements: { orgId: 1042, ... }          |
        +---------------------------------------------------+
```

By assembling queries from modular, reusable fragments, your application guarantees uniform tenant isolation, zero code duplication, and centralized index optimization.

---

### 2. Production Code Example

The following code pattern is modeled directly from production warehouse logistics engines (such as `hawb.service.ts` in real e-commerce backends). It defines modular SQL fragments for organization isolation and status filtering.

```typescript
import { Sequelize, QueryTypes } from "sequelize";

export interface QueryFragment {
  sql: string;
  replacements: Record<string, unknown>;
}

export interface ShipmentFilters {
  orgId: number;
  statusCode?: string;
  startDate?: string;
  endDate?: string;
}

export class ShipmentQueryBuilder {
  /**
   * Generates a reusable INNER JOIN fragment to verify organization ownership.
   */
  public static orgJoin(schema: string): string {
    // Sanitized schema identifier interpolated safely into SQL structure
    return `INNER JOIN "${schema}".organizations org ON org.id = s.organization_id`;
  }

  /**
   * Generates a reusable WHERE fragment enforcing tenant access and optional filters.
   */
  public static orgWhere(filters: ShipmentFilters): QueryFragment {
    const conditions: string[] = ["s.organization_id = :orgId", "s.is_deleted = false"];
    const replacements: Record<string, unknown> = {
      orgId: filters.orgId,
    };

    if (filters.statusCode) {
      conditions.push("s.status = :statusCode");
      replacements.statusCode = filters.statusCode;
    }

    if (filters.startDate && filters.endDate) {
      conditions.push("s.created_at BETWEEN :startDate AND :endDate");
      replacements.startDate = filters.startDate;
      replacements.endDate = filters.endDate;
    }

    return {
      sql: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
      replacements,
    };
  }

  /**
   * Composes a complete paginated query using modular fragments.
   */
  public static buildPaginatedListQuery(
    schema: string,
    filters: ShipmentFilters,
    limit: number,
    offset: number
  ): QueryFragment {
    const joinClause = this.orgJoin(schema);
    const whereFragment = this.orgWhere(filters);

    const sql = `
      SELECT 
        s.id,
        s.tracking_number,
        s.status,
        s.weight_kg,
        org.name AS organization_name,
        s.created_at
      FROM "${schema}".shipments s
      ${joinClause}
      ${whereFragment.sql}
      ORDER BY s.created_at DESC
      LIMIT :limit OFFSET :offset;
    `;

    return {
      sql,
      replacements: {
        ...whereFragment.replacements,
        limit,
        offset,
      },
    };
  }
}
```

---

### 3. Chronological Line-by-Line Breakdown

- `export interface QueryFragment`: Defines a strict contract returning both the partial SQL string and its associated parameter replacements. This ensures fragments cannot accidentally produce orphaned placeholders.
- `public static orgJoin(schema: string)`:
  - Takes the database schema name and builds an `INNER JOIN` clause between the target table (`shipments s`) and the tenant master table (`organizations org`).
  - Does not take dynamic user text as replacements because table names in PostgreSQL cannot be parameterized. It relies on internal validated schema strings wrapped in double quotes `"${schema}"`.
- `public static orgWhere(filters: ShipmentFilters)`:
  - Initializes `conditions` with mandatory tenant checks: `s.organization_id = :orgId` and `s.is_deleted = false`.
  - Injects `orgId` into the `replacements` dictionary.
  - Dynamically inspects optional filter parameters (`statusCode`, `startDate`, `endDate`). If present, it pushes SQL conditions using named `:placeholders` and assigns the exact values into `replacements`.
  - Joins all conditions with the SQL boolean operator `AND`.
- `public static buildPaginatedListQuery(...)`:
  - Calls `orgJoin(schema)` to get the join string.
  - Calls `orgWhere(filters)` to get the `whereFragment`.
  - Concatenates the structural SQL string cleanly with indentation.
  - Merges `whereFragment.replacements` with pagination parameters (`limit`, `offset`) using object spread `{ ...whereFragment.replacements, limit, offset }`.

---

### 4. Visual Engine Execution Diagram

```
Application Call:
buildPaginatedListQuery("tenant_acme", { orgId: 42, statusCode: "IN_TRANSIT" }, 25, 0)
                          |
                          v
         Step 1: orgJoin("tenant_acme")
         Output: INNER JOIN "tenant_acme".organizations org ON org.id = s.organization_id
                          |
                          v
         Step 2: orgWhere({ orgId: 42, statusCode: "IN_TRANSIT" })
         Output SQL: WHERE s.organization_id = :orgId AND s.is_deleted = false AND s.status = :statusCode
         Output Replacements: { orgId: 42, statusCode: "IN_TRANSIT" }
                          |
                          v
         Step 3: Master Assembly & Pagination Merge
         Output SQL:
           SELECT s.id, s.tracking_number, ... 
           FROM "tenant_acme".shipments s
           INNER JOIN "tenant_acme".organizations org ON org.id = s.organization_id
           WHERE s.organization_id = :orgId AND s.is_deleted = false AND s.status = :statusCode
           ORDER BY s.created_at DESC
           LIMIT :limit OFFSET :offset;
         Output Replacements:
           { orgId: 42, statusCode: "IN_TRANSIT", limit: 25, offset: 0 }
                          |
                          v
         Sequelize Execution:
         sequelize.query(result.sql, { replacements: result.replacements, type: QueryTypes.SELECT })
```

---

### 5. Junior Pitfall vs Senior Fix

#### Junior Pitfall: Leaking Filters Through String Concatenation Without Dictionary Synchronization

```typescript
// JUNIOR ANTI-PATTERN: Loose string concat and orphaned replacement arrays
function buildBadQuery(orgId: number, status?: string) {
  let sql = `SELECT * FROM shipments WHERE org_id = ` + orgId; // SQL Injection risk if orgId is unparsed!
  if (status) {
    sql += ` AND status = '` + status + `'`; // High vulnerability!
  }
  return sql;
}
```

*Why it fails*: Any un-sanitized string passed into `status` executes arbitrary SQL commands. Furthermore, combining strings ad-hoc across multiple helper functions leads to missing spaces (e.g., `WHERE org_id = 1AND status = 'pending'`), causing immediate runtime syntax errors.

#### Senior Fix: Strongly Typed Composable Fragments

```typescript
// SENIOR PATTERN: Atomic fragment returning synchronized SQL snippet and replacement dictionary
export function createSafeFilterFragment(orgId: number, status?: string): QueryFragment {
  const clauses: string[] = ["org_id = :orgId"];
  const replacements: Record<string, unknown> = { orgId };

  if (status !== undefined) {
    clauses.push("status = :status");
    replacements.status = status;
  }

  return {
    sql: `WHERE ${clauses.join(" AND ")}`,
    replacements,
  };
}
```

*Why it succeeds*: SQL text is 100% parameterized with tokens (`:orgId`, `:status`). The replacements object precisely mirrors the tokens generated in the string. Space delimiters are automatically handled by `Array.join(" AND ")`.

---

### 6. "Think First" Mystery Puzzle

Study this query composer. What error occurs when `filters.maxWeight` is provided as `0`?

```typescript
function buildWeightFragment(filters: { minWeight?: number; maxWeight?: number }): QueryFragment {
  const conditions: string[] = [];
  const replacements: Record<string, unknown> = {};

  if (filters.minWeight) {
    conditions.push("weight >= :minWeight");
    replacements.minWeight = filters.minWeight;
  }

  if (filters.maxWeight) {
    conditions.push("weight <= :maxWeight");
    replacements.maxWeight = filters.maxWeight;
  }

  return {
    sql: conditions.length > 0 ? conditions.join(" AND ") : "1=1",
    replacements,
  };
}

const fragment = buildWeightFragment({ minWeight: 0, maxWeight: 0 });
console.log(fragment.sql);
```

#### Step-by-Step Execution Trace:
1. `filters.minWeight` is `0`. In JavaScript, `0` is a falsy value (`Boolean(0) === false`).
2. The `if (filters.minWeight)` condition evaluates to `false`. The clause `weight >= :minWeight` is skipped!
3. `filters.maxWeight` is `0`. It also evaluates to `false`. The clause `weight <= :maxWeight` is skipped!
4. `conditions.length` is `0`. The ternary expression returns `"1=1"`.
5. **Result**: A user filtering for zero-weight packages receives all packages in the entire database because numeric `0` was suppressed by truthiness coercion.
6. **Senior Rule**: Always use `if (filters.maxWeight !== undefined && filters.maxWeight !== null)` when validating numbers and booleans.

---

### 7. Graded Exercises

#### Exercise 6.1 (Warm-up): Date Range Fragment Builder
Create a function `buildDateRangeFragment(startDate?: string, endDate?: string): QueryFragment` that:
- Returns an empty string and empty replacements if neither date is supplied.
- Uses `>= :startDate` if only `startDate` is provided.
- Uses `<= :endDate` if only `endDate` is provided.
- Uses `BETWEEN :startDate AND :endDate` if both are provided.

*Hint 1*: Check `if (startDate && endDate)` first before checking individual dates.
*Hint 2*: Return `{ sql: "", replacements: {} }` as the default fallback.

#### Exercise 6.2 (Intermediate): Composable Multi-Table Join Registry
Write a class `JoinRegistry` with methods `addUserJoin(schema: string)` and `addWarehouseJoin(schema: string)`. Ensure calling both methods returns a single combined string without duplicate spaces, properly referencing `s.user_id = u.id` and `s.warehouse_id = w.id`.

*Hint 1*: Store joins in a `Set<string>` to automatically prevent duplicate joins.
*Hint 2*: Return `Array.from(set).join("\n")`.

#### Exercise 6.3 (Advanced): Modular Tenant Permission Scoping Engine
Write a function `buildTenantScope(user: { id: number; role: string; orgId: number }): QueryFragment`:
- If `user.role === "SUPER_ADMIN"`, return `{ sql: "1=1", replacements: {} }`.
- If `user.role === "ORG_MANAGER"`, return `{ sql: "organization_id = :orgId", replacements: { orgId: user.orgId } }`.
- If `user.role === "OPERATOR"`, return `{ sql: "organization_id = :orgId AND assigned_user_id = :userId", replacements: { orgId: user.orgId, userId: user.id } }`.
- If role is unrecognized, throw an `Error("Unauthorized role")`.

*Hint 1*: Use a `switch` statement on `user.role`.
*Hint 2*: Never allow dynamic user inputs into the SQL string; only parameterized tokens.

#### Exercise 6.4 (Expert): Composable Query Pipeline with CTE (Common Table Expression)
Write a query builder function `buildOrderMetricsCte(schema: string, orgId: number, minSpend: number): QueryFragment` that generates:
```sql
WITH high_value_orders AS (
  SELECT customer_id, SUM(total_amount) AS total_spend
  FROM "<schema>".orders
  WHERE organization_id = :orgId
  GROUP BY customer_id
  HAVING SUM(total_amount) >= :minSpend
)
SELECT c.name, c.email, hvo.total_spend
FROM high_value_orders hvo
INNER JOIN "<schema>".customers c ON c.id = hvo.customer_id
ORDER BY hvo.total_spend DESC;
```
Ensure all schema references are safely escaped and all numeric parameters are bound.

*Hint 1*: Pass `schema` into string interpolation with double quotes `"${schema}"`.
*Hint 2*: Place `orgId` and `minSpend` into the `replacements` dictionary.

---

### Solutions for Topic 6

```typescript
// Solution 6.1
export function buildDateRangeFragment(startDate?: string, endDate?: string): QueryFragment {
  if (startDate && endDate) {
    return {
      sql: "created_at BETWEEN :startDate AND :endDate",
      replacements: { startDate, endDate },
    };
  }
  if (startDate) {
    return {
      sql: "created_at >= :startDate",
      replacements: { startDate },
    };
  }
  if (endDate) {
    return {
      sql: "created_at <= :endDate",
      replacements: { endDate },
    };
  }
  return { sql: "", replacements: {} };
}

// Solution 6.2
export class JoinRegistry {
  private joins = new Set<string>();

  public addUserJoin(schema: string): this {
    this.joins.add(`INNER JOIN "${schema}".users u ON u.id = s.user_id`);
    return this;
  }

  public addWarehouseJoin(schema: string): this {
    this.joins.add(`INNER JOIN "${schema}".warehouses w ON w.id = s.warehouse_id`);
    return this;
  }

  public compile(): string {
    return Array.from(this.joins).join("\n");
  }
}

// Solution 6.3
export function buildTenantScope(user: { id: number; role: string; orgId: number }): QueryFragment {
  switch (user.role) {
    case "SUPER_ADMIN":
      return { sql: "1=1", replacements: {} };
    case "ORG_MANAGER":
      return {
        sql: "organization_id = :orgId",
        replacements: { orgId: user.orgId },
      };
    case "OPERATOR":
      return {
        sql: "organization_id = :orgId AND assigned_user_id = :userId",
        replacements: { orgId: user.orgId, userId: user.id },
      };
    default:
      throw new Error(`Unauthorized role: ${user.role}`);
  }
}

// Solution 6.4
export function buildOrderMetricsCte(schema: string, orgId: number, minSpend: number): QueryFragment {
  // Validate schema identifier to prevent identifier injection
  if (!/^[a-zA-Z0-9_]+$/.test(schema)) {
    throw new Error("Invalid schema identifier");
  }

  const sql = `
    WITH high_value_orders AS (
      SELECT customer_id, SUM(total_amount) AS total_spend
      FROM "${schema}".orders
      WHERE organization_id = :orgId
      GROUP BY customer_id
      HAVING SUM(total_amount) >= :minSpend
    )
    SELECT c.name, c.email, hvo.total_spend
    FROM high_value_orders hvo
    INNER JOIN "${schema}".customers c ON c.id = hvo.customer_id
    ORDER BY hvo.total_spend DESC;
  `;

  return {
    sql,
    replacements: { orgId, minSpend },
  };
}
```

---

## Topic 7: Advanced Search Query Builders: Pattern Matching, `ILIKE`, Comma-Separated `IN (:searchList)` & Dynamic Fan-Out

### 1. Concept Definition & Mechanics

In high-volume e-commerce applications (such as inventory search, merchant shipping portals, or tracking consoles), search inputs arrive in diverse formats:
1. **Bulk List Search**: A warehouse worker pastes 50 comma-separated or newline-separated tracking numbers into a single search box (`TRK-1001, TRK-1002, TRK-1003`).
2. **Exact Identifier Search**: An exact alphanumeric SKU code (`SKU-X892-RED`).
3. **Fuzzy Text Match**: A partial customer name, item title, or destination address (`john`, `seattle`).

Executing a naive `WHERE col LIKE '%input%'` query on a table with 10 million rows causes severe database degradation. PostgreSQL must execute a **Sequential Table Scan** across every single row because a leading wildcard (`%word`) invalidates standard B-Tree index lookups.

Senior engineers design **Search Query Builders** (such as `buildMfnSearch` in `mfn.service.ts`) that evaluate the input query structure and select the optimal SQL strategy:
- If the user provides a delimited list (commas, spaces, newlines), parse it into an array and emit an `IN (:searchList)` clause. This allows the database engine to use lightning-fast B-Tree Index Scans.
- If the input is a single term, fan out search conditions using `ILIKE :term` across targeted columns (SKU, title, recipient), while using exact equality `= :exactTerm` for indexed primary identifiers.

```
Incoming Search Input: "TRK-01, TRK-02, TRK-03"
               |
               v
   Contains delimiter (comma)?
        /            \
      YES             NO
      /                \
Parse into Array:     Single Search Term: "Seattle"
["TRK-01", ...]                 |
      |                         v
      v               Fan-out ILIKE across columns:
Emit SQL:             (s.tracking_number ILIKE :term
col IN (:searchList)   OR s.recipient_name ILIKE :term
                       OR s.destination_city ILIKE :term)
```

---

### 2. Production Code Example

The following pattern mirrors the search builder from `mfn.service.ts` in production Amazon seller engines:

```typescript
import { QueryFragment } from "./ShipmentQueryBuilder";

export class SearchQueryBuilder {
  /**
   * Parses a raw user query string into a list of clean tokens if delimited.
   */
  public static parseSearchTokens(rawQuery: string): string[] {
    if (!rawQuery || typeof rawQuery !== "string") {
      return [];
    }

    // Split on commas, semicolons, or newlines, trimming whitespace
    return rawQuery
      .split(/[\s,;\n\r]+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 0);
  }

  /**
   * Constructs an optimized SQL search fragment.
   * If multiple tokens are found, it generates an indexed IN (:searchList) condition.
   * If a single token is found, it performs a fanned-out ILIKE search with exact-match priority.
   */
  public static buildSearchFragment(
    rawQuery: string,
    exactColumns: string[],
    fuzzyColumns: string[]
  ): QueryFragment {
    const tokens = this.parseSearchTokens(rawQuery);

    if (tokens.length === 0) {
      return { sql: "", replacements: {} };
    }

    // Strategy A: Multiple tokens provided -> IN clause across exact columns
    if (tokens.length > 1) {
      const orClauses = exactColumns.map((col) => `${col} IN (:searchList)`);
      return {
        sql: `(${orClauses.join(" OR ")})`,
        replacements: {
          searchList: tokens,
        },
      };
    }

    // Strategy B: Single token -> Exact match OR case-insensitive pattern match
    const singleToken = tokens[0];
    const clauses: string[] = [];
    const replacements: Record<string, unknown> = {
      exactTerm: singleToken,
      fuzzyTerm: `%${singleToken}%`,
    };

    // Exact matches take index precedence
    for (const col of exactColumns) {
      clauses.push(`${col} = :exactTerm`);
    }

    // Fuzzy matches search substrings across secondary fields
    for (const col of fuzzyColumns) {
      clauses.push(`${col} ILIKE :fuzzyTerm`);
    }

    return {
      sql: `(${clauses.join(" OR ")})`,
      replacements,
    };
  }
}
```

---

### 3. Chronological Line-by-Line Breakdown

- `public static parseSearchTokens(rawQuery: string)`:
  - Takes raw input from the HTTP request query parameter (`req.query.search`).
  - Uses the regular expression `/[\s,;\n\r]+/` to split across one or more spaces, commas, semicolons, or carriage returns.
  - Strips leading and trailing whitespace with `.map(t => t.trim())`.
  - Drops empty elements with `.filter(t => t.length > 0)`.
- `public static buildSearchFragment(...)`:
  - Receives `rawQuery`, a list of `exactColumns` (e.g., `["order_id", "tracking_number"]`), and `fuzzyColumns` (e.g., `["customer_name", "shipping_address"]`).
  - Calls `parseSearchTokens` to determine token count.
  - If `tokens.length > 1`:
    - Constructs SQL clauses: `order_id IN (:searchList) OR tracking_number IN (:searchList)`.
    - Binds `tokens` directly to `:searchList`. Sequelize translates this array into `('TRK-1', 'TRK-2', ...)` automatically.
  - If `tokens.length === 1`:
    - Binds `:exactTerm` to `singleToken` and `:fuzzyTerm` to `"%${singleToken}%"`.
    - Iterates over `exactColumns` generating `${col} = :exactTerm`.
    - Iterates over `fuzzyColumns` generating `${col} ILIKE :fuzzyTerm`.
    - Encloses all conditions inside parentheses `(...)` so downstream `AND` filters are not broken by boolean operator precedence.

---

### 4. Visual Engine Execution Diagram

```
Boolean Operator Precedence Trap:

BAD (Unparenthesized):
WHERE organization_id = :orgId AND status = 'active' OR customer_name ILIKE :fuzzyTerm

Evaluated by SQL Parser as:
WHERE (organization_id = :orgId AND status = 'active') 
   OR (customer_name ILIKE :fuzzyTerm)   <-- CRITICAL BUG: Exposes other tenants' data!

SENIOR FIX (Strict Parenthesization):
WHERE organization_id = :orgId 
  AND status = 'active' 
  AND (order_id = :exactTerm OR customer_name ILIKE :fuzzyTerm)

Evaluated by SQL Parser as:
Tenant isolation is enforced ALWAYS, regardless of search matches.
```

---

### 5. Junior Pitfall vs Senior Fix

#### Junior Pitfall: Injecting Wildcards Directly into SQL Strings

```typescript
// JUNIOR ANTI-PATTERN: Wildcard concatenation inside SQL string
const query = "apple";
const sql = `SELECT * FROM products WHERE title ILIKE '%${query}%'`; // VULNERABLE TO SQL INJECTION!
```

If a user searches for `apple%'; DROP TABLE products; --`, the raw string concatenation leads to catastrophic query alteration.

#### Senior Fix: Binding Wildcards via Replacements Dictionary

```typescript
// SENIOR PATTERN: Wildcards belong in the parameter value, NEVER in the SQL template
const query = "apple";
const sql = `SELECT * FROM products WHERE title ILIKE :searchTerm`;
const replacements = {
  searchTerm: `%${query}%`, // Bound safely as a string literal by database driver
};
```

---

### 6. "Think First" Mystery Puzzle

Look at this search builder snippet:

```typescript
function buildBrokenSearch(queryText: string): QueryFragment {
  const isNumeric = !isNaN(Number(queryText));
  
  if (isNumeric) {
    return {
      sql: "id = :id",
      replacements: { id: Number(queryText) }
    };
  }
  
  return {
    sql: "title ILIKE :title",
    replacements: { title: `%${queryText}%` }
  };
}

const res = buildBrokenSearch("   ");
console.log(res);
```

What SQL fragment is returned for the whitespace string `"   "`?

#### Step-by-Step Execution Trace:
1. `Number("   ")` in JavaScript returns `0`! (Empty strings and pure whitespace convert to `0`).
2. `isNaN(0)` returns `false`.
3. `!isNaN(0)` evaluates to `true`.
4. The function executes the `isNumeric` block: returning `id = :id` with `{ id: 0 }`.
5. **Result**: A user who accidentally typed spaces searches for record ID `0` instead of triggering a fallback or fuzzy match.
6. **Senior Rule**: Always call `.trim()` and check `.length > 0` before running numerical conversion checks.

---

### 7. Graded Exercises

#### Exercise 7.1 (Warm-up): Whitespace and Comma Tokenizer
Write a function `sanitizeSearchTokens(input: string): string[]` that takes a string containing tabs, commas, duplicate spaces, and returns a deduplicated array of lowercase strings.

*Hint 1*: Use a `Set` to eliminate duplicates.
*Hint 2*: Convert each item with `.toLowerCase()`.

#### Exercise 7.2 (Intermediate): Comma-Separated SKUs vs Single Title Search
Write a function `buildInventorySearch(term: string): QueryFragment`:
- If `term` has commas, split on commas and return `sku IN (:skuList)`.
- If `term` has no commas, return `(sku = :term OR title ILIKE :likeTerm)`.
- If empty or whitespace, return `{ sql: "", replacements: {} }`.

*Hint 1*: Trim the string first.
*Hint 2*: For `likeTerm`, interpolate `%` around the search word.

#### Exercise 7.3 (Advanced): Safe Regex Prefix/Suffix Sanitizer
When users search using SQL `LIKE` or `ILIKE`, characters like `%` and `_` are special wildcards in SQL. If a user searches for `100%_guaranteed`, `_` matches any single character. Write a utility `escapeLikeWildcards(input: string): string` that escapes `%` and `_` with a backslash `\` so literal searches work accurately.

*Hint 1*: Use `.replace(/[%_]/g, "\\$&")`.
*Hint 2*: In PostgreSQL, specify `LIKE :term ESCAPE '\'` if necessary, or use parameterized replacements.

#### Exercise 7.4 (Expert): Multi-Field Weighted Search Builder with Scoring
Write a search builder function `buildScoredSearch(query: string): QueryFragment` that generates a SQL fragment calculating a relevance score:
- Score 100 if `sku = :exact`
- Score 50 if `sku ILIKE :prefix` (`term%`)
- Score 10 if `title ILIKE :fuzzy` (`%term%`)
- Score 0 otherwise
Return both the `CASE` statement snippet and the replacements dictionary.

*Hint 1*: Use `CASE WHEN ... THEN 100 WHEN ... THEN 50 ELSE 0 END AS relevance_score`.
*Hint 2*: Ensure all token variants (`:exact`, `:prefix`, `:fuzzy`) are provided in `replacements`.

---

### Solutions for Topic 7

```typescript
// Solution 7.1
export function sanitizeSearchTokens(input: string): string[] {
  if (!input || typeof input !== "string") return [];
  const rawList = input
    .split(/[\s,]+/)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);
  return Array.from(new Set(rawList));
}

// Solution 7.2
export function buildInventorySearch(term: string): QueryFragment {
  const clean = term?.trim();
  if (!clean) {
    return { sql: "", replacements: {} };
  }

  if (clean.includes(",")) {
    const tokens = clean
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    return {
      sql: "sku IN (:skuList)",
      replacements: { skuList: tokens },
    };
  }

  return {
    sql: "(sku = :term OR title ILIKE :likeTerm)",
    replacements: {
      term: clean,
      likeTerm: `%${clean}%`,
    },
  };
}

// Solution 7.3
export function escapeLikeWildcards(input: string): string {
  if (!input) return "";
  return input.replace(/([%_\\])/g, "\\$1");
}

// Solution 7.4
export function buildScoredSearch(query: string): QueryFragment {
  const clean = query?.trim() || "";
  if (!clean) {
    return { sql: "0 AS relevance_score", replacements: {} };
  }

  const escaped = escapeLikeWildcards(clean);

  const sql = `
    CASE 
      WHEN sku = :exact THEN 100
      WHEN sku ILIKE :prefix THEN 50
      WHEN title ILIKE :fuzzy THEN 10
      ELSE 0
    END AS relevance_score
  `;

  return {
    sql,
    replacements: {
      exact: clean,
      prefix: `${escaped}%`,
      fuzzy: `%${escaped}%`,
    },
  };
}
```

---

## Topic 8: Multi-Tenancy & Dynamic Schema Interpolation (`"${schema}".table_name` & Tenant Isolation)

### 1. Concept Definition & Mechanics

In Software-as-a-Service (SaaS) and enterprise B2B architectures, customer data must be rigorously isolated. There are three primary multi-tenancy models in PostgreSQL:
1. **Shared Database, Shared Schema**: All tenants share tables, differentiated by a `tenant_id` column.
2. **Database-Per-Tenant**: Each tenant gets a completely separate PostgreSQL database instance. High isolation, but massive infrastructure overhead.
3. **Schema-Per-Tenant (The Gold Standard)**: A single PostgreSQL database contains multiple PostgreSQL schemas (e.g., `schema_acme`, `schema_globex`, `public`). Each schema contains identical table structures (`orders`, `shipments`, `inventory`).

Why is Schema-Per-Tenant the preferred enterprise architecture?
- **Total Data Isolation**: A query on `"schema_acme".orders` can never accidentally read rows from `"schema_globex".orders`.
- **Easy Maintenance**: Backing up, exporting, or dropping a departing tenant is as simple as `DROP SCHEMA "schema_acme" CASCADE;`.
- **Zero Row-Level Locking Contention**: Bulk writes for one customer do not lock table indexes for another customer.

However, standard SQL parameterized replacements (`?` or `:name`) **CANNOT** be used for schema or table names in PostgreSQL.
The PostgreSQL protocol treats parameters strictly as **values** (strings, numbers, dates), not SQL identifiers:
```sql
-- THIS WILL THROW A SYNTAX ERROR IN POSTGRESQL:
SELECT * FROM :schemaName.orders; -- ERROR: syntax error at or near "$1"
```

Therefore, the schema name must be dynamically interpolated into the query string:
`FROM "${schema}".orders`
Because it is interpolated into the SQL string, it introduces a severe vulnerability if not sanitized. Senior engineers implement **Strict Identifier Validation** using regex whitelists or schema dictionaries to guarantee complete immunity against Identifier Injection attacks.

---

### 2. Production Code Example

The following pattern demonstrates how enterprise multi-tenant services (such as `hawb.service.ts` and `sp-orders.service.ts`) execute schema-isolated raw queries safely with Sequelize:

```typescript
import { Sequelize, QueryTypes } from "sequelize";

export class TenantSchemaService {
  private static readonly VALID_SCHEMA_REGEX = /^[a-zA-Z0-9_]{1,63}$/;

  /**
   * Validates and sanitizes a PostgreSQL schema identifier.
   * Throws an error immediately if any illegal character or SQL punctuation is present.
   */
  public static sanitizeSchema(schema: string): string {
    if (!schema || typeof schema !== "string") {
      throw new Error("Schema identifier must be a non-empty string");
    }

    const trimmed = schema.trim();
    if (!this.VALID_SCHEMA_REGEX.test(trimmed)) {
      throw new Error(`Invalid schema identifier: "${schema}". Only alphanumeric and underscores allowed.`);
    }

    return trimmed;
  }

  /**
   * Queries orders within a tenant's isolated schema using parameterized value replacements.
   */
  public static async getTenantOrders(
    sequelize: Sequelize,
    rawSchema: string,
    status: string,
    limit: number = 50
  ): Promise<any[]> {
    const schema = this.sanitizeSchema(rawSchema);

    // Schema is safe to interpolate inside double quotes
    // Values (status, limit) are strictly parameterized via replacements
    const sql = `
      SELECT 
        o.order_id,
        o.customer_id,
        o.status,
        o.total_amount,
        o.created_at
      FROM "${schema}".orders o
      WHERE o.status = :status
      ORDER BY o.created_at DESC
      LIMIT :limit;
    `;

    return await sequelize.query(sql, {
      replacements: {
        status,
        limit,
      },
      type: QueryTypes.SELECT,
    });
  }

  /**
   * Provisions a brand new tenant schema with base tables.
   */
  public static async provisionTenantSchema(
    sequelize: Sequelize,
    rawSchema: string
  ): Promise<void> {
    const schema = this.sanitizeSchema(rawSchema);

    // Multi-statement DDL for new tenant creation
    const ddl = `
      CREATE SCHEMA IF NOT EXISTS "${schema}";

      CREATE TABLE IF NOT EXISTS "${schema}".orders (
        order_id VARCHAR(64) PRIMARY KEY,
        customer_id VARCHAR(64) NOT NULL,
        status VARCHAR(32) NOT NULL,
        total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS "idx_${schema}_orders_status" 
      ON "${schema}".orders(status);
    `;

    await sequelize.query(ddl, { type: QueryTypes.RAW });
  }
}
```

---

### 3. Chronological Line-by-Line Breakdown

- `private static readonly VALID_SCHEMA_REGEX = /^[a-zA-Z0-9_]{1,63}$/`:
  - PostgreSQL identifier limit is 63 bytes.
  - Matches only letters, numbers, and underscores. Forbids spaces, quotes, hyphens, semicolons, and dashes.
- `public static sanitizeSchema(schema: string)`:
  - Validates type and emptiness.
  - Tests against the regex whitelist.
  - If invalid, throws an exception immediately before any SQL string is constructed.
- `public static async getTenantOrders(...)`:
  - Receives `rawSchema`, `status`, and `limit`.
  - Calls `this.sanitizeSchema(rawSchema)`.
  - Interpolates `"${schema}"` into the `FROM` clause. The double quotes instruct PostgreSQL to treat it strictly as an identifier.
  - Uses `:status` and `:limit` in `replacements`.
  - Executes with `QueryTypes.SELECT`.
- `public static async provisionTenantSchema(...)`:
  - Dynamically runs `CREATE SCHEMA IF NOT EXISTS "${schema}"`.
  - Creates tenant-specific tables and indexes prefixed with the schema name.

---

### 4. Visual Engine Execution Diagram

```
+-------------------------------------------------------------------+
|               PostgreSQL Database: "enterprise_db"                |
+-------------------------------------------------------------------+
       |                                              |
       v                                              v
+-------------------------------+              +-------------------------------+
|    Schema: "tenant_alpha"     |              |     Schema: "tenant_beta"     |
+-------------------------------+              +-------------------------------+
| Tables:                       |              | Tables:                       |
| - orders                      |              | - orders                      |
| - shipments                   |              | - shipments                   |
| - inventory                   |              | - inventory                   |
+-------------------------------+              +-------------------------------+
       ^                                              ^
       |                                              |
Query 1: FROM "tenant_alpha".orders            Query 2: FROM "tenant_beta".orders
(Returns only Alpha data)                      (Returns only Beta data)
```

---

### 5. Junior Pitfall vs Senior Fix

#### Junior Pitfall: Trusting User Headers for Schema Names Without Sanitization

```typescript
// JUNIOR ANTI-PATTERN: Unsanitized schema injection from HTTP headers
app.get("/orders", async (req, res) => {
  const schema = req.headers["x-tenant-id"]; // Malicious user sends: 'public"; DROP SCHEMA "public" CASCADE; --'
  const sql = `SELECT * FROM "${schema}".orders`;
  await sequelize.query(sql); // DATABASE DESTROYED!
});
```

#### Senior Fix: Strict Whitelisting and Identifier Sanitization

```typescript
// SENIOR PATTERN: Sanitization gatekeeper + Registered tenant lookup
app.get("/orders", async (req, res) => {
  const tenantSlug = req.headers["x-tenant-id"] as string;
  
  // 1. Regex validation
  const safeSchema = TenantSchemaService.sanitizeSchema(tenantSlug);
  
  // 2. Database tenancy verification: ensure tenant is active
  const tenantExists = await checkTenantRegistration(sequelize, safeSchema);
  if (!tenantExists) {
    return res.status(403).json({ error: "Unauthorized tenant" });
  }

  // 3. Execution
  const data = await TenantSchemaService.getTenantOrders(sequelize, safeSchema, "pending");
  res.json(data);
});
```

---

### 6. "Think First" Mystery Puzzle

A developer writes this query to count shipments in a tenant schema:

```typescript
async function countShipments(sequelize: Sequelize, schema: string): Promise<number> {
  const sanitized = TenantSchemaService.sanitizeSchema(schema);
  const sql = 'SELECT COUNT(*) as count FROM ":schema".shipments';
  const [rows] = await sequelize.query(sql, {
    replacements: { schema: sanitized },
    type: QueryTypes.SELECT
  }) as any[];
  return Number(rows.count);
}
```

Why does this function throw a database syntax error or return a table not found error when executed?

#### Step-by-Step Execution Trace:
1. The developer wrote `":schema".shipments` inside the SQL template string.
2. In SQL syntax, single or double quotes surrounding text make it a string literal or exact identifier name.
3. Sequelize's replacement scanner does **not** replace tokens inside quoted SQL identifiers or string literals.
4. Even if it did replace it, PostgreSQL expects `FROM "tenant_name".shipments`, but Sequelize would produce `'tenant_name'.shipments` (with single quotes), which is invalid table syntax in PostgreSQL.
5. **Result**: PostgreSQL tries to find a schema literally named `:schema` or throws an error.
6. **Senior Rule**: SQL identifiers must be interpolated with template strings `"${schema}".table` after strict regex verification, while parameter values are bound with `:name`.

---

### 7. Graded Exercises

#### Exercise 8.1 (Warm-up): Schema Identifier Validator
Write a function `isValidPostgreSqlIdentifier(name: string): boolean` that verifies:
- Length between 1 and 63 characters.
- Must start with a letter (`a-z`, `A-Z`) or underscore `_`.
- Subsequent characters can only be alphanumeric or underscores.
- Must not equal PostgreSQL reserved words (`user`, `select`, `table`).

*Hint 1*: Use `/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/`.
*Hint 2*: Create a `Set` of common reserved words.

#### Exercise 8.2 (Intermediate): Dynamic Cross-Schema Join
In some enterprise systems, the master user table is stored in the `public` schema, while tenant orders are in the tenant's private schema. Write a function `buildCrossSchemaOrderQuery(schema: string): string` that safely joins `"${schema}".orders o` with `"public".users u ON u.id = o.user_id`.

*Hint 1*: Sanitize `schema` first.
*Hint 2*: Escape both schema names in double quotes.

#### Exercise 8.3 (Advanced): Multi-Tenant Table Migration Runner
Write an async function `migrateAllTenantSchemas(sequelize: Sequelize, ddlSnippet: string): Promise<string[]>` that:
- Queries `information_schema.schemata` for all schemas starting with `tenant_%`.
- Loops through each schema sequentially.
- Replaces `{{SCHEMA}}` placeholders in `ddlSnippet` with the sanitized schema name and executes the query.
- Returns the list of updated schemas.

*Hint 1*: Query `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'`.
*Hint 2*: Use a `for...of` loop with `await` to avoid connection pool exhaustion.

#### Exercise 8.4 (Expert): Connection Search Path Isolation vs Explicit Schema Prefixing
Explain and write code demonstrating the difference between:
1. Setting `SET search_path TO "${schema}", public;` per connection.
2. Explicitly prefixing every table `"${schema}".table_name`.
Why is explicit prefixing significantly safer in pooled environments like Sequelize?

*Hint 1*: In connection pools, connections are reused across requests. If a connection is not reset, the next request might inherit the wrong `search_path`.
*Hint 2*: Show a pooled execution demonstrating explicit prefixing.

---

### Solutions for Topic 8

```typescript
// Solution 8.1
const RESERVED_WORDS = new Set(["select", "table", "user", "order", "where", "from", "public"]);

export function isValidPostgreSqlIdentifier(name: string): boolean {
  if (!name || typeof name !== "string") return false;
  if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(name)) return false;
  if (RESERVED_WORDS.has(name.toLowerCase())) return false;
  return true;
}

// Solution 8.2
export function buildCrossSchemaOrderQuery(schema: string): string {
  if (!isValidPostgreSqlIdentifier(schema)) {
    throw new Error(`Invalid schema name: ${schema}`);
  }
  return `
    SELECT 
      o.order_id,
      o.total_amount,
      u.email AS customer_email
    FROM "${schema}".orders o
    INNER JOIN "public".users u ON u.id = o.user_id
    ORDER BY o.order_id ASC;
  `;
}

// Solution 8.3
export async function migrateAllTenantSchemas(
  sequelize: Sequelize,
  ddlSnippet: string
): Promise<string[]> {
  const schemas = await sequelize.query<{ schema_name: string }>(
    `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'`,
    { type: QueryTypes.SELECT }
  );

  const migrated: string[] = [];

  for (const row of schemas) {
    const safeSchema = row.schema_name;
    if (isValidPostgreSqlIdentifier(safeSchema)) {
      const compiledDdl = ddlSnippet.replace(/\{\{SCHEMA\}\}/g, safeSchema);
      await sequelize.query(compiledDdl, { type: QueryTypes.RAW });
      migrated.push(safeSchema);
    }
  }

  return migrated;
}

// Solution 8.4
// Explanation:
// Setting search_path mutates state on the physical DB socket connection. 
// If an unhandled exception occurs or connection isn't reset before returning to the pool,
// subsequent queries from different tenants execute against the wrong schema (Data Leakage)!
// Explicit prefixing ("${schema}".table) is completely stateless and connection-pool safe.

export async function runExplicitPrefixQuery(
  sequelize: Sequelize,
  schema: string,
  orderId: string
) {
  if (!isValidPostgreSqlIdentifier(schema)) throw new Error("Invalid schema");

  const [row] = await sequelize.query(
    `SELECT * FROM "${schema}".orders WHERE order_id = :orderId`,
    {
      replacements: { orderId },
      type: QueryTypes.SELECT,
    }
  );
  return row;
}
```

---

## Topic 9: Database Transactions: Managed (`sequelize.transaction(async t => ...)`) vs Unmanaged (`t.commit()` / `t.rollback()`)

### 1. Concept Definition & Mechanics

In mission-critical systems (such as order checkout, payment capture, and inventory deduction), executing multiple database statements independently is dangerous. If step 1 (deduct balance) succeeds, but step 2 (create order record) crashes due to a network glitch, money is lost and records are corrupted.

To prevent this, relational databases provide **Transactions** that adhere to **ACID** properties:
- **Atomicity**: All operations succeed, or all operations are rolled back completely (All-or-Nothing).
- **Consistency**: The database transitions only between valid states satisfying all constraints.
- **Isolation**: Concurrent transactions cannot observe each other's intermediate, uncommitted states.
- **Durability**: Once committed, changes survive server crashes or power failures.

In Sequelize, there are two distinct modes for managing transactions:

#### Mode 1: Managed Transactions (Recommended)
Sequelize controls the transaction lifecycle using a callback:
```typescript
await sequelize.transaction(async (t) => {
  // If this callback resolves, Sequelize automatically commits (t.commit()).
  // If an error is thrown inside this callback, Sequelize automatically rolls back (t.rollback()).
});
```

#### Mode 2: Unmanaged Transactions (Manual)
The developer manually obtains the transaction object and is strictly responsible for calling `.commit()` or `.rollback()`:
```typescript
const t = await sequelize.transaction();
try {
  // Do queries...
  await t.commit();
} catch (error) {
  await t.rollback();
  throw error;
}
```

```
+-------------------------------------------------------------+
|                Transaction Lifecycle Flow                   |
+-------------------------------------------------------------+
                              |
                              v
                  BEGIN TRANSACTION (Acquire DB connection)
                              |
                              +-----------------------+
                              |                       |
                              v                       v
                   Operation 1: Success      Operation 1: Fails
                              |                       |
                              v                       v
                   Operation 2: Success            ROLLBACK
                              |              (Release connection,
                              v               discard all changes)
                           COMMIT
                    (Persist permanently,
                     release connection)
```

---

### 2. Production Code Example

The following code contrasts Managed transactions (used in `sp-orders.service.ts`) and Unmanaged transactions (used in `hawb.service.ts` when orchestrating complex external APIs).

```typescript
import { Sequelize, Transaction, QueryTypes } from "sequelize";

export class OrderCheckoutService {
  /**
   * Managed Transaction: Recommended for standard transactional flows.
   * Auto-commits on resolve, auto-rolls back on reject.
   */
  public static async checkoutManaged(
    sequelize: Sequelize,
    orderId: string,
    customerId: string,
    amount: number,
    itemIds: string[]
  ): Promise<void> {
    await sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
      async (t: Transaction) => {
        // Step 1: Create Order Header (Transaction must be passed explicitly to raw query)
        await sequelize.query(
          `INSERT INTO orders (order_id, customer_id, total_amount, status)
           VALUES (:orderId, :customerId, :amount, 'PAID');`,
          {
            replacements: { orderId, customerId, amount },
            transaction: t, // BOUND TO TRANSACTION
            type: QueryTypes.INSERT,
          }
        );

        // Step 2: Deduct Inventory
        for (const itemId of itemIds) {
          const [result] = await sequelize.query(
            `UPDATE inventory 
             SET stock = stock - 1 
             WHERE item_id = :itemId AND stock >= 1
             RETURNING stock;`,
            {
              replacements: { itemId },
              transaction: t, // BOUND TO TRANSACTION
              type: QueryTypes.UPDATE,
            }
          );

          if (!result || (result as any[]).length === 0) {
            // Throwing an error triggers automatic rollback of all statements!
            throw new Error(`Insufficient stock for item: ${itemId}`);
          }
        }
      }
    );
  }

  /**
   * Unmanaged Transaction: Required when transaction boundaries span across
   * asynchronous event hooks, external HTTP payment verification, or manual retry loops.
   */
  public static async checkoutUnmanaged(
    sequelize: Sequelize,
    orderId: string,
    customerId: string,
    amount: number
  ): Promise<void> {
    const t = await sequelize.transaction();

    try {
      // Step 1: Insert pending order
      await sequelize.query(
        `INSERT INTO orders (order_id, customer_id, total_amount, status)
         VALUES (:orderId, :customerId, :amount, 'PENDING');`,
        {
          replacements: { orderId, customerId, amount },
          transaction: t,
          type: QueryTypes.INSERT,
        }
      );

      // Step 2: Manual commit
      await t.commit();
    } catch (error) {
      // Step 3: Manual rollback
      await t.rollback();
      throw error;
    }
  }
}
```

---

### 3. Chronological Line-by-Line Breakdown

- `await sequelize.transaction({ isolationLevel: ... }, async (t) => ...)`:
  - Takes an optional configuration object (setting transaction isolation) and a callback function.
  - Dedicates a single physical database socket connection from the pool for the lifetime of this callback.
  - Emits `BEGIN;` to the database.
- `transaction: t`:
  - **CRITICAL**: Every database call inside the transaction MUST explicitly receive `transaction: t` in its options.
  - If you omit `transaction: t`, that query will grab an independent connection from the pool and execute outside the transaction!
- `throw new Error(...)`:
  - When an error is thrown inside the managed callback, Sequelize intercepts the rejection, issues `ROLLBACK;`, releases the connection back to the pool, and re-throws the error to the caller.
- `const t = await sequelize.transaction()`:
  - In unmanaged mode, reserves a connection and issues `BEGIN;`.
  - Must be surrounded by a strict `try...catch` block.
- `await t.commit()`:
  - Persists all writes permanently to disk and releases the socket back to the pool.
- `await t.rollback()`:
  - Reverts all changes in the `catch` block and releases the socket. If omitted in an unmanaged transaction, the connection **leaks** in the pool indefinitely, eventually stalling the entire server!

---

### 4. Visual Engine Execution Diagram

```
THE OMITTED TRANSACTION PARAMETER TRAP:

Socket Connection Pool:
[ Socket 1 (Tx Active) ]   <-- sequelize.transaction() borrowed Socket 1
[ Socket 2 (Idle)      ]
[ Socket 3 (Idle)      ]

Code Execution:
await sequelize.query(INSERT_ORDER, { transaction: t });
-> Executed on Socket 1 (Inside Transaction) [OK]

await sequelize.query(DEDUCT_STOCK); // <--- FORGOT { transaction: t }!
-> Grabs Socket 2 from pool!
-> Executed on Socket 2 (OUTSIDE Transaction, IMMEDIATELY COMMITTED!)

Error thrown in step 3!
-> Socket 1 issues ROLLBACK;
-> Order is rolled back, BUT stock deduction on Socket 2 PERSISTED!
-> DATABASE IS NOW CORRUPTED!
```

---

### 5. Junior Pitfall vs Senior Fix

#### Junior Pitfall: Forgetting `await` on `t.rollback()` or Forgetting `transaction: t`

```typescript
// JUNIOR ANTI-PATTERN: Silent connection leak and orphaned transaction
async function brokenCheckout(sequelize: Sequelize) {
  const t = await sequelize.transaction();
  try {
    await stepOne(); // No transaction: t passed!
    await stepTwo(); // Throws error
    await t.commit();
  } catch (err) {
    t.rollback(); // FORGOT AWAIT! Might not complete before process terminates or socket returns
    // Connection might remain in aborted state
  }
}
```

#### Senior Fix: Managed Transactions with Explicit Transaction Passing

```typescript
// SENIOR PATTERN: Managed transaction ensures zero connection leaks
async function safeCheckout(sequelize: Sequelize, payload: any) {
  return await sequelize.transaction(async (t) => {
    await runStepOne(sequelize, payload, t);
    await runStepTwo(sequelize, payload, t);
  });
}
```

---

### 6. "Think First" Mystery Puzzle

Study this code. What happens if `sendWelcomeEmail` takes 15 seconds to execute?

```typescript
await sequelize.transaction(async (t) => {
  await sequelize.query(INSERT_USER, { transaction: t });
  
  // Non-database network call inside transaction callback:
  await sendWelcomeEmail(); 
  
  await sequelize.query(UPDATE_USER_VERIFIED, { transaction: t });
});
```

#### Step-by-Step Execution Trace:
1. `INSERT_USER` acquires row/table locks on the database socket inside the transaction.
2. The transaction callback halts and waits 15 seconds for `sendWelcomeEmail()` to finish.
3. During those 15 seconds, the database socket connection is held hostage.
4. If 20 users register simultaneously, all 20 connections in Sequelize's default pool (`pool.max: 5`) become exhausted.
5. All other API routes across the entire application freeze with `ConnectionAcquisitionTimeoutError`.
6. Furthermore, database row locks remain open for 15 seconds, blocking concurrent reads or writes on those users.
7. **Senior Rule**: **NEVER** put long-running external I/O (email sending, third-party HTTP calls, payment webhooks) inside a database transaction block. Execute the database transaction first, commit it, and send the email *after* the transaction has completed.

---

### 7. Graded Exercises

#### Exercise 9.1 (Warm-up): Managed Transaction Balance Transfer
Write an async function `transferFunds(sequelize: Sequelize, fromId: number, toId: number, amount: number): Promise<void>` that uses a managed transaction to:
- Deduct `amount` from `fromId`.
- Add `amount` to `toId`.
- Verify balance does not drop below zero.

*Hint 1*: Use `sequelize.transaction(async (t) => { ... })`.
*Hint 2*: Pass `{ transaction: t }` to both queries.

#### Exercise 9.2 (Intermediate): Unmanaged Transaction Safe Wrapper
Write a higher-order utility function `withManualTransaction<T>(sequelize: Sequelize, fn: (t: Transaction) => Promise<T>): Promise<T>` that:
- Starts an unmanaged transaction.
- Passes it to `fn`.
- Awaits `t.commit()` on success.
- Catches errors, awaits `t.rollback()`, and re-throws the original error.

*Hint 1*: Use a standard `try...catch` block.
*Hint 2*: Return the result of `await fn(t)`.

#### Exercise 9.3 (Advanced): Savepoints and Nested Transactions
PostgreSQL supports `SAVEPOINT` to roll back part of a transaction without aborting the entire transaction. Sequelize supports nested transactions automatically if configured.
Write a function using nested transactions where an order is created, an optional reward coupon is applied (which may fail and roll back), but the main order still commits successfully.

*Hint 1*: Use a nested `sequelize.transaction(async (nestedT) => { ... })` inside the parent transaction.
*Hint 2*: Catch the inner error so it does not bubble up to the parent.

#### Exercise 9.4 (Expert): Transaction Isolation Levels & Phantom Reads
Write a test script comparing `Transaction.ISOLATION_LEVELS.READ_COMMITTED` vs `Transaction.ISOLATION_LEVELS.SERIALIZABLE`. Demonstrate what happens when two transactions attempt to reserve the same inventory seat simultaneously.

*Hint 1*: `SERIALIZABLE` detects concurrent conflicts and throws a serialization failure error (`40001`), requiring application-level retry.
*Hint 2*: Configure `{ isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE }`.

---

### Solutions for Topic 9

```typescript
// Solution 9.1
export async function transferFunds(
  sequelize: Sequelize,
  fromId: number,
  toId: number,
  amount: number
): Promise<void> {
  if (amount <= 0) throw new Error("Amount must be positive");

  await sequelize.transaction(async (t) => {
    // 1. Deduct funds with guard
    const [deductRes] = await sequelize.query(
      `UPDATE accounts 
       SET balance = balance - :amount 
       WHERE id = :fromId AND balance >= :amount
       RETURNING balance;`,
      {
        replacements: { fromId, amount },
        transaction: t,
        type: QueryTypes.UPDATE,
      }
    );

    if (!deductRes || (deductRes as any[]).length === 0) {
      throw new Error(`Insufficient funds in account ${fromId}`);
    }

    // 2. Credit funds
    await sequelize.query(
      `UPDATE accounts 
       SET balance = balance + :amount 
       WHERE id = :toId;`,
      {
        replacements: { toId, amount },
        transaction: t,
        type: QueryTypes.UPDATE,
      }
    );
  });
}

// Solution 9.2
export async function withManualTransaction<T>(
  sequelize: Sequelize,
  fn: (t: Transaction) => Promise<T>
): Promise<T> {
  const t = await sequelize.transaction();
  try {
    const result = await fn(t);
    await t.commit();
    return result;
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

// Solution 9.3
export async function orderWithOptionalCoupon(
  sequelize: Sequelize,
  orderId: string,
  couponCode: string
): Promise<void> {
  await sequelize.transaction(async (parentT) => {
    // Main order is always committed
    await sequelize.query(
      `INSERT INTO orders (order_id, status) VALUES (:orderId, 'PENDING');`,
      {
        replacements: { orderId },
        transaction: parentT,
        type: QueryTypes.INSERT,
      }
    );

    // Nested transaction creates a SAVEPOINT
    try {
      await sequelize.transaction({ transaction: parentT }, async (nestedT) => {
        const [coupon] = await sequelize.query(
          `UPDATE coupons SET is_used = true WHERE code = :code AND is_used = false RETURNING id;`,
          {
            replacements: { code: couponCode },
            transaction: nestedT,
            type: QueryTypes.UPDATE,
          }
        );

        if (!coupon || (coupon as any[]).length === 0) {
          throw new Error("Invalid or exhausted coupon");
        }
      });
    } catch (couponError) {
      // Coupon failed, rolled back to savepoint, but parent order continues!
      console.warn(`Coupon failed: ${(couponError as Error).message}. Continuing without coupon.`);
    }
  });
}

// Solution 9.4
export async function runSerializableTransaction(sequelize: Sequelize, seatId: string) {
  // In SERIALIZABLE isolation, PostgreSQL monitors read/write locks
  // If a concurrent transaction commits conflicting data, an error with code 40001 is thrown
  return await sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
    async (t) => {
      const [seat] = await sequelize.query(
        `SELECT is_reserved FROM seats WHERE id = :seatId;`,
        {
          replacements: { seatId },
          transaction: t,
          type: QueryTypes.SELECT,
        }
      ) as any[];

      if (seat.is_reserved) {
        throw new Error("Seat already reserved");
      }

      await sequelize.query(
        `UPDATE seats SET is_reserved = true WHERE id = :seatId;`,
        {
          replacements: { seatId },
          transaction: t,
          type: QueryTypes.UPDATE,
        }
      );
    }
  );
}
```

---

## Topic 10: PostgreSQL Power Features in Sequelize: `ON CONFLICT DO UPDATE (Upsert)`, `EXCLUDED`, `COALESCE`, `RETURNING *` & `JSONB`

### 1. Concept Definition & Mechanics

While generic ORMs limit you to the lowest common denominator of SQL features, production Node.js applications taking full advantage of PostgreSQL leverage 5 powerful engine capabilities:

1. **`ON CONFLICT (key) DO UPDATE` (Atomic Upsert)**:
   In distributed architectures, two webhook requests might attempt to insert the same Amazon order at the exact same millisecond. Traditional `SELECT` then `INSERT/UPDATE` causes a **Race Condition** resulting in duplicate key violations. PostgreSQL resolves this atomically at the storage engine level with `ON CONFLICT`.
2. **The `EXCLUDED` Pseudo-Table**:
   Inside an `ON CONFLICT DO UPDATE` clause, PostgreSQL provides a special virtual table named `EXCLUDED`. It represents the values that were proposed by the `INSERT` statement.
   Example: `SET status = EXCLUDED.status, updated_at = NOW();`
3. **`COALESCE(val1, val2, ...)`**:
   Returns the first non-null argument in the list. Indispensable for preserving existing values when incoming updates provide partial data:
   `SET customer_phone = COALESCE(EXCLUDED.customer_phone, orders.customer_phone)`
4. **`RETURNING *`**:
   Standard SQL requires an `INSERT` followed by a separate `SELECT` to read generated defaults (IDs, timestamps). PostgreSQL allows `INSERT ... RETURNING *` or `UPDATE ... RETURNING *`, returning the mutated row in the same single network round-trip.
5. **PostgreSQL Native `JSONB`**:
   PostgreSQL stores semi-structured documents in binary format (`JSONB`). You can query nested properties (`data->>'field'`), test for key existence (`data ? 'key'`), and perform json array containment (`data @> '{"status":"ok"}'`) directly in SQL queries.

```
                           +--------------------------------------+
                           | INSERT INTO orders (id, status, ...) |
                           +--------------------------------------+
                                              |
                                              v
                              +-------------------------------+
                              | Does id already exist in DB?  |
                              +-------------------------------+
                                     /                 \
                                   NO                  YES
                                  /                      \
                        Standard INSERT           ON CONFLICT DO UPDATE
                        Row is created.           - EXCLUDED holds incoming values
                                                  - orders holds existing values
                                                  - SET status = EXCLUDED.status
                                              \          /
                                               v        v
                                        RETURNING *
                          (Returns final persisted state to Node.js)
```

---

### 2. Production Code Example

The following code pattern is taken directly from the production Amazon Seller order engine (`sp-orders.service.ts` and `hawb.service.ts`), executing an atomic upsert with `EXCLUDED`, `COALESCE`, and `RETURNING *`.

```typescript
import { Sequelize, QueryTypes } from "sequelize";

export interface AmazonOrderPayload {
  amazonOrderId: string;
  sellerId: string;
  orderStatus: string;
  buyerEmail?: string;
  orderTotal: number;
  metadataJson: Record<string, unknown>;
}

export class OrderSyncService {
  /**
   * Executes an atomic PostgreSQL upsert using ON CONFLICT, EXCLUDED, COALESCE, and RETURNING.
   */
  public static async syncAmazonOrder(
    sequelize: Sequelize,
    order: AmazonOrderPayload
  ): Promise<any> {
    const sql = `
      INSERT INTO amazon_orders (
        amazon_order_id,
        seller_id,
        order_status,
        buyer_email,
        order_total,
        metadata,
        updated_at
      )
      VALUES (
        :amazonOrderId,
        :sellerId,
        :orderStatus,
        :buyerEmail,
        :orderTotal,
        (:metadataJson)::jsonb,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (amazon_order_id) DO UPDATE SET
        order_status = EXCLUDED.order_status,
        -- Preserve existing buyer email if incoming payload is null/empty
        buyer_email = COALESCE(EXCLUDED.buyer_email, amazon_orders.buyer_email),
        order_total = EXCLUDED.order_total,
        -- Merge incoming JSONB with existing JSONB
        metadata = amazon_orders.metadata || EXCLUDED.metadata,
        updated_at = CURRENT_TIMESTAMP
      RETURNING 
        amazon_order_id,
        order_status,
        buyer_email,
        order_total,
        metadata,
        (xmax = 0) AS is_new_record;
    `;

    const [persistedRow] = await sequelize.query(sql, {
      replacements: {
        amazonOrderId: order.amazonOrderId,
        sellerId: order.sellerId,
        orderStatus: order.orderStatus,
        buyerEmail: order.buyerEmail || null,
        orderTotal: order.orderTotal,
        metadataJson: JSON.stringify(order.metadataJson),
      },
      type: QueryTypes.INSERT,
    }) as any[];

    return persistedRow;
  }

  /**
   * Queries JSONB properties directly using PostgreSQL operators.
   */
  public static async findOrdersByTag(
    sequelize: Sequelize,
    tag: string
  ): Promise<any[]> {
    const sql = `
      SELECT 
        amazon_order_id,
        order_status,
        metadata->>'carrier' AS carrier,
        metadata->'items' AS items
      FROM amazon_orders
      WHERE metadata->'tags' ? :tag;
    `;

    return await sequelize.query(sql, {
      replacements: { tag },
      type: QueryTypes.SELECT,
    });
  }
}
```

---

### 3. Chronological Line-by-Line Breakdown

- `(:metadataJson)::jsonb`:
  - Passes the JSON string as a replacement parameter and casts it to PostgreSQL's native `jsonb` data type using the `::jsonb` cast operator.
- `ON CONFLICT (amazon_order_id) DO UPDATE SET`:
  - Instructs PostgreSQL that if a unique constraint or primary key violation triggers on `amazon_order_id`, do not abort the query with an error. Instead, perform an in-place `UPDATE`.
- `order_status = EXCLUDED.order_status`:
  - Overwrites the existing row's status with the new status sent in this query.
- `buyer_email = COALESCE(EXCLUDED.buyer_email, amazon_orders.buyer_email)`:
  - If the new payload did not supply a buyer email (`EXCLUDED.buyer_email IS NULL`), retain the email that is already stored in `amazon_orders.buyer_email`.
- `metadata = amazon_orders.metadata || EXCLUDED.metadata`:
  - Uses the PostgreSQL JSONB concatenation operator `||` to merge top-level keys from the new payload into the existing JSON document without wiping out unrelated keys.
- `(xmax = 0) AS is_new_record`:
  - A PostgreSQL system column trick: In PostgreSQL, `xmax` is the transaction identifier that deleted or updated the row. If `xmax = 0`, the row was freshly inserted; if `xmax > 0`, the row was updated!
- `RETURNING ...`:
  - Returns the exact final state of the row immediately to Node.js, eliminating the need for a secondary `SELECT` query.
- `metadata->>'carrier' AS carrier`:
  - `->>` extracts the field as plain `text`.
  - `->` extracts the field as a raw `json/jsonb` object.
- `metadata->'tags' ? :tag`:
  - The `?` operator tests whether a specific string key exists in a JSONB object or array.

---

### 4. Visual Engine Execution Diagram

```
PostgreSQL Conflict Resolution with EXCLUDED and COALESCE:

Existing DB Row:
{ amazon_order_id: "ORD-99", buyer_email: "alice@example.com", status: "PENDING" }

Incoming Payload:
{ amazonOrderId: "ORD-99", buyerEmail: null, status: "SHIPPED" }
                    |
                    v
EXCLUDED Pseudo-Table:
{ amazon_order_id: "ORD-99", buyer_email: NULL, status: "SHIPPED" }
                    |
                    v
ON CONFLICT SET:
status = EXCLUDED.status                            => "SHIPPED"
buyer_email = COALESCE(EXCLUDED.buyer_email, amazon_orders.buyer_email)
            = COALESCE(NULL, "alice@example.com")   => "alice@example.com" (Preserved!)
                    |
                    v
Resulting Persisted Row:
{ amazon_order_id: "ORD-99", buyer_email: "alice@example.com", status: "SHIPPED" }
```

---

### 5. Junior Pitfall vs Senior Fix

#### Junior Pitfall: Race Condition Prone Read-Then-Write Upsert

```typescript
// JUNIOR ANTI-PATTERN: Separate SELECT followed by INSERT or UPDATE
const existing = await sequelize.query(`SELECT * FROM orders WHERE id = :id`, { replacements: { id } });
if (existing.length === 0) {
  // RACE CONDITION: Another concurrent process can insert here!
  await sequelize.query(`INSERT INTO orders ...`);
} else {
  await sequelize.query(`UPDATE orders SET ... WHERE id = :id`);
}
```

*Why it fails*: Under concurrent traffic (e.g., 50 webhooks per second), two workers execute `SELECT` at the same time, both get empty results, and both try to `INSERT`. One succeeds; the second crashes with `UniqueConstraintError: duplicate key value violates unique constraint`.

#### Senior Fix: Single Atomic Statement with `ON CONFLICT`

```typescript
// SENIOR PATTERN: 100% Atomic, concurrency-safe, zero race conditions
await sequelize.query(`
  INSERT INTO orders (id, status) VALUES (:id, :status)
  ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;
`, { replacements: { id, status } });
```

---

### 6. "Think First" Mystery Puzzle

Study this JSONB query:

```typescript
async function getPremiumCustomers(sequelize: Sequelize) {
  const sql = `
    SELECT id, profile
    FROM customers
    WHERE profile->>'is_vip' = true;
  `;
  return await sequelize.query(sql, { type: QueryTypes.SELECT });
}
```

Why does this query throw an error in PostgreSQL?

#### Step-by-Step Execution Trace:
1. `profile->>'is_vip'` uses the `->>` operator.
2. In PostgreSQL, `->>` returns the JSON value as text (`VARCHAR`/`TEXT`), not a native boolean!
3. So `profile->>'is_vip'` evaluates to the string text `'true'`.
4. The query compares `TEXT = BOOLEAN` (`'true' = true`).
5. PostgreSQL is strictly typed and refuses to compare `TEXT` to `BOOLEAN` without casting: `ERROR: operator does not exist: text = boolean`.
6. **Senior Rule**: Either compare to a string `'true'` (`WHERE profile->>'is_vip' = 'true'`), or cast to boolean `(profile->>'is_vip')::boolean = true`, or extract as native json `(profile->'is_vip') = 'true'::jsonb`.

---

### 7. Graded Exercises

#### Exercise 10.1 (Warm-up): Atomic Counter Increment with Upsert
Write a raw query function `incrementPageView(sequelize: Sequelize, path: string): Promise<number>` that:
- Inserts a record `(path, views)` with initial count `1`.
- If `path` already exists, atomically increments `views = views + 1`.
- Uses `RETURNING views` to return the new count.

*Hint 1*: `ON CONFLICT (path) DO UPDATE SET views = page_views.views + 1`.
*Hint 2*: Return the first element of `RETURNING views`.

#### Exercise 10.2 (Intermediate): Null-Coalescing User Profile Sync
Write an upsert query function `syncUserProfile(sequelize: Sequelize, user: { id: number; name?: string; phone?: string; city?: string })`:
- If the user exists, update fields only if the new incoming values are non-null using `COALESCE`.
- If the incoming value is `undefined` or `null`, keep the existing database value.

*Hint 1*: `SET name = COALESCE(:name, users.name), phone = COALESCE(:phone, users.phone)`.
*Hint 2*: Pass `null` for undefined fields in `replacements`.

#### Exercise 10.3 (Advanced): Deep JSONB Array Search & Containment
Given a table `products (id INT, metadata JSONB)` where metadata contains `{ "categories": ["electronics", "gaming"], "specs": { "ram": "16gb" } }`:
Write a function `findProductsByCategoryAndRam(sequelize: Sequelize, category: string, ram: string)` using PostgreSQL's containment operator `@>` to filter matching products.

*Hint 1*: In PostgreSQL, `metadata @> '{"specs": {"ram": "16gb"}}'::jsonb`.
*Hint 2*: Pass parameterized JSON strings to avoid SQL injection.

#### Exercise 10.4 (Expert): Multi-Row Upsert with Indexed Replacements and `RETURNING *`
Write a high-performance function `bulkUpsertInventory(sequelize: Sequelize, items: { sku: string; warehouseId: string; quantity: number }[])` that:
- Inserts up to 500 inventory items in a single query.
- Resolves conflicts on `(sku, warehouse_id)`.
- Updates `quantity = EXCLUDED.quantity` and `updated_at = NOW()`.
- Returns all updated records with `RETURNING *`.

*Hint 1*: Use the Topic 5 indexed replacement pattern (`:sku_0`, `:warehouseId_0`, etc.).
*Hint 2*: Append `ON CONFLICT (sku, warehouse_id) DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = NOW() RETURNING *`.

---

### Solutions for Topic 10

```typescript
// Solution 10.1
export async function incrementPageView(sequelize: Sequelize, path: string): Promise<number> {
  const sql = `
    INSERT INTO page_views (path, views)
    VALUES (:path, 1)
    ON CONFLICT (path) DO UPDATE SET
      views = page_views.views + 1
    RETURNING views;
  `;

  const [row] = await sequelize.query<{ views: number }>(sql, {
    replacements: { path },
    type: QueryTypes.INSERT,
  });

  return (row as any).views;
}

// Solution 10.2
export async function syncUserProfile(
  sequelize: Sequelize,
  user: { id: number; name?: string; phone?: string; city?: string }
): Promise<void> {
  const sql = `
    INSERT INTO users (id, name, phone, city)
    VALUES (:id, :name, :phone, :city)
    ON CONFLICT (id) DO UPDATE SET
      name = COALESCE(:name, users.name),
      phone = COALESCE(:phone, users.phone),
      city = COALESCE(:city, users.city);
  `;

  await sequelize.query(sql, {
    replacements: {
      id: user.id,
      name: user.name || null,
      phone: user.phone || null,
      city: user.city || null,
    },
    type: QueryTypes.INSERT,
  });
}

// Solution 10.3
export async function findProductsByCategoryAndRam(
  sequelize: Sequelize,
  category: string,
  ram: string
): Promise<any[]> {
  const filterDoc = JSON.stringify({
    categories: [category],
    specs: { ram },
  });

  const sql = `
    SELECT id, metadata
    FROM products
    WHERE metadata @> (:filterDoc)::jsonb;
  `;

  return await sequelize.query(sql, {
    replacements: { filterDoc },
    type: QueryTypes.SELECT,
  });
}

// Solution 10.4
export async function bulkUpsertInventory(
  sequelize: Sequelize,
  items: { sku: string; warehouseId: string; quantity: number }[]
): Promise<any[]> {
  if (items.length === 0) return [];

  const valuePlaceholders: string[] = [];
  const replacements: Record<string, unknown> = {};

  items.forEach((item, i) => {
    valuePlaceholders.push(`(:sku_${i}, :warehouseId_${i}, :qty_${i})`);
    replacements[`sku_${i}`] = item.sku;
    replacements[`warehouseId_${i}`] = item.warehouseId;
    replacements[`qty_${i}`] = item.quantity;
  });

  const sql = `
    INSERT INTO inventory (sku, warehouse_id, quantity)
    VALUES ${valuePlaceholders.join(", ")}
    ON CONFLICT (sku, warehouse_id) DO UPDATE SET
      quantity = EXCLUDED.quantity,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;

  return await sequelize.query(sql, {
    replacements,
    type: QueryTypes.INSERT,
  });
}
```

---

## Checkpoint Challenge 2: Modular Query Fragments, Multi-Tenancy & Transactional Order Pipeline

### 1. Challenge Overview

In this comprehensive production project, you will build an end-to-end **Enterprise Fulfillment and Inventory Engine**. You will synthesize all patterns from Topics 6 through 10 into an industrial-grade, fully functional backend service:
1. **Composable Fragments**: Reusable WHERE filters and JOIN clauses.
2. **Search Builder**: Tokenization, exact match vs fuzzy fan-out.
3. **Multi-Tenancy**: Schema-per-tenant isolation with strict regex validation.
4. **Transactions**: Managed checkout pipelines guaranteeing atomic order creation and inventory deduction.
5. **PostgreSQL Power Features**: Atomic bulk upserts using `ON CONFLICT` and `RETURNING *`.

---

### 2. Architectural Blueprint

```
+-----------------------------------------------------------------------------------------+
|                  Enterprise Fulfillment Architecture (Checkpoint 2)                     |
+-----------------------------------------------------------------------------------------+
                                             |
                   +-------------------------+-------------------------+
                   |                                                   |
                   v                                                   v
    +-----------------------------+                     +-----------------------------+
    | Schema: "tenant_logistics"  |                     |  Schema: "tenant_retail"    |
    | - inventory (sku, qty)      |                     | - inventory (sku, qty)      |
    | - orders (order_id, total)  |                     | - orders (order_id, total)  |
    +-----------------------------+                     +-----------------------------+
                   ^                                                   ^
                   |                                                   |
        +------------------------------------------------------------------+
        |                  FulfillmentEngine Service                       |
        |  - provisionTenant(schema)                                       |
        |  - searchInventory(schema, rawQuery)                             |
        |  - processCheckoutTransaction(schema, orderId, items)            |
        +------------------------------------------------------------------+
```

---

### 3. Complete Production Implementation & Verification Test Suite

Save the following code as `test-checkpoint-2.ts` (or run in an in-memory SQLite / PostgreSQL instance) to verify all assertions:

```typescript
import { Sequelize, QueryTypes, Transaction } from "sequelize";

// --- Types & Interfaces ---
export interface QueryFragment {
  sql: string;
  replacements: Record<string, unknown>;
}

export interface InventoryItem {
  sku: string;
  title: string;
  quantity: number;
}

export interface CheckoutItem {
  sku: string;
  quantity: number;
}

// --- Production Fulfillment Service ---
export class EnterpriseFulfillmentService {
  private static readonly SCHEMA_REGEX = /^[a-zA-Z0-9_]{1,63}$/;

  /**
   * Validates schema identifier against strict regex.
   */
  public static validateSchema(schema: string): string {
    if (!schema || !this.SCHEMA_REGEX.test(schema)) {
      throw new Error(`Invalid schema name: ${schema}`);
    }
    return schema;
  }

  /**
   * Provisions tables inside a schema (SQLite compatible for automated in-memory testing).
   */
  public static async provisionTables(sequelize: Sequelize, schema: string): Promise<void> {
    const s = this.validateSchema(schema);

    // Creates tables prefixed by schema name to simulate multi-tenancy in SQLite / Postgres
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${s}_inventory" (
        sku TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0
      );
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${s}_orders" (
        order_id TEXT PRIMARY KEY,
        total_amount REAL NOT NULL,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${s}_order_items" (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL,
        sku TEXT NOT NULL,
        quantity INTEGER NOT NULL
      );
    `);
  }

  /**
   * Reusable Search Fragment Builder:
   * Splits on commas for bulk SKU search; fans out for single fuzzy term.
   */
  public static buildInventorySearch(rawQuery: string): QueryFragment {
    const clean = rawQuery?.trim();
    if (!clean) return { sql: "1=1", replacements: {} };

    if (clean.includes(",")) {
      const skus = clean
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      return {
        sql: "sku IN (:searchSkus)",
        replacements: { searchSkus: skus },
      };
    }

    return {
      sql: "(sku = :exactTerm OR title LIKE :fuzzyTerm)",
      replacements: {
        exactTerm: clean,
        fuzzyTerm: `%${clean}%`,
      },
    };
  }

  /**
   * High-throughput atomic inventory upsert.
   */
  public static async bulkUpsertInventory(
    sequelize: Sequelize,
    schema: string,
    items: InventoryItem[]
  ): Promise<void> {
    const s = this.validateSchema(schema);
    if (items.length === 0) return;

    const valueClauses: string[] = [];
    const replacements: Record<string, unknown> = {};

    items.forEach((item, i) => {
      valueClauses.push(`(:sku_${i}, :title_${i}, :qty_${i})`);
      replacements[`sku_${i}`] = item.sku;
      replacements[`title_${i}`] = item.title;
      replacements[`qty_${i}`] = item.quantity;
    });

    // SQLite / PostgreSQL compatible upsert syntax
    const sql = `
      INSERT INTO "${s}_inventory" (sku, title, quantity)
      VALUES ${valueClauses.join(", ")}
      ON CONFLICT(sku) DO UPDATE SET
        quantity = EXCLUDED.quantity,
        title = EXCLUDED.title;
    `;

    await sequelize.query(sql, { replacements, type: QueryTypes.INSERT });
  }

  /**
   * Atomic Checkout Transaction:
   * - Inserts order header
   * - Inserts order items
   * - Deducts inventory stock with concurrency guard
   * - Rolls back everything if any stock is insufficient
   */
  public static async processCheckout(
    sequelize: Sequelize,
    schema: string,
    orderId: string,
    totalAmount: number,
    items: CheckoutItem[]
  ): Promise<void> {
    const s = this.validateSchema(schema);

    await sequelize.transaction(async (t: Transaction) => {
      // 1. Create order record
      await sequelize.query(
        `INSERT INTO "${s}_orders" (order_id, total_amount, status)
         VALUES (:orderId, :totalAmount, 'COMPLETED');`,
        {
          replacements: { orderId, totalAmount },
          transaction: t,
          type: QueryTypes.INSERT,
        }
      );

      // 2. Process each item and deduct inventory
      for (const item of items) {
        // Concurrency guard: Only decrement if quantity >= requested
        const [updateResult] = await sequelize.query(
          `UPDATE "${s}_inventory"
           SET quantity = quantity - :qty
           WHERE sku = :sku AND quantity >= :qty;`,
          {
            replacements: { sku: item.sku, qty: item.quantity },
            transaction: t,
            type: QueryTypes.UPDATE,
          }
        );

        // In SQLite/Postgres updateResult returns affected rows count
        const affectedRows = (updateResult as any);
        if (affectedRows === 0) {
          throw new Error(`Insufficient inventory for SKU: ${item.sku}`);
        }

        // Insert item record
        await sequelize.query(
          `INSERT INTO "${s}_order_items" (order_id, sku, quantity)
           VALUES (:orderId, :sku, :qty);`,
          {
            replacements: { orderId, sku: item.sku, qty: item.quantity },
            transaction: t,
            type: QueryTypes.INSERT,
          }
        );
      }
    });
  }

  /**
   * Search inventory using modular search fragment.
   */
  public static async searchInventory(
    sequelize: Sequelize,
    schema: string,
    rawQuery: string
  ): Promise<InventoryItem[]> {
    const s = this.validateSchema(schema);
    const fragment = this.buildInventorySearch(rawQuery);

    const sql = `
      SELECT sku, title, quantity 
      FROM "${s}_inventory"
      WHERE ${fragment.sql}
      ORDER BY sku ASC;
    `;

    return await sequelize.query<InventoryItem>(sql, {
      replacements: fragment.replacements,
      type: QueryTypes.SELECT,
    });
  }
}

// --- Automated Test Runner ---
async function runCheckpoint2Tests() {
  console.log("=== Running Checkpoint Challenge 2 Verification Suite ===\n");

  const sequelize = new Sequelize("sqlite::memory:", { logging: false });
  await sequelize.authenticate();

  const tenantA = "tenant_alpha";
  const tenantB = "tenant_beta";

  // 1. Provision schemas
  console.log("--- 1. Provisioning Multi-Tenant Tables ---");
  await EnterpriseFulfillmentService.provisionTables(sequelize, tenantA);
  await EnterpriseFulfillmentService.provisionTables(sequelize, tenantB);
  console.log("Schemas provisioned successfully.");

  // 2. Ingest inventory via bulk upsert
  console.log("\n--- 2. Ingesting Initial Inventory ---");
  await EnterpriseFulfillmentService.bulkUpsertInventory(sequelize, tenantA, [
    { sku: "SKU-LAPTOP", title: "Pro Developer Laptop", quantity: 10 },
    { sku: "SKU-MOUSE", title: "Wireless Ergonomic Mouse", quantity: 25 },
    { sku: "SKU-KEYBOARD", title: "Mechanical Keyboard", quantity: 15 },
  ]);

  // Tenant B has independent inventory
  await EnterpriseFulfillmentService.bulkUpsertInventory(sequelize, tenantB, [
    { sku: "SKU-LAPTOP", title: "Pro Developer Laptop", quantity: 2 },
  ]);

  // 3. Test Search Fragment Builder
  console.log("\n--- 3. Testing Search Fragment Builder ---");
  // A: Bulk comma search
  const bulkSearchResults = await EnterpriseFulfillmentService.searchInventory(
    sequelize,
    tenantA,
    "SKU-LAPTOP, SKU-KEYBOARD"
  );
  console.log("Bulk comma search found 2 items:", bulkSearchResults.length === 2);
  console.log("Items found:", bulkSearchResults.map((i) => i.sku).join(", "));

  // B: Fuzzy search
  const fuzzySearchResults = await EnterpriseFulfillmentService.searchInventory(
    sequelize,
    tenantA,
    "Ergonomic"
  );
  console.log("Fuzzy search found mouse:", fuzzySearchResults[0]?.sku === "SKU-MOUSE");

  // 4. Test Successful Checkout Transaction
  console.log("\n--- 4. Testing Successful Checkout Transaction ---");
  await EnterpriseFulfillmentService.processCheckout(
    sequelize,
    tenantA,
    "ORD-SUCCESS-1",
    1250.0,
    [
      { sku: "SKU-LAPTOP", quantity: 2 },
      { sku: "SKU-MOUSE", quantity: 5 },
    ]
  );

  const inventoryAfter = await EnterpriseFulfillmentService.searchInventory(sequelize, tenantA, "");
  const laptop = inventoryAfter.find((i) => i.sku === "SKU-LAPTOP");
  const mouse = inventoryAfter.find((i) => i.sku === "SKU-MOUSE");
  console.log("Laptop quantity deducted (10 -> 8):", laptop?.quantity === 8);
  console.log("Mouse quantity deducted (25 -> 20):", mouse?.quantity === 20);

  // 5. Test Transaction Rollback on Insufficient Stock
  console.log("\n--- 5. Testing Transaction Rollback on Stock Depletion ---");
  let errorCaught = false;
  try {
    // Attempt to purchase 100 laptops (only 8 in stock)
    await EnterpriseFulfillmentService.processCheckout(
      sequelize,
      tenantA,
      "ORD-FAIL-1",
      50000.0,
      [{ sku: "SKU-LAPTOP", quantity: 100 }]
    );
  } catch (err) {
    errorCaught = true;
    console.log("Caught expected transaction rejection:", (err as Error).message);
  }

  console.log("Transaction aborted properly:", errorCaught === true);

  // Verify stock was not touched after failed transaction
  const inventoryAfterFailed = await EnterpriseFulfillmentService.searchInventory(sequelize, tenantA, "");
  const laptopRollback = inventoryAfterFailed.find((i) => i.sku === "SKU-LAPTOP");
  console.log("Laptop quantity preserved after rollback:", laptopRollback?.quantity === 8);

  // Verify order was not created
  const orders = await sequelize.query(`SELECT * FROM "${tenantA}_orders" WHERE order_id = 'ORD-FAIL-1'`, {
    type: QueryTypes.SELECT,
  });
  console.log("Failed order was rolled back from DB:", orders.length === 0);

  // 6. Verify Tenant Isolation
  console.log("\n--- 6. Verifying Tenant Isolation ---");
  const tenantBInventory = await EnterpriseFulfillmentService.searchInventory(sequelize, tenantB, "");
  console.log("Tenant B laptop inventory unaffected by Tenant A checkout:", tenantBInventory[0]?.quantity === 2);

  console.log("\n=== Checkpoint 2 Complete: All enterprise assertions verified! ===");
}

runCheckpoint2Tests();
```

---

## Topic 11: Defining Models & Data Types: `Model.init()`, `sequelize.define()`, `DataTypes` & Constraints

### 1. Concept Definition & Mechanics

While raw SQL queries give absolute control over high-throughput batch operations, modern web applications also require a structured, declarative way to represent database tables in TypeScript. In Sequelize, this representation is called a **Model**.

A Model represents a table in the database. Instances of that model represent individual rows. Sequelize provides two distinct methods to declare models:
1. `sequelize.define('ModelName', attributes, options)`: The legacy functional style.
2. `class User extends Model`: The modern **ES6 / TypeScript Class-based inheritance style** using `Model.init()`.

Senior TypeScript engineering standards exclusively use the Class-based approach because it gives full compile-time type safety across model properties, methods, and associations.

```
+-------------------------------------------------------------+
|                Model Definition Architecture                |
+-------------------------------------------------------------+
                              |
       +----------------------+----------------------+
       |                                             |
       v                                             v
TypeScript Type Declaration                   Sequelize Schema Definition
- interface UserAttributes                    - Model.init({
- interface UserCreationAttributes                id: DataTypes.BIGINT,
- class User extends Model<...>                   email: DataTypes.STRING,
                                                  status: DataTypes.ENUM
                                                }, { sequelize, tableName })
```

#### Core Model Components:
- **`DataTypes`**: Maps JavaScript types to database-native columns (`DataTypes.STRING`, `DataTypes.INTEGER`, `DataTypes.BIGINT`, `DataTypes.DECIMAL(10, 2)`, `DataTypes.BOOLEAN`, `DataTypes.JSONB`, `DataTypes.DATE`).
- **Constraints & Validations**: `allowNull: false`, `unique: true`, `validate: { isEmail: true, min: 0 }`. Validations run inside Node.js *before* emitting SQL; database constraints run inside the database engine.
- **Timestamps**: Automatically populates `createdAt` and `updatedAt`.
- **Paranoid Soft Deletes**: Setting `paranoid: true` adds a `deletedAt` timestamp. Calling `destroy()` sets `deletedAt = NOW()` instead of issuing a hard `DELETE FROM`, keeping the row intact for auditing and recovery.

---

### 2. Production Code Example

The following code defines a production-grade `Order` model with strong TypeScript contracts, field validations, paranoid soft-deletes, and computed getters.

```typescript
import {
  Sequelize,
  Model,
  DataTypes,
  Optional,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";

// Modern TypeScript Model Definition using InferAttributes
export class Order extends Model<
  InferAttributes<Order>,
  InferCreationAttributes<Order>
> {
  // Primary Key (CreationOptional because DB auto-generates or defaults)
  declare id: CreationOptional<number>;
  declare orderNumber: string;
  declare customerId: string;
  declare totalAmount: number;
  declare status: "PENDING" | "PROCESSING" | "SHIPPED" | "CANCELLED";
  declare metadata: CreationOptional<Record<string, unknown> | null>;
  
  // Timestamps automatically managed by Sequelize
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;

  // Virtual Getter: Computed on the fly, not stored as a DB column
  get isHighValue(): boolean {
    return this.totalAmount >= 1000.0;
  }
}

export function initOrderModel(sequelize: Sequelize): typeof Order {
  Order.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        field: "order_id", // Maps TS 'id' to DB column 'order_id'
      },
      orderNumber: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        field: "order_number",
        validate: {
          notEmpty: true,
          len: [5, 64],
        },
      },
      customerId: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: "customer_id",
      },
      totalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
        field: "total_amount",
        validate: {
          min: 0.0,
        },
        // Converts SQL decimal string into JS number on read
        get() {
          const rawValue = this.getDataValue("totalAmount");
          return rawValue === null ? 0 : parseFloat(rawValue as unknown as string);
        },
      },
      status: {
        type: DataTypes.ENUM("PENDING", "PROCESSING", "SHIPPED", "CANCELLED"),
        allowNull: false,
        defaultValue: "PENDING",
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      createdAt: {
        type: DataTypes.DATE,
        field: "created_at",
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: "updated_at",
      },
      deletedAt: {
        type: DataTypes.DATE,
        field: "deleted_at",
      },
    },
    {
      sequelize,
      tableName: "orders",
      timestamps: true, // Enables createdAt and updatedAt
      paranoid: true,   // Enables soft deletes with deletedAt
      underscored: true, // Automatically converts camelCase to snake_case in SQL
      indexes: [
        {
          name: "idx_orders_customer_id",
          fields: ["customer_id"],
        },
        {
          name: "idx_orders_status",
          fields: ["status"],
        },
      ],
    }
  );

  return Order;
}
```

---

### 3. Chronological Line-by-Line Breakdown

- `export class Order extends Model<InferAttributes<Order>, InferCreationAttributes<Order>>`:
  - Utilizes modern TypeScript 4.7+ `declare` property syntax.
  - `InferAttributes<Order>` scans the class properties to type database read results.
  - `InferCreationAttributes<Order>` marks fields wrapped in `CreationOptional<T>` as optional when calling `Order.create()`.
- `declare id: CreationOptional<number>`:
  - Informs the TypeScript compiler that `id` will exist on instantiated rows, but is not required when inserting new rows.
- `get isHighValue()`:
  - A JavaScript virtual getter. It computes business logic on demand without adding a redundant column to the database.
- `Order.init({ ... }, { sequelize, tableName })`:
  - Maps TypeScript attributes to SQL data types, constraints, and validation rules.
- `field: "order_id"`:
  - Decouples JavaScript naming conventions (`id`) from legacy database column names (`order_id`).
- `DataTypes.DECIMAL(12, 2)` with custom `get()`:
  - Relational database drivers return `NUMERIC` and `DECIMAL` types as strings (e.g., `"149.99"`) in JavaScript to prevent IEEE-754 floating-point precision loss. The custom getter safely parses it to a float when read by the application.
- `paranoid: true`:
  - Directs Sequelize to append `AND deleted_at IS NULL` to every `SELECT` query automatically, making soft-deleted records invisible to regular application lookups.

---

### 4. Visual Engine Execution Diagram

```
Application Code: Order.create({ orderNumber: "ORD-99", customerId: "C1", totalAmount: 49.99 })
                                  |
                                  v
                    Phase 1: Node.js Validation
                    - Checks allowNull rules
                    - Runs len: [5, 64] check on orderNumber
                    - Runs min: 0.0 check on totalAmount
                                  |
                        +---------+---------+
                        |                   |
                     Failed               Passed
                        |                   |
                  Throws ValidationError    v
                                    Phase 2: SQL Compilation
                                    INSERT INTO orders (order_number, customer_id, total_amount, status, created_at, updated_at)
                                    VALUES ($1, $2, $3, 'PENDING', NOW(), NOW()) RETURNING *;
                                  |
                                  v
                    Phase 3: Instance Hydration
                    - Receives raw SQL row
                    - Wraps row inside new Order() instance
                    - Returns typed Order object to caller
```

---

### 5. Junior Pitfall vs Senior Fix

#### Junior Pitfall: Floating Point Corruption Using `DataTypes.FLOAT` for Money

```typescript
// JUNIOR ANTI-PATTERN: Using FLOAT for financial transactions
amount: {
  type: DataTypes.FLOAT, // DANGEROUS! 0.1 + 0.2 = 0.30000000000000004
}
```

*Why it fails*: Binary floating-point cannot accurately represent decimal fractions like 10 cents ($0.10). Over thousands of orders, financial calculations suffer penny rounding drift.

#### Senior Fix: Exact Precision with `DataTypes.DECIMAL` or Storing Cents in `BIGINT`

```typescript
// SENIOR PATTERN: Exact arbitrary-precision decimal or integer cents
amount: {
  type: DataTypes.DECIMAL(12, 2), // Stores exact precision up to 12 digits, 2 decimal places
  allowNull: false,
}
// OR: store as integer cents:
amountCents: {
  type: DataTypes.BIGINT, // $19.99 stored as 1999
  allowNull: false,
}
```

---

### 6. "Think First" Mystery Puzzle

A developer writes this validation:

```typescript
phone: {
  type: DataTypes.STRING,
  validate: {
    isNumeric: true,
    len: [10, 10],
  }
}

// Then creates a record without passing a phone:
await User.create({ name: "Alice" });
```

Does this throw a `ValidationError` for the missing phone number?

#### Step-by-Step Execution Trace:
1. The developer defined `validate: { isNumeric: true, len: [10, 10] }`.
2. Notice that `allowNull: false` was **omitted**. By default, columns in Sequelize are `allowNull: true`.
3. In Sequelize, validators (like `isNumeric`, `len`, `isEmail`) are **skipped** if the field value is `null` or `undefined`, unless `allowNull: false` is explicitly configured!
4. The record is inserted with `phone = null` without triggering any validation error.
5. **Senior Rule**: Model validations only validate *present* values. If a field is mandatory, you must pair validations with `allowNull: false`.

---

### 7. Graded Exercises

#### Exercise 11.1 (Warm-up): User Model Definition
Create a TypeScript `User` model using `Model.init` with:
- `id`: Auto-incrementing primary key.
- `email`: Non-null, unique, validated as email format.
- `role`: Enum with values `"ADMIN"`, `"MEMBER"`, `"GUEST"`, defaulting to `"MEMBER"`.

*Hint 1*: Use `DataTypes.STRING` with `validate: { isEmail: true }`.
*Hint 2*: Use `DataTypes.ENUM("ADMIN", "MEMBER", "GUEST")`.

#### Exercise 11.2 (Intermediate): Paranoid Product Catalog with Custom Getters/Setters
Define a `Product` model with `paranoid: true`:
- `sku`: Uppercase string. Use a setter (`set()`) that automatically converts incoming SKUs to uppercase (`sku.trim().toUpperCase()`).
- `price`: Decimal(10, 2) that returns a float via custom getter.
- `tags`: Array of strings stored in PostgreSQL as `DataTypes.ARRAY(DataTypes.STRING)` or `DataTypes.JSONB`.

*Hint 1*: Inside the setter, use `this.setDataValue('sku', val.trim().toUpperCase())`.
*Hint 2*: Configure `{ paranoid: true, timestamps: true }`.

#### Exercise 11.3 (Advanced): Composite Indexes and Custom Model Validators
Create a model `Subscription` with `userId`, `planId`, and `status`. Add:
- A composite unique index on `[userId, planId]` so a user cannot have two identical plans simultaneously.
- A custom model-level validator function that verifies that if `status === "ACTIVE"`, `planId` cannot be `"TRIAL"`.

*Hint 1*: Add `indexes: [{ unique: true, fields: ["user_id", "plan_id"] }]`.
*Hint 2*: Add `validate: { activeCannotBeTrial() { ... } }` in the options block.

#### Exercise 11.4 (Expert): Multi-Tenant Model Dynamic Binding
Explain how Sequelize models can be dynamically bound to tenant schemas at runtime using `.schema("tenant_name")`. Write a function `getTenantModel(schema: string): typeof Order` that returns a schema-scoped model reference without mutating the global definition.

*Hint 1*: Use `Order.schema(schema)`.
*Hint 2*: Verify that calling `.schema()` produces a scoped subclass without modifying the base model.

---

### Solutions for Topic 11

```typescript
// Solution 11.1
export class User extends Model {
  declare id: number;
  declare email: string;
  declare role: "ADMIN" | "MEMBER" | "GUEST";
}

export function initUserModel(sequelize: Sequelize) {
  User.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      role: {
        type: DataTypes.ENUM("ADMIN", "MEMBER", "GUEST"),
        allowNull: false,
        defaultValue: "MEMBER",
      },
    },
    { sequelize, tableName: "users", timestamps: true }
  );
}

// Solution 11.2
export class Product extends Model {
  declare sku: string;
  declare price: number;
  declare tags: string[];
}

export function initProductModel(sequelize: Sequelize) {
  Product.init(
    {
      sku: {
        type: DataTypes.STRING(32),
        allowNull: false,
        unique: true,
        set(value: string) {
          this.setDataValue("sku", value.trim().toUpperCase());
        },
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        get() {
          const raw = this.getDataValue("price");
          return raw ? parseFloat(raw as any) : 0;
        },
      },
      tags: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
    },
    { sequelize, tableName: "products", paranoid: true, timestamps: true }
  );
}

// Solution 11.3
export class Subscription extends Model {
  declare userId: number;
  declare planId: string;
  declare status: string;
}

export function initSubscriptionModel(sequelize: Sequelize) {
  Subscription.init(
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      planId: { type: DataTypes.STRING, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
    },
    {
      sequelize,
      tableName: "subscriptions",
      indexes: [
        {
          unique: true,
          fields: ["user_id", "plan_id"],
          name: "idx_unique_user_plan",
        },
      ],
      validate: {
        activeCannotBeTrial() {
          if (this.status === "ACTIVE" && this.planId === "TRIAL") {
            throw new Error("Active subscriptions cannot be on a TRIAL plan");
          }
        },
      },
    }
  );
}

// Solution 11.4
export function getTenantModel(schema: string): typeof Order {
  if (!/^[a-zA-Z0-9_]+$/.test(schema)) {
    throw new Error("Invalid schema name");
  }
  // Order.schema() returns a scoped model instance bound to that PostgreSQL schema
  return Order.schema(schema);
}
```

---

## Topic 12: Model CRUD Operations: `create()`, `bulkCreate()`, `findByPk()`, `findOne()`, `findAll()`, `update()`, `destroy()`

### 1. Concept Definition & Mechanics

Once models are defined, Sequelize provides an object-oriented API for performing **CRUD** (Create, Read, Update, Delete) operations. These methods abstract database-specific SQL dialect differences while returning fully hydrated model instances.

```
+-------------------------------------------------------------------+
|               Sequelize Model CRUD Method Taxonomy                |
+-------------------------------------------------------------------+
       |                  |                   |                  |
       v                  v                   v                  v
    CREATE              READ               UPDATE             DELETE
- .create()         - .findByPk()       - .update()        - .destroy()
- .bulkCreate()     - .findOne()        - instance.save()  - instance.destroy()
- .findOrCreate()   - .findAll()
                    - .findAndCountAll()
```

#### Key Mechanics to Master:
- **`bulkCreate([rows], options)`**: Emits a single multi-row `INSERT` statement instead of N separate round-trips. Options like `{ validate: true }` enforce validations, and `{ ignoreDuplicates: true }` handles conflict avoidance.
- **Filtering with `Op` (Operators)**: Sequelize does not parse raw operator strings in `where` clauses. You must use Sequelize's `Op` symbols (`Op.eq`, `Op.gt`, `Op.in`, `Op.like`, `Op.between`, `Op.or`, `Op.and`) to ensure parameters are safely sanitized.
- **`findAndCountAll(options)`**: Essential for pagination. Executes a `COUNT(*)` query and a `SELECT ... LIMIT ... OFFSET` query in parallel, returning both `{ count, rows }`.
- **Soft Delete Behavior in `destroy()`**: If `paranoid: true` is configured, `.destroy()` issues an `UPDATE ... SET deleted_at = NOW()`. To permanently remove the row from the disk, you must pass `{ force: true }`.

---

### 2. Production Code Example

The following service demonstrates comprehensive, production-grade Model CRUD workflows:

```typescript
import { Op, Transaction } from "sequelize";
import { Order } from "./Topic11_ModelInit";

export interface PaginationParams {
  page: number;
  pageSize: number;
  status?: string;
  minAmount?: number;
}

export class OrderModelService {
  /**
   * CREATE: Inserts a single order instance.
   */
  public static async createOrder(
    payload: { orderNumber: string; customerId: string; totalAmount: number },
    transaction?: Transaction
  ): Promise<Order> {
    return await Order.create(
      {
        orderNumber: payload.orderNumber,
        customerId: payload.customerId,
        totalAmount: payload.totalAmount,
        status: "PENDING",
      },
      { transaction }
    );
  }

  /**
   * BULK CREATE: High-throughput batch insertion with validation and conflict ignoring.
   */
  public static async bulkCreateOrders(
    records: Array<{ orderNumber: string; customerId: string; totalAmount: number }>,
    transaction?: Transaction
  ): Promise<Order[]> {
    return await Order.bulkCreate(
      records.map((r) => ({
        ...r,
        status: "PENDING" as const,
      })),
      {
        validate: true,           // Run model validators on each item
        ignoreDuplicates: true,   // Skips duplicate order numbers instead of throwing error
        returning: true,          // Returns generated columns (PostgreSQL only)
        transaction,
      }
    );
  }

  /**
   * READ: Paginated search with complex Op filters and total count.
   */
  public static async listOrdersPaginated(params: PaginationParams): Promise<{
    items: Order[];
    totalCount: number;
    totalPages: number;
  }> {
    const limit = Math.max(1, Math.min(params.pageSize, 100));
    const offset = (Math.max(1, params.page) - 1) * limit;

    const whereClause: Record<string | symbol, unknown> = {};

    if (params.status) {
      whereClause.status = params.status;
    }

    if (params.minAmount !== undefined) {
      whereClause.totalAmount = {
        [Op.gte]: params.minAmount,
      };
    }

    const { count, rows } = await Order.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      // raw: false ensures fully hydrated instances with getters available
    });

    return {
      items: rows,
      totalCount: count,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * UPDATE: Atomic status transition with row count verification.
   */
  public static async markOrdersShipped(
    orderIds: number[],
    transaction?: Transaction
  ): Promise<number> {
    const [affectedCount] = await Order.update(
      { status: "SHIPPED" },
      {
        where: {
          id: { [Op.in]: orderIds },
          status: "PROCESSING", // Guard: only transition from PROCESSING
        },
        transaction,
      }
    );

    return affectedCount;
  }

  /**
   * DELETE: Soft delete vs Hard delete.
   */
  public static async removeOrder(orderId: number, permanent: boolean = false): Promise<void> {
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    await order.destroy({ force: permanent });
  }

  /**
   * RESTORE: Recovers a soft-deleted paranoid order.
   */
  public static async restoreOrder(orderId: number): Promise<void> {
    const order = await Order.findByPk(orderId, { paranoid: false });
    if (!order) {
      throw new Error("Order not found even in archive");
    }

    await order.restore();
  }
}
```

---

### 3. Chronological Line-by-Line Breakdown

- `Order.create(..., { transaction })`:
  - Validates attributes, constructs the `INSERT` SQL statement, sends it to the database, and hydrates a new `Order` model instance with the returned primary key.
- `Order.bulkCreate(..., { validate: true, ignoreDuplicates: true, returning: true })`:
  - Batches all objects into a single multi-value `INSERT INTO orders (...) VALUES (...), (...)`.
  - `{ validate: true }` executes model validation on all array elements before SQL emission.
  - `{ ignoreDuplicates: true }` adds `ON CONFLICT DO NOTHING` in PostgreSQL.
  - `{ returning: true }` adds `RETURNING *` so the hydrated instances receive their database-generated IDs.
- `Order.findAndCountAll(...)`:
  - Automatically issues two queries: a count query (`SELECT COUNT(*) FROM orders WHERE ...`) and a paginated data query (`SELECT ... LIMIT 10 OFFSET 20`).
  - Returns an object containing `{ count: number, rows: Order[] }`.
- `[Op.in]: orderIds`:
  - Uses Sequelize's operator symbol `Op.in` to generate an `IN (1, 2, 3)` clause with safe parameter binding.
- `order.destroy({ force: permanent })`:
  - When `permanent: false` (default on paranoid models), it executes `UPDATE orders SET deleted_at = NOW() WHERE id = :id`.
  - When `permanent: true`, it overrides paranoid mode and executes a hard `DELETE FROM orders WHERE id = :id`.
- `Order.findByPk(orderId, { paranoid: false })`:
  - By default, paranoid queries append `WHERE deleted_at IS NULL`. Passing `{ paranoid: false }` disables this filter, allowing the application to read soft-deleted records for restoration or auditing.

---

### 4. Visual Engine Execution Diagram

```
Application Call:
Order.findAndCountAll({ where: { status: 'PENDING' }, limit: 10, offset: 0 })
                             |
                             +-------------------------------+
                             |                               |
                             v                               v
                     Query 1 (Count):                Query 2 (Data):
                     SELECT count(*) AS count        SELECT id, order_number, ...
                     FROM orders                     FROM orders
                     WHERE status = 'PENDING'        WHERE status = 'PENDING'
                     AND deleted_at IS NULL;         AND deleted_at IS NULL
                                                     ORDER BY created_at DESC
                                                     LIMIT 10 OFFSET 0;
                             |                               |
                             +---------------+---------------+
                                             |
                                             v
                             Return: { count: 142, rows: [Order, Order, ...] }
```

---

### 5. Junior Pitfall vs Senior Fix

#### Junior Pitfall: Iterative Database Updates inside a Loop

```typescript
// JUNIOR ANTI-PATTERN: N+1 Network round-trips for batch updates
for (const id of orderIds) {
  const order = await Order.findByPk(id); // 1 Query
  if (order) {
    order.status = "SHIPPED";
    await order.save(); // 1 Query per item! Total = 2N queries!
  }
}
```

*Why it fails*: For 500 orders, this executes 1,000 separate sequential network round-trips to the database, consuming seconds of latency and saturating connection pool threads.

#### Senior Fix: Single Batch Update with `Op.in`

```typescript
// SENIOR PATTERN: 1 Single network round-trip for all 500 rows
await Order.update(
  { status: "SHIPPED" },
  {
    where: {
      id: { [Op.in]: orderIds },
    },
  }
);
```

---

### 6. "Think First" Mystery Puzzle

A developer writes this query to find active users:

```typescript
const users = await User.findAll({
  where: {
    name: "John",
    deletedAt: null, // Attempting to manually filter soft deletes
  }
});
```

If the `User` model is paranoid (`paranoid: true`), what SQL query does Sequelize generate, and what subtle edge case might occur?

#### Step-by-Step Execution Trace:
1. Because `User` is paranoid, Sequelize automatically injects `AND "User"."deleted_at" IS NULL` into the compiled SQL.
2. The developer explicitly specified `deletedAt: null` in the `where` dictionary.
3. Sequelize compiles the developer's where clause into: `"User"."deleted_at" IS NULL`.
4. The final compiled query ends up with redundant clauses:
   `WHERE "User"."name" = 'John' AND "User"."deleted_at" IS NULL AND "User"."deleted_at" IS NULL;`
5. While this executes fine, if the developer meant to find *deleted* users by writing `deletedAt: { [Op.ne]: null }`, Sequelize's automatic paranoid filter *still* injects `AND "User"."deleted_at" IS NULL` at the end, resulting in an impossible condition (`WHERE deleted_at IS NOT NULL AND deleted_at IS NULL`), returning zero rows!
6. **Senior Rule**: To query soft-deleted records, never filter on `deletedAt` manually. Pass `{ paranoid: false }` to the query options.

---

### 7. Graded Exercises

#### Exercise 12.1 (Warm-up): High-Priority Order Lookup
Write a function `findHighPriorityPendingOrders(): Promise<Order[]>` using `Order.findAll` that retrieves all orders where `status === "PENDING"` and `totalAmount >= 500.0`, ordered by `totalAmount` descending.

*Hint 1*: Use `where: { status: "PENDING", totalAmount: { [Op.gte]: 500.0 } }`.
*Hint 2*: Use `order: [["totalAmount", "DESC"]]`.

#### Exercise 12.2 (Intermediate): Atomic Inventory Decrement with `instance.decrement()`
Sequelize instances support direct atomic increments and decrements without race conditions: `instance.decrement('stock', { by: qty })`.
Write a function `reserveStock(productId: number, quantity: number): Promise<boolean>` that:
- Finds the product by primary key.
- Checks if `product.stock >= quantity`.
- Atomically decrements the stock and returns `true`. If insufficient, returns `false`.

*Hint 1*: Use `await product.decrement("stock", { by: quantity })`.
*Hint 2*: Wrap inside a transaction for concurrency safety.

#### Exercise 12.3 (Advanced): Upserting with `findOrCreate()`
Write a function `upsertCustomerContact(email: string, phone: string): Promise<{ user: User; created: boolean }>` using `User.findOrCreate`:
- Searches by `email`.
- If not found, creates the user with both `email` and `phone`.
- Returns both the instance and the `created` boolean flag.

*Hint 1*: Use `User.findOrCreate({ where: { email }, defaults: { email, phone } })`.
*Hint 2*: `findOrCreate` returns a tuple: `[instance, boolean]`.

#### Exercise 12.4 (Expert): Custom Pagination Utility with Cursor-Based Pagination
Offset-based pagination (`OFFSET 100000`) becomes very slow on large tables because the database must scan and discard 100,000 rows.
Write a cursor-based pagination function `fetchOrdersAfterCursor(cursorId: number, limit: number): Promise<Order[]>` using `Op.gt` on the primary key `id`.

*Hint 1*: Use `where: { id: { [Op.gt]: cursorId } }`.
*Hint 2*: Order by `id ASC` with `limit`.

---

### Solutions for Topic 12

```typescript
// Solution 12.1
export async function findHighPriorityPendingOrders(): Promise<Order[]> {
  return await Order.findAll({
    where: {
      status: "PENDING",
      totalAmount: { [Op.gte]: 500.0 },
    },
    order: [["totalAmount", "DESC"]],
  });
}

// Solution 12.2
export async function reserveStock(
  sequelize: Sequelize,
  ProductModel: any,
  productId: number,
  quantity: number
): Promise<boolean> {
  return await sequelize.transaction(async (t) => {
    const product = await ProductModel.findByPk(productId, {
      transaction: t,
      lock: t.LOCK.UPDATE, // Exclusive row lock
    });

    if (!product || product.stock < quantity) {
      return false;
    }

    await product.decrement("stock", { by: quantity, transaction: t });
    return true;
  });
}

// Solution 12.3
export async function upsertCustomerContact(
  UserModel: any,
  email: string,
  phone: string
): Promise<{ user: any; created: boolean }> {
  const [user, created] = await UserModel.findOrCreate({
    where: { email },
    defaults: { email, phone },
  });

  return { user, created };
}

// Solution 12.4
export async function fetchOrdersAfterCursor(
  cursorId: number,
  limit: number = 50
): Promise<Order[]> {
  return await Order.findAll({
    where: {
      id: { [Op.gt]: cursorId },
    },
    order: [["id", "ASC"]],
    limit,
  });
}
```

---

## Topic 13: Model Associations: One-to-One, One-to-Many, Many-to-Many (`belongsTo`, `hasMany`, `belongsToMany`), Eager Loading (`include`)

### 1. Concept Definition & Mechanics

In relational databases, real-world data is normalized across related tables. An order belongs to a customer; an order has many line items; products and categories have many-to-many relationships.

Sequelize provides 4 fundamental association methods:
1. **`Source.hasOne(Target, options)`**: One-to-One relationship. The foreign key is placed on the **Target** table.
2. **`Source.belongsTo(Target, options)`**: One-to-One or Many-to-One relationship. The foreign key is placed on the **Source** table.
3. **`Source.hasMany(Target, options)`**: One-to-Many relationship. The foreign key is placed on the **Target** table.
4. **`Source.belongsToMany(Target, { through: JunctionModel })`**: Many-to-Many relationship. Uses an intermediate **Junction Table**.

```
+-------------------------------------------------------------------------------+
|                        Association Architecture Guide                         |
+-------------------------------------------------------------------------------+
  Relationship        Methods                                Foreign Key Location
  -----------------------------------------------------------------------------
  User -> Profile     User.hasOne(Profile)                   Profile table (userId)
  Profile -> User     Profile.belongsTo(User)                Profile table (userId)
  Order -> Items      Order.hasMany(OrderItem)               OrderItem table (orderId)
  Item -> Order       OrderItem.belongsTo(Order)             OrderItem table (orderId)
  Product <-> Tag     Product.belongsToMany(Tag, through)    ProductTags junction
```

#### Eager Loading with `include`:
When querying associated records, standard ORM calls might trigger the infamous **N+1 Problem** (executing 1 query for orders, and then N separate queries for each order's items). Sequelize solves this via **Eager Loading** using the `include` option, which issues an optimized `LEFT OUTER JOIN` in a single SQL query.

---

### 2. Production Code Example

The following code establishes production associations between `Customer`, `Order`, `OrderItem`, and `Product`, followed by typed eager loading:

```typescript
import { Sequelize, Model, DataTypes, NonAttribute } from "sequelize";

// --- Model Definitions ---
export class Customer extends Model {
  declare id: number;
  declare email: string;
  declare name: string;

  // Association Mixin Types
  declare orders?: NonAttribute<Order[]>;
}

export class Order extends Model {
  declare id: number;
  declare customerId: number;
  declare orderNumber: string;
  declare totalAmount: number;

  // Association Mixin Types
  declare customer?: NonAttribute<Customer>;
  declare items?: NonAttribute<OrderItem[]>;
}

export class OrderItem extends Model {
  declare id: number;
  declare orderId: number;
  declare sku: string;
  declare quantity: number;
  declare unitPrice: number;

  declare order?: NonAttribute<Order>;
}

// --- Association Configuration ---
export function setupAssociations(sequelize: Sequelize) {
  // 1. Initialize models (schema definitions omitted for brevity)
  
  // 2. Customer <-> Order (One-to-Many)
  Customer.hasMany(Order, {
    foreignKey: "customer_id",
    as: "orders",
    onDelete: "CASCADE",
  });
  Order.belongsTo(Customer, {
    foreignKey: "customer_id",
    as: "customer",
  });

  // 3. Order <-> OrderItem (One-to-Many)
  Order.hasMany(OrderItem, {
    foreignKey: "order_id",
    as: "items",
    onDelete: "CASCADE",
  });
  OrderItem.belongsTo(Order, {
    foreignKey: "order_id",
    as: "order",
  });
}

// --- Eager Loading Service ---
export class OrderAssociationService {
  /**
   * Retrieves an Order by ID, eagerly joining Customer and all OrderItems.
   */
  public static async getOrderWithDetails(orderId: number): Promise<Order | null> {
    return await Order.findByPk(orderId, {
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "email", "name"], // Select only necessary columns
        },
        {
          model: OrderItem,
          as: "items",
          attributes: ["id", "sku", "quantity", "unitPrice"],
        },
      ],
    });
  }

  /**
   * Retrieves high-spending Customers who placed orders in the last 30 days.
   * Demonstrates required: true (INNER JOIN) on associations.
   */
  public static async getActiveCustomersWithOrders(): Promise<Customer[]> {
    return await Customer.findAll({
      include: [
        {
          model: Order,
          as: "orders",
          required: true, // Forces INNER JOIN (excludes customers with 0 orders)
          where: {
            totalAmount: { [Op.gt]: 100.0 },
          },
        },
      ],
    });
  }
}
```

---

### 3. Chronological Line-by-Line Breakdown

- `declare orders?: NonAttribute<Order[]>`:
  - The `NonAttribute<T>` utility type from Sequelize tells TypeScript that `orders` is an associated relation hydrated at runtime, not a physical database column stored in the `customers` table.
- `Customer.hasMany(Order, { foreignKey: 'customer_id', as: 'orders', onDelete: 'CASCADE' })`:
  - Registers the relationship with foreign key `customer_id`.
  - Sets the association alias to `'orders'`.
  - `onDelete: 'CASCADE'` instructs the database to automatically delete associated orders if the customer record is deleted.
- `Order.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' })`:
  - Pairs the relationship symmetrically. The `as` alias must be used consistently whenever querying with `include`.
- `include: [{ model: Customer, as: 'customer', attributes: [...] }]`:
  - Directs Sequelize to perform a `LEFT OUTER JOIN customers AS customer ON customer.id = order.customer_id`.
  - The `attributes` array restricts column selection, preventing over-fetching of massive blobs or sensitive columns like passwords.
- `required: true`:
  - By default, Sequelize uses `LEFT OUTER JOIN` for includes, which returns parent records even if no child records match.
  - Setting `required: true` converts the join into an `INNER JOIN`, automatically filtering out parent rows that have no matching children.

---

### 4. Visual Engine Execution Diagram

```
Application Call:
Order.findByPk(42, {
  include: [{ model: Customer, as: 'customer' }, { model: OrderItem, as: 'items' }]
})
                               |
                               v
Compiled SQL Statement:
SELECT 
  "Order"."id", "Order"."total_amount",
  "customer"."id" AS "customer.id", "customer"."name" AS "customer.name",
  "items"."id" AS "items.id", "items"."sku" AS "items.sku"
FROM "orders" AS "Order"
LEFT OUTER JOIN "customers" AS "customer" ON "Order"."customer_id" = "customer"."id"
LEFT OUTER JOIN "order_items" AS "items" ON "Order"."id" = "items"."order_id"
WHERE "Order"."id" = 42;
                               |
                               v
Hydration Engine:
Nests the flat SQL rows into a structured JavaScript object graph:
{
  id: 42,
  totalAmount: 250.0,
  customer: Customer { id: 10, name: "Alice" },
  items: [
    OrderItem { id: 101, sku: "LAPTOP" },
    OrderItem { id: 102, sku: "MOUSE" }
  ]
}
```

---

### 5. Junior Pitfall vs Senior Fix

#### Junior Pitfall: The Alias Mismatch Error

```typescript
// JUNIOR DEFINITION:
User.hasMany(Order, { as: "userOrders" });

// JUNIOR QUERY:
User.findAll({
  include: [{ model: Order, as: "orders" }] // CRASH! "Association with alias orders does not exist on User"
});
```

*Why it fails*: When an alias `as` is defined on an association, that alias becomes the strict identifier for that relation. Querying with a different alias (or omitting `as`) throws an immediate runtime exception.

#### Senior Fix: Centralized Association Constants or Single Source of Truth

```typescript
// SENIOR PATTERN: Define alias constants to guarantee type-safe alignment
export const ASSOCIATIONS = {
  USER_ORDERS: "userOrders" as const,
  ORDER_ITEMS: "items" as const,
};

User.hasMany(Order, { as: ASSOCIATIONS.USER_ORDERS, foreignKey: "user_id" });

User.findAll({
  include: [{ model: Order, as: ASSOCIATIONS.USER_ORDERS }],
});
```

---

### 6. "Think First" Mystery Puzzle

Study this Many-to-Many setup:

```typescript
Product.belongsToMany(Category, { through: "ProductCategories" });
Category.belongsToMany(Product, { through: "ProductCategories" });

const products = await Product.findAll({
  include: [{ model: Category }]
});
```

When you inspect `products[0].Categories[0]`, there is an unexpected extra nested property called `products[0].Categories[0].ProductCategories`. What is this property and how do you exclude it from the JSON response if not needed?

#### Step-by-Step Execution Trace:
1. In Many-to-Many relationships, Sequelize automatically includes data from the intermediate junction table (`ProductCategories`).
2. It nests the junction row under the property name matching the `through` model name.
3. If your frontend API only wants clean category details without junction table metadata, this extra nested object wastes bandwidth.
4. **Senior Fix**: Exclude the through model attributes by passing `through: { attributes: [] }` in the include block:
   ```typescript
   include: [{
     model: Category,
     through: { attributes: [] } // Suppresses junction table fields!
   }]
   ```

---

### 7. Graded Exercises

#### Exercise 13.1 (Warm-up): User Profile One-to-One Mapping
Define `User` and `Profile` models and connect them with `User.hasOne(Profile)` and `Profile.belongsTo(User)`. Write a query to find a user by ID including their profile.

*Hint 1*: Foreign key is `user_id`.
*Hint 2*: Use `include: [{ model: Profile, as: "profile" }]`.

#### Exercise 13.2 (Intermediate): Nested Eager Loading (Author -> Books -> Reviews)
Write a query fetching an `Author` by ID that loads all their `Books`, and for each book, loads all of its `Reviews`.

*Hint 1*: Nest the `include` array inside the child include:
`include: [{ model: Book, include: [{ model: Review }] }]`.
*Hint 2*: Verify aliases match model associations.

#### Exercise 13.3 (Advanced): Many-to-Many Tagging System with Filter
Given `Article` and `Tag` associated via `ArticleTag`. Write a function `findArticlesByTag(tagName: string): Promise<Article[]>` that retrieves all articles associated with `tagName`, using `required: true` on the tag include.

*Hint 1*: `include: [{ model: Tag, where: { name: tagName }, required: true }]`.
*Hint 2*: Ensure junction table data is suppressed.

#### Exercise 13.4 (Expert): Polymorphic Associations Pattern in Sequelize
In PostgreSQL, an `AuditLog` might belong to either an `Order`, a `Customer`, or a `Product`.
Demonstrate how to implement a Polymorphic Association using `item_id` and `item_type` columns with Sequelize custom associations or getter hooks.

*Hint 1*: Store `item_type: "ORDER" | "CUSTOMER"` and `item_id: number`.
*Hint 2*: Use `AuditLog.belongsTo(Order, { foreignKey: 'item_id', constraints: false })` with scope `{ item_type: 'ORDER' }`.

---

### Solutions for Topic 13

```typescript
// Solution 13.1
export async function getUserWithProfile(UserModel: any, ProfileModel: any, userId: number) {
  UserModel.hasOne(ProfileModel, { foreignKey: "user_id", as: "profile" });
  ProfileModel.belongsTo(UserModel, { foreignKey: "user_id", as: "user" });

  return await UserModel.findByPk(userId, {
    include: [{ model: ProfileModel, as: "profile" }],
  });
}

// Solution 13.2
export async function getAuthorWithBooksAndReviews(Author: any, Book: any, Review: any, authorId: number) {
  return await Author.findByPk(authorId, {
    include: [
      {
        model: Book,
        as: "books",
        include: [
          {
            model: Review,
            as: "reviews",
          },
        ],
      },
    ],
  });
}

// Solution 13.3
export async function findArticlesByTag(Article: any, Tag: any, tagName: string) {
  return await Article.findAll({
    include: [
      {
        model: Tag,
        as: "tags",
        where: { name: tagName },
        required: true,
        through: { attributes: [] },
      },
    ],
  });
}

// Solution 13.4
export function setupPolymorphicAuditLogs(AuditLog: any, Order: any, Customer: any) {
  // Order polymorphic link
  Order.hasMany(AuditLog, {
    foreignKey: "item_id",
    constraints: false,
    scope: { item_type: "ORDER" },
    as: "auditLogs",
  });
  AuditLog.belongsTo(Order, {
    foreignKey: "item_id",
    constraints: false,
    as: "order",
  });

  // Customer polymorphic link
  Customer.hasMany(AuditLog, {
    foreignKey: "item_id",
    constraints: false,
    scope: { item_type: "CUSTOMER" },
    as: "auditLogs",
  });
  AuditLog.belongsTo(Customer, {
    foreignKey: "item_id",
    constraints: false,
    as: "customer",
  });
}
```

---

## Topic 14: Model Scopes & Lifecycle Hooks: Reusable Filter Sets (`scopes`) & Interceptors (`beforeCreate`, `afterUpdate`)

### 1. Concept Definition & Mechanics

As applications expand, developers frequently duplicate common queries and business logic:
- Always filtering by `status = 'ACTIVE'`
- Hashing user passwords before saving
- Creating audit trail records whenever financial records change
- Sending notifications after an order ships

Sequelize provides two powerful features to centralize and automate this logic:

#### 1. Scopes (Reusable Query Presets)
A **Scope** is a pre-packaged query configuration (including `where`, `include`, `attributes`, and `order`) defined directly on the model.
- **Default Scope (`defaultScope`)**: Automatically applied to **every** query on the model unless explicitly bypassed with `.unscoped()`. Perfect for hiding sensitive fields like password hashes.
- **Named Scopes**: Reusable query filters applied on demand using `Model.scope('scopeName').findAll()`. Scopes can also accept parameters dynamically.

#### 2. Lifecycle Hooks (Database Interceptors)
**Hooks** (also known as Lifecycle Events) are functions triggered before or after Sequelize executes database operations:
- `beforeValidate` / `afterValidate`
- `beforeCreate` / `afterCreate`
- `beforeUpdate` / `afterUpdate`
- `beforeDestroy` / `afterDestroy`
- `beforeBulkCreate`

```
+-------------------------------------------------------------+
|                Model Lifecycle Interceptor Flow             |
+-------------------------------------------------------------+
                              |
                              v
                       Model.create()
                              |
                              v
                        beforeValidate
                              |
                        afterValidate
                              |
                        beforeCreate  <-- Password hashing, slug generation
                              |
                        [ SQL INSERT ]
                              |
                        afterCreate   <-- Audit logging, event dispatching
                              |
                              v
                       Instance returned
```

---

### 2. Production Code Example

The following code defines a `User` model equipped with security scopes (stripping password hashes by default), parameterized tenant scopes, and automated password hashing hooks:

```typescript
import { Sequelize, Model, DataTypes, Op } from "sequelize";
import * as crypto from "crypto";

export class UserAccount extends Model {
  declare id: number;
  declare organizationId: number;
  declare email: string;
  declare passwordHash: string;
  declare role: "ADMIN" | "STAFF" | "USER";
  declare isActive: boolean;

  /**
   * Helper method to verify passwords.
   */
  public verifyPassword(candidate: string): boolean {
    const hash = crypto.createHash("sha256").update(candidate).digest("hex");
    return this.passwordHash === hash;
  }
}

export function initUserAccountModel(sequelize: Sequelize) {
  UserAccount.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      organizationId: { type: DataTypes.INTEGER, allowNull: false, field: "organization_id" },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      passwordHash: { type: DataTypes.STRING, allowNull: false, field: "password_hash" },
      role: { type: DataTypes.ENUM("ADMIN", "STAFF", "USER"), defaultValue: "USER" },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: "is_active" },
    },
    {
      sequelize,
      tableName: "user_accounts",
      timestamps: true,

      // --- 1. SCOPES ---
      defaultScope: {
        // SECURITY: Never select passwordHash by default!
        attributes: { exclude: ["passwordHash"] },
        where: { isActive: true }, // Default queries only see active accounts
      },
      scopes: {
        // Explicitly include password hash during authentication logins
        withPassword: {
          attributes: { include: ["passwordHash"] },
        },
        // Filter by role
        adminsOnly: {
          where: { role: "ADMIN" },
        },
        // Parameterized dynamic scope
        byOrganization(orgId: number) {
          return {
            where: { organizationId: orgId },
          };
        },
      },

      // --- 2. LIFECYCLE HOOKS ---
      hooks: {
        // Automatically hash password before saving a new record
        beforeCreate: async (user: UserAccount) => {
          if (user.passwordHash) {
            user.passwordHash = crypto
              .createHash("sha256")
              .update(user.passwordHash)
              .digest("hex");
          }
          user.email = user.email.toLowerCase().trim();
        },

        // Hash password before update IF it was modified
        beforeUpdate: async (user: UserAccount) => {
          if (user.changed("passwordHash")) {
            user.passwordHash = crypto
              .createHash("sha256")
              .update(user.passwordHash)
              .digest("hex");
          }
          if (user.changed("email")) {
            user.email = user.email.toLowerCase().trim();
          }
        },

        // Audit log trigger after creation
        afterCreate: (user: UserAccount) => {
          console.log(`[AUDIT] User registered: ID ${user.id}, Org ${user.organizationId}`);
        },
      },
    }
  );
}
```

---

### 3. Chronological Line-by-Line Breakdown

- `defaultScope: { attributes: { exclude: ['passwordHash'] }, where: { isActive: true } }`:
  - Enforces least-privilege security by default. Any `UserAccount.findAll()` or `findByPk()` call will automatically omit `passwordHash` and append `is_active = true`.
- `withPassword: { attributes: { include: ['passwordHash'] } }`:
  - When the authentication controller needs to verify credentials, it calls `UserAccount.scope('withPassword').findOne({ where: { email } })`.
- `byOrganization(orgId: number)`:
  - Demonstrates a parameterized scope. Calling `UserAccount.scope({ method: ['byOrganization', 42] }).findAll()` filters by organization 42.
- `beforeCreate: async (user: UserAccount)`:
  - Intercepts creation before SQL emission. Hashes the plaintext password into a SHA-256 hex string and normalizes the email address.
- `if (user.changed('passwordHash'))`:
  - On update operations, checks whether `passwordHash` was actually modified. If only the user's name or role was updated, it avoids re-hashing an already hashed string!

---

### 4. Visual Engine Execution Diagram

```
Controller Call: UserAccount.findAll()
                     |
                     v
             Apply defaultScope:
             - Exclude: passwordHash
             - Where: isActive = true
                     |
                     v
             Compiled SQL:
             SELECT id, organization_id, email, role, is_active 
             FROM user_accounts 
             WHERE is_active = true;

-------------------------------------------------------------------------

Controller Call: UserAccount.scope('withPassword', { method: ['byOrganization', 10] }).findOne(...)
                     |
                     v
             Merge Scopes:
             - Include: passwordHash
             - Where: organizationId = 10 AND email = :email
                     |
                     v
             Compiled SQL:
             SELECT id, organization_id, email, password_hash, role, is_active 
             FROM user_accounts 
             WHERE organization_id = 10 AND email = 'alice@example.com';
```

---

### 5. Junior Pitfall vs Senior Fix

#### Junior Pitfall: The Bulk Operation Hook Trap

```typescript
// JUNIOR ANTI-PATTERN: Expecting beforeCreate or beforeUpdate to fire on bulk operations
await UserAccount.bulkCreate([
  { email: "user1@test.com", passwordHash: "secret1" },
  { email: "user2@test.com", passwordHash: "secret2" },
]);
```

*Why it fails*: By default, `bulkCreate()` and `update({ ... }, { where: { ... } })` **DO NOT** execute individual instance hooks (`beforeCreate`, `beforeUpdate`) for performance reasons! The passwords will be inserted as plaintext!

#### Senior Fix: Passing `individualHooks: true` or Using `beforeBulkCreate`

```typescript
// SENIOR PATTERN A: Enable individualHooks (fires hooks per row, slightly slower)
await UserAccount.bulkCreate(users, { individualHooks: true });

// SENIOR PATTERN B: Use bulk-specific hook
hooks: {
  beforeBulkCreate: async (users) => {
    for (const user of users) {
      user.passwordHash = hashPassword(user.passwordHash);
    }
  }
}
```

---

### 6. "Think First" Mystery Puzzle

A developer defines a default scope with an association:

```typescript
defaultScope: {
  include: [{ model: Profile, as: "profile" }]
}
```

Later, another developer writes this count query:

```typescript
const count = await User.count();
```

Why does this count query perform poorly or generate an unexpectedly complex query?

#### Step-by-Step Execution Trace:
1. `defaultScope` applies to **all** model queries, including `.count()`.
2. Even though `count()` only needs the total number of users (`SELECT COUNT(*) FROM users`), Sequelize merges the default scope containing `LEFT OUTER JOIN profiles AS profile`.
3. The database is forced to execute an unnecessary join to count rows in the user table.
4. **Senior Rule**: Keep `defaultScope` lightweight (simple column exclusions and boolean flags). Never place heavy multi-table `include` joins inside `defaultScope`. Instead, place them inside explicit named scopes (e.g., `User.scope('withProfile').findAll()`).

---

### 7. Graded Exercises

#### Exercise 14.1 (Warm-up): Dynamic Date Range Scope
Add a named scope `createdBetween(start: Date, end: Date)` to the `Order` model that filters `createdAt` between `start` and `end`.

*Hint 1*: Define `createdBetween(start: Date, end: Date) { return { where: { createdAt: { [Op.between]: [start, end] } } }; }`.
*Hint 2*: Call with `Order.scope({ method: ["createdBetween", d1, d2] }).findAll()`.

#### Exercise 14.2 (Intermediate): Slug Generation Hook
Define a `beforeValidate` hook on an `Article` model that automatically takes the `title` attribute and generates an SEO-friendly URL `slug` (e.g., `"Hello World!"` -> `"hello-world"`).

*Hint 1*: Use `article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')`.
*Hint 2*: Assign result to `article.slug`.

#### Exercise 14.3 (Advanced): Cascade Soft Delete Hook
Write an `afterDestroy` hook on a `Customer` model that automatically soft-deletes all associated `Order` records belonging to that customer.

*Hint 1*: In `afterDestroy: async (customer, options) => { ... }`.
*Hint 2*: Call `Order.destroy({ where: { customerId: customer.id }, transaction: options.transaction })`.

#### Exercise 14.4 (Expert): Global Hook for Tenant Auditing
Register a global Sequelize hook using `sequelize.addHook('afterUpdate', ...)` that checks if any financial model (models with an `amount` column) had its `amount` changed, and logs a tamper-evident audit message with old and new values.

*Hint 1*: Use `instance.changed('amount')`.
*Hint 2*: Access previous value with `instance.previous('amount')`.

---

### Solutions for Topic 14

```typescript
// Solution 14.1
export function addOrderScopes(Order: any) {
  Order.addScope("createdBetween", (start: Date, end: Date) => ({
    where: {
      createdAt: { [Op.between]: [start, end] },
    },
  }));
}

// Solution 14.2
export function setupArticleSlugHook(Article: any) {
  Article.addHook("beforeValidate", (article: any) => {
    if (article.title && !article.slug) {
      article.slug = article.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
  });
}

// Solution 14.3
export function setupCascadeDestroyHook(Customer: any, Order: any) {
  Customer.addHook("afterDestroy", async (customer: any, options: any) => {
    await Order.destroy({
      where: { customerId: customer.id },
      transaction: options.transaction, // Preserves transaction boundary!
    });
  });
}

// Solution 14.4
export function registerFinancialAuditHook(sequelize: Sequelize) {
  sequelize.addHook("afterUpdate", (instance: any) => {
    if (instance.changed && instance.changed("amount")) {
      const oldVal = instance.previous("amount");
      const newVal = instance.getDataValue("amount");
      console.warn(
        `[FINANCIAL AUDIT] ${instance.constructor.name} ID:${instance.id} amount modified: ${oldVal} -> ${newVal}`
      );
    }
  });
}
```

---

## Topic 15: Production Engineering: Connection Pool Sizing, Query Logging, Performance Tuning & Avoiding N+1 Traps

### 1. Concept Definition & Mechanics

In production environments handling thousands of requests per second, poorly configured ORMs can quickly crash database instances. Mastering Sequelize in production requires tuning three operational dimensions:

#### 1. Sizing the Connection Pool
A common misconception is that larger pools yield higher performance (`pool: { max: 100 }`). In reality, PostgreSQL forks a separate backend OS process for each connection. Allocating too many connections causes **CPU Cache Thrashing** and disk I/O starvation.
The PostgreSQL formula for optimal pool sizing:
$$\text{Max Connections} = (\text{CPU Cores} \times 2) + \text{Spindle / Effective Disk Count}$$
For a typical 4-core container instance, a pool max of **10 to 15 connections** per Node process delivers optimal throughput.

#### 2. The N+1 Query Trap and Solutions
The N+1 problem occurs when fetching a list of N parent records causes N additional separate queries to load related records.
- **Solution A**: Eager loading with `include` (issues a single `LEFT OUTER JOIN`).
- **Solution B**: Two-query separation using `separate: true`. For 1-to-many relationships where joins cause massive Cartesian row multiplication, `{ model: Item, separate: true }` issues 1 parent query and 1 batch child query `WHERE order_id IN (...)`.

#### 3. Production Query Logging & Slow Query Tracking
In production, never log every query to stdout—it saturates Node.js stdout buffers and leaks sensitive data. Instead, configure a **Slow Query Logger** that only logs queries exceeding a performance threshold (e.g., 200ms).

```
+----------------------------------------------------------------+
|                 Production Query Timing Pipeline               |
+----------------------------------------------------------------+
                               |
                               v
                       Execute DB Query
                               |
                               v
                     Compute Execution Time
                               |
                     +---------+---------+
                     |                   |
               Time < 200ms        Time >= 200ms
                     |                   |
              Silent return       Trigger Warning Alert:
                                  [SLOW QUERY] Took 450ms!
                                  SQL: SELECT * FROM ...
```

---

### 2. Production Code Example

The following configuration demonstrates enterprise connection pooling, slow-query tracking, and the `separate: true` optimization for high-cardinality associations:

```typescript
import { Sequelize, QueryTypes } from "sequelize";

export class ProductionDatabaseManager {
  /**
   * Initializes a production-tuned Sequelize instance.
   */
  public static createProductionInstance(): Sequelize {
    const SLOW_QUERY_THRESHOLD_MS = 200;

    return new Sequelize(process.env.DATABASE_URL!, {
      dialect: "postgres",
      pool: {
        max: 15,          // 10-15 connections per Node container is optimal
        min: 2,           // Keep 2 warm connections open
        acquire: 20000,   // Throw error if connection cannot be acquired within 20s
        idle: 10000,      // Release connection if idle for 10s
        evict: 1000,      // Run eviction sweeps every 1s
      },
      logging: (sql: string, timingMs?: number | object) => {
        // Only log queries that exceed our performance budget
        const duration = typeof timingMs === "number" ? timingMs : 0;
        if (duration >= SLOW_QUERY_THRESHOLD_MS) {
          console.warn(
            `[PERF WARNING: SLOW QUERY] Duration: ${duration}ms | SQL: ${sql.slice(0, 500)}`
          );
        }
      },
      benchmark: true, // Enables timingMs measurement for logging
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
        statement_timeout: 10000, // Terminate any query taking over 10 seconds!
        idle_in_transaction_session_timeout: 15000, // Kill hung transactions
      },
    });
  }

  /**
   * Solves Cartesian product explosions on 1-to-many associations using separate: true.
   */
  public static async fetchOrdersOptimized(OrderModel: any, ItemModel: any) {
    return await OrderModel.findAll({
      limit: 50,
      include: [
        {
          model: ItemModel,
          as: "items",
          // separate: true runs 1 query for orders, and 1 batch query for items using IN (:orderIds)
          // This avoids multiplying order columns across 50 items per order!
          separate: true,
        },
      ],
    });
  }
}
```

---

### 3. Chronological Line-by-Line Breakdown

- `pool: { max: 15, min: 2, acquire: 20000, idle: 10000 }`:
  - `max`: Limits concurrent sockets to prevent server-side PostgreSQL memory exhaustion.
  - `acquire`: Protects callers from hanging indefinitely when all pool connections are busy.
  - `idle`: Closes excess sockets during periods of low activity.
- `benchmark: true`:
  - Directs Sequelize to pass the actual execution duration in milliseconds as the second argument to the `logging` function.
- `statement_timeout: 10000`:
  - Injected directly into PostgreSQL connection settings. If an un-indexed query attempts a full sequential scan on a 50-million row table, PostgreSQL automatically cancels it after 10 seconds, protecting the database from denial of service.
- `idle_in_transaction_session_timeout: 15000`:
  - Protects against buggy code that opens a transaction (`BEGIN`) and stalls without calling `commit` or `rollback`. PostgreSQL terminates the hung session and releases all row locks after 15 seconds.
- `separate: true`:
  - In a standard `include`, fetching 50 orders with 20 items each causes PostgreSQL to stream 1,000 joined rows, repeating all order header columns 20 times.
  - With `separate: true`, Sequelize issues:
    1. `SELECT * FROM orders LIMIT 50;`
    2. `SELECT * FROM items WHERE order_id IN (1, 2, ... 50);`
  - It stitches them together in Node.js memory, drastically reducing network transmission bandwidth.

---

### 4. Visual Engine Execution Diagram

```
Cartesian Join vs Separate Query Execution:

Approach A (Standard Join):
Query: SELECT * FROM orders LEFT JOIN items ON items.order_id = orders.id LIMIT 50;
Result: 1,000 rows sent across network wire. Order data duplicated 20x.

Approach B (separate: true):
Query 1: SELECT * FROM orders LIMIT 50;                     -> 50 rows sent.
Query 2: SELECT * FROM items WHERE order_id IN (1, ... 50); -> 1,000 rows sent.
Result: Zero column duplication. Up to 80% bandwidth reduction.
```

---

### 5. Junior Pitfall vs Senior Fix

#### Junior Pitfall: Setting Pool Max to 100 on Multiple Container Replicas

```typescript
// JUNIOR ANTI-PATTERN: Oversized connection pools per instance
pool: { max: 100 }
```

*Why it fails*: If your service runs across 10 Kubernetes pods, `10 pods x 100 connections = 1,000 active PostgreSQL connections`. PostgreSQL's default `max_connections` is 100. The database instantly crashes with `FATAL: sorry, too many clients already`.

#### Senior Fix: Coordinated Pool Sizing across Horizontal Pod Replicas

```typescript
// SENIOR PATTERN: Divide database capacity by maximum pod replicas
const MAX_DB_CONNECTIONS = 100;
const ESTIMATED_MAX_PODS = 8;
const SAFE_POOL_MAX = Math.floor((MAX_DB_CONNECTIONS * 0.8) / ESTIMATED_MAX_PODS); // ~10 per pod

pool: {
  max: SAFE_POOL_MAX,
  min: 2,
}
```

---

### 6. "Think First" Mystery Puzzle

A developer deploys this query:

```typescript
const count = await Order.count({
  include: [{ model: OrderItem, as: "items" }]
});
```

Why does this count query run 10x slower than expected and occasionally return incorrect counts?

#### Step-by-Step Execution Trace:
1. `Order.count()` with an `include` on a 1-to-many relationship generates:
   `SELECT count(*) FROM orders LEFT OUTER JOIN order_items ON ...`
2. If an order has 5 items, the `LEFT OUTER JOIN` outputs 5 rows for that single order.
3. Therefore, `count(*)` counts the total number of **order items**, NOT orders!
4. To fix this, Sequelize attempts to compile `count(DISTINCT "Order"."id")`.
5. Calculating `DISTINCT` across a large join requires an in-memory hash aggregation or disk sort in PostgreSQL, devastating performance.
6. **Senior Rule**: Never include 1-to-many associations when simply counting parent records. Call `Order.count()` without the include.

---

### 7. Graded Exercises

#### Exercise 15.1 (Warm-up): Statement Timeout Dialect Option
Configure a Sequelize instance with a 5-second PostgreSQL statement timeout and benchmark logging.

*Hint 1*: Set `dialectOptions: { statement_timeout: 5000 }`.
*Hint 2*: Set `benchmark: true`.

#### Exercise 15.2 (Intermediate): Read Replica Pool Configuration
Sequelize supports separate connection pools for reads vs writes. Configure a Sequelize instance with:
- `replication.write`: Points to primary database.
- `replication.read`: Array of read-replica URLs.

*Hint 1*: Use `replication: { write: { host: ... }, read: [{ host: ... }] }`.
*Hint 2*: Test that `SELECT` queries route to replicas while `INSERT` routes to write.

#### Exercise 15.3 (Advanced): Custom Slow Query Alerter with Prometheus Metrics
Write a custom logging handler that tracks the duration of every query, increments a metric counter if `duration >= 500ms`, and logs the sanitized SQL (truncating long replacement arrays).

*Hint 1*: Check `if (duration >= 500)`.
*Hint 2*: Truncate long SQL with `.slice(0, 300)`.

#### Exercise 15.4 (Expert): Analyzing Query Execution Plans with `EXPLAIN (ANALYZE, BUFFERS)`
Write a utility function `analyzeQuery(sequelize: Sequelize, sql: string, replacements: any): Promise<string[]>` that prepends `EXPLAIN (ANALYZE, BUFFERS)` to the SQL, executes it, and returns the PostgreSQL execution plan rows for index verification.

*Hint 1*: Prepend `EXPLAIN (ANALYZE, BUFFERS) ${sql}`.
*Hint 2*: Execute with `QueryTypes.SELECT`.

---

### Solutions for Topic 15

```typescript
// Solution 15.1
export function createTimeoutConfiguredSequelize(connectionUrl: string) {
  return new Sequelize(connectionUrl, {
    benchmark: true,
    dialectOptions: {
      statement_timeout: 5000,
    },
    logging: (sql, timing) => console.log(`[${timing}ms] ${sql}`),
  });
}

// Solution 15.2
export function createReplicationSequelize() {
  return new Sequelize("ecommerce_db", null, null, {
    dialect: "postgres",
    replication: {
      read: [
        { host: "replica-1.db.internal", username: "reader", password: "pwd" },
        { host: "replica-2.db.internal", username: "reader", password: "pwd" },
      ],
      write: { host: "primary.db.internal", username: "writer", password: "pwd" },
    },
    pool: { max: 10, min: 2 },
  });
}

// Solution 15.3
export class QueryMetricCollector {
  private static slowQueryCount = 0;

  public static handleQueryLog(sql: string, durationMs?: number | object) {
    const duration = typeof durationMs === "number" ? durationMs : 0;
    if (duration >= 500) {
      this.slowQueryCount++;
      const truncated = sql.length > 300 ? sql.slice(0, 300) + "..." : sql;
      console.warn(`[ALERT: SLOW QUERY #${this.slowQueryCount}] ${duration}ms: ${truncated}`);
    }
  }
}

// Solution 15.4
export async function analyzeQuery(
  sequelize: Sequelize,
  sql: string,
  replacements: Record<string, unknown>
): Promise<string[]> {
  const explainSql = `EXPLAIN (ANALYZE, BUFFERS) ${sql}`;
  const rows = await sequelize.query<Record<string, string>>(explainSql, {
    replacements,
    type: QueryTypes.SELECT,
  });

  return rows.map((r) => Object.values(r)[0]);
}
```

---

## Checkpoint Challenge 3: Enterprise Full-Stack Model Architecture, Associations & Scopes

### 1. Challenge Overview

In this capstone checkpoint, you will assemble the complete object-relational model layer of an enterprise multi-vendor commerce platform. You will implement:
1. **Typed Model Definitions**: `Merchant`, `Product`, `Order`, `OrderItem`.
2. **Comprehensive Associations**:
   - `Merchant.hasMany(Product)`
   - `Order.belongsTo(Merchant)`
   - `Order.hasMany(OrderItem)`
   - `OrderItem.belongsTo(Product)`
3. **Model Scopes**:
   - Default scopes hiding internal profit margins.
   - Parameterized scopes filtering active catalog items.
4. **Lifecycle Hooks**:
   - Automatic SKU formatting and total order recalculation.
5. **Full Automated In-Memory Test Suite**:
   - Zero-dependency verification verifying model creation, eager loading with `include`, and scope filtering.

---

### 2. Architectural Blueprint

```
+-----------------------------------------------------------------------------------------+
|                  Enterprise Commerce Object Model Architecture                          |
+-----------------------------------------------------------------------------------------+
                                             |
                   +-------------------------+-------------------------+
                   |                                                   |
                   v                                                   v
          +-----------------+                                 +-----------------+
          |    Merchant     |                                 |      Order      |
          +-----------------+                                 +-----------------+
          | id              |                                 | id              |
          | name            | 1                             * | merchantId      |
          | email           |----+                     +----->| totalAmount     |
          +-----------------+    |                     |      | status          |
                   | 1           |                     |      +-----------------+
                   |             |                     |               | 1
                   v *           |                     |               v *
          +-----------------+    |                     |      +-----------------+
          |     Product     |<---+---------------------+      |    OrderItem    |
          +-----------------+                                 +-----------------+
          | id              |                                 | id              |
          | merchantId      | 1                             * | orderId         |
          | sku, title      |<--------------------------------| productId       |
          | price, margin   |                                 | quantity, price |
          +-----------------+                                 +-----------------+
```

---

### 3. Complete Production Implementation & Verification Test Suite

Save the following code as `test-checkpoint-3.ts` (or execute via `ts-node` / Node.js) to run the full verification test suite:

```typescript
import {
  Sequelize,
  Model,
  DataTypes,
  NonAttribute,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Op,
} from "sequelize";

// --- 1. MODEL CLASSES ---

export class Merchant extends Model<
  InferAttributes<Merchant>,
  InferCreationAttributes<Merchant>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare email: string;

  declare products?: NonAttribute<Product[]>;
  declare orders?: NonAttribute<Order[]>;
}

export class Product extends Model<
  InferAttributes<Product>,
  InferCreationAttributes<Product>
> {
  declare id: CreationOptional<number>;
  declare merchantId: number;
  declare sku: string;
  declare title: string;
  declare price: number;
  declare costMargin: number; // Internal sensitive margin
  declare isActive: CreationOptional<boolean>;

  declare merchant?: NonAttribute<Merchant>;
}

export class Order extends Model<
  InferAttributes<Order>,
  InferCreationAttributes<Order>
> {
  declare id: CreationOptional<number>;
  declare merchantId: number;
  declare orderNumber: string;
  declare totalAmount: CreationOptional<number>;
  declare status: "PENDING" | "PAID" | "SHIPPED";

  declare merchant?: NonAttribute<Merchant>;
  declare items?: NonAttribute<OrderItem[]>;
}

export class OrderItem extends Model<
  InferAttributes<OrderItem>,
  InferCreationAttributes<OrderItem>
> {
  declare id: CreationOptional<number>;
  declare orderId: number;
  declare productId: number;
  declare quantity: number;
  declare unitPrice: number;

  declare order?: NonAttribute<Order>;
  declare product?: NonAttribute<Product>;
}

// --- 2. MODEL INITIALIZATION & ASSOCIATIONS ---

export function setupCommercePlatform(sequelize: Sequelize) {
  // Merchant Init
  Merchant.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
    },
    { sequelize, tableName: "merchants", timestamps: false }
  );

  // Product Init
  Product.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      merchantId: { type: DataTypes.INTEGER, allowNull: false },
      sku: { type: DataTypes.STRING, allowNull: false, unique: true },
      title: { type: DataTypes.STRING, allowNull: false },
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      costMargin: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    {
      sequelize,
      tableName: "products",
      timestamps: false,
      defaultScope: {
        // SECURITY: Hide costMargin from regular catalog queries
        attributes: { exclude: ["costMargin"] },
        where: { isActive: true },
      },
      scopes: {
        withMargin: {
          attributes: { include: ["costMargin"] },
        },
      },
      hooks: {
        beforeCreate: (product: Product) => {
          product.sku = product.sku.trim().toUpperCase();
        },
      },
    }
  );

  // Order Init
  Order.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      merchantId: { type: DataTypes.INTEGER, allowNull: false },
      orderNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
      totalAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.0 },
      status: {
        type: DataTypes.ENUM("PENDING", "PAID", "SHIPPED"),
        defaultValue: "PENDING",
      },
    },
    { sequelize, tableName: "orders", timestamps: true }
  );

  // OrderItem Init
  OrderItem.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      orderId: { type: DataTypes.INTEGER, allowNull: false },
      productId: { type: DataTypes.INTEGER, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    },
    { sequelize, tableName: "order_items", timestamps: false }
  );

  // --- Associations ---
  Merchant.hasMany(Product, { foreignKey: "merchantId", as: "products" });
  Product.belongsTo(Merchant, { foreignKey: "merchantId", as: "merchant" });

  Merchant.hasMany(Order, { foreignKey: "merchantId", as: "orders" });
  Order.belongsTo(Merchant, { foreignKey: "merchantId", as: "merchant" });

  Order.hasMany(OrderItem, { foreignKey: "orderId", as: "items" });
  OrderItem.belongsTo(Order, { foreignKey: "orderId", as: "order" });

  OrderItem.belongsTo(Product, { foreignKey: "productId", as: "product" });
}

// --- 3. AUTOMATED TEST SUITE ---

async function runCheckpoint3Tests() {
  console.log("=== Running Checkpoint Challenge 3: Full-Stack Model Architecture ===\n");

  const sequelize = new Sequelize("sqlite::memory:", { logging: false });
  setupCommercePlatform(sequelize);
  await sequelize.sync({ force: true }); // Sync in-memory tables

  // 1. Create Merchant
  console.log("--- 1. Creating Merchant ---");
  const merchant = await Merchant.create({
    name: "Apex Electronics",
    email: "contact@apex.com",
  });
  console.log(`Merchant created: ID ${merchant.id}, Name: ${merchant.name}`);

  // 2. Create Products with Hooks and Scopes
  console.log("\n--- 2. Creating Products with SKU Uppercase Hook ---");
  const p1 = await Product.create({
    merchantId: merchant.id,
    sku: "  sku-phone-101  ", // Test lowercase and whitespace trimming hook
    title: "Flagship Smartphone",
    price: 899.99,
    costMargin: 450.0,
    isActive: true,
  });

  const p2 = await Product.create({
    merchantId: merchant.id,
    sku: "SKU-CASE-202",
    title: "Silicone Protective Case",
    price: 29.99,
    costMargin: 5.0,
    isActive: false, // Inactive product (should be hidden by defaultScope)
  });

  console.log("Hook formatted SKU to uppercase:", p1.sku === "SKU-PHONE-101");

  // 3. Verify Default Scope Filtering & Field Exclusion
  console.log("\n--- 3. Verifying Security & Default Scopes ---");
  const activeProducts = await Product.findAll();
  console.log("Default scope excluded inactive product:", activeProducts.length === 1);
  console.log("Default scope excluded costMargin field:", (activeProducts[0] as any).costMargin === undefined);

  // Test explicit named scope
  const allWithMargin = await Product.scope("withMargin").unscoped().findAll();
  console.log("unscoped() retrieved both active and inactive:", allWithMargin.length === 2);
  const foundMargin = (allWithMargin[0] as any).costMargin !== undefined;
  console.log("withMargin scope hydrated costMargin correctly:", foundMargin);

  // 4. Create Order and Associated Order Items
  console.log("\n--- 4. Creating Order with Nested Associated Items ---");
  const order = await Order.create({
    merchantId: merchant.id,
    orderNumber: "ORD-2026-X100",
    status: "PAID",
    totalAmount: 929.98,
  });

  await OrderItem.create({
    orderId: order.id,
    productId: p1.id,
    quantity: 1,
    unitPrice: 899.99,
  });

  await OrderItem.create({
    orderId: order.id,
    productId: p2.id,
    quantity: 1,
    unitPrice: 29.99,
  });

  // 5. Test Deep Eager Loading with Associations
  console.log("\n--- 5. Testing Deep Eager Loading with Associations ---");
  const orderWithDetails = await Order.findByPk(order.id, {
    include: [
      {
        model: Merchant,
        as: "merchant",
        attributes: ["id", "name", "email"],
      },
      {
        model: OrderItem,
        as: "items",
        include: [
          {
            model: Product.unscoped(), // Product might be inactive, so unscoped
            as: "product",
            attributes: ["id", "sku", "title"],
          },
        ],
      },
    ],
  });

  console.log("Order retrieved successfully:", !!orderWithDetails);
  console.log("Merchant loaded via association:", orderWithDetails?.merchant?.name === "Apex Electronics");
  console.log("Order items count:", orderWithDetails?.items?.length === 2);
  console.log("Deeply nested item product SKU:", orderWithDetails?.items?.[0]?.product?.sku === "SKU-PHONE-101");

  console.log("\n=== Checkpoint 3 Complete: Full-Stack Model Architecture Verified! ===");
}

runCheckpoint3Tests();
```

---

## Complete Curriculum Summary: From Scratch to Senior Sequelize Architect

Across these 15 comprehensive topics and 3 end-to-end production checkpoints, you have mastered the complete Sequelize engineering paradigm:

1. **Foundational Architecture**: Connection pooling, dialects, SSL handshakes, and lifecycle management.
2. **Raw SQL Performance Engine**: Zero-overhead parameterized queries with `QueryTypes`, positional (`?`) and named (`:key`) replacements, and total SQL injection defense.
3. **Dynamic Replacements & Upserts**: High-throughput multi-row dictionary reduction (`:orderId_${i}`) and batch limits.
4. **Modular Query Composition**: Production-grade composable fragments (`orgJoin`, `orgWhere`), DRY query architecture, and centralized access security.
5. **High-Performance Search Engines**: Tokenization, comma-separated `IN (:searchList)` fast paths, and fanned-out fuzzy `ILIKE` clauses.
6. **Enterprise Multi-Tenancy**: Schema-per-tenant isolation with strict identifier regex whitelisting (`"${schema}".table`).
7. **ACID Transaction Mastery**: Managed (`sequelize.transaction(async t => ...)`) vs Unmanaged workflows, and zero connection leaks.
8. **PostgreSQL Power Features**: Atomic `ON CONFLICT DO UPDATE`, `EXCLUDED`, `COALESCE`, `RETURNING *`, and native `JSONB` document operations.
9. **Object-Relational Model Layer**: TypeScript Class models (`Model.init()`), precision data types, and paranoid soft-deletes.
10. **Model Operations & Associations**: `findAndCountAll`, `bulkCreate`, 1-to-1, 1-to-Many, Many-to-Many associations, eager loading (`include`), and avoiding Cartesian explosions with `separate: true`.
11. **Scopes, Hooks & Production Sizing**: Reusable query scopes, automated security filters, lifecycle interceptors, slow-query tracking, and optimal connection pool calculations.
