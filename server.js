const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

app.use(express.static('public'));

// In-memory structures for rooms and users
// rooms -> { roomName: { users: { socketId: username }, messages: [] } }
const rooms = {};

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on('createRoom', (roomName, cb) => {
    if (!roomName || typeof roomName !== 'string') return cb({ ok: false, error: 'Invalid room name' });
    roomName = roomName.trim();
    if (!rooms[roomName]) {
      rooms[roomName] = { users: {}, messages: [] };
    }
    io.emit('roomsList', Object.keys(rooms));
    cb({ ok: true, room: roomName });
  });

  socket.on('joinRoom', ({room, username}, cb) => {
    if (!room || !username) return cb({ ok:false, error: 'Missing room or username' });
    room = room.trim();
    username = username.trim();
    if (!rooms[room]) rooms[room] = { users: {}, messages: [] };

    // Prevent duplicate username in same room
    const existing = Object.values(rooms[room].users).includes(username);
    if (existing) return cb({ ok:false, error: 'Username already taken in this room' });

    // attach
    socket.join(room);
    rooms[room].users[socket.id] = username;
    socket.data.room = room;
    socket.data.username = username;

    // send room state
    io.to(room).emit('userList', Object.values(rooms[room].users));
    io.to(room).emit('systemMessage', `${username} joined the room`);
    cb({ ok:true, room, users: Object.values(rooms[room].users), messages: rooms[room].messages });
    io.emit('roomsList', Object.keys(rooms));
  });

  socket.on('sendMessage', ({room, text}) => {
    if (!room || !text) return;
    const username = socket.data.username || 'Unknown';
    const ts = new Date().toISOString();
    const message = { username, text, ts };
    if (!rooms[room]) rooms[room] = { users: {}, messages: [] };
    rooms[room].messages.push(message);
    io.to(room).emit('newMessage', message);
  });

  socket.on('leaveRoom', (room) => {
    if (!room) return;
    if (rooms[room] && rooms[room].users[socket.id]) {
      const username = rooms[room].users[socket.id];
      delete rooms[room].users[socket.id];
      socket.leave(room);
      io.to(room).emit('systemMessage', `${username} left the room`);
      io.to(room).emit('userList', Object.values(rooms[room].users));
      // if room empty, delete it
      if (Object.keys(rooms[room].users).length === 0) {
        delete rooms[room];
        io.emit('roomsList', Object.keys(rooms));
      }
    }
  });

  socket.on('disconnect', () => {
    const room = socket.data.room;
    const username = socket.data.username;
    if (room && rooms[room] && rooms[room].users[socket.id]) {
      delete rooms[room].users[socket.id];
      io.to(room).emit('systemMessage', `${username} disconnected`);
      io.to(room).emit('userList', Object.values(rooms[room].users));
      if (Object.keys(rooms[room].users).length === 0) {
        delete rooms[room];
        io.emit('roomsList', Object.keys(rooms));
      }
    }
    console.log('socket disconnected', socket.id);
  });

  // provide rooms list on demand
  socket.on('getRooms', () => {
    socket.emit('roomsList', Object.keys(rooms));
  });
});

http.listen(port, () => {
  console.log('listening on *:' + port);
});
