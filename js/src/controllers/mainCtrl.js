angular.module('plexusControllers').controller('mainCtrl', ['$scope', '$mdDialog', function($scope, $mdDialog) {

    // request.onerror = function(event) {
    //     alert("Database error: " + event.target.errorCode);
    // }

    // request.onsuccess = function(event) {
    //     indexedDB = event.target.result
    //     console.log("indexedDB is open")
    // }

    $scope.imagePath = 'http://www.navidspage.com/wp-content/uploads/2009/01/theempyrean.jpg'

    $scope.songInfo = false
    $scope.playing = false


    var parent = document.querySelector('.my-player')
    var p = play('05 - Beginning Again.mp3', parent).controls()

    p.on('play', function() {
        console.log('playing')
    })

    p.on('pause', function() {
        console.log('not playing')
    })

    $scope.playSong = function() {

        var songs = folderContents(options)
        $scope.songs = songs[".files"]
        console.log($scope.songs)

    }

    //page loaded
    angular.element(document).ready(function() {

        if (localStorage.getItem("musicDir") === null) {
            ipcRenderer.send('getMusicDir', 'ping')
        }

        ipcRenderer.on('musicDirMessage', function(event, arg) {
            console.log(arg)
            localStorage.setItem("musicDir", arg)
            readSongsInfoIntoDb()
        })

    })

    function readSongsInfoIntoDb() {
        var musicFolder = "d:/Marton/etc/MUSIC"
        var options = {
            "path": musicFolder,
            "filter": {
                "extensionAccept": ["mp3", "flac"]
            }
        }

        var musicRoot = folderContents(options)
        var musicRootFolder = musicRoot[".folders"]
        musicRootFolder.forEach(function(folder) {

            var actualMusicFolder = musicFolder + "/" + folder
            var albumFolderOptions = {
                "path": actualMusicFolder,
                "filter": {
                    "extensionAccept": ["mp3", "flac"]
                }
            }
            var albumFolder = folderContents(albumFolderOptions)
            //depth-1 (TODO depth-n recursively)
            if (albumFolder[".files"]) {
                var songs = albumFolder[".files"]

                readSongInfo(songs, saveAlbumInfo)

            }
        })
    }

    function saveAlbumInfo(album, artist, songTitles) {
        var albumInfo = {
            _id: "album" + getRandomNumber(10000, 99999),
            album: album,
            artist: artist,
            songs: songTitles
        }
        clientDB.put(albumInfo)
    }

    function readSongInfo(songs, callback) {
        var album = ""
        var artist = []
        var songTitles = []
        songs.forEach(function(song, index) {
            var pathToMp3 = song.path + "/" + song.name + "." + song.ext
            var parser = mm(fs.createReadStream(pathToMp3), function(err, metadata) {
                if (err) throw err
                if (index === 0) {
                    album = metadata.album
                    artist = metadata.artist
                }
                songTitles.push(metadata.title)

                if (songs.length === index + 1) {
                    callback(album, artist, songTitles)
                }

            })
        })
    }

    function getRandomNumber(lower, higher) {
        return Math.floor(Math.random() * higher) + lower
    }

}])