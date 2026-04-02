const mongoose = require('mongoose')

const mediaSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  youtubeVideoId: { type: String, required: true },
  thumbnail: { type: String, default: '' },
  genres: [{ type: String }],
  tags: [{ type: String }],
  year: { type: Number, default: 2024 },
  views: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: true },
}, { timestamps: true })

mediaSchema.index({ isPublished: 1, createdAt: -1 })
mediaSchema.index({ views: -1 })

module.exports = mongoose.model('Media', mediaSchema)
