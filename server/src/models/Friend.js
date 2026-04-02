const mongoose = require('mongoose')

const friendSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  friendId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'blocked'], default: 'pending' },
}, { timestamps: true })

friendSchema.index({ userId: 1, friendId: 1 }, { unique: true })
friendSchema.index({ userId: 1, status: 1 })

module.exports = mongoose.model('Friend', friendSchema)
