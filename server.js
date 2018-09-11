const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(
	cors({
		origin: CLIENT_ORIGIN
	})
);


app.post('/api/login', bodyParser.json(), (req, res)) => {

	//validate field types
	if (req.body.)



}