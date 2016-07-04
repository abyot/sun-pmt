/* global sunPMT, selection */

//Controller for column show/hide
sunPMT.controller('LeftBarMenuController',
        function($scope, $location) {
    $scope.showsunPMT = function(){
        selection.load();
        $location.path('/').search();
    };    
});