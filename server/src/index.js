require('dotenv').config()
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const jwt = require('jsonwebtoken')
const User = require('./models/User')
const Room = require('./models/Room')
const Message = require('./models/Message')

const authRoutes = require('./routes/auth')
const mediaRoutes = require('./routes/media')
const roomRoutes = require('./routes/rooms')
const friendRoutes = require('./routes/friends')

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3002', credentials: true },
})

app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3002', credentials: true }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/media', mediaRoutes)
app.use('/api/rooms', roomRoutes)
app.use('/api/friends', friendRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

const roomStates = new Map()
const userSockets = new Map()

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token
    if (!token) return next(new Error('Authentication required'))
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId)
    if (!user) return next(new Error('User not found'))
    socket.user = user
    next()
  } catch (err) {
    next(new Error('Invalid token'))
  }
})

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.displayName} (${socket.id})`)
  userSockets.set(socket.user._id.toString(), socket.id)

  User.findByIdAndUpdate(socket.user._id, { lastSeenAt: new Date() }).catch(() => {})

  socket.on('room:join', async ({ roomId }) => {
    try {
      const room = await Room.findById(roomId).populate('hostId', 'displayName').populate('mediaId', 'title thumbnail youtubeVideoId')
      if (!room) return socket.emit('error', { message: 'Room not found' })

      await socket.join(roomId)
      const state = roomStates.get(roomId) || { currentTime: room.currentTime, isPlaying: room.isPlaying, playbackRate: room.playbackRate }
      socket.emit('room:state', { ...state, room })
      socket.to(roomId).emit('room:user_joined', { userId: socket.user._id, displayName: socket.user.displayName, viewerCount: room.currentViewerCount + 1 })
    } catch (err) {
      socket.emit('error', { message: 'Failed to join room' })
    }
  })

  socket.on('room:leave', async (roomId) => {
    await socket.leave(roomId)
    try {
      const room = await Room.findById(roomId)
      if (room) {
        room.currentViewerCount = Math.max(0, room.currentViewerCount - 1)
        if (room.currentViewerCount <= 0) await room.deleteOne()
        else await room.save()
      }
    } catch {}
  })

  socket.on('playback:play', async ({ roomId, currentTime }) => {
    const room = await Room.findById(roomId)
    if (!room || room.hostId.toString() !== socket.user._id.toString()) return
    roomStates.set(roomId, { currentTime, isPlaying: true, playbackRate: room.playbackRate })
    await Room.findByIdAndUpdate(roomId, { currentTime, isPlaying: true })
    socket.to(roomId).emit('playback:play', { currentTime, isPlaying: true })
  })

  socket.on('playback:pause', async ({ roomId, currentTime }) => {
    const room = await Room.findById(roomId)
    if (!room || room.hostId.toString() !== socket.user._id.toString()) return
    roomStates.set(roomId, { currentTime, isPlaying: false, playbackRate: room.playbackRate })
    await Room.findByIdAndUpdate(roomId, { currentTime, isPlaying: false })
    socket.to(roomId).emit('playback:pause', { currentTime, isPlaying: false })
  })

  socket.on('playback:seek', async ({ roomId, currentTime }) => {
    const room = await Room.findById(roomId)
    if (!room || room.hostId.toString() !== socket.user._id.toString()) return
    const state = { currentTime, isPlaying: room.isPlaying, playbackRate: room.playbackRate }
    roomStates.set(roomId, state)
    await Room.findByIdAndUpdate(roomId, { currentTime })
    socket.to(roomId).emit('playback:seek', state)
  })

  socket.on('chat:message', async ({ roomId, content }) => {
    if (!content.trim()) return
    try {
      const message = await Message.create({ roomId, userId: socket.user._id, content: content.trim() })
      const populated = await Message.findById(message._id).populate('userId', 'displayName')
      socket.to(roomId).emit('chat:message', { id: populated._id, user: { id: populated.userId._id, displayName: populated.userId.displayName }, content: populated.content, createdAt: populated.createdAt })
    } catch {}
  })

  socket.on('chat:history', async ({ roomId }) => {
    try {
      const messages = await Message.find({ roomId }).sort({ createdAt: 1 }).limit(50).populate('userId', 'displayName')
      socket.emit('chat:history', messages.map(m => ({ id: m._id, user: { id: m.userId._id, displayName: m.userId.displayName }, content: m.content, createdAt: m.createdAt })))
    } catch {}
  })

  socket.on('disconnect', async () => {
    userSockets.delete(socket.user._id.toString())
    await User.findByIdAndUpdate(socket.user._id, { lastSeenAt: new Date() }).catch(() => {})
  })
})

async function seedAdmin() {
  const existing = await User.findOne({ email: 'admin@cinevox.app' })
  if (!existing) {
    await User.create({ email: 'admin@cinevox.app', password: 'admin123', displayName: 'Admin', role: 'admin' })
    console.log('Seeded admin account: admin@cinevox.app / admin123')
  }
}

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cinevox')
    console.log('Connected to MongoDB')
    await seedAdmin()

    const port = process.env.PORT || 4000
    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`)
      console.log(`Socket.io ready`)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()
