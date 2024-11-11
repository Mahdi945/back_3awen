const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

// Configuration de nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'mahdibeyy@gmail.com',
    pass: 'arhmcywiuwkbklqq' // Protégez bien cette information
  }
});

// Clé secrète pour JWT
const jwtSecret = 'ayJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJtYWhkaSIsInJvbGUiOiJ1dGlsaXNhdGV1ciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '15m' });
    const resetUrl = `http://localhost:4200/new-pass?token=${token}`;

    const mailOptions = {
      from: 'mahdibeyy@gmail.com',
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="text-align: center; color: #4CAF50;">Réinitialisation de mot de passe</h2>
            <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
            <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Réinitialiser le mot de passe</a>
            </div>
            <p>Si vous n'avez pas fait cette demande, vous pouvez ignorer cet email.</p>
            <p>Cordialement,<br>L'équipe 3awen</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email de réinitialisation envoyé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (!newPassword) {
      return res.status(400).json({ message: 'Le nouveau mot de passe est requis.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Le lien de réinitialisation a expiré.' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: 'Lien de réinitialisation invalide.' });
    } else {
      console.error(error);
      return res.status(500).json({ message: 'Erreur du serveur.' });
    }
  }
};

exports.register = async (req, res) => {
  const { firstName, lastName, email, phone, password, city } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      city,
      isVerified: false
    });

    await newUser.save();

    const token = jwt.sign({ userId: newUser._id }, jwtSecret, { expiresIn: '10m' });
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
};

exports.verifyEmail = async (req, res) => {
  const token = req.query.token;

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé ou lien expiré' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email déjà vérifié.' });
    }

    user.isVerified = true;
    await user.save();
    res.status(200).json({ message: 'Email vérifié avec succès !' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Lien de vérification invalide ou expiré.' });
  }
};


exports.login = async (req, res) => {
  const { email, pass } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Adresse ou mot de passe incorrect' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Veuillez vérifier votre email avant de vous connecter.' });
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Adresse ou mot de passe incorrect' });
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, jwtSecret, { expiresIn: '1h' });

    res.status(200).json({ message: 'Connexion réussie', token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};