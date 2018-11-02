require("dotenv").config();
const bodyParser = require("body-parser");
let urlencodedParser = bodyParser.urlencoded({ extended: false });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");

const passportSetup = require("./login/passport-setup");
const session = require("cookie-session");
const passport = require("passport");
const User = require("./models/user");

const fetch = require("node-fetch");

mongoose.Promise = global.Promise;

const app = express();
app.options("*", cors({ origin: "http://localhost:3000", credentials: true }));
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

app.use(session({ secret: "mysecret", maxAge: 24 * 60 * 60 * 1000 }));

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);

// Rating filter
app.get("/search", async function(req, res) {
  const { genre, year, quality } = req.query;
  let maxRating;
  let minRating;
  if (quality == "good") {
    maxRating = 10;
    minRating = 8;
  } else if (quality == "ok") {
    maxRating = 8;
    minRating = 4;
  } else {
    maxRating = 4;
    minRating = 0;
  }

  // GET movies
  let apiKey = process.env.MOVIEDB_API_KEY;
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&year=${year}&with_genres=${genre}&vote_average.lte=${maxRating}&vote_average.gte=${minRating}`
    );
    if (response.ok) {
      const data = await response.json();
      res.send(
        data.results
          .map(movie => ({
            title: movie.title,
            genre: genre,
            year: parseInt(movie.release_date.slice(0, 4)),
            tmdbID: movie.id,
            image: movie.poster_path
              ? `https://image.tmdb.org/t/p/w200_and_h300_bestv2${
                  movie.poster_path
                }`
              : null,
            quality:
              movie.vote_average >= 8
                ? "good"
                : movie.vote_average >= 5
                  ? "ok"
                  : "bad"
          }))
          .filter(movie => movie.year == year)
      );
    } else if (data.results.length === 0) {
      console.log(data.results.length);
    } else {
      console.log(res.status());
      throw new Error();
    }
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

const { PORT, DATABASE_URL } = require("./config");

let server;

function runServer(dbUrl) {
  return new Promise((resolve, reject) => {
    mongoose.connect(
      dbUrl,
      err => {
        if (err) {
          return reject(err);
        }
        server = app
          .listen(PORT, () => {
            console.log(`Your app is listening on port ${PORT}`);
            resolve();
          })
          .on("error", err => {
            mongoose.disconnect();
            reject(err);
          });
      }
    );
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };
