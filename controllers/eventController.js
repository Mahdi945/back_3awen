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

// Function to create an event
const createEvent = async (req, res) => {
  try {
    const preuvesFiles = req.files['preuves'] || [];
    const eventImageFile = req.files['eventImage'] ? req.files['eventImage'][0] : null;

    const eventData = {
      eventType: req.body.eventType,
      nomOrganisateur: req.body.nomOrganisateur,
      emailOrganisateur: req.body.emailOrganisateur,
      titre: req.body.titre,
      date: req.body.date,
      heure: req.body.heure,
      lieu: req.body.lieu,
      description: req.body.description,
      volontaires: req.body.volontaires,
      preuves: preuvesFiles.map(file => path.join(req.body.nomOrganisateur, file.filename)),
      eventImage: eventImageFile ? path.join('events', eventImageFile.filename) : null,
      isApproved: false,
      id_user_organisateur: req.body.id_user_organisateur,
      donateFor: req.body.donateFor,
      goal: req.body.goal,
      deadline: req.body.deadline
    };

    // Remove donateFor, goal, and deadline if the event type is not fundraising
    if (eventData.eventType !== 'fundraising') {
      delete eventData.donateFor;
      delete eventData.goal;
      delete eventData.deadline;
    }

    const newEvent = new Event(eventData);
    await newEvent.save();

    // Send a confirmation email for the event creation request
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


// Fonction pour obtenir tous les événements de type "service"
const getAllServiceEvents = async (req, res) => {
  try {
    // Récupérer tous les événements de type "service"
    const events = await Event.find({ eventType: 'service' });

    // Ajouter l'URL complète de l'image pour chaque événement
    const eventsWithImageURL = events.map(event => {
      if (event.eventImage) {
        event.eventImage = `${req.protocol}://${req.get('host')}/uploads/${event.eventImage.replace(/\\/g, '/')}`;
      }
      return event;
    });

    res.status(200).json(eventsWithImageURL);
  } catch (error) {
    console.error('Erreur lors du chargement des événements de service:', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

// Fonction pour obtenir tous les événements de type "fundraising"
const getAllDonationEvents = async (req, res) => {
  try {
    // Récupérer tous les événements de type "fundraising"
    const events = await Event.find({ eventType: 'fundraising' });

    // Ajouter l'URL complète de l'image pour chaque événement
    const eventsWithImageURL = events.map(event => {
      if (event.eventImage) {
        event.eventImage = `${req.protocol}://${req.get('host')}/uploads/${event.eventImage.replace(/\\/g, '/')}`;
      }
      return event;
    });

    res.status(200).json(eventsWithImageURL);
  } catch (error) {
    console.error('Erreur lors du chargement des événements de collecte de fonds:', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};



const getAllApprovedServiceEvents = async (req, res) => {
  try {
    const events = await Event.find({ isApproved: true, eventType: 'service' });

    // Ajouter l'URL complète de l'image pour chaque événement
    const eventsWithImageURL = events.map(event => {
      if (event.eventImage) {
        event.eventImage = `${req.protocol}://${req.get('host')}/uploads/${event.eventImage}`;
      }
      return event;
    });

    res.status(200).json(eventsWithImageURL);
  } catch (error) {
    console.error('Erreur lors du chargement des événements de service approuvés:', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

const getAllApprovedFundraisingEvents = async (req, res) => {
  try {
    const events = await Event.find({ isApproved: true, eventType: 'fundraising' });

    // Ajouter l'URL complète de l'image pour chaque événement
    const eventsWithImageURL = events.map(event => {
      if (event.eventImage) {
        event.eventImage = `${req.protocol}://${req.get('host')}/uploads/${event.eventImage}`;
      }
      return event;
    });

    res.status(200).json(eventsWithImageURL);
  } catch (error) {
    console.error('Erreur lors du chargement des événements de collecte de fonds approuvés:', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};


// Fonction pour rechercher des événements
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

    // Ajouter l'URL complète de l'image pour chaque événement
    const eventsWithImageURL = events.map(event => {
      if (event.eventImage) {
        event.eventImage = `${req.protocol}://${req.get('host')}/uploads/${event.eventImage.replace(/\\/g, '/')}`;
      }
      return event;
    });

    res.status(200).json(eventsWithImageURL);
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

    const userEmail = req.body.email;
    if (!userEmail) {
      return res.status(400).json({ message: 'Email de l\'utilisateur requis.' });
    }

    // Vérifier si l'utilisateur a déjà participé
    if (event.participants.includes(userEmail)) {
      return res.status(400).json({ message: 'Vous avez déjà participé à cet événement.' });
    }

    // Ajouter l'email de l'utilisateur aux participants
    event.participants.push(userEmail);
    event.volontaires -= 1;
    await event.save();

    // Envoyer un email de remerciement pour la participation
    const mailOptions = {
      from: 'mahdibeyy@gmail.com',
      to: userEmail, // Utiliser l'email de l'utilisateur passé en paramètre
      subject: 'Merci pour votre participation',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="text-align: center; color: #4CAF50;">Merci pour votre participation !</h2>
            <p>Bonjour,</p>
            <p>Merci d'avoir participé à notre événement intitulé <strong>${event.titre}</strong>.</p>
            <p>L'événement aura lieu le <strong>${event.date}</strong> à <strong>${event.heure}</strong> au <strong>${event.lieu}</strong>.</p>
            <p>Nous apprécions votre engagement et votre soutien.</p>
            <p>Cordialement,<br>L'équipe de gestion des événements</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Participation enregistrée avec succès et email envoyé.' });
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

// Fonction pour supprimer un événement approuvé et envoyer un email de notification
const deleteApprovedEvent = async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.eventId, isApproved: true });
    if (!event) {
      return res.status(404).json({ message: 'Événement approuvé non trouvé.' });
    }

    await Event.findByIdAndDelete(req.params.eventId);

    // Envoyer un email de notification de suppression
    const mailOptions = {
      from: 'mahdibeyy@gmail.com',
      to: event.emailOrganisateur,
      subject: 'Votre événement a été supprimé',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #FFA500;">
            <h2 style="text-align: center; color: #FF4500;">Votre événement a été supprimé</h2>
            <p>Bonjour ${event.nomOrganisateur},</p>
            <p>Nous vous informons que votre événement intitulé <strong>${event.titre}</strong> a été supprimé.</p>
            <p>Pour plus de détails, veuillez nous contacter à l'adresse suivante : <a href="mailto:beyymahdi@gmail.com">beyymahdi@gmail.com</a>.</p>
            <p>Cordialement,<br>L'équipe de gestion des événements</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Événement approuvé supprimé avec succès et email envoyé.' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'événement approuvé :', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
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
// Mettre à jour l'objectif de fundraising après un paiement réussi
const updateEventGoal = async (eventId, donationAmount) => {
  try {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error('Événement non trouvé');
    }

    event.goal = (event.goal || 0) - donationAmount;
    if (event.goal < 0) event.goal = 0;

    await event.save();
    return event;
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'objectif :", error);
    throw error;
  }
};
// Fonction pour mettre à jour un événement de type "service"
const updateServiceEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { titre, date, heure, lieu, description, volontaires } = req.body;

    const event = await Event.findById(eventId);
    if (!event || event.eventType !== 'service') {
      return res.status(404).json({ message: 'Événement de type service non trouvé.' });
    }

    event.titre = titre || event.titre;
    event.date = date || event.date;
    event.heure = heure || event.heure;
    event.lieu = lieu || event.lieu;
    event.description = description || event.description;
    event.volontaires = volontaires || event.volontaires;

    await event.save();
    res.status(200).json({ message: 'Événement de type service mis à jour avec succès', event });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'événement de type service :', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

// Fonction pour mettre à jour un événement de type "fundraising"
const updateFundraisingEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { titre, date, heure, lieu, description, donateFor, goal, deadline } = req.body;

    const event = await Event.findById(eventId);
    if (!event || event.eventType !== 'fundraising') {
      return res.status(404).json({ message: 'Événement de type fundraising non trouvé.' });
    }

    event.titre = titre || event.titre;
    event.date = date || event.date;
    event.heure = heure || event.heure;
    event.lieu = lieu || event.lieu;
    event.description = description || event.description;
    event.donateFor = donateFor || event.donateFor;
    event.goal = goal || event.goal;
    event.deadline = deadline || event.deadline;

    await event.save();
    res.status(200).json({ message: 'Événement de type fundraising mis à jour avec succès', event });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'événement de type fundraising :', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};



module.exports = {
  createEvent,
  approveEvent,
  deleteEvent,
    getAllServiceEvents,
  getAllDonationEvents,
  downloadProofs,
  participateEvent,
  deleteApprovedEvent,
  searchEvents,
  deleteExpiredEvents,
  getAllApprovedServiceEvents,
  getAllApprovedFundraisingEvents,
  updateEventGoal,
  updateServiceEvent,
  updateFundraisingEvent

};