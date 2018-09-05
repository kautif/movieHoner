'use strict';
const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/movie-honer';
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'mongodb://localhost:27017/test-movie-honer';
const PORT = process.env.PORT || 8080;

module.exports = {
    DATABASE_URL,
    TEST_DATABASE_URL,
    PORT
};