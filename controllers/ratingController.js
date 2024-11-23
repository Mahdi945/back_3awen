const Rating = require('../models/ratingModel');

exports.addRating = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    // Validation simple
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const newRating = new Rating({ rating, comment });
    await newRating.save();

    res.status(201).json({ message: 'Rating added successfully!', newRating });
  } catch (error) {
    res.status(500).json({ message: 'Error adding rating.', error });
  }
};
