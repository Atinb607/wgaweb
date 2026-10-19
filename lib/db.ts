import { neon, NeonQueryFunction } from '@neondatabase/serverless';

let _sql: NeonQueryFunction<false, false> | null = null;

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
    if (!process.env.DATABASE_URL) {
      throw new Error(
        'DATABASE_URL is not set. Copy .env.local.example to .env.local and fill in your Neon connection string.'
      );
    }
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}
