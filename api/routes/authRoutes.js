const router = require('express').Router();
const passport = require('passport');
const User = require('../models/user');

// In this file, passport.authenticate is not being used as middleware... 
	// (i.e. after the declared route)
	// when passport.authenticate is used as middleware, req.login will be called automatically
		// Otherwise, it must be called manually like in this case.

router.post('/signup', function(req, res, next){
	passport.authenticate('local-signup', function(err, user, info) {
		console.log(info);
		if (err) {
			console.log(err);
			return res.sendStatus(500);
		}
		if (user) {
			return req.login(user, function(){
				res.send({id: user._id, email: user.email, movies: user.movies});
			});
		}
		res.status(401).send(info);
	}) (req, res, next);
});

router.post('/login', function(req, res, next){
	passport.authenticate('local-login', function(err, user, info) {
		console.log(info);
		if (err) {
			console.log(err);
			return res.sendStatus(500);
		}
		if (user) {
			return req.login(user, function(){
				res.send({id: user._id, email: user.email, movies: user.movies});
			});
		}
		res.status(401).send(info);
	}) (req, res, next);
});

router.get('/user', function(req, res){
	if (req.user) {
		const user = req.user;
		return res.send({id: user._id, email: user.email, movies: user.movies});
	} 

	res.status(401).send({message: 'You are not logged in.'});
});

router.get('/logout', function(req, res){
  req.logout();
  res.sendStatus(200);
});

module.exports = router;

// Add add'l route
	// GET /user
		// If authenticated, send user
		// If not authenticated, send 401