'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const router = express.Router();
const bodyParser = require('body-parser');
const { DATABASE_URL } = require('../config'); //TODO is PORT needed?
const jsonParser = bodyParser.json();
let knex;

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
//============SIGN UP STUDENT===================
router.post('/api/students', jsonParser, (req, res, next) => {
  const requredFields = [name, last_name, email, password, teacher_id]
  const missingField = requredFields.find(field => !(field in req.body));

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
// router.get('/', (req, res) => {
//   return User.find()
//     .then(users => res.json(users.map(user => user.serialize())))
//     .catch(err => res.status(500).json({ message: 'Internal server error' }));
// });

//============LOG IN STUDENT===================
router.post('/api/auth/login', jsonParser, (req, es, next) => {

  const authToken = createAuthToken(req.user.serialize());
  res.json({ authToken });


  console.log("Logging in");
  res.json("Demo");
});
//============LOG IN STUDENT===================
router.post('/api/login', jsonParser, (req, res, next) => {

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
router.get('/api/students', jsonParser, (req, res, next) => {
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
router.get('/api/students', jsonParser, (req, res, next) => {

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
router.get('/api/students/:id', jsonParser, (req, res, next) => {
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
router.post('/api/students', jsonParser, (req, res, next) => {

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
router.put('/api/students/:id', jsonParser, (req, res, next) => {
  const { id } = req.params;

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
// router.route('/students/:id')
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
// router.delete('api/students/:id', jsonParser, (req, res, next)){

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
module.exports = { studentsRouter: router };