const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const passport = require('passport');

// Importer le fichier de configuration de passport
require('../passportConfig');  // Assurez-vous que le chemin correspond à votre fichier passportConfig

// Route pour demander la réinitialisation du mot de passe
router.post('/forgot-password', userController.forgotPassword);

// Route pour réinitialiser le mot de passe
router.post('/reset-password', userController.resetPassword);

// Route pour l'inscription
router.post('/register', userController.register);

// Route pour l'authentification avec Google
router.get('/google', userController.googleAuth);

// Route pour le callback de Google
router.get('/google/callback', userController.googleAuthCallback);

// Route pour vérifier l'email
router.get('/verify-email', userController.verifyEmail);

// Route pour la connexion
router.post('/login', userController.login);

// Route pour mettre à jour les informations utilisateur
router.put('/update/:userId', userController.updateUser);

// Route pour envoyer un email de contact
router.post('/contact', userController.sendContactEmail);

// Route pour supprimer un utilisateur
router.delete('/delete/:userId', userController.deleteUser);

module.exports = router;