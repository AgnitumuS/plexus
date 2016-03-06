var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var PouchDB = require('pouchdb')

app.get('/', function(req, res) {
    res.send('Server is running on 3001')
});

io.on('connection', function(socket) {

    socket.on('create or join', function(info) {
        var room = info.room
        if (io.sockets.adapter.rooms[room] === undefined) {
            var clientNumber = 0;
            var sdp = info.offer
        } else {
            var clientNumber = io.sockets.adapter.rooms[room].length;
            var sdp = info.answer
        }

        var db = new PouchDB('http://localhost:5984/sdps')

        if (clientNumber === 0) {
            socket.join(room)

            info._id = info.room
            db.put(info)
            socket.emit('join', 'join')
        } else if (clientNumber === 1) {
            socket.join(room)

            db.get(room).then(function(doc) {
                doc.answer = info.answer;
                return db.put(doc).then(function() {
                })
            })

            io.to(room).emit('pair', 'half')
        } else {
            console.log('Room is full')
        }
    });

});

http.listen(3001, function() {
    console.log('listening on *:3001');
});
