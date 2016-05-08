angular.module('plexusControllers').controller('createRoomCtrl', ['$scope', 'sharedProperties', 'fileSender',
    function ($scope, sharedProperties, fileSender) {

        var sdp = ''
        var room = randomWord()
        var chunkSize = 1024 * 10

        peerInitiator = new window.SimplePeer({
            initiator: true,
            trickle: false
        })

        $scope.roomNameProgressLine = false
        $scope.roomNameCard = true

        peerInitiator.on('error', function (err) {
            console.log('error', err)
        })

        peerInitiator.on('signal', function (data) {
            sdp = JSON.stringify(data)
            console.log('SDP and room name generated')
            createRoom(room)
            $scope.$apply(function () {
                $scope.roomName = room
                $scope.roomNameProgressLine = true
                $scope.roomNameCard = false
            });


        })

        peerInitiator.on('connect', function () {
            console.log('CONNECT')

            sharedProperties.setConnection(true)
            sharedProperties.notifyProvider()
            
            
            socket.emit('live', 'live')
            
        })

        peerInitiator.on('data', function (data) {
            console.log('data: ' + data)
        })


        socket.on('pair', function (info) {
            db.get(room).then(function (doc) {
                if (doc.answer) {
                    peerInitiator.signal(JSON.parse(doc.answer))
                }
            })
        })

        $scope.connect = function () {
            db.get(room).then(function (doc) {
                if (doc.answer) {
                    peerInitiator.signal(JSON.parse(doc.answer))
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