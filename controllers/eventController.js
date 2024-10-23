// controllers/eventController.js

const Event = require('../models/eventModel');

// Fonction pour créer un événement
const createEvent = async (req, res) => {
  try {
    const eventData = {
      nomOrganisateur: req.body.nomOrganisateur,
      emailOrganisateur: req.body.emailOrganisateur,
      titre: req.body.titre,
      date: req.body.date,
      heure: req.body.heure,
      lieu: req.body.lieu,
      description: req.body.description,
      volontaires: req.body.volontaires,
      preuves: req.files.map(file => file.path),
      isApproved: false // Initialiser isApproved à false
    };

    const newEvent = new Event(eventData);
    await newEvent.save();
    
    res.status(201).json({ message: 'Événement créé avec succès', event: newEvent });
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};

// Fonction pour approuver un événement
const approveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé.' });
    }

    event.isApproved = true;
    await event.save();

    res.status(200).json({ message: 'Événement approuvé avec succès.' });
  } catch (error) {
    console.error('Erreur lors de l\'approbation de l\'événement:', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

// Fonction pour supprimer un événement
const deleteEvent = async (req, res) => {
  try {
    const result = await Event.findByIdAndDelete(req.params.eventId);
    if (!result) {
      return res.status(404).json({ message: 'Événement non trouvé.' });
    }
    res.status(200).json({ message: 'Événement supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'événement:', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

// Fonction pour obtenir tous les événements
const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
  } catch (error) {
    console.error('Erreur lors du chargement des événements:', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};
const downloadFile = (req, res) => {
    const filePath = path.join(__dirname, '../', req.params.filePath);
    res.download(filePath, (err) => {
      if (err) {
        console.error('Erreur lors du téléchargement du fichier:', err);
        res.status(500).json({ message: 'Erreur lors du téléchargement du fichier' });
      }
    });
  };

module.exports = {
  createEvent,
  approveEvent,
  deleteEvent,
  getAllEvents,
  downloadFile,
};
