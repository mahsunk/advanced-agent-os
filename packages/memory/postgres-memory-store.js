import pg from 'pg';

const { Pool } = pg;

export class PostgresMemoryStore {
  constructor(connectionString) {
    this.pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: Number(process.env.POSTGRES_CONNECTION_TIMEOUT_MS ?? 10000),
      idleTimeoutMillis: Number(process.env.POSTGRES_IDLE_TIMEOUT_MS ?? 30000),
      max: Number(process.env.POSTGRES_POOL_MAX ?? 5)
    });
  }

  async add(record) {
    const result = await this.pool.query(
      `insert into memory_records (type, content, metadata)
       values ($1, $2, $3::jsonb)
       returning id, type, content, metadata, created_at`,
      [
        record.type ?? 'generic',
        record.content ?? '',
        JSON.stringify(record.metadata ?? {})
      ]
    );

    return this.mapRow(result.rows[0]);
  }

  async list() {
    const result = await this.pool.query(
      `select id, type, content, metadata, created_at
       from memory_records
       order by created_at desc
       limit 100`
    );

    return result.rows.map(row => this.mapRow(row));
  }

  async search(query) {
    const value = `%${query}%`;

    const result = await this.pool.query(
      `select id, type, content, metadata, created_at
       from memory_records
       where content ilike $1
          or type ilike $1
          or metadata::text ilike $1
       order by created_at desc
       limit 100`,
      [value]
    );

    return result.rows.map(row => this.mapRow(row));
  }

  mapRow(row) {
    return {
      id: row.id,
      type: row.type,
      content: row.content,
      metadata: row.metadata ?? {},
      createdAt:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : row.created_at
    };
  }
}
