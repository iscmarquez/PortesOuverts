var express = require('express');
var path = require('path');

var app =  express.Router();
app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname + '/login.html'));
});

app.post('/auth', function(request, response) {
	let connection = require('@db_integration/db');
	var username = request.body.username;
	var password = request.body.password;
	if (username && password) {
		connection.query('SELECT * FROM user WHERE email = ? AND password = ?', [username, password], function(error, results, fields) {
			console.log('Result %s', results);
			if (results && results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				response.redirect('/login/home');
			} else {
				response.send('Incorrect Username and/or Password!');
			}			
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});

app.get('/home', function(request, response) {
	if (request.session.loggedin) {
		response.send('Welcome back, ' + request.session.username + '!');
	} else {
		response.send('Please login to view this page!');
	}
	response.end();
});

module.exports = app;