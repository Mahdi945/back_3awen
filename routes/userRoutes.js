const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const bcrypt = require('bcrypt'); 
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken'); // Import JWT for token-based email verification

// Create a transporter for nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'mahdibeyy@gmail.com',
    pass: 'arhmcywiuwkbklqq'
  }
});

// Secret key for JWT
const jwtSecret = 'your_jwt_secret_key'; // Replace with your actual secret key

// Registration route
router.post('/register', async (req, res) => {
  const { firstName, lastName, email, phone, password, city } = req.body;

  try {
    // Check if the user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    // Hash the password before saving the user
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user (not verified yet)
    const newUser = new User({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword, // Save the hashed password
      city,
      isVerified: false // User is not verified initially
    });

    // Save the user in the database
    await newUser.save();

    // Create a verification token
    const token = jwt.sign({ userId: newUser._id }, jwtSecret, { expiresIn: '1h' });

    // Send verification email
    const verificationUrl = `http://localhost:3000/api/users/verify-email?token=${token}`;
    const mailOptions = {
      from: 'mahdibeyy@gmail.com',
      to: email,
      subject: 'Vérifiez votre adresse email',
      html: `<p>Merci de vous être inscrit ! Cliquez <a href="${verificationUrl}">ici</a> pour vérifier votre email.</p>`
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: 'Utilisateur enregistré avec succès. Vérifiez votre email.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
});

// Email verification route
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  try {
    // Verify the token
    const decoded = jwt.verify(token, jwtSecret);

    // Find the user and update their verification status
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Utilisateur déjà vérifié' });
    }

    // Mark the user as verified
    user.isVerified = true;
    await user.save();

    res.status(200).json({ message: 'Email vérifié avec succès !' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Lien de vérification invalide ou expiré.' });
  }
});

// Login route (checking if user is verified)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Check if the user is verified
    if (!user.isVerified) {
      return res.status(400).json({ message: 'Veuillez vérifier votre email avant de vous connecter.' });
    }

    // Compare the password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mot de passe incorrect' });
    }

    // If all is correct, return success response
    res.status(200).json({ message: 'Connexion réussie', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
});

module.exports = router;

