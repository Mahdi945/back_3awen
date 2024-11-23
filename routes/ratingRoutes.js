const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');

// Route pour ajouter une note
router.post('/add', ratingController.addRating);

module.exports = router;
