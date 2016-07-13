/* global angular */

'use strict';

var sunPMT = angular.module('sunPMT');

//Controller for reports page
sunPMT.controller('reportsController',
        function($scope,
                $filter,
                $translate,
                SessionStorageService,
                storage,
                DialogService,
                DataSetFactory,
                PeriodService,
                MetaDataFactory,
                ActionMappingUtils,
                DataValueService,
                EventService) {
    $scope.periodOffset = 0;
    $scope.showReportFilters = true;
    $scope.orgUnitLevels = null;
    $scope.model = {stakeholderRoles: [{id: 'CA_ID', name: $translate.instant('catalyst')},{id: 'FU_ID', name: $translate.instant('funder')},{id: 'RM_ID', name: $translate.instant('responsible_ministry')}],
        ouModes: [],
        periods: [],
        dataSets: null,
        selectedDataSets: [],
        ouLevels: [],
        programs: null,
        programsByCode: []};
    
    
    
    function populateOuLevels(){
        $scope.model.ouModes = [{name: $translate.instant('selected_level') , value: 'SELECTED'}];            
        $scope.model.selectedOuMode = $scope.model.ouModes[0];
        for( var i=$scope.selectedOrgUnit.l+1; i<=3; i++ ){
            var md = $scope.model.ouLevels[i];
            $scope.model.ouModes.push({value: md, name: md + ' ' + $translate.instant('level')});
        }
    }
    
    //watch for selection of org unit from tree
    $scope.$watch('selectedOrgUnit', function() {
        if( angular.isObject($scope.selectedOrgUnit)){            
            
            $scope.model.programs = [];
            MetaDataFactory.getAll('programs').then(function(programs){
                $scope.model.programs = programs;
                angular.forEach(programs, function(program){
                    $scope.model.programsByCode[program.actionCode] = program;
                });                        
            });

            $scope.model.dataSets = [];
            MetaDataFactory.getAll('dataSets').then(function(dataSets){
                $scope.model.dataSets = dataSets;
            });

            $scope.orgUnitLevels = [];
            MetaDataFactory.getAll('ouLevels').then(function(ouLevels){
                angular.forEach(ouLevels, function(ol){
                    $scope.model.ouLevels[ol.level] = ol.displayName;
                });                    
                populateOuLevels();
            });
                
            SessionStorageService.set('SELECTED_OU', $scope.selectedOrgUnit);
            $scope.model.periods = PeriodService.getPeriods('Yearly', $scope.model.periodOffset);
        }
    });

    $scope.getPeriods = function(mode){
        
        if( mode === 'NXT'){
            $scope.periodOffset = $scope.periodOffset + 1;
            $scope.model.selectedPeriod = null;
            $scope.model.periods = PeriodService.getPeriods('Yearly', $scope.periodOffset);
        }
        else{
            $scope.periodOffset = $scope.periodOffset - 1;
            $scope.model.selectedPeriod = null;
            $scope.model.periods = PeriodService.getPeriods('Yearly', $scope.periodOffset);
        }
    };
    
    $scope.interacted = function(field) {        
        var status = false;
        if(field){            
            status = $scope.reportForm.submitted || field.$dirty;
        }
        return status;        
    };
    
    $scope.getReport = function(){
        
        //check for form validity
        $scope.reportForm.submitted = true;        
        if( $scope.reportForm.$invalid ){
            return false;
        }
        
        //form is valid
        
    };
});
