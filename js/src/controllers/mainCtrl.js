angular.module('plexusControllers').controller('mainCtrl', ['$scope', '$mdDialog', function($scope, $mdDialog) {

    $scope.imagePath = 'http://www.navidspage.com/wp-content/uploads/2009/01/theempyrean.jpg'

    $scope.songInfo = false
    $scope.playing = false

    var parent = document.querySelector('.my-player')
    var p

    p.on('play', function() {
        console.log('playing')
    })

    p.on('pause', function() {
        console.log('not playing')
    })

    $scope.playSong = function(event) {
        
        p = play(event.target.id, parent).autoplay()
        
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

        readAlbumsFromDb()

    })


    function readAlbumsFromDb() {
        clientDB.allDocs({
            include_docs: true
        })
            .then(function(result) {
                var albums = _.map(result.rows, 'doc')
                $scope.albums = albums
                $scope.$apply()
            })
            .catch(function(err) {
                console.log(err)
            })
    }

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

        console.log('Start scanning...')
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
            scanSubFolder(groupedFolder)
        })
    }

    function scanSubFolder(folder) {
        //iterate on each subfolder
        for (property in folder) {
            var pathToSubfolder = property

            //iterate on each song in the subfodler
            var tracks = folder[pathToSubfolder]

            readFolderMetadata(tracks, pathToSubfolder)
        }
        console.log('Scanning is successfully finished.')
    }

    function readFolderMetadata(tracks, pathToSubfolder) {
        var album = ""
        var artist = []
        var songs = []
        tracks.forEach(function(element, index) {
            var songPath = pathToSubfolder + "/" + element.name + "." + element.ext
            var parser = mm(fs.createReadStream(songPath), function(err, metadata) {
                if (err) throw err

                artist.push(_.toString(metadata.artist))
                songs.push({ title: metadata.title, no: metadata.track.no, path: songPath })

                if (tracks.length === index + 1) {
                    var albumInfo = {
                        _id: _.uniqueId('album_'),
                        album: metadata.album,
                        artist: _.uniq(artist),
                        songs: songs,
                        path: pathToSubfolder
                    }
                    clientDB.put(albumInfo)
                }
            })
        })
    }

}])