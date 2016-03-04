var plexusControllers = angular.module('plexusControllers', [])

/*global things..*/
var socket = io.connect('http://localhost:3001')
var db = new PouchDB('http://localhost:5984/sdps')

/*node.js modules*/
var fs = require('fs')
var randomWord = require('random-word-by-length')
var chunkit = require('chunkit')

var chunkSize = 1024 * 10

plexusControllers.controller('createRoomCtrl', ['$scope', function ($scope) {

    var sdp = ''
    var room = randomWord()

    var peer = new window.SimplePeer({
        initiator: true,
        trickle: false
    })

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
        });
    })

    peer.on('connect', function () {
        console.log('CONNECT')

        var fStream = fs.createReadStream(__dirname + '/05 - Beginning Again.mp3');
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

        var dataBuffer = new Buffer(buffered.data)
        console.log(dataBuffer.length)

        writeableStream.write(dataBuffer)

        if (dataBuffer.length != chunkSize) {
            writeableStream.end()
            console.log('file is downloaded')
        }
    })
    /* Simple-Peer events END */

//     writeableStream.on('finish', () => {
//         console.log('it is just ended')
// 
//         fs.readFile(writeableStreamName, (err, data) => {
//             if (err) throw err
// 
//             var dataObject = JSON.parse(data.toString())
// 
//             console.log(dataObject)
// 
//             var fileName = dataObject.fileName
//             var fileContent = JSON.stringify(dataObject.fileContent)
// 
//             const content = JSON.parse(fileContent, (key, value) => {
//                 return value && value.type === 'Buffer' ? new Buffer(value.data) : value
//             })
// 
//             fs.writeFile(fileName, content, (err) => {
//                 if (err) throw err
//                 console.log('It\'s saved!')
//             })
// 
//         })
// 
//     })

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