const Newsletter = require('../models/newsletterModel'); // Modèle pour la liste d'abonnés

// Fonction pour ajouter un abonné à la newsletter
exports.subscribeToNewsletter = async (req, res) => {
  const { email } = req.body;

  // Vérifier si l'email est déjà abonné
  const existingSubscriber = await Newsletter.findOne({ email });
  if (existingSubscriber) {
    return res.status(400).json({ message: 'Cet email est déjà abonné.' });
  }

  try {
    // Ajouter le nouvel abonné à la base de données
    const newSubscriber = new Newsletter({ email });
    await newSubscriber.save();

    // Répondre avec succès
    res.status(200).json({ message: 'Abonnement réussi !' });
  } catch (error) {
    console.error('Erreur lors de l\'abonnement', error);
    res.status(500).json({ message: 'Une erreur est survenue. Veuillez réessayer plus tard.' });
  }
};
