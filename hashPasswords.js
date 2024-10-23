const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('./models/adminModel'); // Adjust the path as necessary

// MongoDB connection URI
const mongoUri = 'mongodb://localhost:27017/usersDB'; // Replace with your database URI

// Function to hash passwords
const hashAdminPasswords = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    // Fetch all admin users
    const admins = await Admin.find({});
    console.log(`Found ${admins.length} admin(s) to update.`);

    // Loop through each admin user and hash the password
    for (const admin of admins) {
      // Hash the password
      const hashedPassword = await bcrypt.hash(admin.password, 10); // 10 salt rounds

      // Update the admin user's password
      admin.password = hashedPassword;

      // Save the updated admin user back to the database
      await admin.save();
      console.log(`Updated password for adminId: ${admin.adminId}`);
    }

    console.log('All passwords updated successfully!');
  } catch (error) {
    console.error('Error updating passwords:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

// Run the function to hash passwords
hashAdminPasswords();
