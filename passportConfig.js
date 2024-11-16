const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/userModel'); // Importer votre modèle User
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || 'ayJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJtYWhkaSIsInJvbGUiOiJ1dGlsaXNhdGV1ciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

// Configurer Passport pour la stratégie Google
passport.use(new GoogleStrategy({
    //clientID: '227936580507-vmrfhtno62vkofudvqsmit1916u1ng4n.apps.googleusercontent.com',
    //clientSecret: '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',
    callbackURL: 'http://localhost:3000/api/users/google/callback' // URL du callback
  },
  async (token, tokenSecret, profile, done) => {
    try {
      const existingUser = await User.findOne({ email: profile.emails[0].value });

      if (existingUser) {
        return done(null, existingUser);
      }

      const newUser = new User({
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        email: profile.emails[0].value,
        googleId: profile.id,
        isVerified: true, // Si vous souhaitez valider automatiquement les utilisateurs Google
        isGoogleUser: true
      });

      await newUser.save();
      return done(null, newUser);

    } catch (error) {
      done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});