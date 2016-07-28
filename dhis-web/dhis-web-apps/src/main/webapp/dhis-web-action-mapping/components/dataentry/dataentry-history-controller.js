/* global angular */

'use strict';

var sunPMT = angular.module('sunPMT');

//Controller for settings page
sunPMT.controller('DataEntryHistoryController',
        function($scope,
                $modalInstance,
                $translate,
                $filter,
                period,
                dataElement,
                orgUnitId,
                attributeOptionCombo,
                optionCombo,
                DataValueAuditService) {    
    $scope.dataElement = dataElement;
    /*$scope.program = program;
    $scope.period = period; 
    $scope.orgUnitId = orgUnitId;
    $scope.attributeCategoryCombo = attributeCategoryCombo;
    $scope.attributeCategoryOptions = attributeCategoryOptions;
    $scope.attributeOptionCombo = attributeOptionCombo;
    $scope.optionCombo = optionCombo;*/
    
    $scope.historyUrl = "../api/charts/history/data.png?";
    $scope.historyUrl += 'de=' + dataElement.id;
    $scope.historyUrl += '&co=' + optionCombo.id;
    $scope.historyUrl += '&ou=' + orgUnitId;
    $scope.historyUrl += '&pe=' + period.id;
    $scope.historyUrl += '&cp=' + attributeOptionCombo;
    
    var dataValueAudit = {de: dataElement.id, pe: period.id, ou: orgUnitId, co: optionCombo.id, cc: attributeOptionCombo};
    
    $scope.auditColumns = [{id: 'created', name: $translate.instant('created')},
                           {id: 'modifiedBy', name: $translate.instant('modified_by')},
                           {id: 'value', name: $translate.instant('value')},
                           {id: 'auditType', name: $translate.instant('audit_type')}];
    
    $scope.dataValueAudits = [];        
    DataValueAuditService.getDataValueAudit( dataValueAudit ).then(function( response ){
        $scope.dataValueAudits = response && response.dataValueAudits ? response.dataValueAudits : [];
        $scope.dataValueAudits = $filter('filter')($scope.dataValueAudits, {period: {id: period.id}});
    });    
    
    $scope.close = function(status) {        
        $modalInstance.close( status );
    };
});