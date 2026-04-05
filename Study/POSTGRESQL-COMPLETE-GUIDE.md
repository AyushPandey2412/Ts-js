# PostgreSQL — Complete Guide: Beginner to Advanced

> Pure PostgreSQL knowledge. No project code. Every topic covered.

---

## Table of Contents

1. [What is PostgreSQL](#1-what-is-postgresql)
2. [Installation and Setup](#2-installation-and-setup)
3. [Databases, Schemas, Tables](#3-databases-schemas-tables)
4. [Data Types](#4-data-types)
5. [Basic SQL — CRUD](#5-basic-sql--crud)
6. [Filtering — WHERE Clause](#6-filtering--where-clause)
7. [Sorting — ORDER BY](#7-sorting--order-by)
8. [Pagination — LIMIT and OFFSET](#8-pagination--limit-and-offset)
9. [Joins](#9-joins)
10. [Aggregations and GROUP BY](#10-aggregations-and-group-by)
11. [Subqueries](#11-subqueries)
12. [CTEs — Common Table Expressions](#12-ctes--common-table-expressions)
13. [Window Functions](#13-window-functions)
14. [Indexes](#14-indexes)
15. [Transactions](#15-transactions)
16. [Constraints](#16-constraints)
17. [Views and Materialized Views](#17-views-and-materialized-views)
18. [Stored Procedures and Functions](#18-stored-procedures-and-functions)
19. [Triggers](#19-triggers)
20. [JSONB and Arrays](#20-jsonb-and-arrays)
21. [Full-Text Search](#21-full-text-search)
22. [Query Planning and EXPLAIN ANALYZE](#22-query-planning-and-explain-analyze)
23. [Performance Optimization](#23-performance-optimization)
24. [Concurrency and Locking](#24-concurrency-and-locking)
25. [Partitioning](#25-partitioning)
26. [Replication and High Availability](#26-replication-and-high-availability)
27. [Connection Pooling](#27-connection-pooling)
28. [Backup and Restore](#28-backup-and-restore)
29. [Security](#29-security)
30. [Advanced Patterns](#30-advanced-patterns)

---

## 1. What is PostgreSQL

PostgreSQL is an open-source, object-relational database management system (RDBMS). It is known for being:

- **ACID compliant** — Atomicity, Consistency, Isolation, Durability
- **Extensible** — custom types, functions, operators, index types
- **Standards compliant** — follows SQL standard more closely than MySQL
- **Feature-rich** — JSONB, full-text search, window functions, CTEs, partitioning

### How PostgreSQL Works (Architecture)

```
Client App (Node.js, Python, etc.)
    ↓  TCP connection (port 5432)
Postmaster Process (main daemon)
    ↓  forks per connection
Backend Process (one per connection)
    ↓
Query Parser → Rewriter → Planner/Optimizer → Executor
    ↓
Storage Engine (heap files, indexes)
    ↓
WAL (Write-Ahead Log) for crash recovery
    ↓
Shared Buffers (in-memory cache of pages)
```

**Key processes:**
- `postmaster` — master process, listens for connections
- `postgres` (backend) — one per client connection, runs queries
- `autovacuum` — automatically reclaims space from deleted rows
- `WAL writer` — writes ahead logs to disk for durability
- `checkpointer` — flushes dirty pages to disk periodically

### ACID Properties

| Property | Meaning | How PostgreSQL guarantees it |
|---|---|---|
| Atomicity | All or nothing — a transaction either fully commits or fully rolls back | Transaction rollback on error |
| Consistency | Data always satisfies defined constraints | Constraints checked before commit |
| Isolation | Concurrent transactions don't interfere | MVCC (Multi-Version Concurrency Control) |
| Durability | Committed data survives crashes | WAL (Write-Ahead Log) |

### MVCC — How PostgreSQL Handles Concurrent Reads and Writes

PostgreSQL uses MVCC so readers never block writers and writers never block readers.

Every row has hidden system columns:
- `xmin` — transaction ID that inserted this row
- `xmax` — transaction ID that deleted/updated this row (0 if still live)

When you `UPDATE` a row, PostgreSQL does NOT modify the row in-place. It:
1. Marks the old row as dead (sets `xmax`)
2. Inserts a new row with the new values (new `xmin`)

When you read, PostgreSQL shows you the version of the row that was visible at your transaction start time. This is why `SELECT` never waits for `UPDATE` to finish.

The old dead rows are cleaned up by `VACUUM`.

---

## 2. Installation and Setup

### Install on Ubuntu/Debian

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Connect as postgres superuser
sudo -u postgres psql
```

### Install on macOS

```bash
# Using Homebrew
brew install postgresql@16
brew services start postgresql@16

# Connect
psql postgres
```

### Install on Windows

Download installer from https://www.postgresql.org/download/windows/ and run it.

### psql — Command Line Client

```bash
# Connect to local db
psql -U postgres -d mydb

# Connect to remote db
psql -h hostname -p 5432 -U username -d dbname

# Useful psql commands
\l          -- list databases
\c dbname   -- connect to database
\dt         -- list tables in current schema
\dt schema.*  -- list tables in specific schema
\d tablename  -- describe table structure
\dn         -- list schemas
\du         -- list users/roles
\timing     -- toggle query timing
\x          -- toggle expanded output
\q          -- quit

# Run SQL from file
psql -U postgres -d mydb -f script.sql
```

### postgresql.conf — Key Configuration

```conf
# Location: /etc/postgresql/16/main/postgresql.conf (Linux)
#            /usr/local/var/postgresql@16/ (macOS)

# Memory
shared_buffers = 256MB          # RAM for caching pages. Set to 25% of RAM.
work_mem = 4MB                  # RAM per sort/hash operation. Increase for complex queries.
maintenance_work_mem = 64MB     # RAM for VACUUM, CREATE INDEX

# Connections
max_connections = 100           # Max concurrent connections

# Query performance
effective_cache_size = 1GB      # Estimate of OS disk cache. Set to 50-75% of RAM.
random_page_cost = 1.1          # SSD: 1.1. HDD: 4.0. Affects index vs seq scan choice.

# Logging
log_min_duration_statement = 1000  # Log queries slower than 1 second
log_line_prefix = '%t [%p] '

# WAL
wal_level = replica             # 'minimal', 'replica', 'logical'
```

---

## 3. Databases, Schemas, Tables

### Hierarchy

```
PostgreSQL Server (cluster)
  └── Database (logical separation, separate files)
        └── Schema (namespace within database)
              └── Tables, Views, Functions, etc.
```

### Databases

```sql
-- Create database
CREATE DATABASE mydb;
CREATE DATABASE mydb OWNER myuser ENCODING 'UTF8';

-- Drop database
DROP DATABASE mydb;

-- List databases
\l
-- or
SELECT datname FROM pg_database;

-- Connect to database
\c mydb
```

### Schemas

```sql
-- Create schema
CREATE SCHEMA myschema;
CREATE SCHEMA IF NOT EXISTS myschema AUTHORIZATION myuser;

-- Set default schema for session
SET search_path TO myschema, public;

-- Drop schema
DROP SCHEMA myschema;
DROP SCHEMA myschema CASCADE; -- also drops everything inside

-- List schemas
\dn
-- or
SELECT schema_name FROM information_schema.schemata;
```

**Why use schemas:**
- Multi-tenancy (one schema per customer)
- Logical grouping (sales schema, hr schema, public schema)
- Security isolation

### Tables

```sql
-- Create table
CREATE TABLE employees (
  employee_id SERIAL PRIMARY KEY,
  first_name  VARCHAR(100) NOT NULL,
  last_name   VARCHAR(100) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  salary      NUMERIC(10, 2),
  hire_date   DATE DEFAULT CURRENT_DATE,
  department  VARCHAR(100),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Create table in specific schema
CREATE TABLE hr.employees (...);

-- Drop table
DROP TABLE employees;
DROP TABLE IF EXISTS employees;
DROP TABLE employees CASCADE; -- drops dependent objects (views, FK refs)

-- Rename table
ALTER TABLE employees RENAME TO staff;

-- Describe table
\d employees
```

---

## 4. Data Types

### Numeric Types

```sql
SMALLINT          -- 2 bytes, -32768 to 32767
INTEGER / INT     -- 4 bytes, -2 billion to 2 billion
BIGINT            -- 8 bytes, very large numbers
SERIAL            -- auto-incrementing INTEGER (1, 2, 3...)
BIGSERIAL         -- auto-incrementing BIGINT
NUMERIC(p, s)     -- exact decimal, p=precision, s=scale. Use for money.
DECIMAL(p, s)     -- alias for NUMERIC
REAL              -- 4-byte float (approximate)
DOUBLE PRECISION  -- 8-byte float (approximate)

-- Examples
price NUMERIC(10, 2)   -- up to 99999999.99
quantity INTEGER
id BIGSERIAL           -- auto-increment big number
```

### Text Types

```sql
CHAR(n)           -- fixed length, padded with spaces
VARCHAR(n)        -- variable length, max n characters
TEXT              -- unlimited length

-- Recommendation: Use TEXT for most strings. VARCHAR(n) for enforced limits.
-- CHAR(n) is rarely useful.
```

### Date/Time Types

```sql
DATE                -- date only: '2024-01-15'
TIME                -- time only: '14:30:00'
TIMESTAMP           -- date + time, no timezone: '2024-01-15 14:30:00'
TIMESTAMPTZ         -- date + time with timezone (stored as UTC)
INTERVAL            -- duration: '2 hours', '30 days'

-- Recommendation: Always use TIMESTAMPTZ for application timestamps.
-- It stores UTC and converts to local timezone on retrieval.

-- Functions
NOW()               -- current timestamp with timezone
CURRENT_DATE        -- current date
CURRENT_TIME        -- current time
CURRENT_TIMESTAMP   -- same as NOW()
```

### Boolean

```sql
BOOLEAN -- TRUE, FALSE, NULL

-- PostgreSQL accepts: true, false, 'true', 'false', 't', 'f', '1', '0', 'yes', 'no'
```

### UUID

```sql
UUID -- universally unique identifier: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

-- Generate UUID
SELECT gen_random_uuid();   -- PostgreSQL 13+
SELECT uuid_generate_v4();  -- requires uuid-ossp extension

-- Best practice: Use UUID as primary key for distributed systems
id UUID DEFAULT gen_random_uuid() PRIMARY KEY
```

### JSON and JSONB

```sql
JSON   -- stores text as-is, preserves whitespace and key order
JSONB  -- stores binary representation, indexable, faster to query

-- Recommendation: Always use JSONB. JSON is only needed if exact text preservation matters.

metadata JSONB DEFAULT '{}'
```

### Arrays

```sql
-- Array of integers
scores INTEGER[]

-- Array of text
tags TEXT[]

-- Array of enum
channels notification_channel[]

-- Usage
INSERT INTO products (tags) VALUES (ARRAY['electronics', 'sale']);
SELECT * FROM products WHERE 'sale' = ANY(tags);
```

### ENUM

```sql
-- Create enum type
CREATE TYPE order_status AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- Use in table
status order_status DEFAULT 'PENDING'

-- Add value to existing enum (PostgreSQL 9.1+)
ALTER TYPE order_status ADD VALUE 'RETURNED' AFTER 'DELIVERED';

-- Benefit: enforces valid values at DB level, compact storage
```

---

## 5. Basic SQL — CRUD

### INSERT

```sql
-- Single row
INSERT INTO employees (first_name, last_name, email, salary)
VALUES ('John', 'Doe', 'john@example.com', 50000);

-- Multiple rows (one round-trip)
INSERT INTO employees (first_name, last_name, email, salary)
VALUES
  ('Jane', 'Smith', 'jane@example.com', 60000),
  ('Bob', 'Wilson', 'bob@example.com', 55000),
  ('Alice', 'Brown', 'alice@example.com', 65000);

-- Insert from SELECT
INSERT INTO archive_employees (employee_id, first_name, last_name)
SELECT employee_id, first_name, last_name
FROM employees
WHERE is_active = FALSE;

-- INSERT with RETURNING (PostgreSQL-specific)
INSERT INTO employees (first_name, last_name, email)
VALUES ('Tom', 'Jones', 'tom@example.com')
RETURNING employee_id, created_at;
-- Returns the inserted row's values without needing a second SELECT

-- ON CONFLICT (upsert) — insert or update on duplicate
INSERT INTO employees (email, first_name, salary)
VALUES ('john@example.com', 'John', 50000)
ON CONFLICT (email)
  DO UPDATE SET salary = EXCLUDED.salary, first_name = EXCLUDED.first_name;
-- EXCLUDED refers to the row that tried to insert

-- ON CONFLICT DO NOTHING — skip if duplicate
INSERT INTO employees (email, first_name)
VALUES ('john@example.com', 'John')
ON CONFLICT (email) DO NOTHING;
```

### SELECT

```sql
-- All columns
SELECT * FROM employees;

-- Specific columns
SELECT first_name, last_name, email FROM employees;

-- With alias
SELECT first_name AS name, salary * 12 AS annual_salary FROM employees;

-- Distinct values
SELECT DISTINCT department FROM employees;

-- Count distinct
SELECT COUNT(DISTINCT department) FROM employees;

-- Conditional expression inline
SELECT
  first_name,
  salary,
  CASE
    WHEN salary >= 80000 THEN 'Senior'
    WHEN salary >= 50000 THEN 'Mid'
    ELSE 'Junior'
  END AS seniority_level
FROM employees;
```

### UPDATE

```sql
-- Update one column
UPDATE employees
SET salary = 60000
WHERE employee_id = 1;

-- Update multiple columns
UPDATE employees
SET
  salary = salary * 1.1,  -- 10% raise
  department = 'Engineering'
WHERE department = 'Tech';

-- Update with RETURNING
UPDATE employees
SET salary = 70000
WHERE employee_id = 5
RETURNING employee_id, first_name, salary;

-- Update using a subquery
UPDATE employees
SET salary = (
  SELECT AVG(salary) * 1.2
  FROM employees
  WHERE department = 'Engineering'
)
WHERE department = 'Engineering' AND salary < 50000;

-- Update using JOIN (FROM clause)
UPDATE employees e
SET department = d.new_name
FROM department_renames d
WHERE e.department = d.old_name;
```

### DELETE

```sql
-- Delete specific rows
DELETE FROM employees WHERE is_active = FALSE;

-- Delete with RETURNING
DELETE FROM employees
WHERE hire_date < '2020-01-01'
RETURNING employee_id, email;

-- Delete all rows (but keep table structure)
DELETE FROM employees;

-- Faster way to delete all rows (no row-by-row logging, no RETURNING)
TRUNCATE TABLE employees;
TRUNCATE TABLE employees RESTART IDENTITY; -- also resets SERIAL counter
TRUNCATE TABLE employees CASCADE; -- also truncates dependent tables

-- Delete using JOIN
DELETE FROM order_items oi
USING orders o
WHERE oi.order_id = o.order_id
AND o.created_at < '2020-01-01';
```

---

## 6. Filtering — WHERE Clause

### Comparison Operators

```sql
=         -- equal
<> or !=  -- not equal
<         -- less than
>         -- greater than
<=        -- less than or equal
>=        -- greater than or equal

WHERE salary = 50000
WHERE salary != 50000
WHERE hire_date >= '2023-01-01'
```

### Logical Operators

```sql
AND   -- both conditions true
OR    -- either condition true
NOT   -- negate condition

WHERE salary > 50000 AND department = 'Engineering'
WHERE department = 'Sales' OR department = 'Marketing'
WHERE NOT is_active
```

### NULL Handling

```sql
-- Check for NULL (NEVER use = NULL)
WHERE phone IS NULL
WHERE phone IS NOT NULL

-- COALESCE: return first non-null value
SELECT COALESCE(phone, 'N/A') AS phone FROM employees;

-- NULLIF: return NULL if two values are equal (prevents division by zero)
SELECT revenue / NULLIF(costs, 0) AS margin FROM financials;

-- NULLIF example
SELECT NULLIF('active', 'active');  -- returns NULL
SELECT NULLIF('active', 'inactive');  -- returns 'active'
```

### IN and NOT IN

```sql
-- IN: match any value in list
WHERE department IN ('Engineering', 'Sales', 'Marketing')

-- NOT IN
WHERE status NOT IN ('CANCELLED', 'REFUNDED')

-- IN with subquery
WHERE employee_id IN (
  SELECT manager_id FROM departments WHERE is_active = TRUE
)

-- WARNING: NOT IN with NULL values behaves unexpectedly
-- If the subquery returns any NULL, NOT IN returns nothing
-- Use NOT EXISTS instead for subqueries
```

### BETWEEN

```sql
-- Inclusive on both ends
WHERE salary BETWEEN 50000 AND 80000
-- Same as: WHERE salary >= 50000 AND salary <= 80000

WHERE hire_date BETWEEN '2023-01-01' AND '2023-12-31'
```

### LIKE and ILIKE

```sql
-- LIKE: case-sensitive pattern matching
-- % = any sequence of characters
-- _ = exactly one character
WHERE email LIKE '%@gmail.com'          -- ends with @gmail.com
WHERE first_name LIKE 'J%'             -- starts with J
WHERE last_name LIKE '_oe'             -- any char + oe (Doe, Joe, Woe)
WHERE email LIKE '%john%'              -- contains john

-- ILIKE: case-insensitive (PostgreSQL-specific)
WHERE email ILIKE '%GMAIL%'            -- matches gmail, Gmail, GMAIL

-- Pattern with ESCAPE
WHERE path LIKE '50\%' ESCAPE '\'      -- literally matches 50%

-- Performance note:
-- LIKE 'prefix%' CAN use a B-tree index
-- LIKE '%suffix' and LIKE '%middle%' CANNOT use B-tree index
-- Use pg_trgm extension + GIN index for contains/suffix searches
```

### EXISTS and NOT EXISTS

```sql
-- EXISTS: true if subquery returns any rows
SELECT * FROM customers c
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.customer_id = c.customer_id
  AND o.created_at >= '2024-01-01'
);
-- Returns customers who placed an order in 2024

-- NOT EXISTS: true if subquery returns no rows
SELECT * FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id
);
-- Returns customers who have never ordered

-- EXISTS vs IN:
-- EXISTS stops as soon as it finds one match (more efficient)
-- IN collects all matching values first
-- For large datasets, EXISTS is generally faster
```

### ANY and ALL

```sql
-- ANY: compare to any value in a set
WHERE salary > ANY(SELECT salary FROM employees WHERE department = 'Management')
-- Returns employees earning more than the lowest management salary

-- ALL: compare to all values in a set
WHERE salary > ALL(SELECT salary FROM employees WHERE department = 'Interns')
-- Returns employees earning more than every intern
```

---

## 7. Sorting — ORDER BY

```sql
-- Ascending (default)
SELECT * FROM employees ORDER BY salary;
SELECT * FROM employees ORDER BY salary ASC;

-- Descending
SELECT * FROM employees ORDER BY salary DESC;

-- Multiple columns
SELECT * FROM employees ORDER BY department ASC, salary DESC;
-- Sort by department A→Z, then within each department highest salary first

-- NULL handling
ORDER BY salary DESC NULLS LAST    -- NULLs at the end
ORDER BY salary DESC NULLS FIRST   -- NULLs at the start
-- Default: DESC = NULLS FIRST, ASC = NULLS LAST

-- Sort by expression
ORDER BY LENGTH(last_name) DESC;

-- Sort by CASE (custom order)
ORDER BY CASE status
  WHEN 'URGENT' THEN 1
  WHEN 'NORMAL' THEN 2
  WHEN 'LOW' THEN 3
  ELSE 4
END;

-- Sort by column position (not recommended, brittle)
SELECT first_name, salary FROM employees ORDER BY 2 DESC;
-- 2 = second column = salary
```

---

## 8. Pagination — LIMIT and OFFSET

### Offset Pagination

```sql
-- Page 1 (rows 1-10)
SELECT * FROM employees ORDER BY employee_id LIMIT 10 OFFSET 0;

-- Page 2 (rows 11-20)
SELECT * FROM employees ORDER BY employee_id LIMIT 10 OFFSET 10;

-- Page N
-- offset = (page - 1) * limit
-- Page 5: LIMIT 10 OFFSET 40

-- Always pair with COUNT for total pages
SELECT COUNT(*) AS total FROM employees WHERE department = 'Engineering';
```

**Offset pagination problem:**

At page 1000 (offset 9990), PostgreSQL reads 10,000 rows and discards 9,990. Performance degrades linearly with page number.

### Cursor-Based Pagination

```sql
-- First page
SELECT employee_id, first_name, salary, created_at
FROM employees
ORDER BY created_at DESC, employee_id DESC
LIMIT 10;

-- Next page: use last row's (created_at, employee_id) as cursor
SELECT employee_id, first_name, salary, created_at
FROM employees
WHERE (created_at, employee_id) < ('2024-01-15 10:30:00', 'uuid-here')
ORDER BY created_at DESC, employee_id DESC
LIMIT 10;

-- Why it's fast: uses index on (created_at, employee_id)
-- PostgreSQL seeks to cursor position directly, no skipping
```

**Trade-offs:**

| Feature | Offset | Cursor |
|---|---|---|
| Jump to page N | Yes | No |
| Performance at deep pages | Degrades | Constant |
| Consistent results during inserts | No (rows shift) | Yes |
| Implementation complexity | Simple | Moderate |

---

## 9. Joins

### INNER JOIN

Returns only rows where there is a match in BOTH tables.

```sql
SELECT e.first_name, e.last_name, d.department_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.department_id;
-- Only employees who have a matching department

-- Short syntax (JOIN = INNER JOIN)
FROM employees e JOIN departments d ON e.department_id = d.department_id
```

### LEFT JOIN (LEFT OUTER JOIN)

Returns ALL rows from left table, with matching rows from right (NULL if no match).

```sql
SELECT e.first_name, d.department_name
FROM employees e
LEFT JOIN departments d ON e.department_id = d.department_id;
-- Returns all employees, even those with no department (department_name = NULL)
```

### RIGHT JOIN (RIGHT OUTER JOIN)

Returns ALL rows from right table, with matching from left.

```sql
SELECT e.first_name, d.department_name
FROM employees e
RIGHT JOIN departments d ON e.department_id = d.department_id;
-- Returns all departments, even empty ones (first_name = NULL)
-- Rarely used — usually rewrite as LEFT JOIN with tables swapped
```

### FULL OUTER JOIN

Returns ALL rows from BOTH tables, NULL where no match.

```sql
SELECT e.first_name, d.department_name
FROM employees e
FULL OUTER JOIN departments d ON e.department_id = d.department_id;
-- Returns employees without departments AND departments without employees
```

### CROSS JOIN

Returns every combination of rows from both tables (Cartesian product).

```sql
SELECT color, size FROM colors CROSS JOIN sizes;
-- If colors has 3 rows and sizes has 4 rows → returns 12 rows
-- Use with care — can generate huge result sets
```

### SELF JOIN

Join a table to itself.

```sql
-- Find manager name for each employee
SELECT
  e.first_name AS employee,
  m.first_name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.employee_id;
```

### JOIN LATERAL

Lateral join runs a subquery for each row of the outer query, with access to outer columns.

```sql
-- Get top 3 orders for each customer
SELECT c.customer_id, c.name, recent.order_id, recent.amount
FROM customers c
LEFT JOIN LATERAL (
  SELECT order_id, amount
  FROM orders
  WHERE customer_id = c.customer_id  -- references outer table
  ORDER BY created_at DESC
  LIMIT 3
) recent ON TRUE;

-- Without LATERAL you cannot reference c.customer_id inside the subquery
-- LATERAL makes the subquery "aware" of the outer row
```

### JOIN Performance Tips

```sql
-- Always JOIN on indexed columns
-- Bad: joining on un-indexed column forces hash join or nested loop
FROM orders o JOIN customers c ON o.customer_email = c.email
-- Good: if customer_id is a FK with index
FROM orders o JOIN customers c ON o.customer_id = c.customer_id

-- Reduce rows early with WHERE before joining
-- Let the planner push conditions down
SELECT * FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.created_at >= '2024-01-01'  -- filter orders first, then join

-- Use EXPLAIN to see which join algorithm PostgreSQL chose:
-- Nested Loop: good for small result sets
-- Hash Join: good for large tables without index
-- Merge Join: good when both sides are already sorted
```

---

## 10. Aggregations and GROUP BY

### Aggregate Functions

```sql
COUNT(*)          -- count all rows (including NULLs)
COUNT(column)     -- count non-NULL values
COUNT(DISTINCT column) -- count distinct non-NULL values
SUM(column)       -- sum of values
AVG(column)       -- average (excludes NULLs)
MIN(column)       -- minimum value
MAX(column)       -- maximum value
BOOL_OR(expr)     -- true if any value is true
BOOL_AND(expr)    -- true if all values are true
ARRAY_AGG(column) -- collect values into array
STRING_AGG(column, separator) -- concatenate strings
```

### GROUP BY

```sql
-- Count employees per department
SELECT department, COUNT(*) AS employee_count
FROM employees
GROUP BY department;

-- Average salary per department
SELECT department, ROUND(AVG(salary), 2) AS avg_salary
FROM employees
GROUP BY department
ORDER BY avg_salary DESC;

-- Multiple grouping columns
SELECT department, is_active, COUNT(*) AS count
FROM employees
GROUP BY department, is_active;

-- Rule: any column in SELECT that's not an aggregate must be in GROUP BY
-- This FAILS:
SELECT department, first_name, COUNT(*) FROM employees GROUP BY department;
-- first_name must be in GROUP BY or wrapped in an aggregate
```

### HAVING

```sql
-- HAVING filters AFTER grouping (WHERE filters BEFORE grouping)
SELECT department, COUNT(*) AS employee_count
FROM employees
GROUP BY department
HAVING COUNT(*) > 10;
-- Only departments with more than 10 employees

-- Combine WHERE and HAVING
SELECT department, AVG(salary) AS avg_salary
FROM employees
WHERE is_active = TRUE           -- filter rows first
GROUP BY department
HAVING AVG(salary) > 60000;     -- then filter groups
```

### ROLLUP, CUBE, GROUPING SETS

```sql
-- ROLLUP: hierarchical subtotals
SELECT department, job_title, SUM(salary)
FROM employees
GROUP BY ROLLUP(department, job_title);
-- Produces: (dept, title), (dept, NULL=subtotal), (NULL, NULL=grand total)

-- CUBE: all combinations of subtotals
SELECT department, region, SUM(salary)
FROM employees
GROUP BY CUBE(department, region);
-- Produces: (dept, region), (dept, NULL), (NULL, region), (NULL, NULL)

-- GROUPING SETS: specific combinations
SELECT department, job_title, SUM(salary)
FROM employees
GROUP BY GROUPING SETS ((department), (job_title), ());
-- Produces: by dept only, by title only, grand total
```

---

## 11. Subqueries

### Scalar Subquery (returns one value)

```sql
-- Find employees earning above average
SELECT first_name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- Subquery in SELECT column
SELECT
  first_name,
  salary,
  (SELECT AVG(salary) FROM employees) AS company_avg,
  salary - (SELECT AVG(salary) FROM employees) AS diff_from_avg
FROM employees;
```

### Table Subquery (inline view)

```sql
-- Derived table: subquery in FROM clause
SELECT dept_stats.department, dept_stats.avg_salary, e.first_name
FROM employees e
JOIN (
  SELECT department, AVG(salary) AS avg_salary
  FROM employees
  GROUP BY department
) dept_stats ON e.department = dept_stats.department
WHERE e.salary > dept_stats.avg_salary;
```

### Correlated Subquery

A subquery that references the outer query. Runs once per outer row.

```sql
-- Find employees earning more than their department average
SELECT e.first_name, e.salary, e.department
FROM employees e
WHERE e.salary > (
  SELECT AVG(e2.salary)
  FROM employees e2
  WHERE e2.department = e.department  -- references outer query
);
-- For each employee row, the subquery runs once for that employee's department
-- At 100,000 employees, this runs 100,000 subqueries — slow!
```

**Better approach — use a JOIN:**
```sql
SELECT e.first_name, e.salary, e.department
FROM employees e
JOIN (
  SELECT department, AVG(salary) AS dept_avg
  FROM employees
  GROUP BY department
) dept ON e.department = dept.department
WHERE e.salary > dept.dept_avg;
-- Runs aggregation once, then joins — much faster
```

---

## 12. CTEs — Common Table Expressions

CTEs are named temporary result sets defined with the `WITH` keyword.

```sql
-- Basic CTE
WITH dept_averages AS (
  SELECT department, AVG(salary) AS avg_salary
  FROM employees
  GROUP BY department
)
SELECT e.first_name, e.salary, d.avg_salary
FROM employees e
JOIN dept_averages d ON e.department = d.department
WHERE e.salary > d.avg_salary;
```

### Multiple CTEs

```sql
WITH
active_employees AS (
  SELECT * FROM employees WHERE is_active = TRUE
),
dept_stats AS (
  SELECT department, COUNT(*) AS headcount, AVG(salary) AS avg_salary
  FROM active_employees
  GROUP BY department
),
top_departments AS (
  SELECT department FROM dept_stats WHERE headcount > 20
)
SELECT ae.first_name, ae.salary, ds.avg_salary
FROM active_employees ae
JOIN dept_stats ds ON ae.department = ds.department
WHERE ae.department IN (SELECT department FROM top_departments);
```

### Recursive CTE

Used for hierarchical data (org charts, folder trees, graph traversal).

```sql
-- Org chart: find all reports under a manager
WITH RECURSIVE org_tree AS (
  -- Base case: start with top-level manager
  SELECT employee_id, first_name, manager_id, 0 AS level
  FROM employees
  WHERE employee_id = :root_manager_id

  UNION ALL

  -- Recursive case: find direct reports
  SELECT e.employee_id, e.first_name, e.manager_id, ot.level + 1
  FROM employees e
  JOIN org_tree ot ON e.manager_id = ot.employee_id
)
SELECT * FROM org_tree ORDER BY level, first_name;

-- Folder tree example
WITH RECURSIVE folder_tree AS (
  SELECT folder_id, folder_name, parent_id, 0 AS depth
  FROM folders WHERE parent_id IS NULL  -- root folders

  UNION ALL

  SELECT f.folder_id, f.folder_name, f.parent_id, ft.depth + 1
  FROM folders f
  JOIN folder_tree ft ON f.parent_id = ft.folder_id
  WHERE ft.depth < 10  -- prevent infinite recursion
)
SELECT REPEAT('  ', depth) || folder_name AS indented_name
FROM folder_tree
ORDER BY folder_id;
```

### Writeable CTEs (CTE with INSERT/UPDATE/DELETE)

```sql
-- Move rows from one table to another atomically
WITH deleted AS (
  DELETE FROM orders WHERE status = 'CANCELLED' AND created_at < '2023-01-01'
  RETURNING *
)
INSERT INTO archived_orders SELECT * FROM deleted;

-- Multiple writes in one statement
WITH
new_order AS (
  INSERT INTO orders (customer_id, total_amount) VALUES (1, 500)
  RETURNING order_id
),
first_item AS (
  INSERT INTO order_items (order_id, product_id, quantity)
  SELECT order_id, 42, 2 FROM new_order
  RETURNING item_id
)
SELECT order_id FROM new_order;
```

---

## 13. Window Functions

Window functions compute a value for each row based on a "window" of related rows, without collapsing them into groups.

**Key difference from GROUP BY:**
- `GROUP BY` → collapses N rows into 1 row per group
- Window function → keeps all N rows, adds a calculated column

### Syntax

```sql
function_name() OVER (
  PARTITION BY column   -- divide rows into groups (like GROUP BY, but rows stay separate)
  ORDER BY column       -- define order within each partition
  ROWS/RANGE BETWEEN ... -- define which rows are in the "window"
)
```

### Ranking Functions

```sql
-- ROW_NUMBER: unique sequential number within partition
SELECT
  first_name,
  department,
  salary,
  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rank_in_dept
FROM employees;
-- Each department gets rows numbered 1, 2, 3...

-- RANK: same rank for ties, gaps after ties
SELECT
  first_name, salary,
  RANK() OVER (ORDER BY salary DESC) AS salary_rank
FROM employees;
-- 1, 2, 2, 4, 5 (gap after tied ranks)

-- DENSE_RANK: same rank for ties, no gaps
SELECT
  first_name, salary,
  DENSE_RANK() OVER (ORDER BY salary DESC) AS salary_rank
FROM employees;
-- 1, 2, 2, 3, 4 (no gap)

-- NTILE: divide into N buckets
SELECT
  first_name, salary,
  NTILE(4) OVER (ORDER BY salary) AS salary_quartile
FROM employees;
-- 1=bottom 25%, 2=25-50%, 3=50-75%, 4=top 25%
```

### Aggregate Window Functions

```sql
-- Running total (cumulative sum)
SELECT
  order_date,
  amount,
  SUM(amount) OVER (ORDER BY order_date) AS running_total
FROM orders;

-- Running total per customer
SELECT
  customer_id, order_date, amount,
  SUM(amount) OVER (PARTITION BY customer_id ORDER BY order_date) AS customer_running_total
FROM orders;

-- Average salary in same department (without GROUP BY collapse)
SELECT
  first_name, department, salary,
  AVG(salary) OVER (PARTITION BY department) AS dept_avg,
  salary - AVG(salary) OVER (PARTITION BY department) AS diff_from_dept_avg
FROM employees;

-- Count of orders per customer alongside each order
SELECT
  order_id, customer_id, amount,
  COUNT(*) OVER (PARTITION BY customer_id) AS customer_total_orders
FROM orders;
```

### LAG and LEAD (Access Adjacent Rows)

```sql
-- LAG: access the previous row's value
SELECT
  order_date, amount,
  LAG(amount) OVER (ORDER BY order_date) AS previous_amount,
  amount - LAG(amount) OVER (ORDER BY order_date) AS change_from_previous
FROM orders;

-- LEAD: access the next row's value
SELECT
  order_date, amount,
  LEAD(amount) OVER (ORDER BY order_date) AS next_amount
FROM orders;

-- With offset and default
LAG(amount, 2, 0) OVER (ORDER BY order_date)
-- 2 = look back 2 rows, 0 = default if no previous row
```

### FIRST_VALUE, LAST_VALUE, NTH_VALUE

```sql
-- First value in the window
SELECT
  first_name, department, salary,
  FIRST_VALUE(salary) OVER (PARTITION BY department ORDER BY salary DESC) AS dept_max_salary
FROM employees;

-- Last value (requires explicit ROWS frame)
SELECT
  first_name, department, salary,
  LAST_VALUE(salary) OVER (
    PARTITION BY department
    ORDER BY salary DESC
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) AS dept_min_salary
FROM employees;
```

### Frame Specification

```sql
-- ROWS BETWEEN: based on physical row count
SUM(amount) OVER (ORDER BY date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)
-- Sum of current row + previous 2 rows (moving 3-row window)

-- RANGE BETWEEN: based on value range
SUM(amount) OVER (ORDER BY date RANGE BETWEEN INTERVAL '7 days' PRECEDING AND CURRENT ROW)
-- Sum of all rows within last 7 days

-- Common frames:
ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW  -- running total
ROWS BETWEEN 2 PRECEDING AND 2 FOLLOWING          -- 5-row rolling average
ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING  -- entire partition
```

---

## 14. Indexes

An index is a data structure that allows PostgreSQL to find rows quickly without scanning the entire table.

### How Indexes Work

Without index: PostgreSQL reads every row (sequential scan) → O(n).
With index: PostgreSQL navigates a tree structure to find matching rows → O(log n).

**Trade-offs:**
- Indexes speed up reads (SELECT, WHERE, ORDER BY, JOIN)
- Indexes slow down writes (INSERT, UPDATE, DELETE must maintain the index)
- Indexes use disk space

**Rule of thumb:** Index columns used in WHERE, JOIN ON, and ORDER BY.

### B-tree Index (Default)

Supports: `=`, `<`, `>`, `<=`, `>=`, `BETWEEN`, `IN`, `ORDER BY`, `LIKE 'prefix%'`

```sql
-- Single column index
CREATE INDEX idx_employees_email ON employees(email);

-- Unique index (enforces uniqueness + speeds up lookups)
CREATE UNIQUE INDEX idx_employees_email ON employees(email);

-- Descending index
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Composite index (multi-column)
CREATE INDEX idx_orders_customer_date ON orders(customer_id, created_at DESC);
-- Useful for: WHERE customer_id = X ORDER BY created_at DESC
-- Also useful for: WHERE customer_id = X (prefix match)
-- NOT useful for: WHERE created_at = X (must start from leftmost column)

-- Drop index
DROP INDEX idx_employees_email;

-- Create index without blocking writes (production-safe)
CREATE INDEX CONCURRENTLY idx_orders_status ON orders(status);
-- Takes longer but doesn't lock the table
```

### Partial Index

Indexes only a subset of rows. Smaller and faster.

```sql
-- Index only active users
CREATE INDEX idx_users_active_email ON users(email) WHERE is_active = TRUE;

-- Index only unprocessed orders
CREATE INDEX idx_orders_pending ON orders(created_at) WHERE status = 'PENDING';
-- Much smaller than indexing all orders
-- Very fast for: WHERE status = 'PENDING' ORDER BY created_at

-- Index soft-delete pattern
CREATE INDEX idx_orders_not_deleted ON orders(customer_id, created_at)
  WHERE deleted_at IS NULL;
```

### Expression Index

Index the result of an expression.

```sql
-- Case-insensitive search
CREATE INDEX idx_users_lower_email ON users(LOWER(email));
-- Supports: WHERE LOWER(email) = 'john@example.com'

-- Date part index
CREATE INDEX idx_orders_year ON orders(DATE_PART('year', created_at));
-- Supports: WHERE DATE_PART('year', created_at) = 2024

-- JSON field index
CREATE INDEX idx_products_category ON products((metadata->>'category'));
-- Supports: WHERE metadata->>'category' = 'electronics'
```

### GIN Index (Generalized Inverted Index)

For: arrays, JSONB, full-text search, pg_trgm

```sql
-- Array contains search
CREATE INDEX idx_products_tags ON products USING gin(tags);
-- Supports: WHERE tags @> ARRAY['sale']::text[]

-- JSONB search
CREATE INDEX idx_orders_meta ON orders USING gin(meta);
-- Supports: WHERE meta @> '{"is_gift": true}'::jsonb
-- Supports: WHERE meta ? 'coupon_code'

-- Full-text search
CREATE INDEX idx_articles_fts ON articles USING gin(search_vector);

-- pg_trgm (trigram) for LIKE/ILIKE
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
-- Supports: WHERE name ILIKE '%laptop%'
```

### GiST Index

For: geometric types, full-text search, range types

```sql
-- Range type index
CREATE INDEX idx_events_during ON events USING gist(during);
-- Supports: WHERE during && '[2024-01-01, 2024-12-31]'::daterange

-- Geometric index
CREATE INDEX idx_locations ON locations USING gist(position);
-- Supports: WHERE position <-> POINT(51.5, -0.1) < 10
```

### Index on Expressions vs Columns

```sql
-- This query CANNOT use a regular index on email:
WHERE LOWER(email) = 'john@example.com'

-- Create an expression index:
CREATE INDEX ON users(LOWER(email));
-- Now the query can use the index

-- This query also cannot use a B-tree index on name for LIKE '%search%':
WHERE name LIKE '%search%'

-- Use pg_trgm:
CREATE INDEX ON products USING gin(name gin_trgm_ops);
-- Now LIKE '%search%' and ILIKE '%search%' can use this index
```

### Checking Index Usage

```sql
-- See all indexes on a table
\d employees
-- or
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'employees';

-- Check if indexes are being used
SELECT
  indexrelname,
  idx_scan AS times_used,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE relname = 'employees'
ORDER BY idx_scan DESC;

-- Find unused indexes (candidates for removal)
SELECT indexrelname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND indexrelname NOT LIKE 'pg_%';
```

---

## 15. Transactions

A transaction is a group of SQL statements that execute as a single unit.

### Basic Transaction

```sql
BEGIN;                  -- start transaction

UPDATE accounts SET balance = balance - 500 WHERE account_id = 1;
UPDATE accounts SET balance = balance + 500 WHERE account_id = 2;

COMMIT;                 -- save changes permanently

-- If something goes wrong:
ROLLBACK;               -- undo all changes since BEGIN
```

### SAVEPOINT (Partial Rollback)

```sql
BEGIN;

INSERT INTO orders (customer_id, amount) VALUES (1, 100);

SAVEPOINT after_order;   -- set checkpoint

INSERT INTO order_items (order_id, product_id) VALUES (1, 999);
-- This fails (product 999 doesn't exist)

ROLLBACK TO SAVEPOINT after_order;  -- go back to checkpoint, keep the order insert

INSERT INTO order_items (order_id, product_id) VALUES (1, 42);  -- correct product

COMMIT;
```

### Transaction Isolation Levels

```sql
-- Set isolation level for current transaction
BEGIN ISOLATION LEVEL READ COMMITTED;
BEGIN ISOLATION LEVEL REPEATABLE READ;
BEGIN ISOLATION LEVEL SERIALIZABLE;

-- Or
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
```

| Isolation Level | Dirty Read | Non-repeatable Read | Phantom Read |
|---|---|---|---|
| READ UNCOMMITTED | Prevented in PG | Possible | Possible |
| READ COMMITTED (default) | Prevented | Possible | Possible |
| REPEATABLE READ | Prevented | Prevented | Prevented in PG |
| SERIALIZABLE | Prevented | Prevented | Prevented |

**READ COMMITTED (default):** Each statement sees committed data as of that statement's start. If another transaction commits between your statements, your second statement sees the new data.

**REPEATABLE READ:** All statements in your transaction see the same snapshot — data as of your transaction's start. Other commits during your transaction are invisible to you.

**SERIALIZABLE:** Transactions behave as if they ran one-at-a-time (serially). PostgreSQL uses SSI (Serializable Snapshot Isolation) — detects conflicts and aborts one transaction.

```sql
-- Example: Repeatable Read
-- Transaction A        Transaction B
BEGIN;                  BEGIN;
SELECT salary           -- salary = 50000
FROM emp WHERE id=1;

                        UPDATE emp SET salary = 60000 WHERE id=1;
                        COMMIT;

SELECT salary           -- still sees 50000 (repeatable)
FROM emp WHERE id=1;
COMMIT;
```

### Deadlocks

A deadlock occurs when two transactions each hold a lock the other needs.

```sql
-- Transaction A               Transaction B
BEGIN;                          BEGIN;
UPDATE accounts SET...          UPDATE orders SET...
WHERE account_id = 1;           WHERE order_id = 5;
                                -- waits for account lock
UPDATE orders SET...            UPDATE accounts SET...
WHERE order_id = 5;             WHERE account_id = 1;
-- waits for order lock (DEADLOCK!)
```

PostgreSQL detects deadlocks automatically and aborts one transaction with error code `40P01`.

**Prevention:** Always acquire locks in the same order. If you always lock accounts before orders, deadlocks cannot occur.

```sql
-- Defensive pattern: use SELECT FOR UPDATE with NOWAIT or SKIP LOCKED
SELECT * FROM jobs WHERE status = 'PENDING' LIMIT 1 FOR UPDATE SKIP LOCKED;
-- Skips locked rows instead of waiting — used in job queues
```

---

## 16. Constraints

Constraints enforce data integrity at the database level.

### NOT NULL

```sql
CREATE TABLE employees (
  first_name VARCHAR(100) NOT NULL,  -- cannot be NULL
  middle_name VARCHAR(100)           -- can be NULL
);

-- Add/remove constraint
ALTER TABLE employees ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE employees ALTER COLUMN first_name DROP NOT NULL;
```

### UNIQUE

```sql
-- Single column
email VARCHAR(255) UNIQUE

-- Multi-column unique (combination must be unique)
CONSTRAINT uq_employee_dept UNIQUE (employee_id, department_id)

-- Partial unique (PostgreSQL)
CREATE UNIQUE INDEX ON employees(email) WHERE is_active = TRUE;
-- Only one active user per email, but multiple inactive users can share email
```

### PRIMARY KEY

```sql
-- Single column PK
id SERIAL PRIMARY KEY
id UUID DEFAULT gen_random_uuid() PRIMARY KEY

-- Composite PK
CONSTRAINT pk_order_items PRIMARY KEY (order_id, item_id)
```

### FOREIGN KEY

```sql
-- Basic FK
department_id INTEGER REFERENCES departments(department_id)

-- With explicit name and actions
CONSTRAINT fk_emp_dept
  FOREIGN KEY (department_id)
  REFERENCES departments(department_id)
  ON DELETE SET NULL    -- when dept is deleted, set department_id = NULL
  ON UPDATE CASCADE     -- when dept's id changes, update here too

-- ON DELETE options:
-- RESTRICT / NO ACTION  (default) — error if referenced row deleted
-- CASCADE               — delete this row too
-- SET NULL              — set FK column to NULL
-- SET DEFAULT           — set FK column to its default value

-- Deferrable FK (check constraint at commit, not statement time)
CONSTRAINT fk_emp_dept
  FOREIGN KEY (department_id)
  REFERENCES departments(department_id)
  DEFERRABLE INITIALLY DEFERRED
```

### CHECK

```sql
-- Column check
salary NUMERIC CHECK (salary >= 0)

-- Named check constraint
CONSTRAINT chk_positive_salary CHECK (salary >= 0)

-- Multi-column check
CONSTRAINT chk_date_range CHECK (end_date > start_date)

-- Complex check
CONSTRAINT chk_order_status CHECK (
  status IN ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')
)
```

### EXCLUSION Constraint

Ensures no two rows satisfy a given condition simultaneously.

```sql
-- Prevent overlapping reservations for the same room
CREATE TABLE reservations (
  room_id INTEGER,
  during TSTZRANGE,
  EXCLUDE USING gist(room_id WITH =, during WITH &&)
  -- No two rows can have same room_id AND overlapping time ranges
);
```

---

## 17. Views and Materialized Views

### Views

A view is a saved SELECT query. It runs the query every time you access the view.

```sql
-- Create view
CREATE VIEW active_employees AS
SELECT employee_id, first_name, last_name, email, department, salary
FROM employees
WHERE is_active = TRUE;

-- Query a view like a table
SELECT * FROM active_employees WHERE department = 'Engineering';

-- Update view
CREATE OR REPLACE VIEW active_employees AS
SELECT employee_id, first_name, last_name, email, department, salary, hire_date
FROM employees
WHERE is_active = TRUE;

-- Drop view
DROP VIEW active_employees;

-- View with security (row-level security alternative)
CREATE VIEW my_orders AS
SELECT * FROM orders WHERE user_id = current_setting('app.user_id')::uuid;
```

**Updatable views:** Simple views (no joins, aggregations, DISTINCT) are automatically updatable — you can INSERT/UPDATE/DELETE through them.

### Materialized Views

A materialized view stores the query RESULT on disk. It does not update automatically — you refresh it manually.

```sql
-- Create
CREATE MATERIALIZED VIEW daily_sales_summary AS
SELECT
  DATE(created_at) AS sale_date,
  COUNT(*) AS order_count,
  SUM(total_amount) AS total_revenue,
  AVG(total_amount) AS avg_order_value
FROM orders
WHERE status = 'DELIVERED'
GROUP BY DATE(created_at);

-- Index the materialized view
CREATE INDEX ON daily_sales_summary(sale_date DESC);

-- Refresh (must be done manually or via scheduler)
REFRESH MATERIALIZED VIEW daily_sales_summary;
-- Blocks reads while refreshing

-- Refresh without blocking reads (requires unique index)
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_summary;

-- Drop
DROP MATERIALIZED VIEW daily_sales_summary;
```

**When to use:**
- Expensive aggregation queries that don't need real-time data
- Dashboard summaries updated every hour or day
- Reporting queries taking seconds

**When NOT to use:**
- Data that must be real-time
- Tables that change very frequently (refreshing too often defeats the purpose)

---

## 18. Stored Procedures and Functions

### Functions

```sql
-- Basic function (returns scalar value)
CREATE OR REPLACE FUNCTION get_employee_count(dept TEXT)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM employees
  WHERE department = dept AND is_active = TRUE;
$$ LANGUAGE sql;

-- Usage
SELECT get_employee_count('Engineering');

-- PL/pgSQL function (procedural)
CREATE OR REPLACE FUNCTION calculate_bonus(emp_id INTEGER)
RETURNS NUMERIC AS $$
DECLARE
  v_salary NUMERIC;
  v_years  INTEGER;
  v_bonus  NUMERIC;
BEGIN
  SELECT salary, EXTRACT(YEAR FROM NOW() - hire_date)
  INTO v_salary, v_years
  FROM employees
  WHERE employee_id = emp_id;

  IF v_years >= 10 THEN
    v_bonus := v_salary * 0.20;
  ELSIF v_years >= 5 THEN
    v_bonus := v_salary * 0.10;
  ELSE
    v_bonus := v_salary * 0.05;
  END IF;

  RETURN v_bonus;
END;
$$ LANGUAGE plpgsql;

-- Function that returns a table
CREATE OR REPLACE FUNCTION get_top_earners(dept TEXT, n INTEGER)
RETURNS TABLE(
  employee_id INTEGER,
  first_name TEXT,
  salary NUMERIC
) AS $$
  SELECT employee_id, first_name, salary
  FROM employees
  WHERE department = dept
  ORDER BY salary DESC
  LIMIT n;
$$ LANGUAGE sql;

-- Usage
SELECT * FROM get_top_earners('Engineering', 5);
```

### Stored Procedures (PostgreSQL 11+)

```sql
-- Procedures can run transactions (functions cannot)
CREATE OR REPLACE PROCEDURE transfer_funds(
  from_account INTEGER,
  to_account INTEGER,
  amount NUMERIC
)
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE accounts SET balance = balance - amount WHERE account_id = from_account;
  UPDATE accounts SET balance = balance + amount WHERE account_id = to_account;

  IF (SELECT balance FROM accounts WHERE account_id = from_account) < 0 THEN
    ROLLBACK;
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  COMMIT;
END;
$$;

-- Call procedure
CALL transfer_funds(1, 2, 500.00);
```

### Useful Built-in Functions

```sql
-- String functions
UPPER(str), LOWER(str)
LENGTH(str)
TRIM(str), LTRIM(str), RTRIM(str)
REPLACE(str, from, to)
SUBSTRING(str FROM 1 FOR 5)
SPLIT_PART(str, delimiter, field)
CONCAT(str1, str2) or str1 || str2
REGEXP_REPLACE(str, pattern, replacement, flags)
REGEXP_MATCH(str, pattern)
TO_CHAR(value, format)

-- Number functions
ROUND(n, decimals)
CEIL(n), FLOOR(n)
ABS(n)
MOD(n, divisor)
RANDOM()  -- 0 to 1

-- Date functions
NOW(), CURRENT_DATE, CURRENT_TIME
DATE_PART('year', timestamp)
DATE_TRUNC('month', timestamp)  -- truncate to month start
AGE(timestamp)  -- interval from then to now
timestamp + INTERVAL '7 days'
EXTRACT(EPOCH FROM timestamp)  -- Unix timestamp

-- Type casting
'42'::INTEGER
'2024-01-15'::DATE
value::TEXT
CAST(value AS INTEGER)
```

---

## 19. Triggers

A trigger automatically executes a function when a specified event occurs on a table.

```sql
-- Step 1: Create the trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;  -- return the modified row
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create the trigger
CREATE TRIGGER trg_employees_updated_at
BEFORE UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Now every UPDATE on employees auto-sets updated_at = NOW()
```

### Trigger Types

| Type | When |
|---|---|
| BEFORE INSERT | Before row is inserted |
| AFTER INSERT | After row is inserted |
| BEFORE UPDATE | Before row is updated |
| AFTER UPDATE | After row is updated |
| BEFORE DELETE | Before row is deleted |
| AFTER DELETE | After row is deleted |
| INSTEAD OF | For views — replace the default action |

```sql
-- Audit log trigger
CREATE OR REPLACE FUNCTION log_salary_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.salary != NEW.salary THEN
    INSERT INTO salary_audit_log(
      employee_id, old_salary, new_salary, changed_at, changed_by
    ) VALUES (
      NEW.employee_id, OLD.salary, NEW.salary, NOW(), current_user
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_salary_audit
AFTER UPDATE ON employees
FOR EACH ROW
WHEN (OLD.salary IS DISTINCT FROM NEW.salary)  -- only fire when salary changes
EXECUTE FUNCTION log_salary_changes();

-- Statement-level trigger (fires once per statement, not per row)
CREATE TRIGGER trg_bulk_update_notify
AFTER UPDATE ON employees
FOR EACH STATEMENT
EXECUTE FUNCTION notify_hr_system();
```

**NEW and OLD:**
- `NEW` — the new row values (available in INSERT and UPDATE triggers)
- `OLD` — the old row values (available in UPDATE and DELETE triggers)

**Drop trigger:**
```sql
DROP TRIGGER trg_employees_updated_at ON employees;
```

---

## 20. JSONB and Arrays

### JSONB Operators

```sql
-- Access object field
metadata -> 'key'        -- returns JSONB
metadata ->> 'key'       -- returns TEXT

-- Access nested
metadata -> 'address' -> 'city'     -- returns JSONB
metadata -> 'address' ->> 'city'    -- returns TEXT

-- Access array element
data -> 0                -- first element

-- Contains (left contains right)
metadata @> '{"status": "active"}'::jsonb

-- Contained by (left contained by right)
'{"a":1}'::jsonb <@ '{"a":1, "b":2}'::jsonb

-- Key exists
metadata ? 'email'                  -- key exists
metadata ?| array['email', 'phone'] -- any key exists
metadata ?& array['email', 'phone'] -- all keys exist

-- Path access
metadata #> '{address, city}'       -- returns JSONB
metadata #>> '{address, city}'      -- returns TEXT

-- Delete key
metadata - 'key'                    -- remove key
metadata - ARRAY['key1', 'key2']   -- remove multiple keys
metadata #- '{address, city}'       -- remove nested key
```

### Querying JSONB

```sql
-- Filter by JSONB field
SELECT * FROM orders WHERE metadata->>'payment_method' = 'CARD';

-- JSONB contains
SELECT * FROM products WHERE tags @> '["electronics"]'::jsonb;

-- JSONB in WHERE with index
CREATE INDEX ON products USING gin(metadata);
SELECT * FROM products WHERE metadata @> '{"category": "laptops"}'::jsonb;

-- Extract and aggregate JSONB
SELECT
  metadata->>'category' AS category,
  COUNT(*) AS count,
  AVG((metadata->>'price')::NUMERIC) AS avg_price
FROM products
GROUP BY metadata->>'category';
```

### Modifying JSONB

```sql
-- Set a key (jsonb_set)
UPDATE products
SET metadata = jsonb_set(metadata, '{stock}', '50'::jsonb)
WHERE product_id = 1;

-- Set nested key
UPDATE orders
SET metadata = jsonb_set(metadata, '{shipping, tracking_number}', '"TRK12345"'::jsonb)
WHERE order_id = 1;

-- Merge JSONB (PostgreSQL 9.5+)
UPDATE products
SET metadata = metadata || '{"sale": true, "discount": 20}'::jsonb
WHERE category = 'clearance';

-- Remove key
UPDATE products
SET metadata = metadata - 'old_key'
WHERE product_id = 1;
```

### Arrays

```sql
-- Array operations
ARRAY[1, 2, 3]                          -- create array literal
ARRAY['a', 'b', 'c']::text[]           -- typed array

-- Access element (1-indexed)
tags[1]                                 -- first element

-- Array length
array_length(tags, 1)                   -- 1 = first dimension
cardinality(tags)                       -- same thing

-- Append element
array_append(tags, 'new_tag')

-- Contains
'electronics' = ANY(tags)              -- check if value in array
tags @> ARRAY['electronics']::text[]   -- array contains array
tags && ARRAY['a', 'b']::text[]        -- arrays overlap (any common element)

-- Expand array into rows
SELECT unnest(ARRAY['a', 'b', 'c']);
-- Returns 3 rows: a, b, c

-- Aggregate into array
SELECT customer_id, ARRAY_AGG(order_id ORDER BY created_at) AS order_ids
FROM orders GROUP BY customer_id;
```

---

## 21. Full-Text Search

### Basic Concepts

- `tsvector` — a sorted list of distinct lexemes (normalized words), stored efficiently
- `tsquery` — a search query expression
- `to_tsvector(text)` — convert text to tsvector
- `to_tsquery(text)` — convert search term to tsquery
- `plainto_tsquery(text)` — converts plain text (no special chars needed)
- `websearch_to_tsquery(text)` — Google-like query syntax

```sql
-- Convert text to tsvector
SELECT to_tsvector('english', 'The quick brown fox jumps over the lazy dog');
-- Returns: 'brown':3 'dog':9 'fox':4 'jump':5 'lazi':8 'quick':2
-- Stop words (the, over) removed, words stemmed (jumps→jump, lazy→lazi)

-- Create tsquery
SELECT to_tsquery('english', 'quick & fox');    -- AND
SELECT to_tsquery('english', 'quick | dog');    -- OR
SELECT to_tsquery('english', 'quick & !dog');   -- AND NOT
SELECT websearch_to_tsquery('quick brown fox'); -- plain text

-- Match operator @@
SELECT to_tsvector('english', 'The quick brown fox') @@ to_tsquery('quick & fox');
-- Returns: true
```

### Full-Text Search in Practice

```sql
-- Method 1: Compute on the fly (slow for large tables)
SELECT title, content
FROM articles
WHERE to_tsvector('english', title || ' ' || content) @@ to_tsquery('postgresql & index');

-- Method 2: Store tsvector column (fast with GIN index)
-- Add column
ALTER TABLE articles ADD COLUMN search_vector tsvector;

-- Populate it
UPDATE articles
SET search_vector = to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''));

-- Keep it up to date with trigger
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = to_tsvector('english',
    coalesce(NEW.title, '') || ' ' || coalesce(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_articles_search
BEFORE INSERT OR UPDATE ON articles
FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- Index it
CREATE INDEX idx_articles_fts ON articles USING gin(search_vector);

-- Query with ranking
SELECT
  title,
  ts_rank(search_vector, query) AS rank
FROM articles,
  to_tsquery('english', 'postgresql & performance') query
WHERE search_vector @@ query
ORDER BY rank DESC
LIMIT 10;

-- Method 3: Generated column (PostgreSQL 12+, always up to date)
ALTER TABLE articles ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
) STORED;
```

### Highlighting Results

```sql
SELECT
  ts_headline('english', content,
    to_tsquery('postgresql & index'),
    'StartSel=<b>, StopSel=</b>, MaxWords=30'
  ) AS highlighted
FROM articles
WHERE search_vector @@ to_tsquery('postgresql & index');
-- Returns excerpt with matching terms wrapped in <b>...</b>
```

---

## 22. Query Planning and EXPLAIN ANALYZE

### EXPLAIN

Shows PostgreSQL's execution plan without actually running the query.

```sql
EXPLAIN SELECT * FROM employees WHERE department = 'Engineering';

-- Output:
-- Seq Scan on employees  (cost=0.00..25.00 rows=10 width=200)
--   Filter: (department = 'Engineering')
```

**Reading cost:** `(startup_cost..total_cost)`
- Startup cost: cost before returning first row
- Total cost: total cost to return all rows
- Rows: estimated number of rows returned
- Width: estimated average row width in bytes

### EXPLAIN ANALYZE

Actually runs the query and shows real timing.

```sql
EXPLAIN ANALYZE SELECT * FROM employees WHERE department = 'Engineering';

-- Output:
-- Seq Scan on employees  (cost=0.00..25.00 rows=10 width=200)
--                        (actual time=0.015..0.892 rows=8 loops=1)
--   Filter: (department = 'Engineering')
--   Rows Removed by Filter: 992
-- Planning Time: 0.123 ms
-- Execution Time: 0.934 ms
```

**Key additions:**
- `actual time=startup..total` — real time in milliseconds
- `rows=N` — actual rows returned
- `loops=N` — how many times this node ran (>1 in nested loops)
- `Rows Removed by Filter` — rows scanned but discarded

### Scan Types

| Scan Type | When Used | Performance |
|---|---|---|
| `Seq Scan` | No usable index, small table | O(n) — reads all rows |
| `Index Scan` | Index exists, selective filter | O(log n + k) — fast |
| `Index Only Scan` | All needed columns in index | O(log n) — fastest |
| `Bitmap Index Scan` | Multiple indexes combined, less selective | O(log n + k) |
| `Bitmap Heap Scan` | Used with Bitmap Index Scan | Reads pages in order |

### Join Types in Plans

| Join Type | When Used |
|---|---|
| `Nested Loop` | Small inner table, index on join key |
| `Hash Join` | Large tables, no index on join key |
| `Merge Join` | Both inputs sorted on join key |

### EXPLAIN Options

```sql
EXPLAIN (ANALYZE, BUFFERS) SELECT ...;  -- show buffer cache hits/misses
EXPLAIN (ANALYZE, FORMAT JSON) SELECT ...;  -- JSON output
EXPLAIN (ANALYZE, VERBOSE) SELECT ...;  -- more detail

-- Buffers output:
-- Buffers: shared hit=50 read=10
-- hit = pages served from cache (fast)
-- read = pages read from disk (slow)
```

### Interpreting Slow Queries

```sql
-- Bad: Seq Scan on large table
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 123;
-- Seq Scan on orders (actual time=0.010..850.234 rows=50 loops=1)
-- Rows Removed by Filter: 999950
-- Fix: CREATE INDEX ON orders(customer_id)

-- After adding index:
-- Index Scan using idx_orders_customer on orders (actual time=0.050..0.150 rows=50 loops=1)
-- Index Cond: (customer_id = 123)
-- 850ms → 0.15ms improvement
```

---

## 23. Performance Optimization

### Query Optimization Checklist

1. **EXPLAIN ANALYZE** every slow query
2. **Add indexes** on columns in WHERE, JOIN, ORDER BY
3. **Use covering indexes** (include all needed columns in index)
4. **Avoid SELECT *** — select only needed columns
5. **Avoid functions on indexed columns** in WHERE
6. **Replace correlated subqueries** with JOINs
7. **Use LIMIT** to avoid fetching unnecessary rows
8. **Avoid implicit type casting** in WHERE clauses

### Bad Query Patterns and Fixes

```sql
-- BAD: Function on indexed column defeats index
WHERE LOWER(email) = 'john@example.com'
-- FIX: Expression index
CREATE INDEX ON users(LOWER(email));

-- BAD: Wildcard at start of LIKE
WHERE name LIKE '%smith%'
-- FIX: pg_trgm + GIN index
CREATE INDEX ON users USING gin(name gin_trgm_ops);

-- BAD: Implicit type cast
WHERE user_id = '123'  -- user_id is INTEGER, '123' is TEXT
-- PostgreSQL may cast every value in the table
-- FIX: Use correct type: WHERE user_id = 123

-- BAD: OR on different columns (cannot use single index)
WHERE first_name = 'John' OR last_name = 'John'
-- FIX: Use two indexes with UNION or bitmap scans
-- Or: CREATE INDEX ON users(first_name); CREATE INDEX ON users(last_name);

-- BAD: NOT IN with subquery (NULL problem + full scan)
WHERE id NOT IN (SELECT id FROM excluded)
-- FIX: NOT EXISTS
WHERE NOT EXISTS (SELECT 1 FROM excluded WHERE excluded.id = employees.id)

-- BAD: COUNT(*) with DISTINCT on large table
SELECT COUNT(DISTINCT customer_id) FROM orders;
-- Can be slow for large tables
-- FIX: Use HyperLogLog approximation for analytics: pg_hll extension
```

### Connection and Configuration Optimization

```sql
-- Check current config
SHOW shared_buffers;
SHOW work_mem;
SHOW max_connections;

-- Check cache hit ratio (should be > 95%)
SELECT
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) AS cache_hit_ratio
FROM pg_statio_user_tables;

-- Increase work_mem for complex queries (session-level)
SET work_mem = '128MB';
-- Use carefully — each sort/hash operation per query can use this much memory
-- 100 connections × 10 sorts × 128MB = 128GB potential usage
```

### VACUUM and ANALYZE

```sql
-- VACUUM: reclaims space from dead rows
VACUUM employees;

-- ANALYZE: updates statistics used by query planner
ANALYZE employees;

-- Both together
VACUUM ANALYZE employees;

-- Full vacuum: rewrites entire table (locks table, use rarely)
VACUUM FULL employees;

-- Autovacuum: runs automatically — check its status
SELECT schemaname, tablename, last_autovacuum, last_autoanalyze, n_dead_tup
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;

-- pg_stat_statements: find slow queries
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT
  round(total_exec_time::numeric / calls, 2) AS avg_ms,
  calls,
  left(query, 80) AS query
FROM pg_stat_statements
ORDER BY avg_ms DESC
LIMIT 20;
```

---

## 24. Concurrency and Locking

### Lock Types

| Lock Mode | Who sets it | Blocks what |
|---|---|---|
| `ACCESS SHARE` | SELECT | ACCESS EXCLUSIVE only |
| `ROW SHARE` | SELECT FOR UPDATE | EXCLUSIVE, ACCESS EXCLUSIVE |
| `ROW EXCLUSIVE` | INSERT, UPDATE, DELETE | SHARE, SHARE ROW EXCLUSIVE, EXCLUSIVE, ACCESS EXCLUSIVE |
| `SHARE UPDATE EXCLUSIVE` | VACUUM, ANALYZE, CREATE INDEX CONCURRENTLY | self, SHARE, EXCLUSIVE |
| `SHARE` | CREATE INDEX | ROW EXCLUSIVE and above |
| `EXCLUSIVE` | Rare | ROW SHARE and above |
| `ACCESS EXCLUSIVE` | ALTER TABLE, DROP TABLE, TRUNCATE | everything |

**In practice:**
- SELECT never blocks other SELECTs
- INSERT/UPDATE/DELETE block other INSERT/UPDATE/DELETE on the same rows
- ALTER TABLE blocks everything (very dangerous in production)

### Row-Level Locking

```sql
-- FOR UPDATE: exclusive lock on selected rows
-- Prevents other transactions from locking, updating, or deleting these rows
SELECT * FROM orders WHERE order_id = 1 FOR UPDATE;

-- FOR SHARE: shared lock — multiple transactions can hold it
-- Prevents UPDATE/DELETE but allows other FOR SHARE
SELECT * FROM orders WHERE order_id = 1 FOR SHARE;

-- FOR NO KEY UPDATE: like FOR UPDATE but less strict
-- Allows foreign key checks to proceed

-- FOR KEY SHARE: allows foreign key checks

-- NOWAIT: fail immediately if cannot acquire lock
SELECT * FROM orders WHERE order_id = 1 FOR UPDATE NOWAIT;

-- SKIP LOCKED: skip rows that are already locked (queue processing)
SELECT * FROM jobs WHERE status = 'PENDING' LIMIT 1 FOR UPDATE SKIP LOCKED;
-- Multiple workers can each grab different jobs concurrently
```

### Advisory Locks

Application-level locks not tied to table rows.

```sql
-- Session-level advisory lock (held until released or session ends)
SELECT pg_advisory_lock(12345);       -- acquire (blocks if locked)
SELECT pg_try_advisory_lock(12345);   -- try (returns false if locked)
SELECT pg_advisory_unlock(12345);     -- release

-- Transaction-level advisory lock (auto-released at transaction end)
SELECT pg_advisory_xact_lock(12345);

-- Use case: prevent concurrent cron jobs
-- Each worker tries to acquire advisory lock with a fixed ID
-- Only one succeeds — others skip
DO $$
BEGIN
  IF pg_try_advisory_lock(1) THEN
    -- Run the job
    PERFORM run_nightly_cleanup();
    PERFORM pg_advisory_unlock(1);
  ELSE
    RAISE NOTICE 'Another instance is running, skipping';
  END IF;
END;
$$;
```

### Monitoring Locks

```sql
-- See current locks
SELECT
  pg_stat_activity.pid,
  pg_stat_activity.query,
  pg_stat_activity.state,
  pg_locks.locktype,
  pg_locks.mode,
  pg_locks.granted
FROM pg_locks
JOIN pg_stat_activity ON pg_locks.pid = pg_stat_activity.pid
WHERE NOT granted;  -- show waiting locks

-- Kill a blocking query
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE pid = 12345;

-- Find blocking chains
SELECT
  blocked.pid AS blocked_pid,
  blocked.query AS blocked_query,
  blocker.pid AS blocker_pid,
  blocker.query AS blocker_query
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocker ON blocker.pid = ANY(
  SELECT unnest(pg_blocking_pids(blocked.pid))
);
```

---

## 25. Partitioning

Partitioning splits one large table into smaller physical pieces while keeping one logical table.

### Range Partitioning

Partition by a value range (dates, IDs).

```sql
-- Create partitioned table
CREATE TABLE orders (
  order_id   UUID DEFAULT gen_random_uuid(),
  order_date DATE NOT NULL,
  amount     NUMERIC,
  status     TEXT
) PARTITION BY RANGE (order_date);

-- Create partitions
CREATE TABLE orders_2023 PARTITION OF orders
  FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');

CREATE TABLE orders_2024 PARTITION OF orders
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE orders_2025 PARTITION OF orders
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Default partition (catches rows that don't fit any partition)
CREATE TABLE orders_default PARTITION OF orders DEFAULT;

-- Indexes on partitioned table apply to all partitions
CREATE INDEX ON orders(order_date);
CREATE INDEX ON orders(status);

-- Query transparently (PostgreSQL routes to correct partition)
SELECT * FROM orders WHERE order_date BETWEEN '2024-01-01' AND '2024-12-31';
-- Only scans orders_2024 partition

-- Add new partition
CREATE TABLE orders_2026 PARTITION OF orders
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- Detach old partition (can archive or drop)
ALTER TABLE orders DETACH PARTITION orders_2023;
DROP TABLE orders_2023; -- or move to cold storage
```

### List Partitioning

Partition by specific values.

```sql
CREATE TABLE customers (
  customer_id UUID,
  name TEXT,
  region TEXT
) PARTITION BY LIST (region);

CREATE TABLE customers_us PARTITION OF customers FOR VALUES IN ('US', 'CA');
CREATE TABLE customers_eu PARTITION OF customers FOR VALUES IN ('UK', 'DE', 'FR');
CREATE TABLE customers_apac PARTITION OF customers FOR VALUES IN ('IN', 'SG', 'AU');
```

### Hash Partitioning

Distribute rows evenly based on a hash of a column.

```sql
CREATE TABLE events (
  event_id UUID,
  user_id UUID,
  event_type TEXT,
  created_at TIMESTAMPTZ
) PARTITION BY HASH (user_id);

CREATE TABLE events_0 PARTITION OF events FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE events_1 PARTITION OF events FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE events_2 PARTITION OF events FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE events_3 PARTITION OF events FOR VALUES WITH (MODULUS 4, REMAINDER 3);
-- Distributes rows across 4 equal partitions based on user_id hash
```

### Partition Pruning

```sql
-- PostgreSQL automatically prunes irrelevant partitions
EXPLAIN SELECT * FROM orders WHERE order_date = '2024-06-15';
-- Plan shows: Append → Seq Scan on orders_2024
-- (orders_2023, orders_2025 are pruned — not scanned)

-- Verify partition pruning is enabled
SHOW enable_partition_pruning; -- should be 'on'
```

---

## 26. Replication and High Availability

### Types of Replication

**Streaming Replication (Physical):**
- Primary sends WAL stream to standby in real-time
- Standby is an exact byte-for-byte copy of primary
- Standby can be read-only (read replica)
- Used for: high availability, read scaling

**Logical Replication:**
- Replicate specific tables or databases
- Standby can have different schema or PostgreSQL version
- Subscribers can be different databases entirely
- Used for: partial replication, zero-downtime migrations

### Read Replica Setup Concept

```
Primary DB ──── WAL stream ────► Replica DB (read-only)
     │                                   │
  Write queries                    Read queries (SELECT)
  (INSERT, UPDATE, DELETE)         (reports, analytics)
```

```sql
-- On primary: create replication user
CREATE USER replicator WITH REPLICATION LOGIN PASSWORD 'secret';

-- pg_hba.conf on primary: allow replication
-- host  replication  replicator  replica_ip/32  md5

-- postgresql.conf on primary:
-- wal_level = replica
-- max_wal_senders = 5

-- On replica: pg_basebackup to get initial copy
-- pg_basebackup -h primary_host -U replicator -D /var/lib/postgresql/data -P -R
```

### Connection Routing

```typescript
// Application: route reads to replica
const primaryPool = new Pool({ host: 'primary.db', ... });
const replicaPool = new Pool({ host: 'replica.db', ... });

// Writes → primary
await primaryPool.query('INSERT INTO orders ...');

// Reads → replica (okay to be slightly behind)
const orders = await replicaPool.query('SELECT * FROM orders ...');
```

### Monitoring Replication Lag

```sql
-- On primary: check replication status
SELECT
  client_addr,
  state,
  sent_lsn,
  write_lsn,
  flush_lsn,
  replay_lsn,
  sent_lsn - replay_lsn AS replication_lag_bytes
FROM pg_stat_replication;

-- On replica: check lag
SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) AS lag_seconds;
```

---

## 27. Connection Pooling

### Why Connection Pooling

Each PostgreSQL connection = one OS process = ~5-10MB RAM.

Without pooling:
- 200 app instances × 1 connection = 200 PG processes = ~1-2GB RAM just for connections
- PostgreSQL default max_connections = 100 → overflow rejected

With pooling (PgBouncer):
- 200 app instances → PgBouncer → 20 actual PG connections
- PgBouncer multiplexes many app connections onto few DB connections

### PgBouncer

```ini
# pgbouncer.ini

[databases]
mydb = host=localhost port=5432 dbname=production_db

[pgbouncer]
listen_port = 6432
listen_addr = 0.0.0.0
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt

# Pool mode
pool_mode = transaction  # Best for most apps
                         # connection = hold connection for session lifetime
                         # transaction = release after each transaction
                         # statement = release after each statement

max_client_conn = 1000   # Max connections from apps
default_pool_size = 20   # Max real connections to PostgreSQL per database

server_idle_timeout = 600  # Close idle server connections after 10 minutes
```

### Pool Modes

| Mode | Connection held | Use case |
|---|---|---|
| `session` | Entire session | Long-lived app connections, uses temp tables |
| `transaction` | Per transaction | Most web apps (recommended) |
| `statement` | Per statement | Read-only apps, no multi-statement transactions |

### Connection Pool in Application

```typescript
// Node.js with pg library
import { Pool } from 'pg';

const pool = new Pool({
  host: 'pgbouncer_host',
  port: 6432,
  database: 'mydb',
  user: 'myuser',
  password: 'mypass',
  max: 20,           // max connections in this app's pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Always return connection to pool after use
const result = await pool.query('SELECT ...'); // auto-releases connection

// Explicit client (for transactions)
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('INSERT ...');
  await client.query('COMMIT');
} catch {
  await client.query('ROLLBACK');
} finally {
  client.release(); // return to pool
}
```

---

## 28. Backup and Restore

### pg_dump — Logical Backup

```bash
# Backup single database
pg_dump -U postgres -d mydb -f backup.sql

# Backup in custom format (compressed, faster restore)
pg_dump -U postgres -d mydb -F c -f backup.dump

# Backup specific tables
pg_dump -U postgres -d mydb -t orders -t order_items -f tables.sql

# Backup schema only
pg_dump -U postgres -d mydb --schema-only -f schema.sql

# Backup data only
pg_dump -U postgres -d mydb --data-only -f data.sql
```

### pg_dumpall — Backup All Databases

```bash
pg_dumpall -U postgres -f all_databases.sql
# Includes global objects (roles, tablespaces)
```

### pg_restore — Restore

```bash
# Restore from SQL file
psql -U postgres -d mydb -f backup.sql

# Restore from custom format
pg_restore -U postgres -d mydb -F c backup.dump

# Restore specific table
pg_restore -U postgres -d mydb -t orders backup.dump

# Parallel restore (faster for large databases)
pg_restore -U postgres -d mydb -j 4 backup.dump  # 4 parallel workers
```

### Point-in-Time Recovery (PITR)

```bash
# postgresql.conf
archive_mode = on
archive_command = 'cp %p /backup/wal/%f'

# Take base backup
pg_basebackup -D /backup/base -Ft -z -P

# Restore to specific point in time
# recovery.conf / postgresql.conf
restore_command = 'cp /backup/wal/%f %p'
recovery_target_time = '2024-01-15 14:30:00'
```

### Automated Backup Schedule

```bash
# Daily backup cron
0 2 * * * pg_dump -U postgres -F c mydb > /backups/mydb_$(date +\%Y\%m\%d).dump

# Keep last 7 days
find /backups -name "*.dump" -mtime +7 -delete
```

---

## 29. Security

### Users and Roles

```sql
-- Create user (user = role with LOGIN)
CREATE USER appuser WITH PASSWORD 'secret';
CREATE USER readonly_user WITH PASSWORD 'secret';

-- Create role (role without LOGIN, for grouping permissions)
CREATE ROLE developers;

-- Grant role to user
GRANT developers TO appuser;

-- Alter user
ALTER USER appuser PASSWORD 'newsecret';
ALTER USER appuser VALID UNTIL '2025-12-31';  -- expiry
ALTER USER appuser CONNECTION LIMIT 10;        -- max connections
```

### Privileges

```sql
-- Grant on database
GRANT CONNECT ON DATABASE mydb TO appuser;
GRANT CREATE ON DATABASE mydb TO developer;

-- Grant on schema
GRANT USAGE ON SCHEMA myschema TO appuser;
GRANT CREATE ON SCHEMA myschema TO developer;

-- Grant on tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO appuser;
GRANT ALL ON orders TO appuser;

-- Grant on future tables (default privileges)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO readonly_user;

-- Revoke
REVOKE SELECT ON orders FROM readonly_user;

-- Principle of least privilege: give minimum needed
-- App user: SELECT, INSERT, UPDATE, DELETE on specific tables
-- Never: SUPERUSER, CREATEDB, CREATEROLE for app users
```

### Row-Level Security (RLS)

```sql
-- Enable RLS on table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policy: users can only see their own orders
CREATE POLICY user_orders_policy ON orders
  USING (user_id = current_setting('app.current_user_id')::uuid);

-- Policies for specific operations
CREATE POLICY select_own_orders ON orders
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id')::uuid);

CREATE POLICY insert_own_orders ON orders
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id')::uuid);

-- Set user context from app
SELECT set_config('app.current_user_id', user_id::text, false);
-- Now queries against orders automatically filter by user_id
```

### SSL/TLS

```conf
# postgresql.conf
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'

# pg_hba.conf — require SSL
hostssl  all  all  0.0.0.0/0  md5
# hostnossl rejects non-SSL connections
```

### SQL Injection Prevention

```sql
-- NEVER do this (vulnerable to injection)
query = "SELECT * FROM users WHERE email = '" + userInput + "'"

-- Always use parameterized queries
-- In psql / pg library:
await pool.query('SELECT * FROM users WHERE email = $1', [userInput]);

-- In Sequelize:
sequelize.query('SELECT * FROM users WHERE email = :email',
  { replacements: { email: userInput }, type: QueryTypes.SELECT });
```

---

## 30. Advanced Patterns

### Upsert (INSERT ON CONFLICT)

```sql
-- Insert or update (upsert)
INSERT INTO user_preferences (user_id, key, value)
VALUES (:user_id, :key, :value)
ON CONFLICT (user_id, key)
DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Insert or ignore
INSERT INTO event_log (event_id, event_type)
VALUES (:id, :type)
ON CONFLICT (event_id) DO NOTHING;

-- Conditional upsert
INSERT INTO products (sku, name, price)
VALUES (:sku, :name, :price)
ON CONFLICT (sku) DO UPDATE SET
  price = EXCLUDED.price
  WHERE products.price != EXCLUDED.price;  -- only update if price changed
```

### Bulk Insert with UNNEST

```sql
-- Insert arrays of values instead of N individual INSERTs
INSERT INTO orders (customer_id, amount, status)
SELECT
  unnest(:customer_ids::uuid[]),
  unnest(:amounts::numeric[]),
  unnest(:statuses::text[]);

-- With specific type casting
INSERT INTO events (user_id, event_type, created_at)
SELECT
  unnest(:user_ids::uuid[]),
  unnest(:event_types::text[]),
  unnest(:timestamps::timestamptz[]);
```

### COPY — Fastest Bulk Load

```sql
-- From file
COPY orders(customer_id, amount, status)
FROM '/tmp/orders.csv'
WITH (FORMAT CSV, HEADER true, DELIMITER ',');

-- From stdin
COPY orders(customer_id, amount) FROM STDIN WITH (FORMAT CSV);

-- To file (export)
COPY (SELECT * FROM orders WHERE status = 'DELIVERED')
TO '/tmp/delivered_orders.csv'
WITH (FORMAT CSV, HEADER true);

-- In Node.js with pg-copy-streams
const copyFrom = require('pg-copy-streams').from;
const stream = client.query(copyFrom('COPY orders(id,amount) FROM STDIN'));
fs.createReadStream('orders.csv').pipe(stream);
```

### Temporal Patterns (Soft Deletes, Auditing)

```sql
-- Soft delete pattern
ALTER TABLE orders ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- "Delete" operation
UPDATE orders SET deleted_at = NOW() WHERE order_id = :id;

-- Always filter in queries
WHERE deleted_at IS NULL

-- Partial index for better performance
CREATE INDEX idx_orders_not_deleted ON orders(customer_id, created_at)
WHERE deleted_at IS NULL;

-- Temporal table (full history)
CREATE TABLE orders_history AS SELECT * FROM orders WITH NO DATA;
ALTER TABLE orders_history ADD COLUMN valid_from TIMESTAMPTZ;
ALTER TABLE orders_history ADD COLUMN valid_until TIMESTAMPTZ;
ALTER TABLE orders_history ADD COLUMN operation CHAR(1); -- I=insert, U=update, D=delete

-- History trigger
CREATE OR REPLACE FUNCTION record_order_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO orders_history SELECT OLD.*, OLD.updated_at, NOW(), 'U';
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO orders_history SELECT OLD.*, OLD.updated_at, NOW(), 'D';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Optimistic Locking

```sql
-- Add version column
ALTER TABLE orders ADD COLUMN version INTEGER DEFAULT 1;

-- Read: get version along with data
SELECT order_id, amount, status, version FROM orders WHERE order_id = :id;

-- Update: include version in WHERE, increment version
UPDATE orders
SET amount = :new_amount, version = version + 1
WHERE order_id = :id AND version = :expected_version;

-- If 0 rows updated → conflict (someone else updated in between)
-- Application retries or returns 409 Conflict to client
```

### Job Queue Pattern

```sql
CREATE TABLE job_queue (
  job_id    BIGSERIAL PRIMARY KEY,
  job_type  TEXT NOT NULL,
  payload   JSONB,
  status    TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'DONE', 'FAILED')),
  attempts  INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  run_at    TIMESTAMPTZ DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient polling
CREATE INDEX idx_jobs_pending ON job_queue(run_at)
  WHERE status = 'PENDING';

-- Worker: claim a job atomically
WITH claimed AS (
  SELECT job_id FROM job_queue
  WHERE status = 'PENDING'
    AND run_at <= NOW()
  ORDER BY run_at
  LIMIT 1
  FOR UPDATE SKIP LOCKED  -- skip jobs locked by other workers
)
UPDATE job_queue
SET
  status = 'PROCESSING',
  locked_at = NOW(),
  locked_by = :worker_id,
  attempts = attempts + 1
FROM claimed
WHERE job_queue.job_id = claimed.job_id
RETURNING *;

-- Mark done
UPDATE job_queue SET status = 'DONE' WHERE job_id = :id;

-- Mark failed with retry
UPDATE job_queue
SET
  status = CASE WHEN attempts >= max_attempts THEN 'FAILED' ELSE 'PENDING' END,
  run_at = NOW() + INTERVAL '1 minute' * attempts,  -- exponential backoff
  locked_at = NULL,
  locked_by = NULL
WHERE job_id = :id;
```

### Hierarchical Data Patterns

```sql
-- Adjacency list (simple, your current approach)
CREATE TABLE categories (
  id INTEGER PRIMARY KEY,
  name TEXT,
  parent_id INTEGER REFERENCES categories(id)
);

-- Fetch tree with recursive CTE
WITH RECURSIVE tree AS (
  SELECT id, name, parent_id, 0 AS depth, ARRAY[id] AS path
  FROM categories WHERE parent_id IS NULL
  UNION ALL
  SELECT c.id, c.name, c.parent_id, tree.depth + 1, tree.path || c.id
  FROM categories c JOIN tree ON c.parent_id = tree.id
)
SELECT * FROM tree ORDER BY path;

-- Nested sets (efficient read, expensive write)
-- Closure table (excellent for all operations)
CREATE TABLE category_closure (
  ancestor_id INTEGER,
  descendant_id INTEGER,
  depth INTEGER,
  PRIMARY KEY (ancestor_id, descendant_id)
);

-- Get all descendants of node 5
SELECT * FROM categories
WHERE id IN (
  SELECT descendant_id FROM category_closure
  WHERE ancestor_id = 5 AND depth > 0
);
```

### Time-Series Patterns

```sql
-- Date_trunc for grouping
SELECT
  DATE_TRUNC('hour', created_at) AS hour,
  COUNT(*) AS order_count,
  SUM(amount) AS revenue
FROM orders
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour;

-- Generate series (fill gaps in time series)
SELECT
  gs.hour,
  COALESCE(o.count, 0) AS order_count
FROM generate_series(
  DATE_TRUNC('hour', NOW() - INTERVAL '24 hours'),
  DATE_TRUNC('hour', NOW()),
  INTERVAL '1 hour'
) gs(hour)
LEFT JOIN (
  SELECT DATE_TRUNC('hour', created_at) AS hour, COUNT(*) AS count
  FROM orders
  WHERE created_at >= NOW() - INTERVAL '24 hours'
  GROUP BY DATE_TRUNC('hour', created_at)
) o ON gs.hour = o.hour
ORDER BY gs.hour;

-- Time-bucket style aggregation using window
SELECT
  order_id, created_at, amount,
  SUM(amount) OVER (
    ORDER BY created_at
    RANGE BETWEEN INTERVAL '1 hour' PRECEDING AND CURRENT ROW
  ) AS rolling_1h_revenue
FROM orders;
```

---

## Quick Reference Card

### Most Used Commands

```sql
-- Show all tables
\dt
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Show table structure
\d tablename
SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'orders';

-- Show indexes
\di
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'orders';

-- Show running queries
SELECT pid, now() - query_start AS duration, query, state
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;

-- Kill query
SELECT pg_cancel_backend(pid);    -- graceful cancel
SELECT pg_terminate_backend(pid); -- force kill

-- Check table size
SELECT
  table_name,
  pg_size_pretty(pg_total_relation_size(table_name::regclass)) AS total_size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(table_name::regclass) DESC;

-- Check database size
SELECT pg_size_pretty(pg_database_size('mydb'));
```

### Common Patterns Summary

```sql
-- Upsert
INSERT INTO t (id, val) VALUES (:id, :val) ON CONFLICT (id) DO UPDATE SET val = EXCLUDED.val;

-- Soft delete
UPDATE t SET deleted_at = NOW() WHERE id = :id;
SELECT * FROM t WHERE deleted_at IS NULL;

-- Pagination (offset)
SELECT * FROM t ORDER BY created_at DESC LIMIT :limit OFFSET :offset;

-- Pagination (cursor)
SELECT * FROM t WHERE created_at < :cursor ORDER BY created_at DESC LIMIT :limit;

-- RETURNING after write
INSERT INTO t (col) VALUES (:val) RETURNING id;

-- Lock row for update
SELECT * FROM t WHERE id = :id FOR UPDATE;

-- Skip locked rows (worker queue)
SELECT * FROM jobs WHERE status = 'PENDING' LIMIT 1 FOR UPDATE SKIP LOCKED;

-- Dynamic sort (safe, no injection)
ORDER BY
  CASE WHEN :sort_col = 'name' THEN name END ASC,
  CASE WHEN :sort_col = 'date' THEN created_at END ASC;

-- Bulk insert with UNNEST
INSERT INTO t(a, b) SELECT unnest(:as::text[]), unnest(:bs::int[]);

-- Aggregate into JSON
json_build_object('key1', val1, 'key2', val2)
json_agg(json_build_object('id', id, 'name', name))

-- Running total
SUM(amount) OVER (ORDER BY created_at ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)

-- Top N per group
SELECT * FROM (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC) AS rn
  FROM employees
) sub WHERE rn <= 3;
```

---

*This guide covers PostgreSQL from fundamentals through production-level patterns.*
*Topics: SQL basics, Joins, Aggregations, CTEs, Window Functions, Indexes, Transactions,*
*Concurrency, Partitioning, Replication, Connection Pooling, Security, and Advanced Patterns.*
