# PostgreSQL Security – Production Cheat Sheet

## Why This Exists

Never let your app connect as `postgres`.

Production rule:

> Every connection must have **minimum required power**.

This prevents:
- Accidental `DROP TABLE`
- Data wipes from bugs
- Human mistakes in prod

We use **roles** to control power.

---

## Roles We Use

| Role | Purpose |
|------|--------|
| `postgres` | Superuser (admin only, never in app) |
| `app_user` | Used by backend |
| `readonly_user` | Dashboards / analytics |
| `migration_user` | Schema changes |

Your Node app must use `app_user`.

---

## Create App Role

```sql
CREATE ROLE app_user WITH LOGIN PASSWORD 'strong_password';

Allow DB access:

GRANT CONNECT ON DATABASE mydb TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;

Give Read-Only Access

For existing tables:

GRANT SELECT
ON ALL TABLES IN SCHEMA public
TO app_user;


For future tables:

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT
ON TABLES TO app_user;


Now app_user can only read.

Give Access to Only One Table

Example: allow access only to orders:

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM app_user;

GRANT SELECT ON TABLE public.orders TO app_user;


Writable orders only:

GRANT SELECT, INSERT, UPDATE ON TABLE public.orders TO app_user;

Read-Only User
CREATE ROLE readonly_user WITH LOGIN PASSWORD 'readonlypass';

GRANT CONNECT ON DATABASE mydb TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT
ON TABLES TO readonly_user;

DBeaver Testing

Create a new connection with app_user

Test:

SELECT * FROM orders;     -- should work
INSERT INTO orders (...) VALUES (...);   -- should fail


This confirms production safety.

Common Admin Queries (Keep for Future)
-- List all roles
\du

-- See privileges on a table
\dp public.orders

-- Check current user
SELECT current_user;

-- Revoke everything from a role
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM app_user;

-- Drop a role (admin only)
DROP ROLE app_user;

Senior Rules

App never uses postgres

Always grant:

On existing tables

On future tables

Permissions are per table

WHERE power is limited, mistakes become safe

Security is not optional.
It’s how production survives.


Paste this into VS Code as `pg-security.md`.