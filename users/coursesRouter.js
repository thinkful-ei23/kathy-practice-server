'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const router = express.Router();
const bodyParser = require('body-parser');
const { DATABASE_URL } = require('../config');
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
//========GET ALL CARDS-COURSES ==============WORKS
router.get('/api/courses', jsonParser, (req, res, next) => {

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
router.get('/api/courses/:id', jsonParser, (req, res, next) => {
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
router.get('/api/courses/:id', jsonParser, (req, res, next) => {
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
router.get('/api/courses/:title', jsonParser, (req, res, next) => {
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
router.post('/api/courses', jsonParser, (req, res, next) => {

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
router.put('/api/courses/:id', (req, res, next) => {
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
router.delete('/api/courses/:id', (req, res, next) => {
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

//======================================
function runServer(port = PORT) {
  const server = router
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

module.exports = { coursesRouter: router };
