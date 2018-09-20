'use strict';

require('dotenv').config();
const express = require('express');
const { dbConnect, dbGet } = require('./db-knex');
let knex;
console.log(knex, "trying to see knex in server.js, top line-7ish here too!")
const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');

const { authRouter } = require('./auth/index');
const { localStrategy, jwtStrategy } = require('./auth/index');
const { PORT, CLIENT_ORIGIN } = require('./config');

//-------------- create an Express app
const app = express();
app.use(express.json());
//-----------------Logging middleware
app.use(
	morgan(process.env.NODE_ENV === 'production' ? 'common' : 'dev', {
		skip: (req, res) => process.env.NODE_ENV === 'test'
	})
);
//-----------------Enable CORS
app.use(cors({ origin: CLIENT_ORIGIN })
);
// app.use(function (req, res, next) {
// 	res.header('Access-Control-Allow-Origin', '*');
// 	res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
// 	res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
// 	if (req.method === 'OPTIONS') {
// 		return res.send(204);
// 	}
// 	next();
// });
//TODO console.log(localStrategy, 'local in server')
passport.use(localStrategy);
passport.use(jwtStrategy);

// TODO console.log(app.use, 'app.use inside server')
//-----------------Mount routers
// app.use('/api/teachers', router)
// app.use('/api/students')
// app.use('/api/courses')
app.use('/api/auth/login', authRouter)

const jwtAuth = passport.authenticate('jwt', { session: false });

app.get('/api/protected', jwtAuth, (req, res) => {
	return res.json({
		data: 'You cannot access this part of the app'
	});
});


// Referenced by both runServer and closeServer. closeServer
// assumes runServer has run and set `server` to a server object
let server;

const localAuth = passport.authenticate('local', { session: false });

//============== ENDPOINTS ===================
// api/teachers
//============ SIGN UP TEACHER ===================
//Route so user can register
app.post('/api/teachers', (req, res, next) => {

	// console.log('************************I am the first name in signup-teacher endpoint, server.js')// TODO

	let { first_name_signUpT, last_name_signUpT, email_signUpT, password_signUpT } = req.body
	// console.log('************************I am the 1.5 name in signup-teacher endpoint, server.js', req.body)// TODO

	const requiredFields = ['first_name_signUpT', 'last_name_signUpT', 'email_signUpT', 'password_signUpT'];
	// console.log('************************1.75 in signup T endpoint', requiredFields)
	const missingField = requiredFields.find(field => !(field in req.body));
	// console.log('************************I am the 2nd name in signup-teacher endpoint, server.js', missingField)// TODO

	//response object to notify users of error
	if (missingField) {
		// console.log('****************************I am the 3rd name in signup-teacher endpoint, server.js', missingField)// TODO

		return res.status(418).json({
			code: 422,
			reason: 'ValidationError',
			message: 'Missing field',
			location: missingField
		});
	}
	// Validate fields are strings
	const stringFields = ['first_name_signUpT', 'last_name_signUpT', 'email_signUpT', 'password_signUpT'];
	const nonStringField = stringFields.find(

		field => field in req.body && typeof req.body[field] !== 'string'
	);
	if (nonStringField) {
		// console.log('I am the 4th name in signup-teacher endpoint, server.js') // TODO

		return res.status(418).json({
			code: 422,
			reason: 'ValidationError',
			message: 'Incorrect field type: expected string',
			location: nonStringField
		});
	}
	const explicityTrimmedFields = ['email_signUpT', 'password_signUpT'];
	const nonTrimmedField = explicityTrimmedFields.find(
		// console.log('----------------------5th trimmed fields in server.js sign up teacher endpoint', nonTrimmedField), // TODO

		field => req.body[field].trim() !== req.body[field]

	);
	//response object to notify users of error
	if (nonTrimmedField) {
		return res.status(422).json({
			code: 422,
			reason: 'ValidationError',
			message: 'Cannot start or end with whitespace',
			location: nonTrimmedField
		});
	}
	//validate email and password conform to length min-max constraints
	const sizedFields = {
		email_signUpT: {
			min: 1
		},
		password_signUpT: {
			min: 6,
			max: 72
		}
	};
	const tooSmallField = Object.keys(sizedFields).find(
		field =>
			'min' in sizedFields[field] &&
			req.body[field].trim().length < sizedFields[field].min
	);
	const tooLargeField = Object.keys(sizedFields).find(
		field =>
			'max' in sizedFields[field] &&
			req.body[field].trim().length > sizedFields[field].max
	);
	//response object to notify users of error
	if (tooSmallField || tooLargeField) {
		return res.status(422).json({
			code: 422,
			reason: 'ValidationError',
			message: tooSmallField
				? `Must be at least ${sizedFields[tooSmallField]
					.min} characters long`
				: `Must be at most ${sizedFields[tooLargeField]
					.max} characters long`,
			location: tooSmallField || tooLargeField
		});
	}
	// let { email_signUpT, password_signUpT, first_name_signUpT = '', last_name_signUpT = '' } = req.body;
	// Username/email(in this project) and password come in pre-trimmed, otherwise we throw an error
	// before this
	console.log('66666666666666666666666 line 158', first_name_signUpT.trim())
	first_name_signUpT = first_name_signUpT.trim();
	last_name_signUpT = last_name_signUpT.trim();

	//check to see if there is a user with same email already registered
	//with a response object to notify users of error
	const newTeacher = {
		first_name: first_name_signUpT,
		last_name: last_name_signUpT,
		email: email_signUpT,
		password: password_signUpT,
		teacher_code: 1234
	};
	knex.insert(newTeacher)
		.into('teachers')
		.returning(['id', 'first_name', 'last_name'])
		.then(results => {
			const result = results[0];
			res
				.location('${req.originalUrl}/${result.id}')
				.status(201)
				.json(result);
		})
		.catch(err => {
			next(err);
		});
	//TODO subscripting  [] const results = [result]  const result = results[0];
});

// Never expose all your users like below in a prod application
// we're just doing this so we have a quick way to see
// if we're creating users. keep in mind, you can also
// verify this in the Mongo shell.
// app.get('/', (req, res) => {
//   return User.find()
//     .then(users => res.json(users.map(user => user.serialize())))
//     .catch(err => res.status(500).json({ message: 'Internal server error' }));
// });
//============LOG IN TEACHER===================
app.post('/api/auth/login', localAuth, (req, res, next) => {
	const email_signUpT = req.body.email;
	const password_signUpT = req.body.password;
	knex
		.select('id', 'password')
		.from('teachers')
		.where('email', email)
		.then((result) => {
			knex
				//hash req.body.password
				.from('teachers')
				.where('password', password)
				.then(results => {
					//res.json(results)
				})
			console.log(result, 'i am the results in log-in teacher')
		})
		.catch(err => {
			next(err)
		})
});

//=======================
function runServer(databaseUrl, port = PORT) {
	return new Promise((resolve, reject) => {
		server = app.listen(port, () => {
			//TODO console.log(`Your app is listening on port ${port}`);
			resolve();
		})
			.on('error', err => {

				reject(err);
			});
	});
}


function closeServer() {
	return knex.disconnect().then(() => {
		return new Promise((resolve, reject) => {
			console.log('Closing server');
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
	dbConnect();
	knex = dbGet();
	runServer();
}

module.exports = { app, runServer, closeServer };