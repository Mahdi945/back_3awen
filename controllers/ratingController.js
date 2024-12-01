const Rating = require('../models/ratingModel');

exports.addRating = async (req, res) => {
  try {
    const { rating, comment, type, eventId } = req.body;

    // Validation simple
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    if (!type || !['siteRating', 'eventRating'].includes(type)) {
      return res.status(400).json({ message: 'Invalid rating type.' });
    }

    if (type === 'eventRating' && !eventId) {
      return res.status(400).json({ message: 'Event ID is required for event ratings.' });
    }

    const newRating = new Rating({ rating, comment, type, eventId });
    await newRating.save();

    res.status(201).json({ message: 'Rating added successfully!', newRating });
  } catch (error) {
    res.status(500).json({ message: 'Error adding rating.', error });
  }
};