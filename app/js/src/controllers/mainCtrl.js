angular.module('plexusControllers').controller('mainCtrl', ['$scope', '$mdDialog', '$mdMedia', '$mdSidenav', '$http', 'sharedProperties', 'fileSender',
    function ($scope, $mdDialog, $mdMedia, $mdSidenav, $http, sharedProperties, fileSender) {

        var allAlbumCount = 0
        var currentAlbumCount = 0
        var playing = false
        var p = play("05 - Beginning Again.mp3")

        $scope.connectionisOnProvider = false
        $scope.connectionisOnConsumer = false
        $scope.loadingIndicator = 0
        $scope.indicator = "img/icons/ic_play_arrow_white_24px.svg"
        $scope.artistInfo = true
        $scope.mainContent = true
        $scope.loading = false
        $scope.sentSongsByInitiator = []
        $scope.sentSongs = 0
        $scope.receivedSongs = 0
        $scope.receivedSongsFromInitiator = []

        //page loaded
        angular.element(document).ready(function () {

            if (localStorage.getItem("musicDir") === null) {
                ipcRenderer.send('getMusicDir', 'ping')
            } else {
                readAlbumsFromDb()
                showMainContent()
            }

            ipcRenderer.on('musicDirMessage', function (event, arg) {
                localStorage.setItem("musicDir", arg)
                allAlbumCount = 0
                currentAlbumCount = 0
                scanMusicFolder()
            })
        })

        p.on('play', function () {
            $scope.indicator = "img/icons/ic_pause_white_24px.svg"
            playing = true
        })

        p.on('pause', function () {
            $scope.indicator = "img/icons/ic_play_arrow_white_24px.svg"
            playing = false
        })

        //Play controller
        $scope.play = function () {
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

        $scope.playSong = function (event) {
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
        $scope.goToArtist = function (artist, event) {
            $scope.artistInfo = false
            readArtistFromDb(artist)
        }

        $scope.share = function (album, song) {
            if (!$scope.connectionisOnProvider) {
                $scope.toggleRight()
            }
            if (peerInitiator != undefined) {
                $scope.sentSongsByInitiator.push({ artist: album.artist, song: song.title })
                fileSender.setPeer(peerInitiator)
                fileSender.sendFile(album.artist, album.album, song.title, song.path)
                $scope.sentSongs++
            }
        }

        $scope.showCreateRoom = function () {

            sharedProperties.registerProvider(function () {
                $scope.connectionisOnProvider = sharedProperties.getConnection()
            })

            showDialog('partials/createroom.html')
        };

        $scope.showJoinRoom = function () {
            sharedProperties.registerConsumer(function () {
                $scope.connectionisOnConsumer = sharedProperties.getConnectionOnConsumer()
                var downloadedSongsNumber = sharedProperties.getDownloadedSongsCount()

                if ($scope.receivedSongs < downloadedSongsNumber) {
                    $scope.receivedSongs = downloadedSongsNumber
                    $scope.receivedSongsFromInitiator.push(sharedProperties.getLastReceivedSong())
                    console.log($scope.receivedSongsFromInitiator)
                }
            })

            showDialog('partials/joinroom.html')
        }

        $scope.destroyDb = function () {
            console.log("start deleting...")
            localStorage.clear()

            $scope.artists = []
            $scope.albums = []

            musicDb.destroy().then(function () {
                console.log("db 1 deleted")
            }).catch(function (err) {
                console.log(err)
            })

            downloadedMusicDb.destroy().then(function () {
                console.log("db 2 deleted")
            }).catch(function (err) {
                console.log(err)
            })
        }

        $scope.initiatorMessage = function () {
            if ($scope.sentSongs == 0) {
                return true
            }
            return false
        }

        $scope.consumerMessage = function () {
            if ($scope.receivedSongs == 0) {
                return true
            }
            return false
        }

        $scope.roomButtons = function () {
            if ($scope.connectionisOnConsumer || $scope.connectionisOnProvider) {
                return true
            }
            return false
        }

        $scope.providerMessages = function () {
            if ($scope.connectionisOnProvider) {
                return true
            }
            return false
        }

        $scope.consumerMessages = function () {
            if ($scope.connectionisOnConsumer) {
                return true
            }
            return false
        }

        $scope.playReceivedSong = function (path) {
            console.log(path)
            p.pause()
            p.src('downloaded/' + path)
            p.play()
        }

        $scope.toggleRight = buildToggler('right')

        function buildToggler(navID) {
            return function () {
                $mdSidenav(navID)
                    .toggle()
                    .then(function () {
                        $scope.connectionisOnProvider = sharedProperties.getConnection()
                    });
            }
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

        function readArtistFromDb(artist) {
            var artistId = getArtistId(artist)
            musicDb.allDocs({
                include_docs: true,
                startkey: artistId,
                endkey: artistId + '\uffff'
            }).then(function (artistResult) {
                if (artistResult.rows) {
                    var searchedArtist = artistResult.rows[0].doc
                    var albumsOfArtist = searchedArtist.albumsOfArtist
                    if (!searchedArtist.imagePath) {
                        downloadArtistImage(artist, function (imagePath) {
                            saveArtistImage(artist, artistId, imagePath, function () {
                                setScopeArtistVariables(artist, imagePath, albumsOfArtist)
                            })
                        })
                    } else {
                        setScopeArtistVariables(artist, searchedArtist.imagePath, albumsOfArtist)
                    }
                }
            }).catch(function (err) {
                console.error(err)
            })
        }

        function setScopeArtistVariables(artist, imagePath, albumsOfArtist) {
            $scope.artistName = artist
            $scope.artistImage = imagePath
            $scope.albums = []
            albumsOfArtist.forEach(function (album) {
                getAlbumFromDb(album)
            })
        }

        function saveArtistImage(artist, artistId, imagePath, callback) {
            musicDb.get(artistId).then(function (doc) {
                return musicDb.put({
                    "_id": artistId,
                    "_rev": doc._rev,
                    "albumsOfArtist": doc.albumsOfArtist,
                    "imagePath": imagePath
                })
            }).then(function () {
                callback(artist)
            }).catch(function (err) {
                console.error('Error in saveArtistImage ' + err)
            })
        }

        function getAlbumFromDb(albumId) {
            musicDb.get(albumId).then(function (doc) {
                $scope.albums.push(doc)
                $scope.$apply()
            }).catch(function (err) {
                console.log(err)
            })
        }

        //It returns all the albums from the DB
        function readAlbumsFromDb() {
            musicDb.allDocs({
                include_docs: true,
                startkey: 'album_',
                endkey: 'album_\uffff'
            }).then(function (resultFromDb) {
                processInfoFromDb(resultFromDb)
            }).catch(function (err) {
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

            rootMusicFolder.forEach(function (folder) {
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
            tracks.forEach(function (element, index) {
                var songPath = pathToAlbum + "/" + element.name + "." + element.ext

                //read music metadata
                mm(fs.createReadStream(songPath), function (err, metadata) {
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
                        upsertArtistInfo(artist, artistId, albumId)
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

            getAlbumCover(albumInfo)
        }

        function getAlbumCover(albumInfo) {
            var album = albumInfo.album
            var artist = albumInfo.artist
            $http.get('http://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=' + process.env.LASTFM_API_KEY + '&artist=' + artist + '&album=' + album + '&format=json')
                .then(function (resp) {
                    var coverUrl = ""
                    if (resp.data.error) {
                        console.log('no album cover for ths album: ' + album)
                        putAlbumInfoIntoDb(albumInfo)
                    } else if (resp.data.album.image) {
                        coverUrl = resp.data.album.image[2]["#text"]
                        if (coverUrl != "") {
                            var coverPath = 'covers/' + album + '.jpg'
                            downloadImage(coverUrl, coverPath, function () {
                                albumInfo.coverPath = coverPath
                                putAlbumInfoIntoDb(albumInfo)
                            })
                        } else {
                            putAlbumInfoIntoDb(albumInfo)
                        }
                    } else {
                        putAlbumInfoIntoDb(albumInfo)
                    }
                }).catch(function (err) {
                    console.log(err)
                })
        }

        function downloadImage(coverUrl, coverPath, callback) {
            request.head(coverUrl, function (err, res, body) {
                request(coverUrl).pipe(fs.createWriteStream(coverPath)).on('close', callback)
            })
        }

        function putAlbumInfoIntoDb(albumInfo) {
            musicDb.put(albumInfo)
                .then(function (resp) {
                    currentAlbumCount++
                    $scope.loadingIndicator = (currentAlbumCount / allAlbumCount) * 100
                    $scope.$apply()

                    if (allAlbumCount === currentAlbumCount) {
                        readAlbumsFromDb()
                    }
                })
                .catch(function (err) {
                    console.log("Oh err - Putting album info into DB: " + err)
                })
        }

        function upsertArtistInfo(artist, artistId, albumId) {
            musicDb.upsert(artistId, function (doc) {
                if (doc.albumsOfArtist) {
                    doc.albumsOfArtist.push(albumId)
                } else {
                    doc.albumsOfArtist = [albumId]
                }
                return doc
            })
        }

        function downloadArtistImage(artist, callback) {
            $http.get('http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=' + artist + '&api_key=' + process.env.LASTFM_API_KEY + '&format=json')
                .then(function (resp) {
                    console.log('downloading... ' + artist)
                    if (resp.data.error) {
                        console.log('Error occured.')
                    } else if (resp.data.artist.image) {
                        var imageUrl = ""
                        if (resp.data.artist.image[2]["#text"]) {
                            imageUrl = resp.data.artist.image[2]["#text"]
                            var imagePath = 'artists/' + artist + '.jpg'
                            downloadImage(imageUrl, imagePath, function () {
                                callback(imagePath)
                            })
                        }                        
                    }
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