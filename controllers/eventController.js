const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const nodemailer = require('nodemailer');
const Event = require('../models/eventModel');

// Configuration de nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'mahdibeyy@gmail.com',
    pass: 'arhmcywiuwkbklqq' // Assurez-vous d'utiliser un mot de passe d'application Gmail.
  }
});

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

    // Envoyer un email de confirmation de demande de création d'événement
    const mailOptions = {
      from: 'mahdibeyy@gmail.com',
      to: eventData.emailOrganisateur,
      subject: 'Confirmation de demande de création d\'événement',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="text-align: center; color: #4CAF50;">Demande de création d'événement reçue</h2>
            <p>Bonjour ${eventData.nomOrganisateur},</p>
            <p>Nous avons bien reçu votre demande de création d'événement intitulé <strong>${eventData.titre}</strong>.</p>
            <p>Nos administrateurs vont traiter votre demande et vous recevrez un email de confirmation d'approbation ou de refus dans les 48 heures.</p>
            <p>Merci de votre confiance.</p>
            <p>Cordialement,<br>L'équipe de gestion des événements</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

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

    // Envoyer un email de notification d'approbation
    const mailOptions = {
      from: 'mahdibeyy@gmail.com',
      to: event.emailOrganisateur,
      subject: 'Votre événement a été approuvé',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="text-align: center; color: #4CAF50;">Votre événement a été approuvé !</h2>
            <p>Bonjour ${event.nomOrganisateur},</p>
            <p>Nous sommes heureux de vous informer que votre événement intitulé <strong>${event.titre}</strong> a été approuvé.</p>
            <p>Merci de votre confiance.</p>
            <p>Cordialement,<br>L'équipe de gestion des événements</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Événement approuvé avec succès.' });
  } catch (error) {
    console.error('Erreur lors de l\'approbation de l\'événement:', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

// Fonction pour supprimer un événement et envoyer un email de refus
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé.' });
    }

    // Envoyer un email de notification de refus
    const mailOptions = {
      from: 'mahdibeyy@gmail.com',
      to: event.emailOrganisateur,
      subject: 'Votre événement a été refusé',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="text-align: center; color: #FF0000;">Votre événement a été refusé</h2>
            <p>Bonjour ${event.nomOrganisateur},</p>
            <p>Nous sommes désolés de vous informer que votre événement intitulé <strong>${event.titre}</strong> a été refusé.</p>
            <p>Vos preuves n'ont pas été jugées convaincantes.</p>
            <p>Merci de votre compréhension.</p>
            <p>Cordialement,<br>L'équipe de gestion des événements</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    await Event.findByIdAndDelete(req.params.eventId);

    res.status(200).json({ message: 'Événement refusé et supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur lors du refus de l\'événement:', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};
// Fonction pour obtenir tous les événements sans condition
const getAllEventsUnfiltered = async (req, res) => {
  try {
    // Récupérer tous les événements sans condition
    const events = await Event.find();
    res.status(200).json(events);
  } catch (error) {
    console.error('Erreur lors du chargement des événements:', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};
// Fonction pour obtenir tous les événements approuvés
const getAllEvents = async (req, res) => {
  try {
    // Récupérer uniquement les événements approuvés
    const events = await Event.find({ isApproved: true });
    res.status(200).json(events);
  } catch (error) {
    console.error('Erreur lors du chargement des événements:', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};


// Fonction pour rechercher des événements
const searchEvents = async (req, res) => {
  try {
    const { query } = req.query;
    const searchQuery = new RegExp(query, 'i'); // 'i' for case-insensitive

    const events = await Event.find({
      isApproved: true,
      $or: [
        { titre: searchQuery },
        { nomOrganisateur: searchQuery },
        { lieu: searchQuery }
      ]
    });

    res.status(200).json(events);
  } catch (error) {
    console.error('Erreur lors de la recherche des événements:', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

// Fonction pour participer à un événement
const participateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé.' });
    }

    event.volontaires -= 1;
    await event.save();

    res.status(200).json({ message: 'Participation enregistrée avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la participation à l\'événement:', error);
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
// Fonction pour supprimer les événements dépassés
const deleteExpiredEvents = async () => {
  try {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0];

    const expiredEvents = await Event.find({
      $or: [
        { date: { $lt: currentDate } },
        { date: currentDate, heure: { $lt: currentTime } }
      ]
    });

    for (const event of expiredEvents) {
      await Event.findByIdAndDelete(event._id);
      console.log(`Événement avec l'ID ${event._id} supprimé car il est dépassé.`);
    }
  } catch (error) {
    console.error('Erreur lors de la suppression des événements dépassés:', error);
  }
};

module.exports = {
  createEvent,
  approveEvent,
  deleteEvent,
  getAllEventsUnfiltered,
  getAllEvents,
  downloadProofs,
  participateEvent,
  searchEvents,
  deleteExpiredEvents
};