angular.module('PlexusApp', ['ngMaterial', 'ngRoute', 'plexusControllers'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider
            .when('/joinroom', {
                templateUrl: 'partials/joinroom.html'
            })
            .when('/createroom', {
                templateUrl: 'partials/createroom.html'
            })
            .otherwise({
                templateUrl: 'partials/main.html'
            })
    }])


