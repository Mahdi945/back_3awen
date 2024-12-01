const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['siteRating', 'eventRating'],
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: false
  },
 
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: function() { return this.type === 'eventRating'; }
  }
});

const Rating = mongoose.model('Rating', ratingSchema);

module.exports = Rating;