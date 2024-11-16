const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: function() { return !this.isGoogleUser; } // Requis si non Google
  },
  lastName: {
    type: String,
    required: function() { return !this.isGoogleUser; } // Requis si non Google
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String
  },
  password: {
    type: String,
    required: function() { return !this.isGoogleUser; } // Requis si non Google
  },
  city: {
    type: String
  },
  isGoogleUser: {
    type: Boolean,
    default: false // Indique si l'utilisateur vient de Google
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
