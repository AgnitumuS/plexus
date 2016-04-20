angular.module('plexusControllers').service('sharedProperties', function(){
    var connection = false
    
    return {
        getConnection: function(){
            return connection
        },
        
        setConnection: function(value){
            connection = value
        }
    }
    
})