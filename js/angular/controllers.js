var plexusControllers = angular.module('plexusControllers', [])

/*global things..*/
var socket = io.connect('http://localhost:3001')
var db = new PouchDB('http://localhost:5984/sdps')

/*node.js modules*/
var fs = require('fs')
var randomWord = require('random-word-by-length')
var chunkit = require('chunkit')
var play = require('play-audio')

var chunkSize = 1024 * 10

plexusControllers.controller('mainCtrl', ['$scope', function ($scope) {

    $scope.songInfo = true
    $scope.playing = false

    $scope.songName = "Beginning Again"
    $scope.artistName = "John Frusciante"

    $scope.playSong = function () {
        var p = play('05 - Beginning Again.mp3')

        if (!$scope.playing) {
            $scope.playing = true
            $scope.songInfo = false
            p.play()
                .controls()
                .volume(0.3)
        }
    }

}])

plexusControllers.controller('createRoomCtrl', ['$scope', function ($scope) {

    var sdp = ''
    var room = randomWord()

    var peer = new window.SimplePeer({
        initiator: true,
        trickle: false
    })

    $scope.roomNameProgressLine = false
    $scope.roomNameCard = true

    /* Simple-Peer events START */
    peer.on('error', function (err) {
        console.log('error', err)
    })

    peer.on('signal', function (data) {
        sdp = JSON.stringify(data)
        console.log('SDP and room name generated')
        createRoom(room)
        $scope.$apply(function () {
            $scope.roomName = room
            $scope.roomNameProgressLine = true
            $scope.roomNameCard = false
        });
    })

    peer.on('connect', function () {
        console.log('CONNECT')

        var filename = '/05 - Beginning Again.mp3'

        var fileInfo = { song: filename }
        const buf = new Buffer(JSON.stringify(fileInfo))
        peer.send(buf)

        var fStream = fs.createReadStream(__dirname + filename);
        var chunkStream = new chunkit(fStream, { bytes: chunkSize }, function (err, chunk) {
            if (err) return console.error('Error: ', err)

            if (chunk.data) {
                const buf = new Buffer(JSON.stringify(chunk.data))
                peer.send(buf)
            }

        })
    })

    peer.on('data', function (data) {
        console.log('data: ' + data)
    })   
    /* Simple-Peer events END */


    socket.on('pair', function (info) {
        db.get(room).then(function (doc) {
            if (doc.answer) {
                peer.signal(JSON.parse(doc.answer))
            }
        })
    })

    $scope.connect = function () {
        db.get(room).then(function (doc) {
            if (doc.answer) {
                peer.signal(JSON.parse(doc.answer))
            }
        })
    }

    function createRoom(roomName) {
        var info = {
            room: room,
            offer: sdp
        }
        socket.emit('create or join', info)
    }

}])

plexusControllers.controller('joinRoomCtrl', ['$scope', function ($scope) {

    var roomName = ''
    var songName = ''
    var peer = new window.SimplePeer({
        initiator: false,
        trickle: false
    })
    var writeableStreamName = 'stream' + getTimestamp() + '.txt'
    var writeableStream = fs.createWriteStream(writeableStreamName)
    
    /* Simple-Peer events START */
    peer.on('error', function (err) {
        console.log('error', err)
    })

    peer.on('signal', function (data) {
        sdp = JSON.stringify(data)
        console.log('SDP and room name generated')
        joinRoom(sdp)
    })

    peer.on('data', function (data) {
        const chunk = new Buffer(data)
        var buffered = JSON.parse(chunk.toString())

        if (buffered.song) {
            songName = buffered.song
            console.log(songName)
        }
        else {
            var dataBuffer = new Buffer(buffered.data)

            writeableStream.write(dataBuffer)

            if (dataBuffer.length != chunkSize) {
                writeableStream.end()
                console.log('file is downloaded. ')
            }
        }
    })
    /* Simple-Peer events END */

    $scope.joinRoom = function () {
        roomName = $scope.roomName
        console.log(roomName)
        db.get(roomName).then(function (doc) {
            peer.signal(JSON.parse(doc.offer))
        })
    }

    function joinRoom(sdp) {
        var info = {
            room: roomName,
            answer: sdp
        }
        socket.emit('create or join', info)
    }

    function getTimestamp() {
        return Math.floor(Date.now() / 1000)
    }

}])