import express from 'express'
import cors from 'cors'
import pg from 'pg'
import http from 'http'
import { Server } from 'socket.io'

const { Pool } = pg

const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)

// Initialize Socket.io Multiplayer Engine
const io = new Server(server, {
  cors: { origin: '*' }
})

const players = {}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id)
  
  socket.on('join_world', (playerData) => {
    players[socket.id] = { id: socket.id, ...playerData, position: [0,0,0], rotation: 0 }
    socket.broadcast.emit('player_joined', players[socket.id])
    socket.emit('current_players', players)
  })

  socket.on('player_move', (data) => {
    if (players[socket.id]) {
      players[socket.id].position = data.position
      players[socket.id].rotation = data.rotation
      players[socket.id].isAttacking = data.isAttacking
      socket.broadcast.emit('player_moved', players[socket.id])
    }
  })

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id)
    delete players[socket.id]
    io.emit('player_left', socket.id)
  })
})

// NeonDB connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_CySNaR9KFcl4@ep-gentle-unit-atx7180q-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require'
})

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        currency INTEGER DEFAULT 0,
        unlocked_skills JSONB DEFAULT '[]'::jsonb,
        hotbar JSONB DEFAULT '[null, null, null, null, null]'::jsonb,
        inventory JSONB DEFAULT '[]'::jsonb,
        equipped JSONB DEFAULT '{"weapon": null, "armor": null}'::jsonb,
        friends JSONB DEFAULT '[]'::jsonb
      )
    `)
    // Run alters to ensure columns exist for older rows
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS inventory JSONB DEFAULT '[]'::jsonb`)
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS equipped JSONB DEFAULT '{"weapon": null, "armor": null}'::jsonb`)
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS friends JSONB DEFAULT '[]'::jsonb`)
    console.log('Database schema ensured.')
  } catch (err) {
    console.error('Error initializing DB:', err)
  }
}
initDB()

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Required' })
  try {
    const checkRes = await pool.query('SELECT id FROM users WHERE username = $1', [username])
    if (checkRes.rows.length > 0) return res.status(400).json({ error: 'Username taken' })
    const insertRes = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, level, xp, currency, unlocked_skills, hotbar, inventory, equipped, friends',
      [username, password]
    )
    res.json(insertRes.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body
  try {
    const checkRes = await pool.query('SELECT * FROM users WHERE username = $1', [username])
    if (checkRes.rows.length === 0) return res.status(401).json({ error: 'Invalid' })
    const user = checkRes.rows[0]
    if (user.password !== password) return res.status(401).json({ error: 'Invalid' })
    res.json({ 
      id: user.id, username: user.username, level: user.level, xp: user.xp, currency: user.currency,
      unlocked_skills: user.unlocked_skills, hotbar: user.hotbar, inventory: user.inventory, equipped: user.equipped, friends: user.friends
    })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

app.post('/api/save', async (req, res) => {
  const { id, level, xp, currency, unlockedSkills, hotbar, inventory, equipped, friends } = req.body
  if (!id) return res.status(400).json({ error: 'Missing ID' })
  try {
    await pool.query(
      'UPDATE users SET level = $1, xp = $2, currency = $3, unlocked_skills = $4, hotbar = $5, inventory = $6, equipped = $7, friends = $8 WHERE id = $9',
      [
        level, 
        xp, 
        currency, 
        JSON.stringify(unlockedSkills || []), 
        JSON.stringify(hotbar || [null, null, null, null, null]), 
        JSON.stringify(inventory || []),
        JSON.stringify(equipped || {weapon: null, armor: null}),
        JSON.stringify(friends || []),
        id
      ]
    )
    res.json({ success: true })
  } catch (err) {
    console.error('Save error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

const PORT = process.env.PORT || 3001
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Live Game Backend running on port ${PORT}`)
})
