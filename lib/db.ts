import { neon, NeonQueryFunction } from '@neondatabase/serverless';

let _sql: NeonQueryFunction<false, false> | null = null;
let _uncachedSql: NeonQueryFunction<false, false> | null = null;

function requireDatabaseUrl(): string {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.local.example to .env.local and fill in your Neon connection string.'
    );
  }
  return process.env.DATABASE_URL;
}

/**
 * Returns the Neon SQL tagged-template query function.
 * Lazily initialised on first call so the production build doesn't crash
 * when DATABASE_URL isn't available at compile time.
 *
 * Usage:
 *   const sql = getSQL();
 *   const rows = await sql`SELECT * FROM products WHERE slug = ${slug}`;
 */
export function getSQL(): NeonQueryFunction<false, false> {
  if (!_sql) {
    _sql = neon(requireDatabaseUrl());
  }
  return _sql;
}

/**
 * Returns a Neon SQL query function with `cache: 'no-store'` on the underlying
 * fetch call so dynamic admin and tracking endpoints never serve cached queries.
 */
export function getUncachedSQL(): NeonQueryFunction<false, false> {
  if (!_uncachedSql) {
    _uncachedSql = neon(requireDatabaseUrl(), {
      fetchOptions: { cache: 'no-store' },
    });
  }
  return _uncachedSql;
}
