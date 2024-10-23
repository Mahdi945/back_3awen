const express = require('express');
const { loginAdmin } = require('../controllers/adminController'); // Import the controller
const router = express.Router();

// Route for admin login
router.post('/login', loginAdmin);

module.exports = router;
