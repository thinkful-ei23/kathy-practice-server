--    psql -U dev -f seed-data.sql  practice-app;
-- ( run in bash shell)
-- DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;
-- DROP TABLE IF EXISTS teachers;
-- DROP TABLE IF EXISTS join_;

-- SELECT CURRENT_DATE;

-- CREATE TABLE teachers (
-- 	id serial PRIMARY KEY,
-- 	first_name text NOT NULL,
-- 	last_name text NOT NULL,
-- 	email text NOT NULL,
-- 	password text NOT NULL,
-- 	teacher_id int NOT NULL
-- );

CREATE TABLE students (
	id serial PRIMARY KEY,
	name text NOT NULL,
	last_name text ,
	email text NOT NULL,
	password text NOT NULL,
	-- teacher_id int references teacher_id ON DELETE CASCADE
	teacher_id int NOT NULL

);

-- CREATE TABLE courses (
-- 	id serial PRIMARY KEY,
-- 	title text NOT null,
-- 	description text ,
-- 	teacher_id int references teachers(id) ON DELETE CASCADE
-- );
-- ALTER SEQUENCE teachers_id_seq RESTART WITH 1000;
-- ALTER SEQUENCE courses_id_seq RESTART WITH 100;
-- ALTER SEQUENCE students_id_seq RESTART WITH 500;

-- CREATE TABLE joinT (
-- 	id serial PRIMARY KEY,
-- 	student_ID int references student(ID) ON DELETE CASCADE,
-- 	card_ID int references Card(ID) ON DELETE CASCADE

-- );

-- ALTER SEQUENCE notes_id_seq RESTART WITH 1000;
-- ALTER SEQUENCE folders_id_seq RESTART WITH 100;
-- ALTER SEQUENCE tags_id_seq RESTART WITH 500;

-- INSERT INTO folders
-- (name)
-- VALUES
-- ('Archive'), ('Drafts'), ('Personal'), ('Work');

-- INSERT INTO notes
-- (title, content)
-- VALUES

-- teacher ID = 11111111
-- Student ID = 99999999
-- Card ID= 55555555
-- teacher code = 1111


-- INSERT INTO teachers (id, first_name, last_name, email, password, teacher_id) VALUES
-- (1001, 'Amanda', 'LeBoeuf', 'photos@cheese.com', 0987654321, 1111),
-- (1002, 'Kate', 'Hood', 'hook@yarn.com', 0987654321, 1112),
-- (1003, 'Jason', 'Hood', 'anchor@away.com', 0987654321, 1113),
-- (1004, 'Dakota', 'Hood', 'buddy@cutie.net', 0987654321, 1114),
-- (1005, 'Ray', 'LeBoeuf', 'busy@field.edu', 0987654321, 1115);

-- INSERT INTO students (id, name, last_name, email, password, teacher_id) VALUES
-- (501, 'Amanda', 'LeBoeuf', 'photos@cheese.com', 0987654321, 1001),
-- (502, 'Kate', 'Hood', 'hook@yarn.com', 0987654321, 1002),
-- (503, 'Jason', 'Hood', 'anchor@away.com', 0987654321, 1003),
-- (504, 'Dakota', 'Hood', 'buddy@cutie.net', 0987654321, 1004),
-- (505, 'Ray', 'LeBoeuf', 'busy@field.edu', 0987654321, 1005);

-- INSERT INTO students (id, name, last_name, email, password) VALUES
-- (501, 'Amanda', 'LeBoeuf', 'photos@cheese.com', 0987654321),
-- (502, 'Kate', 'Hood', 'hook@yarn.com', 0987654321),
-- (503, 'Jason', 'Hood', 'anchor@away.com', 0987654321),
-- (504, 'Dakota', 'Hood', 'buddy@cutie.net', 0987654321),
-- (505, 'Ray', 'LeBoeuf', 'busy@field.edu', 0987654321);

-- INSERT INTO courses (id, title, description, teacher_id) VALUES
-- (101, 'page1', 'something1', 1001),
-- (102, 'page2', 'something2', 1002),
-- (103, 'page3', 'something3', 1003),
-- (104, 'page3', 'something4', 1004),
-- (105, 'page4', 'something5', 1005);

--============================================= COMMANDS TO SELECT INSERT ETC =============
-- ADD JOIN
-- SELECT title, tags.name, folders.name  FROM notes
-- LEFT JOIN folders ON notes.folder_id = folders.id
-- LEFT JOIN notes_tags ON notes.id = notes_tags.note_id
-- LEFT JOIN tags ON notes_tags.tag_id = tags.id;

-- SELECT title, tags.name as tags_name, folders.name as folder_name FROM notes
-- LEFT JOIN folders ON notes.folder_id = folders.id
-- LEFT JOIN notes_tags ON notes.id = notes_tags.note_id
-- LEFT JOIN tags ON notes_tags.tag_id = tags.id;

--\x -- enable expanded display
-- SELECT id, title, created from notes;
-- SELECT title from notes;

-- SELECT * from notes LIMIT 5;
-- SELECT * from notes ORDER BY title;
-- SELECT * from notes ORDER BY title DESC;
-- SELECT * from notes ORDER BY created;
-- SELECT * from notes ORDER BY created DESC;
-- SELECT * from notes WHERE title = 'Bob Ross'
-- SELECT title from notes WHERE title LIKE '%the%';  -- find the anyplace in title
-- UPDATE notes SET title = 'New Title',  content = 'This is new, updated content' WHERE id = 1013;
-- INSERT INTO notes (title) VALUES ('New Note Title');
-- DELETE FROM notes WHERE id = 1013;

-- ----------------------USE TO RUN DATABASE -----------------------
--psql -U dev -f noteful-app.1.sql -d noteful-app;

--  -----------------Querying samples ------------------------------
-- SELECT id, name, borough, cuisine  FROM restaurants;
-- SELECT DISTINCT borough  FROM restaurants;
-- SELECT id, name, borough, cuisine FROM restaurants WHERE id='225';
-- SELECT name, borough, cuisine FROM restaurants WHERE borough = 'Brooklyn' AND cuisine = 'Italian';
-- SELECT name, borough, cuisine FROM restaurants WHERE borough = 'Brooklyn' AND cuisine in ('Italian', 'Chinese');

-- ----------------------ORDER BY    LIMIT ------------------------------
-- SELECT id, name from restaurants WHERE borough = 'Bronx' AND cuisine = 'Japanese' ORDER BY name DESC;
-- SELECT id, name FROM restaurants ORDER BY name DESC; LIMIT 3;

-- ------------------ Aggregate: Count, Max, Min, Avg ------------------------------
-- SELECT count(*) FROM grades;
-- SELECT max(score) FROM grades;
-- SELECT min(score) FROM grades;
-- SELECT avg(score) FROM grades;

-- ------------------ UPDATING   ------------------------------
-- UPDATE restaurants  SET name = 'Famous Original Ray''s Pizza'  WHERE id = 5269;
-- UPDATE restaurants  SET cuisine = 'Vegetarian'  WHERE cuisine = 'Pizza';

-- ------------------ DELETING  ------------------------------
-- DELETE FROM restaurants WHERE id = 225;
-- DELETE FROM grades WHERE grade = 'Z';
-- DELETE FROM grades;  (Beware: deletes all rows in grades)

-- ------------------ ENUMERATIONS  ------------------------------
-- CREATE TYPE mood AS ENUM ('sad', 'ok', 'happy');
-- CREATE TABLE person (
--     name text,
--     current_mood mood
-- );
-- INSERT INTO person VALUES ('Moe', 'happy');
-- INSERT INTO person VALUES ('Larry', 'sad');
-- INSERT INTO person VALUES ('Curly', 'ok');
-- SELECT * FROM person WHERE current_mood = 'happy';
--  name | current_mood
-- ------+--------------
--  Moe  | happy

-- SELECT * FROM person WHERE current_mood > 'sad';
--  name  | current_mood
-- -------+--------------
--  Moe   | happy
--  Curly | ok

--  -----------------Commands to use ------------------------------
--Start SERVER     	pg_ctl start -l "$PGDATA/server.log"
--Create Database  	createdb -U dev <DATABASE>
--Import      			psql <DATABASE> < ~/Downloads/import-file.sql
--             			psql -U dev -d <DATABASE> -f ~/Downloads/import-file.sql
--Server Status   	pg_ctl status
--Drop Database   	dropdb <DATABASE>

--  -----------------pg_ctl Shell Commands ------------------------------
-- 	pg_ctl is a utility to initialize, start, stop, or control a PostgreSQL server.
-- Usage:
--   pg_ctl init[db] [-D DATADIR] [-s] [-o OPTIONS]
--   pg_ctl start    [-D DATADIR] [-l FILENAME] [-W] [-t SECS] [-s]
--                   [-o OPTIONS] [-p PATH] [-c]
--   pg_ctl stop     [-D DATADIR] [-m SHUTDOWN-MODE] [-W] [-t SECS] [-s]
--   pg_ctl restart  [-D DATADIR] [-m SHUTDOWN-MODE] [-W] [-t SECS] [-s]
--                   [-o OPTIONS] [-c]
--   pg_ctl reload   [-D DATADIR] [-s]
--   pg_ctl status   [-D DATADIR]
--   pg_ctl promote  [-D DATADIR] [-W] [-t SECS] [-s]
--   pg_ctl kill     SIGNALNAME PID

-- Common options:
--   -D, --pgdata=DATADIR   location of the database storage area
--   -s, --silent           only print errors, no informational messages
--   -t, --timeout=SECS     seconds to wait when using -w option
--   -V, --version          output version information, then exit
--   -w, --wait             wait until operation completes (default)
--   -W, --no-wait          do not wait until operation completes
--   -?, --help             show this help, then exit
-- If the -D option is omitted, the environment variable PGDATA is used.

-- Options for start or restart:
--   -c, --core-files       allow postgres to produce core files
--   -l, --log=FILENAME     write (or append) server log to FILENAME
--   -o, --options=OPTIONS  command line options to pass to postgres
--                          (PostgreSQL server executable) or initdb
--   -p PATH-TO-POSTGRES    normally not necessary

-- Options for stop or restart:
--   -m, --mode=MODE        MODE can be "smart", "fast", or "immediate"

-- Shutdown modes are:
--   smart       quit after all clients have disconnected
--   fast        quit directly, with proper shutdown (default)
--   immediate   quit without complete shutdown; will lead to recovery on restart

-- Allowed signal names for kill:
--   ABRT HUP INT QUIT TERM USR1 USR2

-- Report bugs to <pgsql-bugs@postgresql.org>.
--  -----------------PSQL Shell Commands ------------------------------

--Login						psql -h <HOSTNAME> -U <USERNAME> <DATABASE>
--Meta-commands		List Databases   : \l
								-- Tables in DB    : \d
								-- Public Tables   : \dt
								-- Public Tables   : \dt+ (add size and description)
								-- To Exit/Quit    : \q
								-- Connect to other: \c
--Prompts
			-- mydb=# super-user
			-- mydb=> normal user
			-- mydb-# continuation


-- --------------------CREATE A TABLE-----------------------------
-- CREATE TABLE restaurants (
--   id                       serial     PRIMARY KEY,
--   name                     text       NOT NULL,
--   nyc_restaurant_id        integer,
--   borough                  borough_options,
--   cuisine                  text,
--   address_building_number  text,
--   address_street           text,
--   address_zipcode          text
-- );

-- PRIMARY KEY : unique (non-duplicate), non-null values
-- SERIAL: auto-incrementing sequence of integers
-- DROP TABLE restaurants;