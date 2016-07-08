/* global sunPMT, selection */

//Controller for column show/hide
sunPMT.controller('LeftBarMenuController',
        function($scope, $location) {
    $scope.showDataEntry = function(){
        selection.load();
        $location.path('/').search();
    };
    
    $scope.showReports = function(){
        selection.load();
        $location.path('/').search();
    };
});