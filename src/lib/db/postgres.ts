/**
 * PostgreSQL Database Client
 * Replaces Supabase client for database operations
 */

import { Pool, PoolClient, PoolConfig, QueryResult, QueryResultRow } from 'pg';

// Pool configuration
const poolConfig: PoolConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DATABASE || 'autopost_vn',
  user: process.env.POSTGRES_USER || 'autopost_admin',
  password: process.env.POSTGRES_PASSWORD || '',
  max: 20, // Maximum number of clients in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' && process.env.POSTGRES_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false
};

// Singleton pool instance
let pool: Pool | null = null;

/**
 * Get PostgreSQL connection pool (singleton)
 */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(poolConfig);
    
    pool.on('error', (err) => {
      console.error('❌ Unexpected error on idle PostgreSQL client:', err);
      process.exit(-1);
    });

    pool.on('connect', () => {
      if (process.env.LOG_LEVEL === 'debug') {
        console.log('✅ New PostgreSQL client connected');
      }
    });
  }
  return pool;
}

/**
 * Execute a SQL query
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const pool = getPool();
  
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    
    if (process.env.LOG_LEVEL === 'debug') {
      console.log('📊 Query executed:', {
        text: text.substring(0, 100),
        duration: `${duration}ms`,
        rows: res.rowCount
      });
    }
    
    return res;
  } catch (error) {
    console.error('❌ Database query error:', {
      query: text,
      params,
      error: error instanceof Error ? error.message : error
    });
    throw error;
  }
}

/**
 * Execute multiple queries in a transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Transaction rolled back:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Query builder options
 */
interface QueryBuilderOptions {
  table: string;
  select?: string[];
  where?: Record<string, any>;
  whereIn?: { column: string; values: any[] };
  whereNull?: string;
  whereNotNull?: string;
  orderBy?: { column: string; ascending: boolean }[];
  limit?: number;
  offset?: number;
  join?: {
    type: 'INNER' | 'LEFT' | 'RIGHT';
    table: string;
    on: string;
  }[];
}

/**
 * Build SQL query from options (Supabase-like syntax)
 */
export function buildQuery(options: QueryBuilderOptions): { query: string; params: any[] } {
  let query = `SELECT ${options.select?.join(', ') || '*'} FROM ${options.table}`;
  const params: any[] = [];
  let paramIndex = 1;

  // JOINs
  if (options.join) {
    options.join.forEach(j => {
      query += ` ${j.type} JOIN ${j.table} ON ${j.on}`;
    });
  }

  // WHERE conditions
  const conditions: string[] = [];
  
  if (options.where) {
    Object.entries(options.where).forEach(([key, value]) => {
      if (value === null) {
        conditions.push(`${key} IS NULL`);
      } else if (Array.isArray(value)) {
        // IN clause
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        conditions.push(`${key} IN (${placeholders})`);
        params.push(...value);
      } else {
        conditions.push(`${key} = $${paramIndex++}`);
        params.push(value);
      }
    });
  }

  if (options.whereIn) {
    const placeholders = options.whereIn.values.map(() => `$${paramIndex++}`).join(', ');
    conditions.push(`${options.whereIn.column} IN (${placeholders})`);
    params.push(...options.whereIn.values);
  }

  if (options.whereNull) {
    conditions.push(`${options.whereNull} IS NULL`);
  }

  if (options.whereNotNull) {
    conditions.push(`${options.whereNotNull} IS NOT NULL`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  // ORDER BY
  if (options.orderBy && options.orderBy.length > 0) {
    const orderClauses = options.orderBy.map(
      o => `${o.column} ${o.ascending ? 'ASC' : 'DESC'}`
    );
    query += ` ORDER BY ${orderClauses.join(', ')}`;
  }

  // LIMIT & OFFSET
  if (options.limit) {
    query += ` LIMIT ${options.limit}`;
  }

  if (options.offset) {
    query += ` OFFSET ${options.offset}`;
  }

  return { query, params };
}

/**
 * Insert data into table
 */
export async function insert<T extends QueryResultRow = any>(
  table: string,
  data: Record<string, any> | Record<string, any>[]
): Promise<T[]> {
  const records = Array.isArray(data) ? data : [data];
  
  if (records.length === 0) {
    return [];
  }

  const columns = Object.keys(records[0]);
  const values: any[] = [];
  const valuePlaceholders: string[] = [];
  
  let paramIndex = 1;
  records.forEach(record => {
    const rowPlaceholders = columns.map(() => `$${paramIndex++}`);
    valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
    values.push(...columns.map(col => record[col]));
  });

  const queryText = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES ${valuePlaceholders.join(', ')}
    RETURNING *
  `;

  const result = await query<T>(queryText, values);
  return result.rows;
}

/**
 * Update data in table
 */
export async function update<T extends QueryResultRow = any>(
  table: string,
  data: Record<string, any>,
  where: Record<string, any>
): Promise<T[]> {
  const setColumns = Object.keys(data);
  const whereColumns = Object.keys(where);
  
  const params: any[] = [];
  let paramIndex = 1;

  // SET clause
  const setClauses = setColumns.map(col => {
    params.push(data[col]);
    return `${col} = $${paramIndex++}`;
  });

  // WHERE clause
  const whereClauses = whereColumns.map(col => {
    params.push(where[col]);
    return `${col} = $${paramIndex++}`;
  });

  const queryText = `
    UPDATE ${table}
    SET ${setClauses.join(', ')}, updated_at = NOW()
    WHERE ${whereClauses.join(' AND ')}
    RETURNING *
  `;

  const result = await query<T>(queryText, params);
  return result.rows;
}

/**
 * Delete data from table
 */
export async function deleteFrom(
  table: string,
  where: Record<string, any>
): Promise<number> {
  const whereColumns = Object.keys(where);
  const params = Object.values(where);
  
  const whereClauses = whereColumns.map((col, idx) => `${col} = $${idx + 1}`);

  const queryText = `
    DELETE FROM ${table}
    WHERE ${whereClauses.join(' AND ')}
  `;

  const result = await query(queryText, params);
  return result.rowCount || 0;
}

/**
 * Check if connection is healthy
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  }
}

/**
 * Close database connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✅ Database connection pool closed');
  }
}

// Export types
export type { QueryResult, QueryResultRow, PoolClient };
