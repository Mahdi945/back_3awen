const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
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
    // Check if the user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    // Hash the password before saving the user
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the default salt rounds

    // Create a new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword, // Save the hashed password
      city,
      isVerified: false // Set isVerified to false
    });

    // Save the user in the database
    await newUser.save();

    // Create a verification token
    const token = jwt.sign({ userId: newUser._id }, jwtSecret, { expiresIn: '10m' });

    // Send verification email
    const verificationUrl = `http://localhost:4200/email-verification?token=${token}`;

    const mailOptions = {
      from: 'mahdibeyy@gmail.com',
      to: email,
      subject: 'Vérifiez votre adresse email',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="text-align: center; color: #4CAF50;">Bienvenue chez 3awen !</h2>
            <p>Merci de vous être inscrit !</p>
            <p>Pour compléter votre inscription, veuillez vérifier votre adresse email en cliquant sur le lien ci-dessous :</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Vérifiez votre email</a>
            </div>
            <p>Cordialement,<br>L'équipe 3awen</p>
          </div>
        </div>
      `
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

    // Find the user by ID
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé ou lien expiré' });
    }

    // Check if the user is already verified
    if (user.isVerified) {
      return res.status(400).json({ message: 'Lien de vérification déjà utilisé.' });
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

// Login route
router.post('/login', async (req, res) => {
  const { email, pass } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.log('Utilisateur non trouvé');
      return res.status(404).json({ message: 'Adresse ou mot de passe incorrect' });
    }

    console.log('Utilisateur trouvé:', user);

   // Check if the user is verified
   if (!user.isVerified) {
    console.log('Utilisateur non vérifié');
    return res.status(403).json({ message: 'Veuillez vérifier votre email avant de vous connecter.' });
  }

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      console.log('Mot de passe incorrect. Mot de passe entré:', pass, 'Mot de passe hashé:', user.password);
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