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

        //this is for the test
        //readSongsInfoIntoDb()

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
                "recursively": true,
                "filter": {
                    "extensionAccept": ["mp3", "flac"]
                }
            }
            var actualMusicFolderContent = folderContents(albumFolderOptions)
            var groupedFolder = _.groupBy(actualMusicFolderContent, 'path')
            readSubFolder(groupedFolder, saveAlbumInfo)
            console.log("--continue reading--")
        })
    }

    function readSubFolder(folder, callback) {
        //iterate on each subfolder
        for (property in folder) {
            var pathToSubfolder = property

            //iterate on each song in the subfodler
            var tracks = folder[pathToSubfolder]

            readFolderMetadata(tracks, pathToSubfolder, callback)
        }
    }

    function readFolderMetadata(tracks, pathToSubfolder, callback) {
        var album = ""
        var artist = []
        var songTitles = []
        tracks.forEach(function(element, index) {
            var songPath = pathToSubfolder + "/" + element.name + "." + element.ext
            var parser = mm(fs.createReadStream(songPath), function(err, metadata) {
                if (err) throw err

                artist.push(_.toString(metadata.artist))
                songTitles.push(metadata.title)

                if (tracks.length === index + 1) {
                    album = metadata.album
                    callback(album, artist, songTitles)
                }
                console.log("###" + metadata.album + " / " + metadata.title + " read")
            })
        })
    }

    function saveAlbumInfo(album, artist, songTitles) {
        var albumInfo = {
            _id: _.uniqueId('album_'),
            album: album,
            artist: _.uniq(artist),
            songs: songTitles
        }
        clientDB.put(albumInfo)
    }

}])