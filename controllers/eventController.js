const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const nodemailer = require('nodemailer');
const Newsletter = require('../models/newsletterModel'); // Importer le modèle de newsletter
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
          <h2 style="text-align: center; color: #4CAF50;">Event Creation Request Received</h2>
          <p>Hello ${eventData.nomOrganisateur},</p>
          <p>We have received your request to create an event titled <strong>${eventData.titre}</strong>.</p>
          <p>Our administrators will process your request and you will receive an approval or rejection confirmation email within 48 hours.</p>
          <p>Thank you for your trust.</p>
          <p>Best regards,<br>The Event Management Team</p>
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
// Fonction pour approuver un événement et envoyer des emails de notification
const approveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé.' });
    }

    event.isApproved = true;
    await event.save();

    // Envoyer un email de notification à l'organisateur
    const mailOptionsOrganizer = {
      from: 'mahdibeyy@gmail.com',
      to: event.emailOrganisateur,
      subject: 'Your event has been approved',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #FFFFFF;">
            <h2 style="text-align: center; color: #4CAF50;">Your event has been approved</h2>
            <p>Hello ${event.nomOrganisateur},</p>
            <p>We are pleased to inform you that your event titled <strong>${event.titre}</strong> has been approved.</p>
            <p>Best regards,<br>The Event Management Team</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptionsOrganizer);

    // Récupérer tous les abonnés à la newsletter
    const subscribers = await Newsletter.find();

    // Envoyer un email de notification à tous les abonnés
    const mailOptionsSubscribers = {
      from: 'mahdibeyy@gmail.com',
      to: subscribers.map(subscriber => subscriber.email),
      subject: 'New event is available',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #FFFFFF;">
            <h2 style="text-align: center; color: #4CAF50;">New event is available</h2>
            <p>Hello,</p>
            <p>We are pleased to inform you that a new event titled <strong>${event.titre}</strong> has been approved.</p>
            <p>Visit our site for more details.</p>
            <p>Best regards,<br>The Event Management Team</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptionsSubscribers);

    res.status(200).json({ message: 'Événement approuvé avec succès et emails envoyés.' });
  } catch (error) {
    console.error('Erreur lors de l\'approbation de l\'événement :', error);
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
      subject: 'Your event has been rejected',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #FFFFFF;">
            <h2 style="text-align: center; color: #FF0000;">Your event has been rejected</h2>
            <p>Hello ${event.nomOrganisateur},</p>
            <p>We regret to inform you that your event titled <strong>${event.titre}</strong> has been rejected.</p>
            <p>Your proofs were not deemed convincing.</p>
            <p>Thank you for your understanding.</p>
            <p>Best regards,<br>The Event Management Team</p>
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
      subject: 'Thank you for your participation',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="text-align: center; color: #4CAF50;">Thank you for your participation!</h2>
            <p>Hello,</p>
            <p>Thank you for participating in our event titled <strong>${event.titre}</strong>.</p>
            <p>The event will take place on <strong>${event.date}</strong> at <strong>${event.heure}</strong> at <strong>${event.lieu}</strong>.</p>
            <p>We appreciate your commitment and support.</p>
            <p>Best regards,<br>The Event Management Team</p>
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
      subject: 'Your event has been deleted',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #FFFFFF;">
            <h2 style="text-align: center; color: #FF4500;">Your event has been deleted</h2>
            <p>Hello ${event.nomOrganisateur},</p>
            <p>We regret to inform you that your event titled <strong>${event.titre}</strong> has been deleted.</p>
            <p>For more details, please contact us at: <a href="mailto:beyymahdi@gmail.com">beyymahdi@gmail.com</a>.</p>
            <p>Best regards,<br>The Event Management Team</p>
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

// Fonction pour mettre à jour le montant levé de l'événement
const updateEventRaisedAmount = async (req, res) => {
  const { eventId, donationAmount } = req.body;

  if (!eventId || !donationAmount) {
    return res.status(400).json({ message: 'Event ID et montant de la donation sont requis.' });
  }

  try {
    // Mise à jour du montant levé dans l'événement
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { $inc: { raisedAmount: donationAmount } }, // Incrémenter le montant levé
      { new: true }
    );

    if (updatedEvent) {
      res.status(200).json({ message: 'Montant levé mis à jour avec succès.', event: updatedEvent });
    } else {
      res.status(404).json({ message: 'Événement non trouvé.' });
    }
  } catch (err) {
    console.error('Erreur lors de la mise à jour de l\'événement :', err.message);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour.' });
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




// Fonction pour obtenir le nombre d'événements par mois
const getEventCountByMonth = async (req, res) => {
  try {
    const events = await Event.aggregate([
      {
        $addFields: {
          createdAt: { $toDate: "$createdAt" }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json(events);
  } catch (error) {
    console.error('Error retrieving event count by month:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Fonction pour obtenir le montant total levé par mois
const getRaisedAmountByMonth = async (req, res) => {
  try {
    const raisedAmounts = await Event.aggregate([
      {
        $addFields: {
          createdAt: { $toDate: "$createdAt" }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalRaised: { $sum: "$raisedAmount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json(raisedAmounts);
  } catch (error) {
    console.error('Error retrieving raised amount by month:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Fonction pour obtenir le nombre d'événements par type
const getEventCountByType = async (req, res) => {
  try {
    const events = await Event.aggregate([
      {
        $group: {
          _id: "$eventType",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json(events);
  } catch (error) {
    console.error('Error retrieving event count by type:', error);
    res.status(500).json({ message: 'Internal server error' });
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
  updateEventRaisedAmount,
  updateServiceEvent,
  updateFundraisingEvent,
  getEventCountByMonth,
  getEventCountByType,
  getRaisedAmountByMonth,

};