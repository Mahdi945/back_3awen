const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  createEvent,
  approveEvent,
  deleteEvent,
  getAllEvents,
  getAllEventsUnfiltered,
  downloadProofs,
  participateEvent,
  searchEvents,
  deleteExpiredEvents
} = require('../controllers/eventController');
const authMiddleware = require('../authMiddleware'); // Importer le middleware d'authentification
const router = express.Router();

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads', req.body.nomOrganisateur);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Route to create an event
router.post('/create', authMiddleware, upload.array('preuves', 10), createEvent);

// Route to get all approved events
router.get('/', getAllEvents);

// Route to get all events without condition
router.get('/all', getAllEventsUnfiltered);

// Route to approve an event
router.put('/:eventId/approve', authMiddleware, approveEvent);

// Route to delete an event and send rejection email
router.delete('/:eventId', authMiddleware, deleteEvent);

// Route to download proofs as a ZIP file
router.get('/:eventId/downloadProofs', authMiddleware, downloadProofs);

// Route to search events
router.get('/search', searchEvents);

// Route to participate in an event
router.post('/:eventId/participate', authMiddleware, participateEvent);

// Route to delete expired events (for testing purposes)
router.delete('/expired', async (req, res) => {
  await deleteExpiredEvents();
  res.status(200).json({ message: 'Événements dépassés supprimés avec succès.' });
});

module.exports = router;