const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db'); 
const cron = require('node-cron');
const passport = require('passport');
require('./passportConfig'); // Assurez-vous que le fichier de configuration de Passport est correctement importé

const { deleteExpiredEvents } = require('./controllers/eventController');

// Importer les routes
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour gérer les en-têtes de sécurité (COOP, CORS)
app.use(cors());

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialiser Passport
app.use(passport.initialize());

// Utilisation des routes
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);

// Gestion des erreurs pour les routes non trouvées
app.use((req, res, next) => {
  res.status(404).json({ message: 'Ressource non trouvée' });
});

// Gestion des erreurs serveur
app.use((err, req, res, next) => {
  console.error('Erreur serveur :', err);
  res.status(500).json({ message: 'Erreur interne du serveur' });
});

// Connexion à MongoDB et démarrer le serveur
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
  });
});