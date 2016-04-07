// angular.module("plexusControllers").factory('scannerService'), [function() {

//     var factory = {}

//     factory.read =  function() {
//         var musicFolder = "d:/Marton/etc/MUSIC"
//         var options = {
//             "path": musicFolder,
//             "filter": {
//                 "extensionAccept": ["mp3", "flac"]
//             }
//         }

//         var musicRoot = folderContents(options)
//         var musicRootFolder = musicRoot[".folders"]

//         console.log('Start scanning...')
//         musicRootFolder.forEach(function(folder) {

//             var actualMusicFolder = musicFolder + "/" + folder
//             var albumFolderOptions = {
//                 "path": actualMusicFolder,
//                 "recursively": true,
//                 "filter": {
//                     "extensionAccept": ["mp3", "flac"]
//                 }
//             }
//             var actualMusicFolderContent = folderContents(albumFolderOptions)
//             var groupedFolder = _.groupBy(actualMusicFolderContent, 'path')
//             scanSubFolder(groupedFolder)
//         })
//     }

//     function scanSubFolder(folder) {
//         //iterate on each subfolder
//         for (property in folder) {
//             var pathToSubfolder = property

//             //iterate on each song in the subfodler
//             var tracks = folder[pathToSubfolder]

//             readFolderMetadata(tracks, pathToSubfolder)
//         }
//         console.log('Scanning is successfully finished.')
//     }

//     function readFolderMetadata(tracks, pathToSubfolder) {
//         var album = ""
//         var artist = []
//         var songs = []
//         tracks.forEach(function(element, index) {
//             var songPath = pathToSubfolder + "/" + element.name + "." + element.ext
//             var parser = mm(fs.createReadStream(songPath), function(err, metadata) {
//                 if (err) throw err

//                 artist.push(_.toString(metadata.artist))
//                 songs.push({ title: metadata.title, no: metadata.track.no, path: songPath })

//                 if (tracks.length === index + 1) {
//                     var albumInfo = {
//                         _id: _.uniqueId('album_'),
//                         album: metadata.album,
//                         artist: _.uniq(artist),
//                         songs: songs,
//                         path: pathToSubfolder
//                     }
//                     clientDB.put(albumInfo)
//                 }
//             })
//         })
//     }

//     return read

// }];