angular.module('plexusControllers').controller('joinRoomCtrl', ['$scope', function($scope) {

    var roomName = ''
    var peer = new window.SimplePeer({
        initiator: false,
        trickle: false
    })
    var writeableStream = null

    $scope.connectToPeerProgressLine = true

    /* Simple-Peer events START */
    peer.on('error', function(err) {
        console.log('error', err)
    })

    peer.on('signal', function(data) {
        sdp = JSON.stringify(data)
        console.log('SDP and room name generated')
        joinRoom(sdp)
    })

    peer.on('data', function(data) {
        const chunk = new Buffer(data)
        var buffered = JSON.parse(chunk.toString())

        if (buffered.song) {
            $scope.connectToPeerProgressLine = false
            saveSong(buffered.song);
        }
        else {
            var dataBuffer = new Buffer(buffered.data.data)
            writeableStream.write(dataBuffer)

            //if got the last chunk
            if (buffered.last) {
                $scope.connectToPeerProgressLine = true
                writeableStream.end()
                console.log('file is downloaded. ')
            }
        }
    })
    /* Simple-Peer events END */

    $scope.joinRoom = function() {
        roomName = $scope.roomName
        db.get(roomName).then(function(doc) {
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

    function saveSong(songName) {

        var folderToSave = __dirname + '/downloaded/'

        fs.access(folderToSave, fs.F_OK, function(err) {
            //if folder does not exist then create it!
            if (err) {
                mkdirp(folderToSave, function(err) {

                    createWriteableStream(folderToSave, songName)

                })
            } else {
                createWriteableStream(folderToSave, songName)
            }
        })
    }

    function createWriteableStream(folderToSave, songName) {
        var writeableStreamName = folderToSave + songName
        writeableStream = fs.createWriteStream(writeableStreamName)
    }

}])