var plexusControllers = angular.module('plexusControllers', [])

/*global things..*/
var socket = io.connect('http://localhost:3001')
var db = new PouchDB('http://localhost:5984/sdps')

/*node.js modules*/
var fs = require('fs')
var randomWord = require('random-word-by-length')


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
        fs.readFile('cover.jpg', (err, filecontent) => {

            var fileName = 'cover_copy.jpg'

            if (err) throw err
            var info = { fileName: fileName, fileContent: filecontent }
            const buf = new Buffer(JSON.stringify(info))

            peer.send(buf)
            console.log('sending...')
        })
    })

    peer.on('data', function (data) {
        console.log('data: ' + data)
    })   
    /* Simple-Peer events END */


    socket.on('pair', function (info) {
        console.log(info)
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
        const buf = new Buffer(data)
        console.log('Data captured, its length is: ' + data.length)

        var dataObject = JSON.parse(buf.toString())

        var fileName = dataObject.fileName
        var fileContent = JSON.stringify(dataObject.fileContent)

        const content = JSON.parse(fileContent, (key, value) => {
            return value && value.type === 'Buffer' ? new Buffer(value.data) : value
        })

        fs.appendFile(fileName, content, (err) => {
            if (err) throw err
            console.log('It\'s saved!')
        })
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
}])