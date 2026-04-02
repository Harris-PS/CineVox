const express = require('express')
const Media = require('../models/Media')
const auth = require('../middleware/auth')

const router = express.Router()

function extractYouTubeId(url) {
  if (!url) return null
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/)
  return match ? match[1] : null
}

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, genre, search, sort = 'newest' } = req.query
    const query = { isPublished: true }
    if (genre) query.genres = genre
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ]

    const sortOption = sort === 'views' ? { views: -1 } : { createdAt: -1 }
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [media, total] = await Promise.all([
      Media.find(query).sort(sortOption).skip(skip).limit(parseInt(limit)),
      Media.countDocuments(query),
    ])

    res.json({
      data: media,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch media', error: err.message })
  }
})

router.get('/trending', async (req, res) => {
  try {
    const media = await Media.find({ isPublished: true }).sort({ views: -1 }).limit(parseInt(req.query.limit) || 10)
    res.json(media)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch trending', error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const media = await Media.findById(req.params.id)
    if (!media) return res.status(404).json({ message: 'Media not found' })
    await Media.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } })
    res.json(media)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch media', error: err.message })
  }
})

router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' })

    const { title, description, youtubeUrl, youtubeVideoId, genres, tags, year } = req.body
    const videoId = youtubeVideoId || extractYouTubeId(youtubeUrl)
    if (!videoId) return res.status(400).json({ message: 'Valid YouTube URL or video ID required' })

    const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    const media = await Media.create({
      title, description: description || '', youtubeVideoId: videoId, thumbnail,
      genres: genres || [], tags: tags || [], year: year || new Date().getFullYear(),
    })
    res.status(201).json(media)
  } catch (err) {
    res.status(500).json({ message: 'Failed to create media', error: err.message })
  }
})

router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' })
    const { title, description, youtubeUrl, youtubeVideoId, genres, tags, year, isPublished } = req.body
    const update = { title, description, genres, tags, year, isPublished }
    if (youtubeVideoId || youtubeUrl) {
      const videoId = youtubeVideoId || extractYouTubeId(youtubeUrl)
      if (videoId) {
        update.youtubeVideoId = videoId
        update.thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      }
    }
    const media = await Media.findByIdAndUpdate(req.params.id, update, { new: true })
    if (!media) return res.status(404).json({ message: 'Media not found' })
    res.json(media)
  } catch (err) {
    res.status(500).json({ message: 'Failed to update media', error: err.message })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' })
    const media = await Media.findByIdAndDelete(req.params.id)
    if (!media) return res.status(404).json({ message: 'Media not found' })
    res.json({ message: 'Media deleted' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete media', error: err.message })
  }
})

router.get('/admin/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' })
    const media = await Media.find().sort({ createdAt: -1 })
    res.json(media)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch media', error: err.message })
  }
})

module.exports = router
