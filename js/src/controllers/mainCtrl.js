angular.module('plexusControllers').controller('mainCtrl', ['$scope', function($scope) {

    $scope.imagePath = 'http://www.navidspage.com/wp-content/uploads/2009/01/theempyrean.jpg'
    var musicFolder = "d:/Marton/etc/MUSIC/John Frusciante - The Empyrean 2009"

    var options = {
        "path": musicFolder,
        "filter": {
            "extensionAccept": ["mp3"]
        }
    }

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
    // angular.element(document).ready(function() {
    //     var songs = folderContents(options)
    //     $scope.songs = songs[".files"]
    //     console.log($scope.songs)
    // })

}])