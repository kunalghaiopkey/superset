-- Tenant isolation for BI-Studio's MySQL connections
-- ===================================================
--
-- Superset runs every query on a database connection as the MySQL user saved in
-- that connection, whoever the Superset user is. If that MySQL user can read
-- every tenant's database, so can every SQL Lab user of the connection, and
-- `information_schema` lists every tenant's schemas and tables.
--
-- Superset's table permission check refuses queries on tables outside a user's
-- role. That is a second layer, not a substitute: this script makes MySQL itself
-- refuse them, however the SQL is written.
--
-- Run once per tenant, as a MySQL admin. Placeholders:
--   __TENANT_DB__       the tenant's database, e.g. vulcan
--   __TENANT_USER__     the login Superset will use for it, e.g. bi_vulcan
--   __PASSWORD__        a generated secret, stored only in the Superset connection
--   __SUPERSET_HOST__   the host Superset connects from, e.g. 10.0.1.% ('%' = any)
--
--   sed -e 's/__TENANT_DB__/vulcan/g' -e 's/__TENANT_USER__/bi_vulcan/g' \
--       -e "s/__PASSWORD__/$PASSWORD/g" -e 's/__SUPERSET_HOST__/%/g' \
--       tenant_isolation.sql | mysql -u root -p
--
-- Every statement is idempotent, so the script is safe to re-run for a tenant.


-- 1. A login that can read this tenant's database and nothing else
-- -----------------------------------------------------------------
-- SHOW VIEW lets Superset read view definitions in SQL Lab.
--
-- Never grant this user anything ON *.*, FILE, PROCESS, SHOW DATABASES,
-- EXECUTE, or anything on mysql, performance_schema, sys or Superset's own
-- metadata database.
CREATE USER IF NOT EXISTS '__TENANT_USER__'@'__SUPERSET_HOST__'
    IDENTIFIED BY '__PASSWORD__';

-- If the user already existed, drop whatever it was granted before, so the
-- grant below is all it has.
REVOKE ALL PRIVILEGES, GRANT OPTION FROM '__TENANT_USER__'@'__SUPERSET_HOST__';
GRANT SELECT, SHOW VIEW ON `__TENANT_DB__`.* TO '__TENANT_USER__'@'__SUPERSET_HOST__';


-- 2. Check the tenant's views don't read other databases
-- -------------------------------------------------------
-- A view runs with its creator's privileges (SQL SECURITY DEFINER, the
-- default). A view in this tenant's database that reads another database would
-- hand that data to the tenant despite the grant above. This must return no
-- rows (MySQL 8.0.13+):
SELECT view_name, table_schema, table_name
FROM information_schema.view_table_usage
WHERE view_schema = '__TENANT_DB__'
  AND table_schema NOT IN ('__TENANT_DB__');


-- 3. Point Superset at the new login
-- ----------------------------------
-- In Superset: Settings > Database Connections > the tenant's connection > Edit,
-- and replace the username and password with __TENANT_USER__ and __PASSWORD__.
-- Find connections still on a shared login from Superset's metadata database:
--
--   SELECT id, database_name, sqlalchemy_uri FROM dbs ORDER BY sqlalchemy_uri;
--
-- Once no connection uses the shared login, remove it or change its password.


-- 4. Verify, logged in as __TENANT_USER__
-- ---------------------------------------
--   SHOW GRANTS;
--     -> GRANT USAGE ON *.* ...  and  GRANT SELECT, SHOW VIEW ON `__TENANT_DB__`.*
--   SELECT DISTINCT table_schema FROM information_schema.tables;
--     -> information_schema, performance_schema and __TENANT_DB__ only
--        (MySQL 8 lists performance_schema to everyone; its query history
--        tables still need a grant, which this user doesn't have)
--   SELECT * FROM <another_tenant_db>.<any_table>;
--     -> ERROR 1142 (42000): SELECT command denied
--   USE <another_tenant_db>;
--     -> ERROR 1044 (42000): Access denied
--   SELECT LOAD_FILE('/etc/passwd');
--     -> NULL
