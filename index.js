'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const knex = require('knex');
const bodyParser = require('body-parser');
const { dbConnect } = require('./db-knex');
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

// app.use("/api/teacher", teacherRouter);
// app.use("/api/student", studentRouter);
// app.use("/api/course", courseRouter);

//===========GET TEACHER==============
app.get('/api/teachers', jsonParser, (req, res, next) => {
  //let filter = {};
  teachers.filter()
    .then(results => {
      res.json(results)
    })
    .catch(err => {
      next(err)
    })
})
//==========POST TEACHER=================
app.post('/api/teachers', jsonParser, (req, res, next) => {

  const { id, first_name, last_name, email, password, teacher_code } = req.body;
  console.log(req.body)

  /***** Never trust users. Validate input *****/
  // if (!first_name) {
  //   const err = new Error('Missing `first_name` in request body');
  //   err.status = 400;
  //   return next(err);
  // }
  const newTeacher = {
    id: id,
    first_name: first_name,
    last_name: last_name,
    email: email,
    password: password,
    teacher_code: teacher_code
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
      next(err);
    });
});

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
  runServer();
}

module.exports = { app };
