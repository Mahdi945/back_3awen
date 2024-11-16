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
      return res.status(500).json({ message: 'Erreur lors de l\'authentification avec Google' });
    }
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }

    // Générer un token JWT
    const token = jwt.sign({ userId: user._id, email: user.email }, jwtSecret, { expiresIn: '1h' });

    // Rediriger vers le frontend avec le token
    res.redirect(`http://localhost:4200?token=${token}`);
  })(req, res);
};

// Fonction pour demander la réinitialisation du mot de passe
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

// Fonction pour réinitialiser le mot de passe
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

// Fonction pour l'inscription
exports.register = async (req, res) => {
  const { firstName, lastName, email, phone, password, city, isGoogleUser } = req.body;

  try {
    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ message: 'Email déjà utilisé' });
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
      return res.status(201).json({ message: 'Utilisateur inscrit via Google. Connectez-vous pour commencer.' });
    }

    // Générer un token pour l'email de vérification
    const token = jwt.sign({ userId: newUser._id }, jwtSecret, { expiresIn: '10m' });
    const verificationUrl = `http://localhost:4200/email-verification?token=${token}`;

    // Configuration de l'email de vérification
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

    // Envoi de l'email de vérification
    await transporter.sendMail(mailOptions);

    // Réponse après l'envoi de l'email
    res.status(201).json({ message: 'Utilisateur enregistré avec succès. Vérifiez votre email.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Fonction pour vérifier l'email
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

// Fonction pour la connexion
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

// Fonction pour mettre à jour les informations utilisateur
exports.updateUser = async (req, res) => {
  const { userId } = req.params;
  const { firstName, lastName, phone, city } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Mettre à jour les informations utilisateur
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phone = phone || user.phone;
    user.city = city || user.city;

    await user.save();

    res.status(200).json({ message: 'Informations utilisateur mises à jour avec succès', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur du serveur' });
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
          <h2 style="text-align: center; color: #4CAF50;">Nouveau message de contact</h2>
          <p><strong>Nom:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Sujet:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
          <p>Cordialement,<br>L'équipe 3awen</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email envoyé avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de contact:', error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email de contact' });
  }
};
// Fonction pour supprimer un utilisateur
exports.deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.status(200).json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

