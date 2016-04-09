angular.module('plexusControllers').controller('mainCtrl', ['$scope', '$mdDialog', '$mdMedia', '$http', function($scope, $mdDialog, $mdMedia, $http) {

    var allAlbumCount = 0
    var currentAlbumCount = 0

    var playing = false

    $scope.indicator = "img/icons/ic_play_arrow_white_24px.svg"

    $scope.artistInfo = true
    $scope.mainContent = true
    $scope.loading = false

    var p = play("05 - Beginning Again.mp3")

    //Play controller
    $scope.play = function() {
        if (playing) {
            p.pause()
            $scope.indicator = "img/icons/ic_play_arrow_white_24px.svg"
            playing = false
        } else {
            p.play()
            $scope.indicator = "img/icons/ic_pause_white_24px.svg"
            playing = true
        }
    }

    $scope.playSong = function(event) {
        if (!playing) {
            $scope.indicator = "img/icons/ic_pause_white_24px.svg"
        }
        var path = event.target.attributes['data-path'].value
        var album = event.target.attributes['data-album'].value
        var title = event.target.attributes['data-title'].value
        var artist = event.target.attributes['data-artist'].value

        var playingArtistString = artist

        $scope.playingSong = title
        $scope.playingArtist = playingArtistString

        p.pause()
        p.src(path)
        p.play()
    }

    //click on artist name
    $scope.goToArtist = function(artist, event) {
        downloadArtistInfo(artist)
        readArtistFromDb(getArtistId(artist))
        $scope.artistInfo = false
    }

    p.on('play', function() {
        $scope.indicator = "img/icons/ic_pause_white_24px.svg"
        playing = true
    })

    p.on('pause', function() {
        $scope.indicator = "img/icons/ic_play_arrow_white_24px.svg"
        playing = false
    })

    $scope.showCreateRoom = function() {
        showDialog('partials/createroom.html')
    };

    $scope.showJoinRoom = function(ev) {
        showDialog('partials/joinroom.html')
    }

    function showDialog(templateUrl) {
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && $scope.customFullscreen
        $mdDialog.show({
            templateUrl: templateUrl,
            parent: angular.element(document.body),
            clickOutsideToClose: true,
            fullscreen: useFullScreen
        });
    }

    $scope.destroyDb = function() {
        console.log("start deleting...")
        localStorage.clear()
        clientDB.destroy().then(function() {
            console.log("db deleted")
        }).catch(function(err) {
            console.log(err)
        })
    }

    //page loaded
    angular.element(document).ready(function() {

        if (localStorage.getItem("musicDir") === null) {
            ipcRenderer.send('getMusicDir', 'ping')
        } else {
            readAlbumsFromDb()
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

    function downloadArtistInfo(artist) {
        $http.get('http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=' + artist + '&api_key=edf51d0b47dbcc6b8cc143c450297cf1&format=json')
            .then(function(resp) {
                if (resp.status === 200) {
                    $scope.artistName = artist
                    $scope.artistImage = resp.data.artist.image[2]['#text']
                    if (resp.data.artist.bio.summary) {
                        $scope.artistBio = resp.data.artist.bio.summary
                    }
                }
            })
    }

    function readArtistFromDb(artistId) {
        clientDB.allDocs({
            include_docs: true,
            startkey: artistId,
            endkey: artistId + '\uffff'
        }).then(function(artistResult) {
            if (artistResult.rows) {
                var albumsOfArtist = artistResult.rows[0].doc.albumsOfArtist
                $scope.albums = []
                albumsOfArtist.forEach(function(album) {
                    getAlbumFromDb(album)
                })
            }
        }).catch(function(err) {
            console.log(err)
        })
    }

    function getAlbumFromDb(albumId) {
        clientDB.get(albumId).then(function(doc) {
            $scope.albums.push(doc)
            $scope.$apply()
        }).catch(function(err) {
            console.log(err)
        })
    }

    //It returns all the albums from the DB
    function readAlbumsFromDb() {
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
        var rootMusicFolderName = localStorage.getItem("musicDir")
        var options = {
            "path": rootMusicFolderName,
            "filter": {
                "extensionAccept": ["mp3"]
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
                    "extensionAccept": ["mp3"]
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
        var songs = []
        tracks.forEach(function(element, index) {
            var songPath = pathToAlbum + "/" + element.name + "." + element.ext

            //read music metadata
            mm(fs.createReadStream(songPath), function(err, metadata) {
                if (err) throw err

                songs.push({ title: metadata.title, no: metadata.track.no, path: songPath })

                //this is last iteration
                if (tracks.length === index + 1) {
                    var artist = _.toString(metadata.artist)
                    var album = metadata.album
                    var albumId = "album_" + _.snakeCase(album)

                    var artistString = _.lowerCase(_.toString(artist))
                    var artistId = getArtistId(artistString)

                    saveAlbumInfo(albumId, album, artist, artistId, songs, pathToAlbum)
                    updateArtistInfo(artistId, albumId)
                }
            })
        })
    }

    function saveAlbumInfo(albumId, album, artist, artistId, songs, pathToAlbum) {
        var albumInfo = {
            "_id": albumId,
            "album": album,
            "artist": artist,
            "songs": songs,
            "path": pathToAlbum
        }

        clientDB.put(albumInfo)
            .then(function(resp) {
                currentAlbumCount++

                if (allAlbumCount === currentAlbumCount) {
                    readAlbumsFromDb()
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

    function getArtistId(artistString) {
        return "artist_" + _.snakeCase(_.lowerCase(artistString))
    }

    function showMainContent() {
        $scope.loading = true
        $scope.mainContent = false
        $scope.$apply()
    }

}])