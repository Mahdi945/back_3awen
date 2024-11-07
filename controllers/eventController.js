const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
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
      preuves: req.files.map(file => path.join(req.body.nomOrganisateur, file.filename)),
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

// Fonction pour télécharger les preuves d'un événement sous forme de fichier ZIP
const downloadProofs = async (req, res) => {
  try {
    // Récupérer l'événement depuis MongoDB en utilisant l'ID passé en paramètre
    const event = await Event.findById(req.params.eventId);

    // Vérifier si l'événement existe et s'il a des fichiers dans le champ 'preuves'
    if (!event || !event.preuves || event.preuves.length === 0) {
      return res.status(404).json({ message: 'Aucun fichier trouvé pour cet événement.' });
    }

    // Créer un fichier ZIP à la volée
    const archive = archiver('zip', { zlib: { level: 9 } });

    // Définir le nom du fichier ZIP
    const zipFileName = `preuves_${event._id}.zip`;
    res.attachment(zipFileName);

    // Gestion des erreurs de l'archive
    archive.on('error', (err) => {
      console.error('Erreur lors de la création du fichier ZIP:', err);
      res.status(500).send({ message: 'Erreur lors de la création de l\'archive ZIP' });
    });

    // Envoyer l'archive au frontend
    archive.pipe(res);

    // Ajouter chaque fichier de preuve dans l'archive ZIP
    event.preuves.forEach((filePath) => {
      // Normaliser le chemin pour éviter des problèmes liés aux séparateurs de répertoire
      const normalizedPath = path.normalize(filePath);

      // Construire le chemin absolu du fichier dans le dossier 'uploads'
      const fullFilePath = path.join(__dirname, '..', 'uploads', normalizedPath);  

      // Vérifier que le fichier existe
      if (fs.existsSync(fullFilePath)) {
        const fileName = path.basename(fullFilePath);  // Extraire le nom du fichier
        console.log('Ajout du fichier:', fullFilePath); // Afficher le chemin du fichier
        archive.file(fullFilePath, { name: fileName });
      } else {
        console.error(`Le fichier ${normalizedPath} n'existe pas sur le serveur.`);
      }
    });

    // Finaliser l'archive
    await archive.finalize();
    console.log('Archive ZIP finalisée avec succès.');
  } catch (error) {
    console.error('Erreur lors du téléchargement des preuves:', error);
    res.status(500).json({ message: 'Erreur interne du serveur lors du téléchargement des preuves.' });
  }
};

module.exports = {
  createEvent,
  approveEvent,
  deleteEvent,
  getAllEvents,
  downloadProofs
};