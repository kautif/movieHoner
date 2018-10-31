const router = require("express").Router();
const passport = require("passport");
const User = require("../models/user");

// In this file, passport.authenticate is not being used as middleware...
// (i.e. after the declared route)
// when passport.authenticate is used as middleware, req.login will be called automatically
// Otherwise, it must be called manually like in this case.

function serializeUser(user) {
  const id = user._id;
  const email = user.email;
  const movies = user.movies.map(movie => ({
    id: movie._id,
    title: movie.title,
    genre: movie.genre,
    quality: movie.quality,
    image: movie.image,
    tmdbID: movie.tmdbID
  }));
  return { id, email, movies };
}

router.post("/signup", function(req, res, next) {
  passport.authenticate("local-signup", function(err, user, info) {
    console.log(info);
    if (err) {
      console.log(err);
      return res.sendStatus(500);
    }

    // 10/5/18: Attempt at sending error code for taken email address
    if (user) {
      return req.login(user, function() {
        res.send(serializeUser(user));
      });
    }

    const { message, emailInUse } = info;
    if (emailInUse) {
      res.status(409);
    } else {
      res.status(400);
    }
    res.send({ message });
  })(req, res, next);
});

router.post("/login", function(req, res, next) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send({ message: "Missing credentials" });
  }

  if (typeof username !== "string") {
    return res.status(400).send({ message: "That email is not valid." });
  }

  if (typeof password !== "string") {
    return res.status(400).send({ message: "That password is not valid." });
  }

  passport.authenticate("local-login", function(err, user, info) {
    console.log(info);
    if (err) {
      console.log(err);
      return res.sendStatus(500);
    }
    if (user) {
      return req.login(user, function() {
        res.send(serializeUser(user));
      });
    }
    res.status(401).send(info);
  })(req, res, next);
});

router.get("/user", function(req, res) {
  console.log('get/user');
  if (req.user) {
    const user = req.user;
    return res.send(serializeUser(user));
  }

  res.status(401).send({ message: "You are not logged in." });
});

router.get("/logout", function(req, res) {
  req.logout();
  res.sendStatus(200);
});

module.exports = router;

// Add add'l route
// GET /user
// If authenticated, send user
// If not authenticated, send 401
