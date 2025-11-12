/**
 * Supabase-Compatible Query Builder
 * Provides Supabase-like API on top of PostgreSQL
 * Allows minimal code changes during migration
 */

import { query, buildQuery, insert, update, deleteFrom } from './postgres';
import type { QueryResultRow } from 'pg';

class QueryBuilder<T extends QueryResultRow = any> {
  private options: any = {};

  constructor(table: string) {
    this.options.table = table;
  }

  /**
   * Select columns
   */
  select(columns: string = '*'): this {
    this.options.select = columns === '*' ? ['*'] : columns.split(',').map(c => c.trim());
    return this;
  }

  /**
   * WHERE column = value
   */
  eq(column: string, value: any): this {
    this.options.where = this.options.where || {};
    this.options.where[column] = value;
    return this;
  }

  /**
   * WHERE column != value
   */
  neq(column: string, value: any): this {
    this.options.where = this.options.where || {};
    this.options.where[`${column} !=`] = value;
    return this;
  }

  /**
   * WHERE column > value
   */
  gt(column: string, value: any): this {
    this.options.where = this.options.where || {};
    this.options.where[`${column} >`] = value;
    return this;
  }

  /**
   * WHERE column >= value
   */
  gte(column: string, value: any): this {
    this.options.where = this.options.where || {};
    this.options.where[`${column} >=`] = value;
    return this;
  }

  /**
   * WHERE column < value
   */
  lt(column: string, value: any): this {
    this.options.where = this.options.where || {};
    this.options.where[`${column} <`] = value;
    return this;
  }

  /**
   * WHERE column <= value
   */
  lte(column: string, value: any): this {
    this.options.where = this.options.where || {};
    this.options.where[`${column} <=`] = value;
    return this;
  }

  /**
   * WHERE column IN (values)
   */
  in(column: string, values: any[]): this {
    this.options.whereIn = { column, values };
    return this;
  }

  /**
   * WHERE column IS NULL
   */
  isNull(column: string): this {
    this.options.whereNull = column;
    return this;
  }

  /**
   * WHERE column IS NOT NULL
   */
  notNull(column: string): this {
    this.options.whereNotNull = column;
    return this;
  }

  /**
   * ORDER BY
   */
  order(column: string, options?: { ascending?: boolean }): this {
    this.options.orderBy = this.options.orderBy || [];
    this.options.orderBy.push({
      column,
      ascending: options?.ascending !== false
    });
    return this;
  }

  /**
   * LIMIT
   */
  limit(count: number): this {
    this.options.limit = count;
    return this;
  }

  /**
   * OFFSET
   */
  offset(count: number): this {
    this.options.offset = count;
    return this;
  }

  /**
   * JOIN
   */
  join(table: string, on: string, type: 'INNER' | 'LEFT' | 'RIGHT' = 'INNER'): this {
    this.options.join = this.options.join || [];
    this.options.join.push({ type, table, on });
    return this;
  }

  /**
   * Execute query and return results
   */
  async execute(): Promise<{ data: T[] | null; error: Error | null }> {
    try {
      const { query: sql, params } = buildQuery(this.options);
      const result = await query<T>(sql, params);
      return { data: result.rows, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Execute and return single row
   */
  async single(): Promise<{ data: T | null; error: Error | null }> {
    this.limit(1);
    const result = await this.execute();
    
    if (result.error) {
      return { data: null, error: result.error };
    }
    
    return { 
      data: result.data && result.data.length > 0 ? result.data[0] : null,
      error: null
    };
  }

  /**
   * Execute and return first row (or null)
   */
  async maybeSingle(): Promise<{ data: T | null; error: Error | null }> {
    return this.single();
  }
}

/**
 * Main database client (Supabase-compatible API)
 */
export const db = {
  /**
   * Start a query on a table
   */
  from<T extends QueryResultRow = any>(table: string) {
    const builder = new QueryBuilder<T>(table);
    
    const queryInterface = {
      // QueryBuilder methods
      select(columns = '*') {
        builder.select(columns);
        return queryInterface;
      },
      
      eq(column: string, value: any) {
        builder.eq(column, value);
        return queryInterface;
      },
      
      neq(column: string, value: any) {
        builder.neq(column, value);
        return queryInterface;
      },
      
      gt(column: string, value: any) {
        builder.gt(column, value);
        return queryInterface;
      },
      
      gte(column: string, value: any) {
        builder.gte(column, value);
        return queryInterface;
      },
      
      lt(column: string, value: any) {
        builder.lt(column, value);
        return queryInterface;
      },
      
      lte(column: string, value: any) {
        builder.lte(column, value);
        return queryInterface;
      },
      
      in(column: string, values: any[]) {
        builder.in(column, values);
        return queryInterface;
      },
      
      isNull(column: string) {
        builder.isNull(column);
        return queryInterface;
      },
      
      notNull(column: string) {
        builder.notNull(column);
        return queryInterface;
      },
      
      order(column: string, options?: { ascending?: boolean }) {
        builder.order(column, options);
        return queryInterface;
      },
      
      limit(count: number) {
        builder.limit(count);
        return queryInterface;
      },
      
      offset(count: number) {
        builder.offset(count);
        return queryInterface;
      },
      
      // Execute methods
      async execute() {
        return builder.execute();
      },
      
      async single() {
        return builder.single();
      },
      
      async maybeSingle() {
        return builder.maybeSingle();
      },
      
      // Insert method
      async insert(data: Record<string, any> | Record<string, any>[]) {
        try {
          const rows = await insert<T>(table, data);
          const returnData = Array.isArray(data) ? rows : (rows[0] || null);
          return { data: returnData as any, error: null };
        } catch (error) {
          return { 
            data: null, 
            error: error instanceof Error ? error : new Error(String(error))
          };
        }
      },
      
      // Update method
      update(data: Record<string, any>) {
        return {
          async eq(column: string, value: any) {
            try {
              const rows = await update<T>(table, data, { [column]: value });
              return { data: rows, error: null };
            } catch (error) {
              return { 
                data: null, 
                error: error instanceof Error ? error : new Error(String(error))
              };
            }
          }
        };
      },
      
      // Delete method
      delete() {
        return {
          async eq(column: string, value: any) {
            try {
              const count = await deleteFrom(table, { [column]: value });
              return { data: null, error: null, count };
            } catch (error) {
              return { 
                data: null, 
                error: error instanceof Error ? error : new Error(String(error)),
                count: 0
              };
            }
          }
        };
      }
    };
    
    return queryInterface;
  },

  /**
   * Raw SQL query
   */
  async query<T extends QueryResultRow = any>(sql: string, params?: any[]) {
    try {
      const result = await query<T>(sql, params);
      return { data: result.rows, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  },

  /**
   * Call a PostgreSQL function (RPC)
   * Mimics Supabase .rpc() behavior
   */
  async rpc<T = any>(functionName: string, params?: Record<string, any>) {
    try {
      // Build parameter list for SQL function call
      const paramNames = params ? Object.keys(params) : [];
      const paramValues = params ? Object.values(params) : [];
      
      // Generate the SQL call with named parameters
      // e.g., SELECT * FROM function_name(p_user_id := $1, p_user_role := $2)
      const paramPlaceholders = paramNames.map((name, idx) => 
        `${name} := $${idx + 1}`
      ).join(', ');
      
      const sql = `SELECT * FROM ${functionName}(${paramPlaceholders})`;
      
      const result = await query<any>(sql, paramValues);
      
      // If the function returns a single row with a single column, extract that value
      if (result.rows.length === 1 && Object.keys(result.rows[0]).length === 1) {
        const firstKey = Object.keys(result.rows[0])[0];
        const data = result.rows[0][firstKey];
        return { data: data as T, error: null };
      }
      
      // Otherwise return the rows as-is
      return { data: result.rows[0] as T, error: null };
    } catch (error) {
      console.error(`Error calling RPC function ${functionName}:`, error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
};

// Usage examples:
// const { data, error } = await db.from('autopostvn_workspaces').select('*').eq('id', workspaceId).execute();
// const { data, error } = await db.from('autopostvn_posts').insert({ title: 'Test' });
// const { data, error } = await db.from('autopostvn_posts').update({ status: 'published' }).eq('id', postId);
// const { data, error } = await db.rpc('check_ai_rate_limit', { p_user_id: userId, p_user_role: role });
