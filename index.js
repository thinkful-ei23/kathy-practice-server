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
//============SIGN UP STUDENT===================
app.post('/api/auth/signinS', jsonParser, (req, es, next) => {
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


//============SIGN UP TEACHER===================
app.post('/api/auth/signinT', jsonParser, (req, es, next) => {
  const { id, name, last_name, email, password } = req.body;
  //console.log(req.body)

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
//============LOG IN ===================
//POST req
//app.login('./api/auth/login', )
//check if already exists
app.post('/api/auth/login', jsonParser, (req, es, next) => {
  knex()
})

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

//===========GET TEACHER by ID==============
app.get('/api/teachers/:id', jsonParser, (req, res, next) => {
  knex('teachers')
    .select('id', 'first_name', 'last_name', 'password', 'email')
    .from('teachers')
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

//========GET STUDENT ==============WORKS
app.get('/api/students', jsonParser, (req, res, next) => {
  //console.log(knex.raw, 'knex raw not cooked')
  knex('students')
    .select('id', 'name', 'last_name', 'email', 'password', 'teacher_id')
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
//=========DELETE STUDENT ==========

//========GET CARD-COURSE ==============WORKS
app.get('/api/courses', jsonParser, (req, res, next) => {
  //console.log(knex.raw, 'knex raw not cooked')
  knex('courses')
    .select('id', 'title', 'description', 'teacher_id')
    .then(results => {
      res.json(results)
    })
    .catch(err => {
      next(err)
    })
})
//=========POST CARD-COURSE ============WORKS
app.post('/api/courses', jsonParser, (req, res, next) => {

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
