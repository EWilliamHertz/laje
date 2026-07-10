import express from 'express'
import cors from 'cors'
import pg from 'pg'

const { Pool } = pg

const app = express()
app.use(cors())
app.use(express.json())

// NeonDB connection (Node's pg driver doesn't support channel_binding, so we use sslmode=require)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_CySNaR9KFcl4@ep-gentle-unit-atx7180q-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require'
})

// Database initialization
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        currency INTEGER DEFAULT 0
      );
    `)
    console.log('Database initialized successfully')
  } catch (err) {
    console.error('Error initializing DB:', err)
  }
}
initDB()

// Register endpoint
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' })
  }
  
  try {
    // Check if user exists
    const checkRes = await pool.query('SELECT id FROM users WHERE username = $1', [username])
    if (checkRes.rows.length > 0) {
      return res.status(400).json({ error: 'Username already taken' })
    }
    
    // Insert new user
    const insertRes = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, level, xp, currency',
      [username, password] // In a real app, hash the password using bcrypt!
    )
    
    const newUser = insertRes.rows[0]
    res.json(newUser)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' })
  }
  
  try {
    const checkRes = await pool.query('SELECT * FROM users WHERE username = $1', [username])
    if (checkRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }
    
    const user = checkRes.rows[0]
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }
    
    res.json({
      id: user.id,
      username: user.username,
      level: user.level,
      xp: user.xp,
      currency: user.currency
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Live Game Backend running on port ${PORT}`)
})
