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
  console.log('DB migrations applied')
}
