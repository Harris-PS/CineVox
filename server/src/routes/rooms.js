const express = require('express')
const Room = require('../models/Room')
const auth = require('../middleware/auth')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const [rooms, total] = await Promise.all([
      Room.find({ isPublic: true }).sort({ currentViewerCount: -1 }).skip(skip).limit(parseInt(limit))
        .populate('hostId', 'displayName').populate('mediaId', 'title thumbnail youtubeVideoId'),
      Room.countDocuments({ isPublic: true }),
    ])
    res.json({ data: rooms, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch rooms', error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('hostId', 'displayName').populate('mediaId', 'title thumbnail youtubeVideoId')
    if (!room) return res.status(404).json({ message: 'Room not found' })
    res.json(room)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch room', error: err.message })
  }
})

router.post('/', auth, async (req, res) => {
  try {
    const { mediaId, isPublic, name, maxViewers } = req.body
    if (!mediaId) return res.status(400).json({ message: 'mediaId is required' })
    const room = await Room.create({
      hostId: req.user._id, mediaId,
      name: name || 'Watch Party',
      isPublic: isPublic !== false,
      maxViewers: maxViewers || 50,
    })
    const populated = await Room.findById(room._id).populate('hostId', 'displayName').populate('mediaId', 'title thumbnail youtubeVideoId')
    res.status(201).json(populated)
  } catch (err) {
    res.status(500).json({ message: 'Failed to create room', error: err.message })
  }
})

router.post('/:id/join', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
    if (!room) return res.status(404).json({ message: 'Room not found' })
    if (room.currentViewerCount >= room.maxViewers) return res.status(400).json({ message: 'Room is full' })
    room.currentViewerCount += 1
    await room.save()
    const populated = await Room.findById(room._id).populate('hostId', 'displayName').populate('mediaId', 'title thumbnail youtubeVideoId')
    res.json(populated)
  } catch (err) {
    res.status(500).json({ message: 'Failed to join room', error: err.message })
  }
})

router.post('/:id/leave', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
    if (!room) return res.status(404).json({ message: 'Room not found' })
    room.currentViewerCount = Math.max(0, room.currentViewerCount - 1)
    if (room.currentViewerCount <= 0) {
      await room.deleteOne()
      return res.json({ message: 'Room closed' })
    }
    await room.save()
    res.json(room)
  } catch (err) {
    res.status(500).json({ message: 'Failed to leave room', error: err.message })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
    if (!room) return res.status(404).json({ message: 'Room not found' })
    if (room.hostId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' })
    }
    await room.deleteOne()
    res.json({ message: 'Room deleted' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete room', error: err.message })
  }
})

module.exports = router
