const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const passport = require('passport');
const stripe = require('stripe')('sk_test_51QLZyZKtG1o9vy1V0th3vswNgJzOcGdhTrGfHbpTJHN6ZZVp8adYguzaFZyKSg8QAqykmw1FNC3NQVLdAxlxHhfo00G6unSeqw'); // Clé secrète Stripe
const cron = require('node-cron');

const connectDB = require('./config/db');
require('./passportConfig');

// Importer les routes et contrôleurs
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { updateEventGoal, deleteExpiredEvents } = require('./controllers/eventController'); // Import des fonctions

const { createCheckoutSession } = require('./controllers/stripeController');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialiser Passport
app.use(passport.initialize());

// Configurer les routes
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);
app.post('/api/checkoutSession', createCheckoutSession);

// Webhook Stripe
const endpointSecret = 'whsec_f6664e964c9971c0aac1aaf7cb0491921e7287133c4b2df81a4defcd3dc077e7'; // Clé secrète du webhook Stripe
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Erreur lors de la construction de l\'événement Stripe :', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const eventId = session.metadata.eventId;
    const donationAmount = session.amount_total / 100; // Convertir les cents en dollars

    if (eventId) {
      try {
        const updatedEvent = await updateEventGoal(eventId, donationAmount); // Appel au contrôleur
        console.log('L\'objectif de l\'événement a été mis à jour :', updatedEvent.goal);
      } catch (err) {
        console.error('Erreur lors de la mise à jour de l\'objectif :', err);
      }
    } else {
      console.warn('Aucun eventId trouvé dans les métadonnées Stripe');
    }
  }

  res.json({ received: true });
});

// Planifier la suppression des événements dépassés toutes les 24 heures
cron.schedule('0 0 * * *', async () => {
  console.log('Suppression des événements dépassés...');
  await deleteExpiredEvents();
});

// Gestion des erreurs et démarrage du serveur
app.use((req, res, next) => {
  res.status(404).json({ message: 'Ressource non trouvée' });
});

app.use((err, req, res, next) => {
  console.error('Erreur serveur :', err);
  res.status(500).json({ message: 'Erreur interne du serveur' });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
  });
});