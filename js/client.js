var peer = new window.SimplePeer({
    initiator: location.hash === '#1',
    trickle: false
})

sdp = ''
room = 'room' + new Date()

var socket = io('http://localhost:3001')
var db = new PouchDB('http://localhost:5984/sdps')

peer.on('error', function (err) {
    console.log('error', err)
})

peer.on('signal', function (data) {
    sdp = JSON.stringify(data)
    console.log(sdp)
    if (location.hash === '#1') {
        $('#room').text('Room name: ' + room)
    }

    if (location.hash !== '#1') {
        createOrJoin(typedRoomName)
    }
})

$('#submitButton').click(function () {

    typedRoomName = $('#roomname').val()

    if (location.hash === '#1') {
        createOrJoin()
    }

    if (location.hash !== '#1') {
        db.get(typedRoomName).then(function (doc) {
            peer.signal(JSON.parse(doc.offer))
        })
    }

})

$('#sendButton').click(function () {
    if (location.hash === '#1') {
        db.get(room).then(function (doc) {
            if (doc.answer) {
                peer.signal(JSON.parse(doc.answer))
            }
        })
    }
})

socket.on('join', function (info) {
    console.log('Making request to join room ' + info.room)
})

peer.on('connect', function () {
    console.log('CONNECT')
    peer.send('Message' + Math.random)
})

peer.on('data', function (data) {
    console.log('data: ' + data)
})


function createOrJoin(roomName) {
    if (roomName != undefined) {
        room = roomName;
    }

    var info = createInfoObject(room, sdp)

    if (room !== '') {
        console.log('Joining room ' + room)
        socket.emit('create or join', info)
    }
}

function createInfoObject(room, sdp) {
    if (location.hash === '#1') {
        return info = {
            room: room,
            offer: sdp
        }
    } else {
        return info = {
            room: room,
            answer: sdp
        }
    }
}
