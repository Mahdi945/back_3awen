const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  nomOrganisateur: {
    type: String,
    required: true
  },
  emailOrganisateur: {
    type: String,
    required: true
  },
  titre: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  heure: {
    type: String,
    required: true
  },
  lieu: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  volontaires: {
    type: Number,
    required: true
  },
  preuves: [{
    type: String
  }],
  isApproved: {
    type: Boolean,
    default: false
  },
  id_user_organisateur: {
    type: String,
  },
  participants: [{
    type: String // Stocker les emails des participants
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to update the updatedAt field on save
eventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;