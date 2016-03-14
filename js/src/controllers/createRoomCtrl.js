angular.module('plexusControllers').controller('createRoomCtrl', ['$scope', function($scope) {

    var sdp = ''
    var room = randomWord()
    var chunkSize = 1024 * 10

    var peer = new window.SimplePeer({
        initiator: true,
        trickle: false
    })

    $scope.roomNameProgressLine = false
    $scope.roomNameCard = true

    /* Simple-Peer events START */
    peer.on('error', function(err) {
        console.log('error', err)
    })

    peer.on('signal', function(data) {
        sdp = JSON.stringify(data)
        console.log('SDP and room name generated')
        createRoom(room)
        $scope.$apply(function() {
            $scope.roomName = room
            $scope.roomNameProgressLine = true
            $scope.roomNameCard = false
        });


    })

    peer.on('connect', function() {
        console.log('CONNECT')

        var filename = '/05 - Beginning Again.mp3'

        var fileInfo = { song: 'Beginning Again_copy.mp3' }
        const buf = new Buffer(JSON.stringify(fileInfo))
        peer.send(buf)

        var fStream = fs.createReadStream(__dirname + filename);
        var chunkStream = new chunkit(fStream, { bytes: chunkSize }, function(err, chunk) {
            if (err) return console.error('Error: ', err)

            if (chunk.data) {
                const buf = new Buffer(JSON.stringify(chunk))
                peer.send(buf)
            }

        })
    })

    peer.on('data', function(data) {
        console.log('data: ' + data)
    })
    /* Simple-Peer events END */


    socket.on('pair', function(info) {
        db.get(room).then(function(doc) {
            if (doc.answer) {
                peer.signal(JSON.parse(doc.answer))
            }
        })
    })

    $scope.connect = function() {
        db.get(room).then(function(doc) {
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