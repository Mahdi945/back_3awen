const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path'); // Pour la gestion des fichiers statiques (si nécessaire)

// Importer les routes
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes'); // Nouvelle route pour les événements
const adminRoutes = require('./routes/adminRoutes'); // Nouvelle route pour les administrateurs
const app = express();
const PORT = process.env.PORT || 3000; // Support des variables d'environnement pour le port

// Middleware
app.use(cors()); // Autoriser toutes les requêtes CORS
app.use(bodyParser.json()); // Parser les requêtes avec JSON
app.use(bodyParser.urlencoded({ extended: true })); // Parser les requêtes encodées en URL

// Pour servir des fichiers statiques (si nécessaire, par exemple pour des images téléchargées)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Utilisation des routes d'utilisateur avec le préfixe /api/users
app.use('/api/users', userRoutes);

// Utilisation des routes pour la gestion des événements
app.use('/api/events', eventRoutes);

app.use('/api/admin', adminRoutes);


// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/usersDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('MongoDB connecté avec succès');
  })
  .catch((err) => {
    console.error('Erreur de connexion à MongoDB :', err);
  });

// Gestion des erreurs pour les routes non trouvées
app.use((req, res, next) => {
  res.status(404).json({ message: 'Ressource non trouvée' });
});

// Gestion des erreurs serveur
app.use((err, req, res, next) => {
  console.error('Erreur serveur :', err);
  res.status(500).json({ message: 'Erreur interne du serveur' });
});

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
