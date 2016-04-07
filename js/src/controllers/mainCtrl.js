angular.module('plexusControllers').controller('mainCtrl', ['$scope', '$mdDialog', function($scope, $mdDialog) {

    var allAlbumCount = 0
    var currentAlbumCount = 0

    $scope.mainContent = true
    $scope.loading = false

    var p = play("05 - Beginning Again.mp3")

    //Play controller
    $scope.play = function() {
    }

    $scope.playSong = function(event) {
        p.pause()
        p = play(event.target.id).autoplay()
        console.log(event)
    }

    //click on artist name
    $scope.goToArtist = function(artist, event) {
    }

    $scope.showLog = function() {
    }

    p.on('play', function() {
        console.log('playing')
    })

    p.on('pause', function() {
        console.log('pause')
    })

    //page loaded
    angular.element(document).ready(function() {

        if (localStorage.getItem("musicDir") === null) {
            ipcRenderer.send('getMusicDir', 'ping')
        } else {
            readMusicDataFromDb()
            showMainContent()
        }

        ipcRenderer.on('musicDirMessage', function(event, arg) {
            localStorage.setItem("musicDir", arg)
            allAlbumCount = 0
            currentAlbumCount = 0
            scanMusicFolder()
        })

        //this is for the test
        //readSongsInfoIntoDb()
    })

    //It returns all the albums from the DB
    function readMusicDataFromDb() {
        clientDB.allDocs({
            include_docs: true,
            startkey: 'album_',
            endkey: 'album_\uffff'
        }).then(function(resultFromDb) {
            processInfoFromDb(resultFromDb)
        }).catch(function(err) {
            console.log(err)
        })
    }

    //Process album information and save it in an Angular variable
    function processInfoFromDb(resultFromDb) {
        var albums = processAlbumInfo(resultFromDb)
        processArtistInfo(albums)
        if ($scope.mainContent && !$scope.loading) {
            showMainContent()
        }
    }

    function processAlbumInfo(resultFromDb) {
        var albums = _.map(resultFromDb.rows, 'doc')
        $scope.albums = albums
        $scope.$apply()
        return albums
    }

    function processArtistInfo(albums) {
        var arrayOfArtists = _.map(albums, 'artist')
        var artists = _.flatten(arrayOfArtists)
        var uniqArtists = _.uniq(artists)
        var orderedArtists = _.orderBy(uniqArtists)
        $scope.artists = orderedArtists
        $scope.$apply()
    }

    function scanMusicFolder() {
        console.log('Start scanning...')
        var rootMusicFolderName = localStorage.getItem("musicDir")
        var options = {
            "path": rootMusicFolderName,
            "filter": {
                "extensionAccept": ["mp3", "flac"]
            }
        }

        //it could contain files and folders
        var root = folderContents(options)
        //we need only the folders
        var rootMusicFolder = root[".folders"]

        rootMusicFolder.forEach(function(folder) {
            var actualMusicFolder = rootMusicFolderName + "/" + folder
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
            var pathToAlbum = property
            allAlbumCount += 1

            var albumTracks = folder[pathToAlbum]

            readAlbumTracks(albumTracks, pathToAlbum)
        }
    }

    function readAlbumTracks(tracks, pathToAlbum) {
        var artist = []
        var songs = []
        tracks.forEach(function(element, index) {
            var songPath = pathToAlbum + "/" + element.name + "." + element.ext

            //read music metadata
            mm(fs.createReadStream(songPath), function(err, metadata) {
                if (err) throw err

                artist.push(_.toString(metadata.artist))
                songs.push({ title: metadata.title, no: metadata.track.no, path: songPath })

                //this is last iteration
                if (tracks.length === index + 1) {
                    var album = metadata.album
                    var albumId = "album_" + _.snakeCase(album)

                    var artistString = _.lowerCase(_.toString(_.uniq(artist)))
                    var artistId = "artist_" + _.snakeCase(artistString)
                    var uniqArtists = _.uniq(artist)

                    saveAlbumInfo(albumId, album, uniqArtists, artistId, songs, pathToAlbum)
                    updateArtistInfo(artistId, albumId)
                }
            })
        })
    }

    function saveAlbumInfo(albumId, album, uniqArtists, artistId, songs, pathToAlbum) {
        var albumInfo = {
            "_id": albumId,
            "album": album,
            "artist": uniqArtists,
            "songs": songs,
            "path": pathToAlbum
        }

        clientDB.put(albumInfo)
            .then(function(resp) {
                currentAlbumCount++
                console.log(albumId + " is saved!" + "   " + currentAlbumCount)

                if (allAlbumCount === currentAlbumCount) {
                    readMusicDataFromDb()
                }
            })
    }

    function updateArtistInfo(artistId, albumId) {
        clientDB.upsert(artistId, function(doc) {
            if (doc.albumsOfArtist) {
                doc.albumsOfArtist.push(albumId)
            } else {
                doc.albumsOfArtist = [albumId]
            }
            return doc
        })
    }

    function showMainContent() {
        $scope.loading = true
        $scope.mainContent = false
        $scope.$apply()
    }

}])