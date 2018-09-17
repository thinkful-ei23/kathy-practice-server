const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const config = require("../config");
const app = express.Router();
const { jwtStrategy, localStrategy } = require("../passport/strategies");

/*
this is a function that creates the JWT.
the jwt.sign method takes a payload, your secret or key, and an object
containing the desired options for the jwt
documentation:https://www.npmjs.com/package/jsonwebtoken
*/

const createAuthToken = function (user) {
	return jwt.sign({ user }, config.JWT_SECRET, {
		subject: user.email,
		expiresIn: config.JWT_EXPIRY,
		algorithm: "HS256"
	});
};

/*
We run localStrategy as middleware in this endpoint. It just makes sure that
there's a username in the req body and that it's unique, then validates the
password.
the serialize method removes the user's password from the JWT so that the
password cannot be accessed through something like the JWT debugger. You've
verified the password through localStrategy.
the express json makes it so that we equip this endpoint to parse the req
body.
*/
const localStrategy = passport.authenticate('local', { session: false, failWithError: true });
app.post("/login", [express.json(), localStrategy], (req, res) => {
	const authToken = createAuthToken(req.user.serialize());
	res.json({ authToken });
});

const jwtStrategy = passport.authenticate('jwt', { session: false, failWithError: true });
app.post("/refresh", jwtStrategy, (req, res) => {
	const authToken = createAuthToken(req.user);
	res.json({ authToken });
});

module.exports = app;