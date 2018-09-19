'use strict';

require('dotenv').config();
const express = require('express');
const { dbConnect, dbGet } = require('./db-knex');
let knex;
console.log(knex, "here too!")
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


//============== ENDPOINTS ===================
// api/teachers
//============ SIGN UP TEACHER ===================
//Route so user can register
app.post('/api/teachers', (req, res, next) => {
	// TODO console.log(first_name, 'I am the first name in teacherRouter')
	const requiredFields = [first_name, last_name, email, password,]
	const missingField = requiredFields.find(field => !(field in req.body));

	//response object to notify users of error
	if (missingField) {
		return res.status(422).json({
			code: 422,
			reason: 'ValidationError',
			message: 'Missing field',
			location: missingField
		});
	}
	// Validate fields are strings
	const stringFields = ['first_name', 'last_name', 'email', 'password'];
	const nonStringField = stringFields.find(
		field => field in req.body && typeof req.body[field] !== 'string'
	);

	if (nonStringField) {
		return res.status(422).json({
			code: 422,
			reason: 'ValidationError',
			message: 'Incorrect field type: expected string',
			location: nonStringField
		});
	}
	// If the username and password aren't trimmed we give an error.  Users might
	// expect that these will work without trimming (i.e. they want the password
	// "foobar ", including the space at the end).  We need to reject such values
	// explicitly so the users know what's happening, rather than silently
	// trimming them and expecting the user to understand.
	// We'll silently trim the other fields, because they aren't credentials used
	// to log in, so it's less of a problem.
	const explicityTrimmedFields = ['email', 'password'];
	const nonTrimmedField = explicityTrimmedFields.find(
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
		email: {
			min: 1
		},
		password: {
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

	let { email, password, first_name = '', last_name = '' } = req.body;
	// Username/email(in this project) and password come in pre-trimmed, otherwise we throw an error
	// before this
	first_name = first_name.trim();
	last_name = last_name.trim();

	//check to see if there is a user with same email already registered
	//with a response object to notify users of error
	return User.find({ email })
		.count()
		.then(count => {
			if (count > 0) {
				// There is an existing user with the same username
				return Promise.reject({
					code: 422,
					reason: 'ValidationError',
					message: 'User with the same email already exists',
					location: 'email'
				});
			}

			/*knex('users') TODO TODO
	.insert({ email: 'hi@example.com' })
	*/
			// If there is no existing user, hash the password
			return User.hashPassword(password);
		})
		.then(hash => {
			return User.create({
				email,
				password: hash,
				first_name,
				last_name
			});
		})
		.then(user => {
			return res.status(201).//add json JWT
				json(user.serialize());
			//later, add location header: TODO
		})
		.catch(err => {
			// Forward validation errors on to the client, otherwise give a 500
			// error because something unexpected has happened
			if (err.reason === 'ValidationError') {
				return res.status(err.code).json(err);
			}
			res.status(500).json({ code: 500, message: 'Internal server error' });
		});
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
const localAuth = passport.authenticate('local', { session: false });
//============LOG IN TEACHER===================
app.post('/api/auth/login', localAuth, (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;
	knex
		.select('id', 'password')
		.from('teachers')
		.where('email', email)
		.then((result) => {
			knex
				.from('teachers')
				.where('password', password)
				.then(results => {
					res.json(results)
				})
			console.log(result, 'i am the results in log-in teacher')
		})
		.catch(err => {
			next(err)
		})
});






//TODO console.log("Logging in");
// TODO res.json("Demo");
//===========GET ALL TEACHERS==============WORKS
app.get('/api/teachers', (req, res, next) => {
	console.log('we are here!')
	knex('teachers')
		.select('id', 'first_name', 'last_name', 'password', 'email')
		.then(results => {
			res.json(results)
		})
		.catch(err => {
			next(err)
		})
})

//===========GET TEACHER by ID==============WORKS
app.get('/api/teachers/:id', (req, res, next) => {
	const teacherId = req.params.id;

	knex.first('id', 'first_name', 'last_name', 'password', 'email')
		.from('teachers')
		.where('id', teacherId)
		.then(results => {
			res.json(results)
		})
		.catch(err => {
			next(err)
		})
})

//==========POST TEACHER=================WORKS
app.post('/api/teachers', (req, res, next) => {
	// TODO console.log('hello dakota')
	const { first_name, last_name, email, password } = req.body;
	//console.log(req.body, 'line 45 in index.js')

	/***** Never trust users. Validate input *****/
	// if (!first_name) {
	//   const err = new Error('Missing `first_name` in request body');
	//   err.status = 400;
	//   return next(err);
	// }
	const newTeacher = {
		first_name: first_name,
		last_name: last_name,
		email: email,
		password: password,
		teacher_code: 9876
	};

	knex('teachers')
		.insert(newTeacher)
		.into('teachers')
		.returning(['id', 'first_name', 'last_name', 'email', 'password', 'teacher_code'])
		.then((results) => {
			const result = results[0];
			res
				.location(`${req.originalUrl}/${result.id}`)
				.status(201)
				.json(result);
		})
		.catch(err => {
			//console.log(err, 'server side error')
			next(err);
		});
});

//========PUT / UPDATE TEACHER ===========
app.put('/api/teachers/:id', (req, res, next) => {
	const teacher_id = req.params.id;
	const { first_name, last_name, email, password } = req.body;

	// /***** Never trust users. Validate input *****/
	// if (!teacher_id) {
	//   const err = new Error('Missing `teacher_id` in request body');
	//   err.status = 400;
	//   return next(err);
	// }

	const updateTeacher = {
		first_name: first_name,
		last_name: last_name,
		email: email,
		password: password,
	};

	knex('teachers')
		.update(updateTeacher)
		.where('id', teacher_id)
		.returning(['id', 'first_name', 'last_name', 'email', 'password '])
		.then(([result]) => {
			if (result) {
				res.json(result);
			} else {
				next();
			}
		})
		.catch(err => {
			next(err);
		});
});


//=========DELETE TEACHER ==========
app.delete('/api/teachers/:id', (req, res, next) => {
	knex
		.where('id', req.params.id)
		.from('teachers')
		.del()
		.then(() => {
			res.status(204).end();
		})
		.catch(err => {
			next(err);
		});
});


//============== ENDPOINTS ===================
// api/students
//============SIGN UP STUDENT===================
app.post('/api/students', (req, res, next) => {
	const requiredFields = [name, last_name, email, password, teacher_id]
	const missingField = requiredFields.find(field => !(field in req.body));

	if (missingField) {
		return res.status(422).json({
			code: 422,
			reason: 'ValidationError',
			message: 'Missing field',
			location: missingField
		});
	}
	const stringFields = ['name', 'last_name', 'email', 'password', 'teacher_id'];
	const nonStringField = stringFields.find(
		field => field in req.body && typeof req.body[field] !== 'string'
	);

	if (nonStringField) {
		return res.status(422).json({
			code: 422,
			reason: 'ValidationError',
			message: 'Incorrect field type: expected string',
			location: nonStringField
		});
	}
	// If the username and password aren't trimmed we give an error.  Users might
	// expect that these will work without trimming (i.e. they want the password
	// "foobar ", including the space at the end).  We need to reject such values
	// explicitly so the users know what's happening, rather than silently
	// trimming them and expecting the user to understand.
	// We'll silently trim the other fields, because they aren't credentials used
	// to log in, so it's less of a problem.
	const explicityTrimmedFields = ['email', 'password'];
	const nonTrimmedField = explicityTrimmedFields.find(
		field => req.body[field].trim() !== req.body[field]
	);
	if (nonTrimmedField) {
		return res.status(422).json({
			code: 422,
			reason: 'ValidationError',
			message: 'Cannot start or end with whitespace',
			location: nonTrimmedField
		});
	}
	const sizedFields = {
		email: {
			min: 1
		},
		password: {
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

	let { email, password, name = '', last_name = '', teacher_id } = req.body;
	// Username/email(in this project) and password come in pre-trimmed, otherwise we throw an error
	// before this
	name = name.trim();
	last_name = last_name.trim();
	teacher_id = teacher_id.trim();


	return User.find({ email })
		.count()
		.then(count => {
			if (count > 0) {
				// There is an existing user with the same username
				return Promise.reject({
					code: 422,
					reason: 'ValidationError',
					message: 'User with the same info already exists',
					location: 'email'
				});
			}
			// If there is no existing user, hash the password
			return User.hashPassword(password);
		})
		.then(hash => {
			return User.create({
				email,
				password: hash,
				name,
				last_name,
				teacher_id
			});
		})
		.then(user => {
			return res.status(201). //add json JWT
				json(user.serialize());
			//later, add location header: TODO
		})
		.catch(err => {
			// Forward validation errors on to the client, otherwise give a 500
			// error because something unexpected has happened
			if (err.reason === 'ValidationError') {
				return res.status(err.code).json(err);
			}
			console.error(err)
			res.status(500).json({ code: 500, message: 'Internal server error' });

		});
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

//============LOG IN STUDENT===================
app.post('/api/students', (req, es, next) => {

	const authToken = createAuthToken(req.user.serialize());
	res.json({ authToken });


	console.log("Logging in");
	res.json("Demo");
});
//============LOG IN STUDENT===================
app.post('/api/students', (req, res, next) => {

	const { name, last_name, email, password, teacher_id } = req.body;
	//console.log(req.body)

	/***** Never trust users. Validate input *****/
	// if (!first_name) {
	//   const err = new Error('Missing `first_name` in request body');
	//   err.status = 400;
	//   return next(err);
	// }
	const newStudent = {
		id: id,
		name: name,
		last_name: last_name,
		email: email,
		password: password,
		teacher_id: teacher_id
	};

	knex('students')
		.insert(newStudent)
		.into('students')
		.returning(['id', 'name', 'last_name', 'email', 'password', 'teacher_id'])
		.then((results) => {
			const result = results[0];
			res
				.location(`${req.originalUrl}/${result.id}`)
				.status(201)
				.json(result);
		})
		.catch(err => {
			next(err);
		});
});

//========GET ALL STUDENTS ==============WORKS
app.get('/api/students', (req, res, next) => {
	knex('students')
		.select('id', 'name', 'last_name', 'email', 'password', 'teacher_id')
		.then(results => {
			res.json(results)
		})
		.catch(err => {
			next(err)
		})
})


//========GET STUDENTS Filtered by Teacher_ID==============WORKS
app.get('/api/students', (req, res, next) => {

	knex('students')
		.select('id', 'name', 'last_name', 'email', 'password', 'teacher_id')
		.from('students')
		.modify(queryBuilder => {
			if (searchTerm) {
				queryBuilder.where()
			}
		})
		.sort('teacher_id')
		.orderBy('teacher_id', 'desc')
		.then(results => {
			res.json(results)
		})
		.catch(err => {
			next(err)
		})
})
//knex.select('*')
// .from('students')
// .where({ teacher_id: req.body.teacher_id })
//---------------
// knex('user').insert({email: req.body.email})
//       .then( function (result) {
//           res.json({ success: true, message: 'ok' });     // respond back to request
//        })
//        .catch(err => {
//          next(err)
//     })
// })
//---------------


//========GET STUDENT by ID ==============WORKS
app.get('/api/students/:id', (req, res, next) => {
	const studentId = req.params.id;

	knex.first('id', 'name', 'last_name', 'password', 'email', 'teacher_id')
		.from('students')
		.where('id', studentId)

		.then(results => {
			res.json(results)
		})
		.catch(err => {
			next(err)
		})
})
//=========POST STUDENT ============WORKS
app.post('/api/students', (req, res, next) => {

	const { id, name, last_name, email, password, teacher_id } = req.body;
	//console.log(req.body)

	/***** Never trust users. Validate input *****/
	// if (!first_name) {
	//   const err = new Error('Missing `first_name` in request body');
	//   err.status = 400;
	//   return next(err);
	// }
	const newStudent = {
		id: id,
		name: name,
		last_name: last_name,
		email: email,
		password: password,
		teacher_id: teacher_id
	};

	knex('students')
		.insert(newStudent)
		.into('students')
		.returning(['id', 'name', 'last_name', 'email', 'password', 'teacher_id'])
		.then((results) => {
			const result = results[0];
			res
				.location(`${req.originalUrl}/${result.id}`)
				.status(201)
				.json(result);
		})
		.catch(err => {
			next(err);
		});
});

//========UPDATE STUDENT ===========
app.put('/api/students/:id', (req, res, next) => {
	const { id } = req.params.id;

	knex('students')
		.where({ id: req.params.id })
		.update({ 'teacher_id': teacher_id })
		.returning(['id', 'name', 'last_name', 'email', 'password', 'teacher_id'])
		.then((results) => {
			const result = results[0];
			res
				.location(`${req.originalUrl}/${result.id}`)
				.status(201)
				.json(result);
		})
		.catch(err => {
			next(err);
		});
});
// app.route('/api/students/:id')
//   .put(function (req, res) {
//     Contact
//       .where('id', req.params.id)
//       .fetch()
//       .then(function (contact) {
//         contact
//           .save({
//             name: req.body.name,
//             last_name: req.body.last_name,
//             email: req.body.email,
//           })
//           .then(function (saved) {
//             res.json({ saved });
//           });
//       });
//   });
//=========DELETE STUDENT ==========
// app.delete('/api/students/:id', (req, res, next)){

//   knex
//     .delete((req, res) => {
//       Students
//         .where('id', req.params.id)
//         .del()
//         .then((destroyed) => {
//           res.json({ destroyed });
//         });
//     });
// }

//============== ENDPOINTS ===================
//  api/courses
//========GET ALL CARDS-COURSES ==============WORKS
app.get('/api/courses', (req, res, next) => {

	knex('courses')
		.select('id', 'title', 'description', 'teacher_id')
		.then(results => {
			res.json(results)
		})
		.catch(err => {
			next(err)
		})
})
//========GET by courseID 1 CARD-COURSE ==============WORKS
app.get('/api/courses/:id', (req, res, next) => {
	const courseId = req.params.id;

	knex.first('id', 'title', 'description', 'teacher_id')
		.from('courses')
		.where('id', courseId)

		.then(results => {
			res.json(results)
		})
		.catch(err => {
			next(err)
		})
})

//========GET by teacherID 1 CARD-COURSE ==============
app.get('/api/courses/:id', (req, res, next) => {
	const teacher_id = req.params.id;

	knex.first('id', 'title', 'description', 'teacher_id')
		.from('courses')
		.where('id', teacher_id)
		.returning('id', 'title')
		.then(results => {
			res.json(results)
		})
		.catch(err => {
			next(err)
		})
})

//GET ALL .filter()

//========GET by TITLE 1 CARD-COURSE ==============
app.get('/api/courses/:title', (req, res, next) => {
	const courseTitle = req.params.title;

	knex.first('id', 'title', 'description', 'teacher_id')
		.from('courses')
		.where('title', courseTitle)

		.then(results => {
			res.json(results)
		})
		.catch(err => {
			next(err)
		})
})

//=========POST CARD-COURSE ============WORKS
app.post('/api/courses/', (req, res, next) => {

	const { id, title, description, teacher_id } = req.body;
	//console.log(req.body)

	/***** Never trust users. Validate input *****/
	// if (!first_name) {
	//   const err = new Error('Missing `first_name` in request body');
	//   err.status = 400;
	//   return next(err);
	// }
	const newCourse = {
		id: id,
		title: title,
		description: description,
		teacher_id: teacher_id
	};

	knex('courses')
		.insert(newCourse)
		.into('courses')
		.returning(['id', 'title', 'description', 'teacher_id'])
		.then((results) => {
			const result = results[0];
			res
				.location(`${req.originalUrl}/${result.id}`)
				.status(201)
				.json(result);
		})
		.catch(err => {
			next(err);
		});
});

//========PUT/UPDATE CARD-COURSE ===========
app.put('/api/courses/:id', (req, res, next) => {
	const { title } = req.body;

	// /***** Never trust users. Validate input *****/
	// if (!name) {
	//   const err = new Error('Missing `name` in request body');
	//   err.status = 400;
	//   return next(err);
	// }

	const updateItem = { title };

	knex('courses')
		.update(updateItem)
		.where('id', req.params.id)
		.returning(['id', 'name'])
		.then(([result]) => {
			if (result) {
				res.json(result);
			} else {
				next(); // fall-through to 404 handler
			}
		})
		.catch(err => {
			next(err);
		});
});

//=========DELETE CARD-COURSE ==========
app.delete('/api/courses/:id', (req, res, next) => {
	knex.del()
		.where('id', req.params.id)
		.from('courses')
		.then(() => {
			res.status(204).end();

		})
		.catch(err => {
			next(err);
		});
});

app.use('*', (req, res) => {
	return res.status(404).json({
		message: 'Not Found'
	});
});


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