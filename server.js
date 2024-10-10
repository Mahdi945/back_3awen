const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

// Importer les routes
const userRoutes = require('./routes/userRoutes.js');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Utilisation des routes d'utilisateur avec le préfixe /api/users
app.use('/api/users', userRoutes);

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/usersDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connecté');
}).catch((err) => {
  console.error('Erreur de connexion à MongoDB', err);
});

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
