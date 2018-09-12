//const express = require('express');
//const { PORT } = require('./config');
//const dbConnect = require('./db-knex')

//const app = express();
// app.use(express.json());
// app.use(express.static('public'));
//app.use(
// 	cors({
// 		origin: CLIENT_ORIGIN
// 	})
// );
//========== POST NEW TEACHER ===============


//api - backend needs to get teachercode from db before student success register


app.listen(process.env.PORT, () => console.log(
	`Your app is listening on port ${process.env.PORT}`));

app.get('/api/cheeses', (req, res) => {
	// return
	res.json([
		"Bath Blue",
		"Barkham Blue",
		"Buxton Blue",
		"Cheshire Blue",
		"Devon Blue",
		"Dorset Blue Vinney",
		"Dovedale",
		"Exmoor Blue",
		"Harbourne Blue",
		"Lanark Blue",
		"Lymeswold",
		"Oxford Blue",
		"Shropshire Blue",
		"Stichelton",
		"Stilton",
		"Blue Wensleydale",
		"Yorkshire Blue"
	]);
});

/*
knex
	.select('teacher.id', 'first_name', 'last_name')
	.from('teacher')
	.modify(queryBuilder => {
		if (searchTerm) {
			queryBuilder.where('title', 'like', `%${searchTerm}%`);
		}
	})
	.orderBy('teacher.id')
	.then(results => {
		console.log(JSON.stringify(results, null, 2));
	})
	.catch(err => {
		console.error(err);
	});
*/

	// app.get('/api/teacher/:id', (req, res) => {
// 	const id = req.params.id;
// 	res.json(data.find(item => item.id === Number(id)))
// };