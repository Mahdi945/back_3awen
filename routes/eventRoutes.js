const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  createEvent,
  approveEvent,
  deleteEvent,
  getAllEvents,
  downloadProofs, // Import the new download function
} = require('../controllers/eventController');
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
router.post('/create', upload.array('preuves', 10), createEvent);

// Route to get all events
router.get('/', getAllEvents);

// Route to approve an event
router.put('/:eventId/approve', approveEvent);

// Route to delete an event
router.delete('/:eventId', deleteEvent);

// Route to download proofs as a ZIP file
router.get('/:eventId/downloadProofs', downloadProofs); // Updated route for downloading proofs as a ZIP file

module.exports = router;