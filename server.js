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

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Required' })
  try {
    const checkRes = await pool.query('SELECT id FROM users WHERE username = $1', [username])
    if (checkRes.rows.length > 0) return res.status(400).json({ error: 'Username taken' })
    const insertRes = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, level, xp, currency',
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
    res.json({ id: user.id, username: user.username, level: user.level, xp: user.xp, currency: user.currency })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

const PORT = process.env.PORT || 3001
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Live Game Backend running on port ${PORT}`)
})
