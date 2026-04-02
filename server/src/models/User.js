const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  displayName: { type: String, required: true, trim: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  lastSeenAt: { type: Date, default: Date.now },
}, { timestamps: true })

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password)
}

module.exports = mongoose.model('User', userSchema)
