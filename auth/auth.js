'use strict';
const express = require('express');
const passport = require('passport');
//const bodyParser = require('body-parser'); TODO need?
const jwt = require('jsonwebtoken');

const config = require('../config');
const router = express.Router();
const { localStrategy, jwtStrategy } = require("./strategies");

const createAuthToken = function (user) {
	return jwt.sign({ user }, config.JWT_SECRET, {
		subject: user.email,  //TODO change to email from original username?
		expiresIn: config.JWT_EXPIRY,
		algorithm: 'HS256'
	});
};

// The user provides a email and password to login
router.post("/login", [express.json(), localStrategy], (req, res) => {
	const authToken = createAuthToken(req.user.serialize());
	res.json({ authToken });
});

// The user exchanges a valid JWT for a new one with a later expiration
router.post("/refresh", jwtStrategy, (req, res) => {
	const authToken = createAuthToken(req.user);
	res.json({ authToken });
});


// TODO why is this block here?
// const localStrategy = passport.authenticate('local', { session: false });
// router.use(bodyParser.json());
//  const jwtStrategy = passport.authenticate('jwt', { session: false });



module.exports = { router };