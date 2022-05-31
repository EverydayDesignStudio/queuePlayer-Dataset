const express = require('express'); // require express
const app = express(); // create an app with the express framework
const http = require('http'); // require http
const server = http.createServer(app); // create a server using http and the express app
const { Server } = require("socket.io"); // require the server package from socket.io
const io = new Server(server); // create a new server using socket.io

const connectedPlayers = new Map(); // Map array to keep track of connected clients

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html'); // serve the index.html file which serves as a console/dashboard for debugging
});

app.get('/qp1', (req, res) => {
  res.sendFile(__dirname + '/qp1.html'); // serve the qp1.html file for any requests coming in to /qp1
})

app.get('/qp2', (req, res) => {
  res.sendFile(__dirname + '/qp2.html'); // serve the qp2.html file for any requests coming in to /qp2
})

io.on('connection', (socket) => {
  if(socket.handshake.headers.id) {
    connectedPlayers.set(socket.id, socket.handshake.headers.id);
    io.emit('log', 'connected', connectedPlayers.get(socket.id));
  }

  socket.on('disconnect', () => {
    io.emit('log', 'disconnected', connectedPlayers.get(socket.id));
    connectedPlayers.delete(socket.id);
  });

  socket.on('BPM request', (msg) => {
    io.emit('BPM request', msg, connectedPlayers.get(socket.id));
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});