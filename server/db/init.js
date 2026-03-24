import pg from 'pg'

const { Pool } = pg

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

export async function runMigrations() {
  // Phase 16: niche auto-detection
  await pool.query(`
    ALTER TABLE IF EXISTS saved_results
      ADD COLUMN IF NOT EXISTS niche VARCHAR(50) NOT NULL DEFAULT 'Other'
  `)
  // Phase 17: public/private visibility
  await pool.query(`
    ALTER TABLE IF EXISTS saved_results
      ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true
  `)
  // Phase 18: username for leaderboard attribution
  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE
  `)
  // Phase 19: idea versioning — parent chain
  await pool.query(`
    ALTER TABLE saved_results
      ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES saved_results(id) ON DELETE SET NULL
  `)
  await pool.query(`
    ALTER TABLE saved_results
      ADD COLUMN IF NOT EXISTS suggested_parent_id UUID REFERENCES saved_results(id) ON DELETE SET NULL
  `)
  // Phase 20: user profiles — display name
  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS display_name VARCHAR(100)
  `)
  // Phase 23: social interactions — likes and comments
  await pool.query(`
    CREATE TABLE IF NOT EXISTS likes (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      result_id UUID NOT NULL REFERENCES saved_results(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, result_id)
    )
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS likes_result_id_idx ON likes(result_id)
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS likes_user_created_idx ON likes(user_id, created_at)
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      result_id UUID NOT NULL REFERENCES saved_results(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
      body TEXT NOT NULL CHECK (char_length(body) <= 500),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ DEFAULT NULL
    )
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS comments_result_id_idx ON comments(result_id)
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON comments(parent_id)
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS comments_user_created_idx ON comments(user_id, created_at)
  `)
  console.log('DB migrations applied')
}
