let express = require('express');
let fs = require('fs');
let path = require('path');

var app =  express.Router();

app.get('/outGeneralConsult', function(request, response) {
	let connection = require('db_integration');
        connection.query('SELECT linkVirtualVisit, linkFAQ, endMessage, noEvent , video1, video2, date, idUser FROM Configuration', (error, results) => { 
			console.log(results);
			if(error){
				response.json({
					error: error
				});
				return;
			}
			response.json(results);			
		});
	
});


app.post('/inGeneralConsult', function(request, response) {
	let connection = require('db_integration');
	let virtualVisit = request.body.linkVirtualVisit;
    let faq = request.body.linkFAQ;
	let message = request.body.message;
	let username = request.session.username;
	let noEvent = request.body.noEvent;
	let video1 = request.body.video1;
	let video2 = request.body.video2;
	
    var sql = "UPDATE  Configuration SET linkVirtualVisit = ?, linkFAQ = ?, endMessage = ? , noEvent = ?, video1 = ?, video2= ? , idUser = ?, date =now() ;";
    connection.query(sql, [virtualVisit, faq , message, noEvent, video1, video2, username ], function (err, result) {
        if (err){
			response.status(500).json(
				{
					"readyState":err.code,
					"status":err.sqlState,
					"statusText":err.sqlMessage
				}
			);
			return;
		}
		response.json({
			message: 'success'
		})			
	});
});

app.post('/inEvent', function(request, response) {
	let connection = require('db_integration');
	let dateStart = request.body.dateInitial;
	let eventName = request.body.eventName;
	let user = request.session.username;
	let sql = "INSERT INTO Event (startDate, nomEvent, idUser) VALUES (?,?,?);";
	connection.query(sql, [dateStart, eventName ,user], function (err, result) {
		if (err){
			console.error(err);
			response.status(500).json(
				{
					"readyState":err.code,
					"status":err.sqlState,
					"statusText":err.sqlMessage
				}
			);
			return;
		}
		response.json({
			message: 'success'
		})			
	});
});


app.get('/inEvent', function(request, response) {
	try{
		let connection = require('db_integration');
		
        connection.query('SELECT idEvent, date_format(startDate,\'%Y-%m-%d\') startDate , nomEvent FROM event order by startDate desc', (error, results) => { 
			
			if(error){
				response.status(500).json({
					"readyState":error.code,
					"status":error.sqlState,
					"statusText":error.sqlMessage
				});
				return;
			}
			response.status(200).json(results);			
		});
		
	}catch(error){
		
		response.status(500).json(
			{
				"readyState":error.code,
				"status":error.sqlState,
				"statusText":error.sqlMessage
			}
		);		
	}
});

app.put('/inEvent', function(request, response) {
	console.log("put in event  %s" , JSON.stringify(request.body));
	let connection = require('db_integration');
	let eventId = request.body.idEventUpdate;
	let dateStart = request.body.dateInitial;
	let eventName = request.body.eventName;
	let user = request.session.username;
	console.log(eventId);
	let sql = "UPDATE event SET startDate = date_format(?,\'%Y-%m-%d\'), nomEvent = ?, idUser = ? where idEvent = ? ;";
	connection.query(sql, [dateStart, eventName ,user, eventId ], function (err, result) {
		console.log(result);
		if (err){
			console.error(err);
			response.status(500).json(
				{
					"readyState":err.code,
					"status":err.sqlState,
					"statusText":err.sqlMessage
				}
			);
			return;
		}
		response.json({
			message: 'success'
		})			
	});
});

app.delete('/inEvent', function(request, response) {
	console.log("delete in event");
	let connection = require('db_integration');
	let eventId = request.body.idEventUpdate;	
	console.log("delete in event" + eventId);
	let sql = "DELETE FROM event where idEvent = ? ;";
	connection.query(sql, [eventId ], function (err, result) {
		
		if (err){
			console.error(err);
			response.status(500).json(
				{
					"readyState":err.code,
					"status":err.sqlState,
					"statusText":err.sqlMessage
				}
			);
			return;
		}
		response.json({
			message: 'success'
		})			
	});
});

//Methods speaker

app.get('/inSpeaker', function(request, response) {
	try{
		let connection = require('db_integration');
        connection.query("SELECT idSpeaker, name, description, REPLACE(photoLink, '#idSpeaker#', idSpeaker) as photoLink, chat, linkchat, idUser FROM speaker", (error, results) => { 
			if(error){
				response.json({
					error: error
				});
				return;
			}
			response.json(results);			
		});
		
	}catch(error){
		console.error(error);
		response.status(500).json(
			{
				"readyState":error.code,
				"status":error.sqlState,
				"statusText":error.sqlMessage
			}
		);		
	}
});

app.post('/inSpeaker', function(request, response) {
	
	try{
		if(!request.files){
			response.status(500).json({
				status : "Error",
				error: {
					"readyState" : 500,
						"status" : -1,
					"statusText" : "Invalid File"
				}
			})
			return;
		}

		let connection = require('db_integration'); 
		let name = request.body.name;
		let description = request.body.description;
		let chat = request.body.chat;
		let user = request.session.username;
		let linkchat = request.body.linkchat;
		let fileName = request.files.file.name;
		
		let imageName = "photo." + fileName.substr(fileName.indexOf(".") + 1);
		let photoLink = '/images/speaker/#idSpeaker#/' + imageName;
		
		let sql = "INSERT INTO Speaker (name, description, photoLink, chat, linkchat, idUser) VALUES (?,?,?,?,?,?);";
		
		connection.query(sql, [name, description , photoLink , JSON.parse(chat), linkchat, user], function (err, result) {
			if (err){
				console.error(err);
				throw (err);
			}
			console.log('Result %s', JSON.stringify(result));

			let pathDir = path.resolve(imagesPath + "/speaker/"+ result.insertId + "/");
			if(!fs.existsSync(pathDir)){
				fs.mkdirSync(pathDir);
			}

			request.files.file.mv(imagesPath + "/speaker/"+ result.insertId + "/" + imageName, function(err){
				if(err){
					console.error(err);
					throw (err);
				}
			});
		});

	}catch(error){
		console.log("ERROR => ");
		console.error(error);
		return response.status(500).json(
			{
				"readyState":error.code,
				"status":error.sqlState,
				"statusText":error.sqlMessage
			}
		);		
	}

	return 	response.status(200).json({
		status : "success"
	});
});

app.put('/inSpeaker', function(request, response) {
	try{
		let connection = require('db_integration'); 
		let idSpeaker = request.body.idSpeaker;
		let name = request.body.name;
		let description = request.body.description;
		let chat = request.body.chat;
		let linkchat = request.body.linkchat;
		let user = request.session.username;


		let fileName = request.files != null ? request.files.file.name : null;
		let imageName = fileName != null ? "photo." + fileName.substr(fileName.indexOf(".") + 1) : null;
		const photoLink = request.files ? '/images/speaker/#idSpeaker#/' + imageName : null;
		var sql = "UPDATE Speaker SET name = ?, description = ?," + (request.files ? " photoLink = '" + photoLink + "' ," : "")  + "chat = " + chat + ",  linkchat = ?, idUser = ? where idSpeaker = ? ;";

		var query = connection.query(sql, [name, description ,   linkchat, user, idSpeaker], function (err, result) {
			if (err){
				throw(err);
			} 
			if(request.files){
				request.files.file.mv(imagesPath + "/speaker/"+ idSpeaker + "/" + imageName, function(err){
					if(err){
						throw (err);
					}
				});
			}
		});
		console.log(query.sql);
	}catch(error){
		console.error(error);
		return response.status(500).json(
			{
				"readyState":error.code,
				"status":error.sqlState,
				"statusText":error.sqlMessage
			}
		);		
	}
	return response.status(200).json({
		status : "success"
	});
});

app.delete('/inSpeaker', function(request, response) {
	
		let connection = require('db_integration');
		console.log("ID Speaker to delete : %s", request.body.idSpeaker);
        connection.query('DELETE FROM speaker where idSpeaker = ?', [request.body.idSpeaker], (error, results) => { 
			console.log(results);
			if(error){
				response.status(500).json({
					"readyState":error.code,
					"status":error.sqlState,
					"statusText":error.sqlMessage
				});
				return;
			}
			response.status(200).json({
				status : "success"
			});			
		});
		
	
});


app.get('/outSpeakerDdl', function(request, response) {
	try{
		let connection = require('db_integration');
        connection.query('SELECT idSpeaker, name FROM speaker', (error, results) => { 
			console.log("ddl" + JSON.stringify(results));
			if(error){
				response.json({
					error: error
				});
				return;
			}
			response.json(results);			
		});
		
	}catch(error){
		console.error(error);
		response.status(500).json(
			{
				"readyState":error.code,
				"status":error.sqlState,
				"statusText":error.sqlMessage
			}
		);		
	}
});

app.get('/outEvents', function(request, response) {
	try{
		let connection = require('db_integration');
		console.log("outEvents- eventos disponibles");
        connection.query('SELECT idEvent, date_format(startDate,\'%Y-%m-%d\') date FROM event	where  date_format(startDate,\'%Y-%m-%d\') >= date_format(now(),\'%Y-%m-%d\') ;', (error, results) => { 
			if(error){
				response.json({
					error: error
				});
				return;
			}
			response.json(results);			
		});
		
	}catch(error){
		console.error(error);
		response.status(500).json(
			{
				"readyState":error.code,
				"status":error.sqlState,
				"statusText":error.sqlMessage
			}
		);		
	}
});

app.get('/Events', function(request, response) {
	try{
		let connection = require('db_integration');
		console.log("Events- eventos disponibles");
        connection.query('SELECT idEvent, date_format(startDate,\'%Y-%m-%d\') date FROM event	 ;', (error, results) => { 
			if(error){
				response.json({
					error: error
				});
				return;
			}
			response.json(results);			
		});
		
	}catch(error){
		console.error(error);
		response.status(500).json(
			{
				"readyState":error.code,
				"status":error.sqlState,
				"statusText":error.sqlMessage
			}
		);		
	}
});


app.post('/inConference', function(request, response) {
	try{
	let connection = require('db_integration');
	let nameConference = request.body.nameConference;
	let event = request.body.event;
    let init = request.body.init;
	let end = request.body.end;
	let link = request.body.link;
	let speaker = request.body.speaker;
	let username = request.session.username;
	
	

    var sql = "INSERT INTO  Conference(nameConference, idEvent, idSpeaker, start, end, linkConference, date, idUser) VALUES(?,?,?,?,?,?,now(),?) ;";
    connection.query(sql, [nameConference,event,speaker, init , end, link, username  ], function (err, result) {
		console.log("response " + result);
		if (err){
			console.log("error " + err);
			response.status(500).json(
				{
					"readyState":err.code,
					"status":err.sqlState,
					"statusText":err.sqlMessage
				}
			);
			return;
		}
		response.json({
			message: 'success'
		})			
	});
	}
	catch(Err)
	{
		console.error(Err);
	}

});


app.get('/inConference', function(request, response) {
	try{
		let connection = require('db_integration');
		
        connection.query('SELECT idConference,  nameConference, speaker.name, start, end, linkConference, conference.idSpeaker , conference.idEvent FROM conference INNER JOIN Speaker on conference.idSpeaker = speaker.idSpeaker order by conference.start asc  ;		', (error, results) => { 
			
			if(error){
				response.status(500).json({
					"readyState":error.code,
					"status":error.sqlState,
					"statusText":error.sqlMessage
				});
				return;
			}
			response.status(200).json(results);			
		});
		
	}catch(error){
		
		response.status(500).json(
			{
				"readyState":error.code,
				"status":error.sqlState,
				"statusText":error.sqlMessage
			}
		);		
	}
});


app.delete('/inConference', function(request, response) {
	
	let connection = require('db_integration');
	console.log("ID conference to delete : %s", request.body.idConference);
	connection.query('DELETE FROM Conference where idConference = ?', [request.body.idConference], (error, results) => { 
		console.log(results);
		if(error){
			response.status(500).json({
				"readyState":error.code,
				"status":error.sqlState,
				"statusText":error.sqlMessage
			});
			return;
		}
		response.status(200).json({
			status : "success"
		});			
	});
	

});

app.put('/inConference', function(request, response) {
	try{
	let connection = require('db_integration');
	let idConference = request.body.idConference;
	let nameConference = request.body.nameConference;
	let event = request.body.event;
    let init = request.body.init;
	let end = request.body.end;
	let link = request.body.link;
	let speaker = request.body.speaker;
	let username = request.session.username;
	
	console.log("idConference "+ nameConference);
	
    var sql = "UPDATE  Conference SET nameConference=?, idEvent=?, idSpeaker=?, start=?, end=?, linkConference=?, date=now(), idUser=? where idConference=? ;";
    let con = connection.query(sql, [nameConference,event,speaker, init , end, link, username ,idConference ], function (err, result) {
		if (err){
			console.log("error " + err);
			response.status(500).json(
				{
					"readyState":err.code,
					"status":err.sqlState,
					"statusText":err.sqlMessage
				}
			);
			return;
		}
		
		response.json({
			message: 'success'
		})			
	});
	console.log("update "+ con);

	}
	catch(Err)
	{
		console.error(Err);
	}

});



module.exports = app;