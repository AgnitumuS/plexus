angular.module('plexusControllers').service('fileSender', function () {

    var peer = null
    var chunkSize = 1024 * 10

    return {
        setPeer: function (p) {
            peer = p
        },

        sendFile: function (artist, album, title, path) {
            var fileInfo = { artist: artist, album: album, title: title, filename: title + ".mp3" }
            const buf = new Buffer(JSON.stringify(fileInfo))
            peer.send(buf)

            var fStream = fs.createReadStream(path)
            var chunkStream = new chunkit(fStream, { bytes: chunkSize }, function (err, chunk) {
                if (err) return console.error('Error: ', err)

                if (chunk.data) {
                    const buf = new Buffer(JSON.stringify(chunk))
                    peer.send(buf)
                }

            })
        }
    }

})