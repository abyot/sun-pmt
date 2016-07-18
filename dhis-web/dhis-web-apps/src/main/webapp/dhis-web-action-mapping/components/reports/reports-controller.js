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
        programsByCode: [],
        dataElementsByCode: [],
        selectedPrograms: null};
    
    function populateOuLevels(){
        $scope.model.ouModes = [{name: $translate.instant('selected_level') , value: 'SELECTED', level: $scope.selectedOrgUnit.l}];            
        $scope.model.selectedOuMode = $scope.model.ouModes[0];
        for( var i=$scope.selectedOrgUnit.l+1; i<=3; i++ ){
            var lvl = $scope.model.ouLevels[i];
            $scope.model.ouModes.push({value: lvl, name: lvl + ' ' + $translate.instant('level'), level: i});
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
                angular.forEach($scope.model.dataSets, function(ds){
                    if( ds.dataElements && ds.dataElements[0] && ds.dataElements[0].code ){
                        $scope.model.dataElementsByCode[ds.dataElements[0].code] = ds.dataElements[0];
                    }
                });
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

        if( !$scope.model.selectedDataSets.length || $scope.model.selectedDataSets.length < 1 ){
            
            var dialogOptions = {
                headerText: $translate.instant('error'),
                bodyText: $translate.instant('please_select_actions')
            };		
            DialogService.showDialog({}, dialogOptions);
            return;
        }
        
        var dataValueSetUrl = 'period=' + $scope.model.selectedPeriod.id;
        angular.forEach($scope.model.selectedDataSets, function(ds){
            dataValueSetUrl += '&dataSet=' + ds.id;
        });
        
        if( $scope.selectedOrgUnit.l === 3 ){
            dataValueSetUrl += '&orgUnit=' + $scope.selectedOrgUnit.id;
        }        
        else{            
            if( $scope.selectedOrgUnit.l+1 < 3 ){
                angular.forEach($scope.selectedOrgUnit.c, function(c){
                    dataValueSetUrl += '&orgUnit=' + c;
                });
            }
            else {
                dataValueSetUrl += '&orgUnit=' + $scope.selectedOrgUnit.id;
            }
            
            dataValueSetUrl += '&children=true';
        }        
        
        $scope.model.selectedPrograms = [];
        angular.forEach($scope.model.selectedDataSets, function(ds){
            if( ds.dataElements && ds.dataElements[0] && ds.dataElements[0].code && $scope.model.programsByCode[ds.dataElements[0].code] ){                
                var pr = $scope.model.programsByCode[ds.dataElements[0].code]; 
                $scope.model.selectedPrograms.push( pr );
            }
        });
        
        EventService.getForMultiplePrograms($scope.selectedOrgUnit.id, 'DESCENDANTS', $scope.model.selectedPrograms, null, $scope.model.selectedPeriod.startDate, $scope.model.selectedPeriod.endDate).then(function(events){
            console.log('the events:  ', events);
            DataValueService.getDataValueSet( dataValueSetUrl ).then(function( response ){
                console.log('the data:  ', response);            
            });
        });
    };
});
