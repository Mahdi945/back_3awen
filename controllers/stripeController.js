const stripe = require('stripe')('sk_test_51QLZyZKtG1o9vy1V0th3vswNgJzOcGdhTrGfHbpTJHN6ZZVp8adYguzaFZyKSg8QAqykmw1FNC3NQVLdAxlxHhfo00G6unSeqw'); // Remplacez par votre clé secrète Stripe

const createCheckoutSession = async (req, res) => {
  try {
    const { items, eventId, donationAmount } = req.body; // Inclut l'ID de l'événement et le montant du don

    // Vérification des paramètres requis
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Invalid request: items are required and must be an array.' });
    }

    if (!eventId) {
      return res.status(400).json({ message: 'Invalid request: eventId is required.' });
    }

    if (!donationAmount || isNaN(donationAmount)) {
      return res.status(400).json({ message: 'Invalid request: donationAmount is required and must be a number.' });
    }

    // Création de la session de paiement
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
      success_url: `http://localhost:4200/donation-success?session_id={CHECKOUT_SESSION_ID}&event_id=${eventId}`,
      cancel_url: `http://localhost:4200/contact`,
      metadata: {
        eventId, // ID de l'événement
        donationAmount: donationAmount.toString(), // Montant du don en tant que métadonnée (converti en chaîne de caractères)
      },
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Erreur lors de la création de la session de paiement:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};

module.exports = {
  createCheckoutSession,
};
