const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Route pour demander la réinitialisation du mot de passe
router.post('/forgot-password', userController.forgotPassword);

// Route pour réinitialiser le mot de passe
router.post('/reset-password', userController.resetPassword);

// Route pour l'inscription
router.post('/register', userController.register);

// Route pour vérifier l'email
router.get('/verify-email', userController.verifyEmail);

// Route pour la connexion
router.post('/login', userController.login);

module.exports = router;
