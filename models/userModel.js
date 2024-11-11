const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false // Add isVerified field
  },
  createdAt: {
    type: Date,
    default: Date.now // Add createdAt field
  },
  updatedAt: {
    type: Date,
    default: Date.now // Add updatedAt field
  }
});

// Middleware to update the updatedAt field on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;