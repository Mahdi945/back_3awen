const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  createEvent,
  approveEvent,
  deleteEvent,
  getAllApprovedServiceEvents,
  getAllApprovedFundraisingEvents,
  getAllServiceEvents,
  getAllDonationEvents,
  downloadProofs,
  deleteApprovedEvent,
  participateEvent,
  searchEvents,
  deleteExpiredEvents,
  
  updateServiceEvent,
  updateFundraisingEvent,
  getEventCountByMonth,
  getEventCountByType,
  getRaisedAmountByMonth,
} = require('../controllers/eventController');
const { updateEventDonation } = require('../controllers/stripeController');
const authMiddleware = require('../authMiddleware'); // Importer le middleware d'authentification
const router = express.Router();

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;
    if (file.fieldname === 'preuves') {
      uploadPath = path.join(__dirname, '..', 'uploads', req.body.nomOrganisateur);
    } else if (file.fieldname === 'eventImage') {
      uploadPath = path.join(__dirname, '..', 'uploads', 'events');
    }
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Route to create an event
router.post('/create', upload.fields([{ name: 'preuves', maxCount: 10 }, { name: 'eventImage', maxCount: 1 }]), createEvent);

// Route to get all approved events of type "service"
router.get('/approvedServices', getAllApprovedServiceEvents);

// Route to get all approved events of type "fundraising"
router.get('/approvedFundraising', getAllApprovedFundraisingEvents);

// Route to delete an approved event and send notification email
router.delete('/approved/:eventId', deleteApprovedEvent);

// Route to update a service event
router.put('/updateService/:eventId', updateServiceEvent);

// Route to update a fundraising event
router.put('/updateFundraising/:eventId', updateFundraisingEvent);

// Route pour obtenir tous les événements de type "service"
router.get('/service-events', getAllServiceEvents);

// Route pour obtenir tous les événements de type "fundraising"
router.get('/donation-events', getAllDonationEvents);

// Route to approve an event
router.put('/:eventId/approve', approveEvent);

// Route to delete an event and send rejection email
router.delete('/:eventId', deleteEvent);

// Route to download proofs as a ZIP file
router.get('/:eventId/downloadProofs', downloadProofs);

// Route to search events
router.get('/search', searchEvents);
// Route pour obtenir le nombre d'événements par mois
router.get('/countbymonth', getEventCountByMonth);

// Route pour obtenir le nombre d'événements par type
router.get('/countbytype', getEventCountByType);
router.get('/raisedamountbymonth', getRaisedAmountByMonth);

// Route to participate in an event
router.put('/:eventId/participate', participateEvent);
router.put('/updateRaisedAmount', updateEventDonation);
// Route pour obtenir le montant total levé par mois



// Route to delete expired events (for testing purposes)
router.delete('/expired', async (req, res) => {
  await deleteExpiredEvents();
  res.status(200).json({ message: 'Événements dépassés supprimés avec succès.' });
});

module.exports = router;