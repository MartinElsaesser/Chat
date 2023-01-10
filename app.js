const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
	console.log('a user connected');
	socket.on('chat message', (msg) => {
		io.emit('chat message', msg);
	});
	socket.on('move', (msg) => {
		socket.broadcast.emit('move', msg);
	});
});

server.listen(3000, () => {
	console.log('listening on *:3000');
});