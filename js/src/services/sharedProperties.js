angular.module('plexusControllers').service('sharedProperties', function () {
    var connectionProv = false
    var connectionCons = false

    var downloadedSongs = 0
    var lastReceivedSong = {}

    var providers = []
    var consumers = []

    return {
        registerProvider: function (callback) {
            providers.push(callback)
        },

        registerConsumer: function (callback) {
            consumers.push(callback)
        },

        notifyProvider: function () {
            angular.forEach(providers, function (callback) {
                callback()
            })
        },

        notifyConsumer: function () {
            angular.forEach(consumers, function (callback) {
                callback()
            })
        },

        getConnection: function () {
            return connectionProv
        },

        setConnection: function (value) {
            connectionProv = value
        },

        getConnectionOnConsumer: function () {
            return connectionCons
        },

        setConnectionOnConsumer: function (value) {
            connectionCons = value
        },
        
        fileIsDownloaded: function(song){
            console.log('in shared properties: ' + song)
            lastReceivedSong = song
            downloadedSongs++
        },
        
        getDownloadedSongsCount: function(){
            return downloadedSongs
        },
        
        getLastReceivedSong: function(){
            return lastReceivedSong
        }
    }

})