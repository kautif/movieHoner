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

function validPassword(password) {
  if (!password) {
    return false;
  }

  if (password.length < 8) {
    return false;
  }

  return password.match(/^[A-Za-z0-9]*$/) !== null;
}

function validUsername(email) {
  if (!email) {
    return false;
  }

  // Indicating that @ should have characters on both sides of it
  return RegExp(".+@.").test(email);
}

passport.use(
  "local-signup",
  new LocalStrategy(function(email, password, done) {
    console.log("email: ", email);
    console.log("password: ", password);
    console.log(validUsername(email));
    if (!validUsername(email)) {
      return done(null, false, { message: "That email is not valid." });
    }

    if (!validPassword(password)) {
      return done(null, false, {
        message:
          "That password is not valid. Must be at least 8 characters. Can contain only letters or numbers."
      });
    }
    // find a user whose email is the same as the forms email
    // we are checking to see if the user trying to login already exists
    User.findOne({ email: email }, function(err, user) {
      if (err) return done(err);

      // check to see if theres already a user with that email
      if (user) {
        return done(null, false, {
          message: "That email is already taken.",
          emailInUse: true
        });
      } else {
        bcrypt.hash(password, saltRounds, function(err, hash) {
          // Store hash in your password DB.
          // if there is no user with that email
          // create the user
          if (err) return done(err);

          var newUser = new User();

          // set the user's local credentials
          newUser.email = email;

          // password supposed to be hash, but if hash is longer than password length requirement
          // and has more than alphanumeric chars, password will be rejected.
          newUser.password = hash;

          // save the user
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
    // callback with email and password from our form

    // find a user whose email is the same as the forms email
    // we are checking to see if the user trying to login already exists
    User.findOne({ email: email }, function(err, user) {
      // if there are any errors, return the error before anything else
      if (err) return done(err);

      // if no user is found, return the message
      if (!user)
        return done(null, false, {
          message: "That username and password combination are invalid."
        }); // req.flash is the way to set flashdata using connect-flash
      bcrypt.compare(password, user.password, function(err, res) {
        if (err) return done(err);

        if (res) return done(null, user);

        return done(null, false, {
          message: "That username and password combination are invalid."
        }); // create the loginMessage and save it to session as flashdata
      });
    });
  })
);
