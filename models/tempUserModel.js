const mongoose = require('mongoose');

const tempUserSchema = new mongoose.Schema({
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
    default: Date.now,
    expires: 600 // Expire after 10 minutes (600 seconds)
  }
});

const TempUser = mongoose.model('TempUser', tempUserSchema);
module.exports = TempUser;