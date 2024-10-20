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
  }]
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;