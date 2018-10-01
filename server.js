'use strict';

require('dotenv').config();
const express = require('express');
const { dbConnect, dbGet } = require('./db-knex');
let knex;
// console.log(knex, "trying to see knex in server.js, top line-7ish here too!")
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
//============ SIGN UP TEACHER ===================WORKS with console.logs intact
//Route so user can register
app.post('/api/teachers', (req, res, next) => {

	let { first_name_signUpT, last_name_signUpT, email_signUpT, password_signUpT } = req.body

	const requiredFields = ['first_name_signUpT', 'last_name_signUpT', 'email_signUpT', 'password_signUpT'];
	const missingField = requiredFields.find(field => !(field in req.body));
	console.log("--------------------------I'm right here in missing and!", password_signUpT)
	//response object to notify users of error
	if (missingField) {
		console.log("--------------------------I'm right here in missing field!", missingField)

		return res.status(418).json({
			reason: 'ValidationError',
			message: 'Missing field',
			location: missingField
		});
	}
	// Validate fields are strings
	const stringFields = ['first_name_signUpT', 'last_name_signUpT', 'email_signUpT', ' password_signUpT'];
	console.log("--------------------------I'm right her2!", stringFields)

	const nonStringField = stringFields.find(
		field => field in req.body && typeof req.body[field] !== 'string'
	);
	if (nonStringField) {

		return res.status(422).json({
			id: 422,
			reason: 'ValidationError',
			message: 'Incorrect field type: expected string',
			location: nonStringField
		});
	}
	const explicityTrimmedFields = ['email_signUpT', 'password_signUpT'];
	const nonTrimmedField = explicityTrimmedFields.find(
		field => req.body[field].trim() !== req.body[field]

	);
	//response object to notify users of error
	if (nonTrimmedField) {
		return res.status(422).json({
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
			id: 422,
			reason: 'ValidationError',
			message: tooSmallField
				? `Must be at least ${sizedFields[tooSmallField]
					.min} characters long`
				: `Must be at most ${sizedFields[tooLargeField]
					.max} characters long`,
			location: tooSmallField || tooLargeField
		});
	}

	first_name_signUpT = first_name_signUpT.trim();
	last_name_signUpT = last_name_signUpT.trim();

	const newTeacher = {
		first_name: first_name_signUpT,
		last_name: last_name_signUpT,
		email: email_signUpT,
		password: password_signUpT,
		teacher_id: 1114
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
console.log('i am the results in just before log-in teacher')

//============LOG IN TEACHER===================
app.post('/api/auth/login', localAuth, (req, res, next) => {
	console.log('i am the results in log-in teacher')

	const email_signUpT = req.body.email;
	const password_signUpT = req.body.password;
	console.log('I am in log-in teacher', password_signUpT)
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
//=================================
// api/students
//============SIGN UP STUDENT===================WORKS

app.post('/api/students', (req, res, next) => {


	let { name_signUpS, last_name_signUpS, email_signUpS, password_signUpS, teacher_id_signUpS } = req.body
	console.log("--------------------------I'm right here! 1", teacher_id_signUpS)
	const requiredFields = ['name_signUpS', 'last_name_signUpS', 'email_signUpS', 'password_signUpS', 'teacher_id_signUpS'];
	const missingField = requiredFields.find(field => !(field in req.body));

	if (missingField) {
		console.log(missingField, '------------------------------ 2')
		return res.status(422).json({
			id: 422,
			reason: 'ValidationError',
			message: 'Missing field',
			location: missingField
		});
	}
	const stringFields = ['name_signUpS', 'last_name_signUpS', 'email_signUpS', 'password_signUpS', 'teacher_id_signUpS'];
	const nonStringField = stringFields.find(
		field => field in req.body && typeof req.body[field] !== 'string'
	);
	if (nonStringField) {
		return res.status(422).json({
			reason: 'ValidationError',
			message: 'Incorrect field type: expected string',
			location: nonStringField
		});
	}

	const explicityTrimmedFields = ['email_signUpS', 'password_signUpS'];
	console.log("--------------------------I'm right here! 3", teacher_id_signUpS)

	const nonTrimmedField = explicityTrimmedFields.find(

		field => req.body[field].trim() !== req.body[field]

	);
	if (nonTrimmedField) {
		return res.status(422).json({
			reason: 'ValidationError',
			message: 'Cannot start or end with whitespace',
			location: nonTrimmedField
		});
	}
	const sizedFields = {
		email_signUpS: {
			min: 1
		},
		password_signUpS: {
			min: 6,
			// bcrypt truncates after 72 characters, so let's not give the illusion
			// of security by storing extra (unused) info
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

	if (tooSmallField || tooLargeField) {
		return res.status(422).json({
			reason: 'ValidationError',
			message: tooSmallField
				? `Must be at least ${sizedFields[tooSmallField]
					.min} characters long`
				: `Must be at most ${sizedFields[tooLargeField]
					.max} characters long`,
			location: tooSmallField || tooLargeField
		});
	}
	// Username_signUpS/email_signUpS(in this project) and password_signUpS come in pre-trimmed, otherwise we throw an error
	// before this
	name_signUpS = name_signUpS.trim();
	last_name_signUpS = last_name_signUpS.trim();
	teacher_id_signUpS = teacher_id_signUpS.trim();

	console.log("--------------------------I'm right here! 4", teacher_id_signUpS)
	const newStudent = {
		name: name_signUpS,
		last_name: last_name_signUpS,
		email: email_signUpS,
		password: password_signUpS,
		teacher_id: teacher_id_signUpS
	};
	console.log("--------------------------I'm right here! 5", newStudent)

	knex.insert(newStudent)
		.into('students')
		.returning(['id', 'name', 'last_name'])
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
});
//=======================
function runServer(databaseUrl, port = PORT) {
	return new Promise((resolve, reject, next) => {
		server = app.listen(port, () => {
			//TODO
			console.log(`Your app is listening on port ${port}`);
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