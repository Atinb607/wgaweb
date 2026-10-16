import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

function splitStatements(sqlText) {
  const statements = [];
  let current = '';
  let inString = false;
  let inDollarQuote = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sqlText.length; i++) {
    const char = sqlText[i];
    const nextChar = sqlText[i + 1] || '';

    // Handle line comment
    if (inLineComment) {
      if (char === '\n') {
        inLineComment = false;
      }
      current += char;
      continue;
    }

    // Handle block comment
    if (inBlockComment) {
      if (char === '*' && nextChar === '/') {
        inBlockComment = false;
        current += '*/';
        i++;
        continue;
      }
      current += char;
      continue;
    }

    // Handle dollar quote
    if (inDollarQuote) {
      if (char === '$' && nextChar === '$') {
        inDollarQuote = false;
        current += '$$';
        i++;
        continue;
      }
      current += char;
      continue;
    }

    // Handle single-quoted string
    if (inString) {
      if (char === "'") {
        if (nextChar === "'") {
          // escaped quote ''
          current += "''";
          i++;
          continue;
        }
        inString = false;
      }
      current += char;
      continue;
    }

    // Check for comment starts
    if (char === '-' && nextChar === '-') {
      inLineComment = true;
      current += '--';
      i++;
      continue;
    }
    if (char === '/' && nextChar === '*') {
      inBlockComment = true;
      current += '/*';
      i++;
      continue;
    }

    // Check for string / dollar quote starts
    if (char === "'") {
      inString = true;
      current += char;
      continue;
    }
    if (char === '$' && nextChar === '$') {
      inDollarQuote = true;
      current += '$$';
      i++;
      continue;
    }

    // Statement separator
    if (char === ';') {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      current = '';
      continue;
    }

    current += char;
  }

  const trimmed = current.trim();
  if (trimmed.length > 0) {
    statements.push(trimmed);
  }

  return statements;
}

async function main() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error('Usage: node --env-file=.env.local scripts/run-migration.mjs <path-to-sql-file>');
    process.exit(1);
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), fileArg);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`Reading migration: ${filePath}`);
  const sqlText = fs.readFileSync(filePath, 'utf-8');
  const statements = splitStatements(sqlText);

  console.log(`Found ${statements.length} SQL statements to execute.`);

  const sql = neon(dbUrl);

  for (let idx = 0; idx < statements.length; idx++) {
    const stmt = statements[idx];
    const preview = stmt.replace(/\s+/g, ' ').slice(0, 70);
    console.log(`[${idx + 1}/${statements.length}] Executing: ${preview}...`);
    try {
      await sql.query(stmt);
      console.log(`  -> Success`);
    } catch (err) {
      console.error(`  -> Failed:`, err);
      process.exit(1);
    }
  }

  console.log('Migration completed successfully!');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
