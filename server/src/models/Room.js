const mongoose = require('mongoose')

const roomSchema = new mongoose.Schema({
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', required: true },
  name: { type: String, default: '' },
  isPublic: { type: Boolean, default: true },
  maxViewers: { type: Number, default: 50 },
  currentViewerCount: { type: Number, default: 1 },
  currentTime: { type: Number, default: 0 },
  isPlaying: { type: Boolean, default: false },
  playbackRate: { type: Number, default: 1 },
}, { timestamps: true })

roomSchema.index({ isPublic: 1, currentViewerCount: -1 })
roomSchema.index({ hostId: 1 })

module.exports = mongoose.model('Room', roomSchema)
