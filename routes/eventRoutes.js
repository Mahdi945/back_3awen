// routes/eventRoutes.js

const express = require('express');
const multer = require('multer');
const {
  createEvent,
  approveEvent,
  deleteEvent,
  getAllEvents, // Make sure this is imported
  downloadFile,
} = require('../controllers/eventController');
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
router.post('/create', upload.array('preuves'), createEvent); // Utiliser la fonction de contrôleur
// routes/eventRoutes.js

// Approve event route
// Route pour obtenir tous les événements
router.get('/', getAllEvents);

// Route pour approuver un événement
router.put('/:eventId/approve', approveEvent);

// Route pour supprimer un événement
router.delete('/:eventId', deleteEvent);
// Route to download a file
router.get('/download/:filePath', downloadFile);
module.exports = router;
