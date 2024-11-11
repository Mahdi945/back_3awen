// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db'); // Connexion à MongoDB
const cron = require('node-cron');

const { deleteExpiredEvents } = require('./controllers/eventController');

// Importer les routes
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
connectDB().then(async () => {
  // Supprimer les événements expirés au démarrage du serveur
  console.log('Suppression des événements expirés au démarrage du serveur');
  await deleteExpiredEvents();

  // Planifier la suppression des événements expirés toutes les heures
  cron.schedule('0 * * * *', async () => {
    console.log('Exécution du cron job pour supprimer les événements dépassés');
    await deleteExpiredEvents();
  });

  app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
  });
});