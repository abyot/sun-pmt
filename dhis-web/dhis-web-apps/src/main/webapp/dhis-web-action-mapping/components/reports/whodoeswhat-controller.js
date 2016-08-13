/* global angular */

'use strict';

var sunPMT = angular.module('sunPMT');

//Controller for reports page
sunPMT.controller('WhoDoesWhatController',
        function($scope,
                $filter,
                $translate,
                SessionStorageService,
                DialogService,
                PeriodService,
                MetaDataFactory,
                OptionComboService,
                ReportService) {
    $scope.periodOffset = 0;
    $scope.showReportFilters = true;
    $scope.reportReady = false;
    $scope.noDataExists = false;
    $scope.orgUnitLevels = null;
    $scope.model = {stakeholderRoles: [{id: 'CA_ID', name: $translate.instant('catalyst')},{id: 'FU_ID', name: $translate.instant('funder')},{id: 'RM_ID', name: $translate.instant('responsible_ministry')}],
        ouModes: [],
        periods: [],
        dataSets: null,
        selectedDataSets: [],
        ouLevels: [],
        programs: null,
        programsByCode: [],
        programCodesById: [],
        dataElementsByCode: [],
        dataElementCodesById: [],
        selectedPrograms: null,
        mappedOptionCombos: null,
        roleDataElementsById: null,
        reportDataElements: null,
        whoDoesWhatCols: null,
        mappedValues: null,
        childrenIds: []};
    
    function populateOuLevels(){
        $scope.ouModes = [{name: $translate.instant('selected_level') , value: 'SELECTED', level: $scope.selectedOrgUnit.l}];        
        for( var i=$scope.selectedOrgUnit.l+1; i<=3; i++ ){
            var lvl = $scope.model.ouLevels[i];
            $scope.ouModes.push({value: lvl, name: lvl + ' ' + $translate.instant('level'), level: i});
        }
        $scope.selectedOuMode = $scope.ouModes[0];
    }
    
    function resetParams(){
        $scope.showReportFilters = true;
        $scope.reportStarted = false;
        $scope.reportReady = false;
        $scope.noDataExists = false;
        $scope.model.reportDataElements = [];
        $scope.model.whoDoesWhatCols = [];
        $scope.model.selectedDataSets = [];
        $scope.model.selectedPeriod = null;
    }
    
    //watch for selection of org unit from tree
    $scope.$watch('selectedOrgUnit', function() {
        resetParams();
        if( angular.isObject($scope.selectedOrgUnit)){            
            
            if( $scope.selectedOrgUnit.l === 1 ){                
                subtree.getChildren($scope.selectedOrgUnit.id).then(function( json ){                            
                    var children = [];
                    for( var k in json ){
                        if( json.hasOwnProperty( k ) ){
                            children.push(json[k]);
                        }
                    }
                    children = $filter('filter')(children, {l: 3});
                    $scope.model.childrenIds = [];
                    angular.forEach(children, function(c){
                        $scope.model.childrenIds.push(c.id);
                    });
                });
            }
            if( $scope.selectedOrgUnit.l === 2 ){
                $scope.model.childrenIds = $scope.selectedOrgUnit.c;
            }
            
            $scope.model.programs = [];
            $scope.model.roleDataElementsById = [];
            $scope.model.roleDataElements = [];
            MetaDataFactory.getAll('programs').then(function(programs){
                $scope.model.programs = programs;
                angular.forEach(programs, function(program){
                    if( program.programStages && program.programStages[0] && program.programStages[0].programStageDataElements ){
                        angular.forEach(program.programStages[0].programStageDataElements, function(prStDe){
                            if( prStDe.dataElement && prStDe.dataElement.id && !$scope.model.roleDataElementsById[prStDe.dataElement.id]){                                
                                $scope.model.roleDataElementsById[prStDe.dataElement.id] = {name:  prStDe.dataElement.name, sortOrder: prStDe.sortOrder};
                            }                            
                        });
                    }                    
                    $scope.model.programsByCode[program.actionCode] = program;
                    $scope.model.programCodesById[program.id] = program.actionCode;
                });
                
                for( var k in $scope.model.roleDataElementsById ){
                    if( $scope.model.roleDataElementsById.hasOwnProperty( k ) ){
                        $scope.model.roleDataElements.push( {id: k, name: $scope.model.roleDataElementsById[k].name, sortOrder: $scope.model.roleDataElementsById[k].sortOrder} );
                    }
                }
            });
            
            $scope.model.mappedOptionCombos = [];
            OptionComboService.getMappedOptionCombos().then(function(ocos){
                $scope.model.mappedOptionCombos = ocos;
            });
            
            $scope.model.categoryCombos = {};
            MetaDataFactory.getAll('categoryCombos').then(function(ccs){
                angular.forEach(ccs, function(cc){
                    $scope.model.categoryCombos[cc.id] = cc;
                });
            });

            $scope.model.dataSets = [];
            MetaDataFactory.getAll('dataSets').then(function(dataSets){
                $scope.model.dataSets = $filter('filter')(dataSets, {dataSetType: 'action'});
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
            return;
        }
                
        if( !$scope.model.selectedDataSets.length || $scope.model.selectedDataSets.length < 1 ){            
            var dialogOptions = {
                headerText: $translate.instant('error'),
                bodyText: $translate.instant('please_select_actions')
            };		
            DialogService.showDialog({}, dialogOptions);
            return;
        }
        
        $scope.showReportFilters = false;
        $scope.reportStarted = true;
        $scope.reportReady = false;
        $scope.noDataExists = false;
        $scope.model.reportDataElements = [];
        $scope.model.whoDoesWhatCols = [];
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
        $scope.model.dataElementCodesById = [];
        $scope.model.mappedRoles = {};
        $scope.optionCombos = [];
        angular.forEach($scope.model.selectedDataSets, function(ds){
            if( ds.dataElements && ds.dataElements[0] && ds.dataElements[0].code && $scope.model.programsByCode[ds.dataElements[0].code] ){                
                var pr = $scope.model.programsByCode[ds.dataElements[0].code]; 
                $scope.model.selectedPrograms.push( pr );                
                $scope.model.reportDataElements.push( ds.dataElements[0] );
                $scope.model.dataElementCodesById[ds.dataElements[0].id] = ds.dataElements[0].code;
                $scope.optionCombos = $scope.optionCombos.concat($scope.model.categoryCombos[ds.dataElements[0].categoryCombo.id].categoryOptionCombos);                
                $scope.model.mappedRoles[pr.actionCode] = {};
            }
        });
        
        $scope.model.availableRoles = {};
        var reportParams = {orgUnit: $scope.selectedOrgUnit.id, 
                        programs: $scope.model.selectedPrograms, 
                        period: $scope.model.selectedPeriod, 
                        dataValueSetUrl: dataValueSetUrl};
        var reportData = {mappedRoles: $scope.model.mappedRoles,
                        programCodesById: $scope.model.programCodesById,
                        roleDataElementsById: $scope.model.roleDataElementsById,
                        whoDoesWhatCols: $scope.model.whoDoesWhatCols,
                        availableRoles: $scope.model.availableRoles,
                        mappedOptionCombos: $scope.model.mappedOptionCombos,
                        dataElementCodesById: $scope.model.dataElementCodesById
                    };
        
        ReportService.getReportData( reportParams, reportData ).then(function(response){            
            $scope.model.mappedRoles = response.mappedRoles;
            $scope.model.whoDoesWhatCols = response.whoDoesWhatCols;
            $scope.model.availableRoles = response.availableRoles;
            $scope.model.mappedValues = response.mappedValues;
            $scope.reportReady = response.reportReady;
            $scope.showReportFilters = response.showReportFilters;
            $scope.noDataExists = response.noDataExists;
            $scope.reportStarted = response.reportStarted;     
        });
    };
    
    $scope.getStakeholders = function( col, deId, ocId ){        
        var filteredValues = $filter('filter')($scope.model.mappedValues.dataValues, {dataElement: deId, categoryOptionCombo: ocId});
        var role = [];        
        angular.forEach(filteredValues, function(val){
            if( val[col.id] ){
                angular.forEach(val[col.id], function(v){
                    if( role.indexOf(v) === -1){
                        role.push( v );
                    }
                });
            }            
        });
        var r = role.sort().join(", ");
        return r;
    };
    
    $scope.exportData = function () {
        var blob = new Blob([document.getElementById('exportTable').innerHTML], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8"
        });
        saveAs(blob, "Report.xls");
    };
});
