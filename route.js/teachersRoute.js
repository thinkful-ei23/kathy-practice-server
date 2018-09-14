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
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'common' : 'dev', {
    skip: (req, res) => process.env.NODE_ENV === 'test'
  })
);
app.use(cors({ origin: CLIENT_ORIGIN })
);
//======================
//ENDPOINTS

//============SIGN UP TEACHER===================
app.post('/api', jsonParser, (req, res, next) => {
  const requredFields = [first_name, last_name, email, password,]
  const missingField = requredFields.find(field => !(field in req.body));

  if (missingField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Missing field',
      location: missingField
    });
  }
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
  if (nonTrimmedField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Cannot start or end with whitespace',
      location: nonTrimmedField
    });
  }
  const sizedFields = {
    username: {
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

  let { email, password, first_name = '', last_name = '' } = req.body;
  // Username/email(in this project) and password come in pre-trimmed, otherwise we throw an error
  // before this
  first_name = first_name.trim();
  last_name = last_name.trim();


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
        first_name,
        last_name
      });
    })
    .then(user => {
      return res.status(201).json(user.serialize());
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
// router.get('/', (req, res) => {
//   return User.find()
//     .then(users => res.json(users.map(user => user.serialize())))
//     .catch(err => res.status(500).json({ message: 'Internal server error' }));
// });

module.exports = { app };


//============LOG IN TEACHER===================
//POST req
//app.login('./api/auth/login', )
//check if already exists
app.post('/api/auth/login', jsonParser, (req, es, next) => {
  knex()

  email

})
//
// signup -
//   create new user and sending back to a jwt token

// log finds certain user and returns token

//signup endpoint
//front will take token


//===========GET ALL TEACHERS==============WORKS
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

//===========GET TEACHER by ID==============WORKS
app.get('/api/teachers/:id', jsonParser, (req, res, next) => {
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
app.post('/api/teachers', jsonParser, (req, res, next) => {
  //console.log('hello dakota')
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
app.put('/api/teachers/:id', jsonParser, (req, res, next) => {
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

  knex.insert('teachers')
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
app.delete('/:id', (req, res, next) => {
  knex.del()
    .where('id', req.params.id)
    .from('notes')
    .then(() => {
      res.status(204).end();
    })
    .catch(err => {
      next(err);
    });
});

module.exports = { app };
