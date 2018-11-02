const passport = require("passport");
const bcrypt = require("bcrypt");
const LocalStrategy = require("passport-local").Strategy;
const keys = require("./keys");
const User = require("../models/user");

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id).then(user => {
    done(null, user);
  });
});

const saltRounds = 10;

// Checking password length and characters

function validPassword(password) {
  if (!password) {
    return false;
  }

  if (password.length < 8) {
    return false;
  }

  return password.match(/^[A-Za-z0-9]*$/) !== null;
}

// Checking basic email format

function validUsername(email) {
  if (!email) {
    return false;
  }

  return RegExp(".+@.").test(email);
}

passport.use(
  "local-signup",
  new LocalStrategy(function(email, password, done) {
    if (!validUsername(email)) {
      return done(null, false, { message: "That email is not valid." });
    }

    if (!validPassword(password)) {
      return done(null, false, {
        message:
          "That password is not valid. Must be at least 8 characters. Can contain only letters or numbers."
      });
    }

    // Checking if user already exists

    User.findOne({ email: email }, function(err, user) {
      if (err) return done(err);

      if (user) {
        return done(null, false, {
          message: "That email is already taken.",
          emailInUse: true
        });
      } else {
        bcrypt.hash(password, saltRounds, function(err, hash) {
          if (err) return done(err);

          var newUser = new User();
          newUser.email = email;

          newUser.password = hash;
          console.log(newUser);
          newUser.save(function(err) {
            if (err) throw err;
            return done(null, newUser);
          });
        });
      }
    });
  })
);

passport.use(
  "local-login",
  new LocalStrategy(function(email, password, done) {
    User.findOne({ email: email }, function(err, user) {
      if (err) return done(err);
      if (!user)
        return done(null, false, {
          message: "That username and password combination are invalid."
        });
      bcrypt.compare(password, user.password, function(err, res) {
        if (err) return done(err);

        if (res) return done(null, user);

        return done(null, false, {
          message: "That username and password combination are invalid."
        });
      });
    });
  })
);
