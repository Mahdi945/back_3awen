const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  rating: { type: Number, required: true, min: 1, max: 5 }, // Note entre 1 et 5
  comment: { type: String, required: false } // Optionnel
});

module.exports = mongoose.model('Rating', ratingSchema);
