const express = require('express')
const Friend = require('../models/Friend')
const User = require('../models/User')
const auth = require('../middleware/auth')

const router = express.Router()

router.get('/', auth, async (req, res) => {
  try {
    const friendships = await Friend.find({
      $or: [{ userId: req.user._id }, { friendId: req.user._id }],
      status: 'accepted',
    }).populate('userId', 'displayName lastSeenAt').populate('friendId', 'displayName lastSeenAt')

    const friends = friendships.map(f => {
      const friend = f.userId._id.toString() === req.user._id.toString() ? f.friendId : f.userId
      const isOnline = (Date.now() - new Date(friend.lastSeenAt).getTime()) < 300000
      return { id: friend._id, displayName: friend.displayName, isOnline }
    })
    res.json(friends)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch friends', error: err.message })
  }
})

router.post('/request', auth, async (req, res) => {
  try {
    const { email } = req.body
    const friend = await User.findOne({ email })
    if (!friend) return res.status(404).json({ message: 'User not found' })
    if (friend._id.toString() === req.user._id.toString()) return res.status(400).json({ message: 'Cannot add yourself' })

    const existing = await Friend.findOne({
      $or: [{ userId: req.user._id, friendId: friend._id }, { userId: friend._id, friendId: req.user._id }],
    })
    if (existing) return res.status(409).json({ message: 'Request already exists' })

    const friendship = await Friend.create({ userId: req.user._id, friendId: friend._id })
    res.status(201).json(friendship)
  } catch (err) {
    res.status(500).json({ message: 'Failed to send request', error: err.message })
  }
})

router.post('/request/:friendId/accept', auth, async (req, res) => {
  try {
    const request = await Friend.findOne({ userId: req.params.friendId, friendId: req.user._id, status: 'pending' })
    if (!request) return res.status(404).json({ message: 'Request not found' })
    await request.updateOne({ status: 'accepted' })
    await Friend.create({ userId: req.user._id, friendId: req.params.friendId, status: 'accepted' })
    const friend = await User.findById(req.params.friendId).select('displayName')
    res.json({ friend: { id: friend._id, displayName: friend.displayName } })
  } catch (err) {
    res.status(500).json({ message: 'Failed to accept request', error: err.message })
  }
})

router.delete('/request/:friendId', auth, async (req, res) => {
  try {
    await Friend.findOneAndDelete({ userId: req.params.friendId, friendId: req.user._id, status: 'pending' })
    res.json({ message: 'Request rejected' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to reject request', error: err.message })
  }
})

router.delete('/:friendId', auth, async (req, res) => {
  try {
    await Friend.deleteMany({
      $or: [{ userId: req.user._id, friendId: req.params.friendId }, { userId: req.params.friendId, friendId: req.user._id }],
    })
    res.json({ message: 'Friend removed' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove friend', error: err.message })
  }
})

router.get('/pending', auth, async (req, res) => {
  try {
    const requests = await Friend.find({ friendId: req.user._id, status: 'pending' }).populate('userId', 'displayName email')
    res.json(requests.map(r => ({ id: r._id, from: { id: r.userId._id, displayName: r.userId.displayName, email: r.userId.email }, createdAt: r.createdAt })))
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch pending requests', error: err.message })
  }
})

module.exports = router
