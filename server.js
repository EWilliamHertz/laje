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
    players[socket.id] = { id: socket.id, ...playerData, position: [0, 0, 0], rotation: 0 }
    socket.broadcast.emit('player_joined', players[socket.id])
    socket.emit('current_players', players)
  })

  socket.on('player_move', (data) => {
    if (players[socket.id]) {
      players[socket.id].position = data.position
      players[socket.id].rotation = data.rotation
      players[socket.id].isAttacking = data.isAttacking
      players[socket.id].isMoving = data.isMoving
      players[socket.id].level = data.level
      players[socket.id].equippedWeapon = data.equippedWeapon
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

const MAX_CHARACTERS_PER_USER = 8

const CHARACTER_COLUMNS = `id, user_id, name, char_class, char_race, level, xp, currency,
  unlocked_skills, hotbar, inventory, equipped, position, created_at, last_played`

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
        friends JSONB DEFAULT '[]'::jsonb,
        char_class VARCHAR(50),
        char_race VARCHAR(50)
      )
    `)

    // ── New: 1-to-many users → characters ──────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS characters (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(50) NOT NULL,
        char_class VARCHAR(50) NOT NULL,
        char_race VARCHAR(50) NOT NULL,
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        currency INTEGER DEFAULT 0,
        unlocked_skills JSONB DEFAULT '[]'::jsonb,
        hotbar JSONB DEFAULT '[null, null, null, null, null]'::jsonb,
        inventory JSONB DEFAULT '[]'::jsonb,
        equipped JSONB DEFAULT '{"weapon": null, "armor": null}'::jsonb,
        position JSONB DEFAULT '{"x": 0, "z": 0, "area": "hub"}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT now(),
        last_played TIMESTAMPTZ DEFAULT now(),
        UNIQUE(user_id, name)
      )
    `)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_characters_user ON characters(user_id)`)

    // One-time migration: users that had a legacy single character embedded
    // on the users row get a real character row created for them.
    await pool.query(`
      INSERT INTO characters (user_id, name, char_class, char_race, level, xp, currency, unlocked_skills, hotbar, inventory, equipped)
      SELECT u.id, u.username, u.char_class, COALESCE(u.char_race, 'human'), u.level, u.xp, u.currency,
             COALESCE(u.unlocked_skills::jsonb, '[]'::jsonb),
             COALESCE(u.hotbar::jsonb, '[null, null, null, null, null]'::jsonb),
             COALESCE(u.inventory::jsonb, '[]'::jsonb),
             COALESCE(u.equipped::jsonb, '{"weapon": null, "armor": null}'::jsonb)
      FROM users u
      WHERE u.char_class IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM characters c WHERE c.user_id = u.id)
    `)

    console.log('Database schema ensured (users + characters).')
  } catch (err) {
    console.error('Error initializing DB:', err)
  }
}
initDB()

async function fetchCharacters(userId) {
  const result = await pool.query(
    `SELECT ${CHARACTER_COLUMNS} FROM characters WHERE user_id = $1 ORDER BY last_played DESC`,
    [userId]
  )
  return result.rows
}

// ── Auth ────────────────────────────────────────────────────────────────
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Required' })
  try {
    const checkRes = await pool.query('SELECT id FROM users WHERE username = $1', [username])
    if (checkRes.rows.length > 0) return res.status(400).json({ error: 'Username taken' })
    const insertRes = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, friends',
      [username, password]
    )
    res.json({ ...insertRes.rows[0], characters: [] })
  } catch (err) {
    console.error('Register error:', err)
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
    const characters = await fetchCharacters(user.id)
    res.json({ id: user.id, username: user.username, friends: user.friends, characters })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── Character management (WoW-style multi-character accounts) ───────────
app.get('/api/users/:userId/characters', async (req, res) => {
  try {
    res.json(await fetchCharacters(req.params.userId))
  } catch (err) {
    console.error('List characters error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

app.post('/api/users/:userId/characters', async (req, res) => {
  const { name, charClass, charRace } = req.body
  const userId = req.params.userId
  if (!name || !charClass || !charRace) return res.status(400).json({ error: 'Name, class and race are required' })
  if (name.length < 2 || name.length > 24) return res.status(400).json({ error: 'Name must be 2-24 characters' })
  try {
    const countRes = await pool.query('SELECT COUNT(*) FROM characters WHERE user_id = $1', [userId])
    if (parseInt(countRes.rows[0].count) >= MAX_CHARACTERS_PER_USER) {
      return res.status(400).json({ error: `Character limit reached (${MAX_CHARACTERS_PER_USER})` })
    }
    const insertRes = await pool.query(
      `INSERT INTO characters (user_id, name, char_class, char_race)
       VALUES ($1, $2, $3, $4) RETURNING ${CHARACTER_COLUMNS}`,
      [userId, name.trim(), charClass, charRace]
    )
    res.json(insertRes.rows[0])
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'You already have a character with that name' })
    console.error('Create character error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

app.delete('/api/characters/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM characters WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    console.error('Delete character error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── Auto-save endpoint (called every 30s by the client) ─────────────────
app.put('/api/characters/:id/save', async (req, res) => {
  const { level, xp, currency, unlockedSkills, hotbar, inventory, equipped, position } = req.body
  try {
    await pool.query(
      `UPDATE characters SET
        level = COALESCE($1, level),
        xp = COALESCE($2, xp),
        currency = COALESCE($3, currency),
        unlocked_skills = COALESCE($4, unlocked_skills),
        hotbar = COALESCE($5, hotbar),
        inventory = COALESCE($6, inventory),
        equipped = COALESCE($7, equipped),
        position = COALESCE($8, position),
        last_played = now()
       WHERE id = $9`,
      [
        level,
        xp,
        currency,
        unlockedSkills ? JSON.stringify(unlockedSkills) : null,
        hotbar ? JSON.stringify(hotbar) : null,
        inventory ? JSON.stringify(inventory) : null,
        equipped ? JSON.stringify(equipped) : null,
        position ? JSON.stringify(position) : null,
        req.params.id
      ]
    )
    res.json({ success: true, savedAt: new Date().toISOString() })
  } catch (err) {
    console.error('Save error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── Legacy save endpoint (kept for backwards compatibility) ─────────────
app.post('/api/save', async (req, res) => {
  const { id, level, xp, currency, unlockedSkills, hotbar, inventory, equipped, friends, charClass, charRace } = req.body
  if (!id) return res.status(400).json({ error: 'Missing ID' })
  try {
    await pool.query(
      'UPDATE users SET level = $1, xp = $2, currency = $3, unlocked_skills = $4, hotbar = $5, inventory = $6, equipped = $7, friends = $8, char_class = $9, char_race = $10 WHERE id = $11',
      [
        level, xp, currency,
        JSON.stringify(unlockedSkills || []),
        JSON.stringify(hotbar || [null, null, null, null, null]),
        JSON.stringify(inventory || []),
        JSON.stringify(equipped || { weapon: null, armor: null }),
        JSON.stringify(friends || []),
        charClass || null,
        charRace || null,
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
