const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController'); // Controller pour gérer l'abonnement

// Route pour s'abonner à la newsletter
router.post('/subscribe', newsletterController.subscribeToNewsletter);

module.exports = router;
