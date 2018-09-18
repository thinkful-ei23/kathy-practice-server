'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const router = express.Router();
const bodyParser = require('body-parser');
const { DATABASE_URL } = require('../config');
const jsonParser = bodyParser.json();
let knex;

console.log(router.use, 'router.use in beginning of teachersRouter doc')
router.use(express.json());
router.use(bodyParser.json());
router.use(express.static('public'));
router.use(cors({ origin: DATABASE_URL }));
router.use(
  morgan(process.env.NODE_ENV === 'production' ? 'common' : 'dev', {
    skip: (req, res) => process.env.NODE_ENV === 'test'
  })
);

//============== ENDPOINTS ===================
//============ SIGN UP TEACHER ===================
//Route so user can register
router.post('/api/teachers', jsonParser, (req, res, next) => {
  console.log(first_name, 'I am the first name in teacherRouter')
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
// router.get('/', (req, res) => {
//   return User.find()
//     .then(users => res.json(users.map(user => user.serialize())))
//     .catch(err => res.status(500).json({ message: 'Internal server error' }));
// });



//============LOG IN TEACHER===================
//POST req
//router.login('./api/auth/login', )
//check if already exists
router.post('/api/auth/login', jsonParser, (req, res, next) => {
  user.email
  knex.

    console.log("Logging in");
  res.json("Demo");

})
//
// signup -
//   create new user and sending back to a jwt token

// log finds certain user and returns token

//signup endpoint
//front will take token


//===========GET ALL TEACHERS==============WORKS
router.get('/api/teachers', jsonParser, (req, res, next) => {

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
router.get('/api/teachers/:id', jsonParser, (req, res, next) => {
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
router.post('/api/teachers', jsonParser, (req, res, next) => {
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
router.put('/api/teachers/:id', jsonParser, (req, res, next) => {
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
router.delete('/api/teachers/:id', (req, res, next) => {
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

module.exports = { teachersRouter: router };
