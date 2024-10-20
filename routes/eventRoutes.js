const express = require('express');
const multer = require('multer');
const Event = require('../models/eventModel');
const router = express.Router();

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Route pour créer un événement
router.post('/create', upload.array('preuves'), async (req, res) => {
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
      preuves: req.files.map(file => file.path)
    };

    const newEvent = new Event(eventData);
    await newEvent.save();
    
    res.status(201).json({ message: 'Événement créé avec succès', event: newEvent });
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

module.exports = router;