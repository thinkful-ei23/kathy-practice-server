'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');
const { dbConnect, dbGet } = require('./db-knex');
const knex = require('knex');

const { teachersRouter, studentsRouter, coursesRouter } = require('./users/index');
const { authRouter } = require('./auth/index');
const { localStrategy, jwtStrategy } = require('./auth/index');
const bodyParser = require('body-parser');

const { PORT, DATABASE_URL } = require('./config');

const app = express();

//Logging middleware
app.use(
	morgan(process.env.NODE_ENV === 'production' ? 'common' : 'dev', {
		skip: (req, res) => process.env.NODE_ENV === 'test'
	})
);
//CORS
// app.use(cors({ origin: CLIENT_ORIGIN })
// );
app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
	res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
	if (req.method === 'OPTIONS') {
		return res.send(204);
	}
	next();
});
//console.log(localStrategy, 'local in server')
passport.use(localStrategy);
passport.use(jwtStrategy);

console.log(app.use, 'app.use inside server')
//console.log(Router.use, 'Router.use inside server')

app.use('/api/teachers/', teachersRouter)
app.use('/api/students/', studentsRouter)
app.use('/api/courses/', coursesRouter)
app.use('/api/auth/login/', authRouter)
// app.use("/api", require('./api/teachers'));
// app.use('/teachers', authMiddleware, teachersRouter);


const jwtAuth = passport.authenticate('jwt', { session: false });

app.get('/api/protected', jwtAuth, (req, res) => {
	return res.json({
		data: 'You cannot access this part of the app'
	});
});

app.use('*', (req, res) => {
	return res.status(404).json({
		message: 'Not Found'
	});
});

// Referenced by both runServer and closeServer. closeServer
// assumes runServer has run and set `server` to a server object
let server;

function runServer(databaseUrl, port = PORT) {

	return new Promise((resolve, reject) => {
		// knex.connect(databaseUrl, err => {
		// 	if (err) {
		// 		return reject(err);
		// 	}
		server = app.listen(port, () => {
			console.log(`Your app is listening on port ${port}`);
			resolve();
		})
			.on('error', err => {
				// knex.disconnect();
				reject(err);
			});
	});
	// });
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
	// dbGet();
	runServer();
}

module.exports = { app, runServer, closeServer };

/*

function runServer(port = PORT) {
	const server = app
		.listen(port, () => {
			console.info(`App listening on port ${server.address().port}`);
		})
		.on('error', err => {
			console.error('Express failed to start');
			console.error(err);
		});
}
*/