const stripe = require('stripe')('sk_test_51QLZyZKtG1o9vy1V0th3vswNgJzOcGdhTrGfHbpTJHN6ZZVp8adYguzaFZyKSg8QAqykmw1FNC3NQVLdAxlxHhfo00G6unSeqw'); // Clé secrète Stripe
const Event = require('../models/eventModel'); // Modèle de l'événement

// Fonction pour créer la session de paiement
const createCheckoutSession = async (req, res) => {
  try {
    const { items, eventId, donationAmount } = req.body; // Inclut l'ID de l'événement et le montant du don

    // Validation des paramètres requis
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Invalid request: items are required and must be an array.' });
    }

    if (!eventId) {
      return res.status(400).json({ message: 'Invalid request: eventId is required.' });
    }

    if (!donationAmount || isNaN(donationAmount)) {
      return res.status(400).json({ message: 'Invalid request: donationAmount is required and must be a number.' });
    }

    // Création de la session de paiement Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
          },
          unit_amount: item.amount,
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `http://localhost:4200/donation-success?session_id={CHECKOUT_SESSION_ID}&event_id=${eventId}&donation_amount=${donationAmount}`, // Ajout du montant de la donation
      cancel_url: `http://localhost:4200/contact`,
      metadata: {
        eventId,
        donationAmount: donationAmount.toString(), // Transmet le montant de la donation
      },
    });

    // Réponse avec l'ID de la session
    res.status(200).json({ sessionId: session.id });

  } catch (error) {
    console.error('Erreur lors de la création de la session de paiement:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};

// Fonction pour mettre à jour l'événement (incrémenter le montant de la donation) avec PUT
const updateEventDonation = async (req, res) => {
  try {
    const { eventId, donationAmount } = req.body;

    // Vérifier si l'ID de l'événement et le montant sont présents
    if (!eventId || !donationAmount || isNaN(donationAmount)) {
      return res.status(400).json({ message: 'Invalid request: eventId and donationAmount are required.' });
    }

    // Recherche de l'événement
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Mise à jour de l'événement avec le montant de la donation
    event.raisedAmount += parseFloat(donationAmount); // Incrémente le montant de la donation

    // Sauvegarde de l'événement mis à jour
    const updatedEvent = await event.save();

    // Réponse de succès
    res.status(200).json(updatedEvent);

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'événement:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};

module.exports = {
  createCheckoutSession,
  updateEventDonation,
};
