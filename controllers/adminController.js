// controllers/adminController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Admin = require('../models/adminModel');

// Secret for JWT (use an environment variable for security)
const jwtSecret = process.env.JWT_SECRET || 'byJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJtYWhkaSIsInJvbGUiOiJ1dGlsaXNhdGV1ciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5w';

// Function to handle admin login
const loginAdmin = async (req, res) => {
  const { adminId, password } = req.body;

  // Validate input
  if (!adminId || !password) {
    return res.status(400).json({ message: 'Veuillez fournir un ID et un mot de passe.' });
  }

  try {
    // Find admin by ID
    const admin = await Admin.findOne({ adminId });

    if (!admin) {
      console.log(`Admin non trouvé pour l'ID: ${adminId}`);
      return res.status(404).json({ message: 'ID ou mot de passe incorrect.' });
    }

    // Compare password (hashed password comparison)
    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      console.log(`Mot de passe incorrect pour l'ID: ${adminId}`);
      return res.status(400).json({ message: 'ID ou mot de passe incorrect.' });
    }

    // Generate JWT token
    const token = jwt.sign({ adminId: admin.adminId }, jwtSecret, { expiresIn: '1h' });

    res.status(200).json({ message: 'Connexion réussie', token });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};

module.exports = {
  loginAdmin,
};
