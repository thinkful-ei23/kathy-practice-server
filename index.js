'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { dbConnect, dbGet } = require('./db-knex');
let knex;
const bodyParser = require('body-parser');

const { PORT, CLIENT_ORIGIN } = require('./config');
//const { dbConnect } = require('./db-mongoose');

const app = express();
const jsonParser = bodyParser.json();

app.use(express.json());
//app.use(bodyParser.json());
app.use(express.static('public'));
app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'common' : 'dev', {
    skip: (req, res) => process.env.NODE_ENV === 'test'
  })
);
app.use(cors({ origin: CLIENT_ORIGIN })
);

//console.log(knex, 'knex')
//===========GET TEACHER==============WORKS
app.get('/api/teachers', jsonParser, (req, res, next) => {
  //console.log(knex.raw, 'knex raw not cooked')
  knex('teachers')
    .select('id', 'first_name', 'last_name', 'password', 'email')
    // .from('teachers')
    .then(results => {
      res.json(results)
    })
    .catch(err => {
      next(err)
    })
})
//==========POST TEACHER=================WORKS
app.post('/api/teachers', jsonParser, (req, res, next) => {
  console.log('hello dakota')
  const { first_name, last_name, email, password } = req.body;
  console.log(req.body, 'line 45 in index.js')

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
      console.log(err, 'server side error')
      next(err);
    });
});
//========UPDATE TEACHER ===========

//=========DELETE TEACHER ==========

//========GET STUDENT ==============WORKS
app.get('/api/students', jsonParser, (req, res, next) => {
  //console.log(knex.raw, 'knex raw not cooked')
  knex('students')
    .select('id', 'name', 'last_name')
    .then(results => {
      res.json(results)
    })
    .catch(err => {
      next(err)
    })
})
//=========POST STUDENT ============WORKS
app.post('/api/students', jsonParser, (req, res, next) => {

  const { id, name, last_name, email, password, teacher_id } = req.body;
  console.log(req.body)

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
//=========DELETE STUDENT ==========

//========GET CARD-COURSE ==============WORKS
app.get('/api/courses', jsonParser, (req, res, next) => {
  //console.log(knex.raw, 'knex raw not cooked')
  knex('courses')
    .select('id', 'title', 'teacher_id')
    .then(results => {
      res.json(results)
    })
    .catch(err => {
      next(err)
    })
})
//=========POST CARD-COURSE ============
//========UPDATE CARD-COURSE ===========
//=========DELETE CARD-COURSE ==========



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

if (require.main === module) {
  dbConnect();
  knex = dbGet();
  runServer();
}

module.exports = { app };
