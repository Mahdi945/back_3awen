const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const passport = require('passport');
const stripe = require('stripe')('sk_test_51QLZyZKtG1o9vy1V0th3vswNgJzOcGdhTrGfHbpTJHN6ZZVp8adYguzaFZyKSg8QAqykmw1FNC3NQVLdAxlxHhfo00G6unSeqw'); // Clé secrète Stripe
const cron = require('node-cron');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
require('./passportConfig');

// Importer les modèles et contrôleurs
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { deleteExpiredEvents } = require('./controllers/eventController'); // Import des fonctions
const { createCheckoutSession } = require('./controllers/stripeController');
const Event = require('./models/eventModel'); // Modèle Event

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware pour Stripe Webhook (requiert express.raw)
app.use('/webhooks/stripe', express.raw({ type: 'application/json' })); // Webhook Stripe nécessite express.raw

// Initialiser Passport
app.use(passport.initialize());

// Configurer les routes
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);
app.post('/api/checkoutSession', createCheckoutSession);

// Webhook Stripe
const endpointSecret = 'whsec_f6664e964c9971c0aac1aaf7cb0491921e7287133c4b2df81a4defcd3dc077e7'; // Clé secrète du webhook Stripe
app.post('/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Vérification de la signature et traitement de l'événement
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Erreur lors de la construction de l\'événement Stripe :', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gestion des événements Stripe
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const eventId = session.metadata?.eventId; // Récupération de l'ID de l'événement depuis les métadonnées
    const donationAmount = parseFloat(session.metadata?.donationAmount); // Récupération du montant du don depuis les métadonnées
console.log('Mise à jour de l\'événement avec ID:', eventId);
  console.log('Montant à incrémenter:', donationAmount);

  // Mettez à jour l'événement
  const updatedEvent = await Event.findByIdAndUpdate(
    eventId,
    { $inc: { raisedAmount: donationAmount } },
    { new: true }
  );

  if (updatedEvent) {
    console.log('Événement mis à jour:', updatedEvent);
  } else {
    console.error('Événement non trouvé pour ID:', eventId);
  }
}

  // Réponse de succès à Stripe
  res.status(200).json({ received: true });
});

// Planifier la suppression des événements dépassés toutes les 24 heures
cron.schedule('0 0 * * *', async () => {
  console.log('Suppression des événements dépassés...');
  try {
    await deleteExpiredEvents();
    console.log('Événements dépassés supprimés avec succès.');
  } catch (err) {
    console.error('Erreur lors de la suppression des événements dépassés :', err.message);
  }
});

// Gestion des erreurs et démarrage du serveur
app.use((req, res, next) => {
  res.status(404).json({ message: 'Ressource non trouvée' });
});

app.use((err, req, res, next) => {
  console.error('Erreur serveur :', err.message);
  res.status(500).json({ message: 'Erreur interne du serveur' });
});

// Connexion à la base de données et démarrage du serveur
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
  });
});
