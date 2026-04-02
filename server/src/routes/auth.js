const express = require('express')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const auth = require('../middleware/auth')

const router = express.Router()

router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body
    if (!email || !password || !displayName) {
      return res.status(400).json({ message: 'Email, password, and display name are required' })
    }

    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ message: 'Email already registered' })

    const user = await User.create({ email, password, displayName })
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })

    res.status(201).json({
      user: { id: user._id, email: user.email, displayName: user.displayName, role: user.role },
      token,
    })
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ message: 'Invalid credentials' })

    const isMatch = await user.comparePassword(password)
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' })

    await User.findByIdAndUpdate(user._id, { lastSeenAt: new Date() })
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })

    res.json({
      user: { id: user._id, email: user.email, displayName: user.displayName, role: user.role },
      token,
    })
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message })
  }
})

router.get('/me', auth, async (req, res) => {
  res.json({ user: { id: req.user._id, email: req.user.email, displayName: req.user.displayName, role: req.user.role } })
})

module.exports = router
