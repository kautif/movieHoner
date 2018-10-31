const chai = require("chai");
const chaiHttp = require("chai-http");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const expect = chai.expect;
chai.use(chaiHttp);

const cors = require("cors");
const { app, runServer, closeServer } = require("../server");
const User = require("../models/user");
const { CLIENT_ORIGIN, PORT, TEST_DATABASE_URL } = require("../config");

app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
);
console.log("test db url: ", TEST_DATABASE_URL);
describe("Movie Repository", function() {
  const email = "example@gmail.com";
  const password = "examplePass";
  let uid;

  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  after(function() {
    return closeServer();
  });

  beforeEach(function() {
    return bcrypt.hash(password, 10).then(password =>
      User.create({
        email,
        password
      }).then(user => (uid = user.id))
    );
  });

  afterEach(function() {
    return User.deleteOne({ email: "example@gmail.com" });
  });

  let movieX = {
    title: "Return of the Movie",
    rating: 90,
    release: "2018-09-17",
    position: 1
  };

  let movieY = {
    title: "The Last Movie",
    rating: 65,
    release: "2018-12-21",
    position: 2
  };

  describe("API", function() {
    it("should 200 on GET requests", function() {
      return chai
        .request(app)
        .get("/search")
        .then(function(res) {
          expect(res).to.have.status(200);
          // res.should.be.json;
        });
    });
  });

  describe("GET profile/movies", function() {
    it("Should retrieve empty movie array for user", function() {
      var agent = chai.request.agent(app);
      return agent
        .post("/auth/login")
        .send({ email, password })
        .then(function(res) {
          return agent.get("/profile/movies").then(function(res) {
            expect(res).to.have.status(200);
          });
        });
    });
  });

  describe("PUT /profile/movies", function() {
    it("Should update movies array to add one movie", function() {
      var agent = chai.request.agent(app);
      return agent
        .post("/auth/login")
        .send({ email, password })
        .then((err, res) => {
          return User.findOne({}).then(updatedUser => {
            updatedUser.movies.push(movieX);
            updatedUser.save((err, result) => {});
            expect(updatedUser.movies.length).to.equal(1);
          });
        });
      return agent.get("/profile/movies").then(function(res) {
        expect(res).to.have.status(200);
      });
    });
  });

  it("Should GET user movies list", function() {
    var agent = chai.request.agent(app);
    return agent
      .post("/auth/login")
      .send({ email, password })
      .then((err, res) => {
        return User.findOne({}).then(updatedUser => {
          updatedUser.movies.push(movieX);
          updatedUser.save((err, result) => {});
        });
      });
    return agent.get("/profile/movies").then((err, res) => {
      return User.findOne({}).then(updatedUser => {
        expect(updatedUser.movies.length).to.equal(1);
      });
    });
  });

  it("Add one more movie, and GET list again", function() {
    var agent = chai.request.agent(app);
    return agent
      .post("/auth/login")
      .send({ email, password })
      .then((err, res) => {
        return User.findOne({}).then(data => {
          console.log("line 154: ", data);
          data.movies.push(movieX);
          data.save((err, result) => {});
          expect(data.movies.length).to.equal(1);
        });
      });
    return agent.get("/profile/mylist").then((err, res) => {
      return User.findOne({}).then((err, res) => {
        return User.findOne({}).then(updatedUser => {
          User.findOne({}).then(data => {
            data.movies.push(movieY);
            data.save((err, result) => {});
            expect(data.movies.length).to.equal(2);
          });
        });
      });
    });
  });

  describe("DELETE /profile/movies/:item", function() {
    it("Should delete a movie from user movie array", function() {
      let movieID;

      let user, movieId;

      var agent = chai.request.agent(app);
      return agent
        .post("/auth/login")
        .send({ email, password })
        .then((err, res) => {
          return User.findOne({}).then(data => {
            data.movies.push(movieX);
            data.save((err, result) => {});
            expect(data.movies.length).to.equal(1);
          });
        });
      User.findOne({}).then(user => {
        console.log("Line: 245: ", user);
        movieId = user.movies[0]._id;
        return agent.delete(`/profile/movies/${movieId}`).then(function(res) {
          expect(data.movies.length).to.equal(0);
          expect(res).to.have.status(200);
        });
      });
    });
  });

  describe("POST /signup", function() {
    it("Should reject invalid email addresses", function() {
      var agent = chai.request.agent(app);
      const username = "user.";
      return agent
        .post("/auth/signup")
        .send({ username, password })
        .then(res => {
          expect(JSON.parse(res.text)).to.deep.equal({
            message: "That email is not valid."
          });
          expect(res).to.have.status(400);
        });
    });

    it("Should reject empty email addresses", function() {
      var agent = chai.request.agent(app);
      const username = " ";
      return agent
        .post("/auth/signup")
        .send({ username, password })
        .then(res => {
          expect(JSON.parse(res.text)).to.deep.equal({
            message: "That email is not valid."
          });
          expect(res).to.have.status(400);
        });
    });

    it("Should reject signups of already existing email addresses", function() {
      var agent = chai.request.agent(app);
      const username = "example@gmail.com";
      return agent
        .post("/auth/signup")
        .send({ username, password })
        .then(res => {
          expect(JSON.parse(res.text)).to.deep.equal({
            message: "That email is already taken."
          });
          // 10/5/18: Status message failing
          expect(res).to.have.status(409);
        });
    });

    // 10/3/18
    // More Tests
    // Sign up
    // -- with empty username [X]
    // -- Email already in use [X]
    // -- -- Status of 409. (conflict error message)

    it("Should reject short passwords", function() {
      var agent = chai.request.agent(app);
      const password = "passwor";
      return agent
        .post("/auth/signup")
        .send({ username: email, password })
        .then(res => {
          expect(JSON.parse(res.text)).to.deep.equal({
            message:
              "That password is not valid. Must be at least 8 characters. Can contain only letters or numbers."
          });
          expect(res).to.have.status(400);
        });
    });
  });

  // 10/3/18
  // If username missing, send 400 status [X]
  // If password missing, send 400 status [X]
  // If username not string, send 400 status [X]
  // If password not string, send 400 status [X]
  // If username and password not valid for existing user, then 401 [X]
  // If username and password are valid for existing user, then 200 [X]
  // -- Verify that object has id (string), email, movies (in the model)
  // ^^ Expecting JSON for all cases
  // For error, object with appropriate value for the message property

  describe("POST /login", function() {
    it("Should reject empty username field", function() {
      var agent = chai.request.agent(app);
      return agent
        .post("/auth/login")
        .send({ password })
        .then(res => {
          expect(JSON.parse(res.text)).to.deep.equal({
            message: "Missing credentials"
          });
          expect(res).to.have.status(400);
        });
    });

    it("Should reject non-string username", function() {
      var agent = chai.request.agent(app);
      const username = [];
      return agent
        .post("/auth/login")
        .send({ username, password })
        .then(res => {
          expect(JSON.parse(res.text)).to.deep.equal({
            message: "That email is not valid."
          });
          expect(res).to.have.status(400);
        });
    });

    it("Should reject empty password field", function() {
      var agent = chai.request.agent(app);
      const username = email;
      return agent
        .post("/auth/login")
        .send({ username })
        .then(res => {
          expect(JSON.parse(res.text)).to.deep.equal({
            message: "Missing credentials"
          });
          expect(res).to.have.status(400);
        });
    });

    it("Should non-string passwords", function() {
      var agent = chai.request.agent(app);
      const password = 2;
      const username = email;
      return agent
        .post("/auth/login")
        .send({ username, password })
        .then(res => {
          expect(JSON.parse(res.text)).to.deep.equal({
            message: "That password is not valid."
          });
          expect(res).to.have.status(400);
        });
    });

    it("Should reject a right username with the wrong password", function() {
      var agent = chai.request.agent(app);
      const username = email;
      const password = "badpassword";
      return agent
        .post("/auth/login")
        .send({ username, password })
        .then(res => {
          expect(JSON.parse(res.text)).to.deep.equal({
            message: "That username and password combination are invalid."
          });
          expect(res).to.have.status(401);
        });
    });

    it("Should reject a non-existent user", function() {
      var agent = chai.request.agent(app);
      const username = "badusername";
      return agent
        .post("/auth/login")
        .send({ username, password })
        .then(res => {
          expect(JSON.parse(res.text)).to.deep.equal({
            message: "That username and password combination are invalid."
          });
          expect(res).to.have.status(401);
        });
    });

    it.only("Should accept a valid username and password", function() {
      var agent = chai.request.agent(app);
      const username = email;
      return agent
        .post("/auth/login")
        .send({ username, password })
        .then(res => {
          expect(JSON.parse(res.text)).to.deep.equal({
            id: uid,
            email,
            movies: []
          });
          expect(res).to.have.status(200);
        });
    });
  });
});
