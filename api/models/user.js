const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const MovieSchema = new Schema({
  title: String,
  genre: String,
  year: Number,
  quality: String,
  image: String,
  tmdbID: Number
});

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  movies: [MovieSchema]
});

const User = mongoose.model("user", UserSchema);

module.exports = User;
