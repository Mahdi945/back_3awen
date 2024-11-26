const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const passport = require('passport');

// Configuration de nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'mahdibeyy@gmail.com',
    pass: 'arhmcywiuwkbklqq' // Protégez bien cette information
  }
});

// Clé secrète pour JWT
const jwtSecret = process.env.JWT_SECRET || 'ayJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJtYWhkaSIsInJvbGUiOiJ1dGlsaXNhdGV1ciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

// Fonction pour gérer l'authentification avec Google
exports.googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

// Fonction pour gérer le callback de Google
exports.googleAuthCallback = (req, res) => {
  passport.authenticate('google', { failureRedirect: '/login' }, (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Error during Google authentication' });
    }
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Générer un token JWT
    const token = jwt.sign({ userId: user._id, email: user.email }, jwtSecret, { expiresIn: '1h' });

    // Rediriger vers le frontend avec le token
    res.redirect(`http://localhost:4200?token=${token}`);
  })(req, res);
};

// Fonction pour récupérer tous les utilisateurs
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error retrieving users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Fonction pour rechercher des utilisateurs par prénom, nom, ville ou email
exports.searchUsers = async (req, res) => {
  const { firstName, lastName, city, email } = req.query;

  try {
    const query = {};
    if (firstName) query.firstName = new RegExp(firstName, 'i');
    if (lastName) query.lastName = new RegExp(lastName, 'i');
    if (city) query.city = new RegExp(city, 'i');
    if (email) query.email = new RegExp(email, 'i');

    const users = await User.find(query);
    res.status(200).json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Fonction pour demander la réinitialisation du mot de passe
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '15m' });
    const resetUrl = `http://localhost:4200/new-pass?token=${token}`;

    const mailOptions = {
      from: 'mahdibeyy@gmail.com',
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="text-align: center; color: #4CAF50;">Password Reset Request</h2>
            <p>You have requested to reset your password.</p>
            <p>Click the link below to create a new password:</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
            </div>
            <p>If you did not make this request, you can ignore this email.</p>
            <p>Best regards,<br>The 3awen Team</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Password reset email sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Fonction pour réinitialiser le mot de passe
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Reset link has expired.' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: 'Invalid reset link.' });
    } else {
      console.error(error);
      return res.status(500).json({ message: 'Server error.' });
    }
  }
};

// Fonction pour l'inscription
exports.register = async (req, res) => {
  const { firstName, lastName, email, phone, password, city, isGoogleUser } = req.body;

  try {
    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    // Si l'utilisateur utilise Google pour s'inscrire, le marquer comme vérifié
    const isVerified = isGoogleUser ? true : false;

    // Hash le mot de passe si l'utilisateur ne s'est pas inscrit via Google
    let hashedPassword;
    if (!isGoogleUser) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Créer un nouvel utilisateur
    const newUser = new User({
      firstName,
      lastName,
      email,
      phone,
      password: isGoogleUser ? undefined : hashedPassword, // Pas de mot de passe si inscription via Google
      city,
      isVerified,
      isGoogleUser
    });

    await newUser.save();

    // Si l'utilisateur s'est inscrit via Google, rediriger vers la page de connexion
    if (isGoogleUser) {
      return res.status(201).json({ message: 'User registered via Google. Please log in to continue.' });
    }

    // Générer un token pour l'email de vérification
    const token = jwt.sign({ userId: newUser._id }, jwtSecret, { expiresIn: '10m' });
    const verificationUrl = `http://localhost:4200/email-verification?token=${token}`;

    // Configuration de l'email de vérification
    const mailOptions = {
      from: 'mahdibeyy@gmail.com',
      to: email,
      subject: 'Verify your email address',
      html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="text-align: center; color: #4CAF50;">Welcome to 3awen!</h2>
          <p>Thank you for registering!</p>
          <p>To complete your registration, please verify your email address by clicking the link below:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify your email</a>
          </div>
          <p>Best regards,<br>The 3awen Team</p>
        </div>
      </div>
    `
    };

    // Envoi de l'email de vérification
    await transporter.sendMail(mailOptions);

    // Réponse après l'envoi de l'email
    res.status(201).json({ message: 'User registered successfully. Please verify your email.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Fonction pour vérifier l'email
exports.verifyEmail = async (req, res) => {
  const token = req.query.token;

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found or link expired' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified.' });
    }

    user.isVerified = true;
    await user.save();
    res.status(200).json({ message: 'Email verified successfully!' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Invalid or expired verification link.' });
  }
};

// Fonction pour la connexion
exports.login = async (req, res) => {
  const { email, pass } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Incorrect email or password' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect email or password' });
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, jwtSecret, { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Fonction pour mettre à jour les informations utilisateur
exports.updateUser = async (req, res) => {
  const { userId } = req.params;
  const { firstName, lastName, phone, city } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Mettre à jour les informations utilisateur
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phone = phone || user.phone;
    user.city = city || user.city;

    await user.save();

    res.status(200).json({ message: 'User information updated successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Fonction pour envoyer un email de contact
exports.sendContactEmail = async (req, res) => {
  const { name, email, subject, message } = req.body;

  const mailOptions = {
    from: 'mahdibeyy@gmail.com',
    to: 'mahdibeyy@gmail.com', // Remplacez par l'adresse email de support
    subject: `Contact Form: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="text-align: center; color: #4CAF50;">New Contact Message</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
          <p>Best regards,<br>The 3awen Team</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending contact email:', error);
    res.status(500).json({ message: 'Error sending contact email' });
  }
};

// Fonction pour supprimer un utilisateur
exports.deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Envoyer un email de notification de suppression
    const mailOptions = {
      from: 'mahdibeyy@gmail.com',
      to: user.email,
      subject: 'Your account has been deleted',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #FFFFFF;">
            <h2 style="text-align: center; color: #FF4500;">Your account has been deleted</h2>
            <p>Hello ${user.firstName},</p>
            <p>We regret to inform you that your account on 3awen has been deleted due to inactivity.</p>
            <p>If you have any questions or concerns, please send an email to: <a href="mailto:mahdibeyy@gmail.com">mahdibeyy@gmail.com</a>.</p>
            <p>Best regards,<br>The 3awen Team</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'User deleted successfully and email sent.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Fonction pour obtenir le nombre d'utilisateurs par mois
exports.getUserCountByMonth = async (req, res) => {
  try {
    const users = await User.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json(users);
  } catch (error) {
    console.error('Error retrieving user count by month:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Fonction pour obtenir le nombre d'utilisateurs par ville
exports.getUserCountByCity = async (req, res) => {
  try {
    const users = await User.aggregate([
      {
        $group: {
          _id: "$city",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json(users);
  } catch (error) {
    console.error('Error retrieving user count by city:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

