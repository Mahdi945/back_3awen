const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true // Requis
  },
  lastName: {
    type: String,
    required: true // Requis
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
    required: true // Requis
  },
  city: {
    type: String
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Ajoute les champs createdAt et updatedAt
});

const User = mongoose.model('User', userSchema);

module.exports = User;