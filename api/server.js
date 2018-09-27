const bodyParser = require("body-parser");
let urlencodedParser = bodyParser.urlencoded({ extended: false });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");

const passportSetup = require("./login/passport-setup");
// const session = require('express-session');
const session = require("cookie-session");
const passport = require("passport");
const User = require("./models/user");

const fetch = require("node-fetch");

mongoose.Promise = global.Promise;

const app = express();

// app.use(cookieSession({
// 	maxAge: 24 * 60 * 60 * 1000,
// 	keys: ['keys.session.cookieKey']
// }));
app.options("*", cors({ origin: "http://localhost:3000", credentials: true }));
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

// Should generally be in an .env file before pushing
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

// Create endpoint for retrieving genres
// OR: Hard code genres that will be used inside client.
// Only client should show genre names.
// Not including genre property on results that get sent back

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
  let apiKey = "08eba60ea81f9e9cf342c7fa3df07bb6";
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

// 9/22/18
// Update api module to send image to server when adding a movie
// Update server to add image to document (i.e. movie that is being added)

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

// Need to setup routes
// Add routes for PUT movies
// Calling API for searching

// Add movie to list

if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };
