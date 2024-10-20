const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');
const router = express.Router();

// Secret for JWT (utilisez une variable d'environnement pour plus de sécurité)
const jwtSecret = process.env.JWT_SECRET || 'byJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJtYWhkaSIsInJvbGUiOiJ1dGlsaXNhdGV1ciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5w';

// Route pour la connexion de l'administrateur
router.post('/login', async (req, res) => {
  const { adminId, password } = req.body;

  // Validation des entrées
  if (!adminId || !password) {
    return res.status(400).json({ message: 'Veuillez fournir un ID et un mot de passe.' });
  }

  try {
    // Trouver l'administrateur par ID
    const admin = await Admin.findOne({ adminId });

    if (!admin) {
      console.log(`Admin non trouvé pour l'ID: ${adminId}`);
      return res.status(404).json({ message: 'ID ou mot de passe incorrect.' });
    }

    // Comparer le mot de passe fourni avec le mot de passe en clair dans la base de données
    if (password !== admin.password) {
      console.log(`Mot de passe incorrect pour l'ID: ${adminId}. Mot de passe fourni: ${password}, Mot de passe attendu: ${admin.password}`);
      return res.status(400).json({ message: 'ID ou mot de passe incorrect.' });
    }

    // Générer un token JWT
    const token = jwt.sign({ adminId: admin.adminId }, jwtSecret, { expiresIn: '1h' });

    res.status(200).json({ message: 'Connexion réussie', token });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

module.exports = router;