var plexusControllers = angular.module('plexusControllers', [])

var socket = io('http://localhost:3001')

var peer = new window.SimplePeer({
    initiator: true,
    trickle: false
})

var sdp = ''
var room = 'room' + new Date()


plexusControllers.controller('mainCtrl', ['$scope', function ($scope) {

    peer.on('error', function (err) {
        console.log('error', err)
    })

    peer.on('signal', function (data) {
        sdp = JSON.stringify(data)
        console.log(sdp)

        console.log('room name: ' + room)

        createOrJoin(room)
    })

    $scope.createroom = function () {

        console.log('location >' + location.hash + '<')

        var roomname = room

        if (location.hash === '#/createroom') {
            createOrJoin(roomname)
        }

    }

    function createOrJoin(roomName) {

        var info = {
            room: room,
            offer: sdp
        }

    socket.emit('create or join', info)

    }

}])