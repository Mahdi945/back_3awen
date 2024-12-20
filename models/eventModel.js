const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    enum: ['service', 'fundraising'] // Ensure eventType is either 'service' or 'fundraising'
  },
  eventImage: {
    type: String
  },
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
    required: function() { return this.eventType === 'service'; } // Required if eventType is service
  },
  heure: {
    type: String,
    required: function() { return this.eventType === 'service'; } // Required if eventType is service
  },
  lieu: {
    type: String,
    required: function() { return this.eventType === 'service'; } // Required if eventType is service
  },
  description: {
    type: String,
    required: true
  },
  volontaires: {
    type: Number,
    required: function() { return this.eventType === 'service'; } // Required if eventType is service
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
    type: String,
    required: function() { return this.eventType === 'service'; } // Required if eventType is service
  }],
  donateFor: {
    type: String,
    required: function() { return this.eventType === 'fundraising'; } // Required if eventType is fundraising
  },
  goal: {
    type: Number,
    required: function() { return this.eventType === 'fundraising'; } // Required if eventType is fundraising
  },
  deadline: {
    type: String,
    required: function() { return this.eventType === 'fundraising'; } // Required if eventType is fundraising
  },
  raisedAmount: {
    type: Number,
    default: 0, // Initial amount is 0
    required: function() { return this.eventType === 'fundraising'; } // Only for fundraising events
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

// Middleware to update the updatedAt field on save
eventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;