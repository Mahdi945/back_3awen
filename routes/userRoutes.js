const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const TempUser = require('../models/tempUserModel'); // Import TempUser model
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'mahdibeyy@gmail.com',
    pass: 'arhmcywiuwkbklqq' // Assurez-vous d'utiliser un mot de passe d'application Gmail.
  }
});

// Secret key for JWT
const jwtSecret = 'ayJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJtYWhkaSIsInJvbGUiOiJ1dGlsaXNhdGV1ciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

// Registration route
router.post('/register', async (req, res) => {
  const { firstName, lastName, email, phone, password, city } = req.body;

  try {
    // Check if the user already exists in the main collection
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    // Check if the user already exists in the temporary collection
    const tempUserExists = await TempUser.findOne({ email });
    if (tempUserExists) {
      return res.status(400).json({ message: 'Email déjà utilisé pour la vérification' });
    }

    // Hash the password before saving the user
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new temporary user
    const newTempUser = new TempUser({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword, // Save the hashed password
      city,
      isVerified: false // Set isVerified to false
    });

    // Save the temporary user in the database
    await newTempUser.save();

    // Create a verification token
    const token = jwt.sign({ userId: newTempUser._id }, jwtSecret, { expiresIn: '10m' });

    // Send verification email
    const verificationUrl = `http://localhost:4200/email-verification?token=${token}`;

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
  const token = req.query.token;

  try {
    // Verify the token
    const decoded = jwt.verify(token, jwtSecret);

    // Find the temporary user by ID
    const tempUser = await TempUser.findById(decoded.userId);

    if (!tempUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé ou lien expiré' });
    }

    // Check if the user is already verified
    if (tempUser.isVerified) {
      return res.status(400).json({ message: 'Lien de vérification déjà utilisé.' });
    }

    // Create a new user in the main collection
    const newUser = new User({
      firstName: tempUser.firstName,
      lastName: tempUser.lastName,
      email: tempUser.email,
      phone: tempUser.phone,
      password: tempUser.password, // Utiliser le mot de passe haché du TempUser
      city: tempUser.city,
      isVerified: true
    });

    // Save the new user in the main collection
    await newUser.save();

    // Mark the temporary user as verified
    tempUser.isVerified = true;
    await tempUser.save();

    res.status(200).json({ message: 'Email vérifié avec succès !' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Lien de vérification invalide ou expiré.' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.log('Utilisateur non trouvé');
      return res.status(404).json({ message: 'Adresse ou mot de passe incorrect' });
    }

    // Check if the user is verified
    if (!user.isVerified) {
      console.log('Utilisateur non vérifié');
      return res.status(400).json({ message: 'Veuillez vérifier votre email avant de vous connecter.' });
    }

    // Compare the password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password); // Comparer le mot de passe brut avec le haché
    if (!isMatch) {
      console.log('Mot de passe incorrect');
      return res.status(400).json({ message: 'Adresse ou mot de passe incorrect' });
    }

    // If all is correct, return success response
    console.log('Connexion réussie');
    res.status(200).json({ message: 'Connexion réussie', user });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
});

module.exports = router;