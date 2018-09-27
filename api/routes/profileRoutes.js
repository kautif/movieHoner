const router = require("express").Router();
const User = require("../models/user");
router.use(function(req, res, next) {
  if (!req.user) {
    return res.sendStatus(403);
  }
  next();
});

router.put("/movies", (req, res) => {
  let user = req.user;
  const { title, genre, year, quality, image, tmdbID } = req.body;

  if (user.movies.some(element => element.tmdbID == tmdbID)) {
    return res.sendStatus(400);
  }

  user.movies.push({ title, genre, year, quality, image, tmdbID });

  user.save((err, d) => {
    if (err) {
      console.log(err);
      return res.sendStatus(500);
    }

    const movie = d.movies.find(movie => movie.tmdbID == tmdbID);
    const { title, genre, year, quality, image, _id } = movie;
    res.send({ title, genre, year, quality, image, tmdbID, id: _id });
    console.log(movie);
  });
});

// GET user's movie list

router.get("/movies", function(req, res) {
  let user = req.user;

  User.findById(req.user._id, (err, user) => {
    if (err) {
      res.status(400).json(err);
    }
    res.json(user.movies);
  });
});

router.delete("/movies/:item", (req, res) => {
  User.findOneAndUpdate(
    { "movies._id": req.params.item },
    { $pull: { movies: { _id: req.params.item } } },
    function(err, user) {
      if (err) {
        res.sendStatus(500);
      }
      res.sendStatus(204);
    }
  );
});

module.exports = router;
