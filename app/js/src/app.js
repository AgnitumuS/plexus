angular.module('PlexusApp', ['ngMaterial', 'ngRoute', 'plexusControllers'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'partials/main.html'
            })
    }])