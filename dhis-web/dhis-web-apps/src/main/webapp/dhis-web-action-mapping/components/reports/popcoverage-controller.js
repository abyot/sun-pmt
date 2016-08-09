/* global angular */

'use strict';

var sunPMT = angular.module('sunPMT');

//Controller for reports page
sunPMT.controller('PopCoverageController',
        function($scope,
                $filter,
                $translate,
                SessionStorageService,
                DialogService,
                PeriodService,
                MetaDataFactory,
                DataSetFactory,
                ActionMappingUtils,
                DataValueService,
                OptionComboService,
                EventService) {
    $scope.periodOffset = 0;
    $scope.showReportFilters = true;
    $scope.reportReady = false;
    $scope.noDataExists = false;
    $scope.orgUnitLevels = null;
    $scope.model = {stakeholderRoles: [{id: 'CA_ID', name: $translate.instant('catalyst')},{id: 'FU_ID', name: $translate.instant('funder')},{id: 'RM_ID', name: $translate.instant('responsible_ministry')}],
        ouModes: [],
        periods: [],
        indicators: null,
        selectedIndicators: [],
        dataSets: null,
        selectedDataSets: [],
        targetDataSets: null,
        ouLevels: [],
        programs: null,
        programsByCode: [],
        programCodesById: [],
        dataElementsByCode: [],
        dataElementCodesById: [],
        dataSetsByDataElementId: [],
        selectedPrograms: null,
        selectedRole: null,
        mappedOptionCombos: null,
        roleDataElementsById: null,
        reportDataElements: null,
        whoDoesWhatCols: null,
        mappedValues: null,
        mappedTargetValues: null,
        childrenIds: []};
    
    function populateOuLevels(){
        $scope.model.ouModes = [{name: $translate.instant('selected_level') , value: 'SELECTED', level: $scope.selectedOrgUnit.l}];            
        $scope.model.selectedOuMode = $scope.model.ouModes[0];
        for( var i=$scope.selectedOrgUnit.l+1; i<=3; i++ ){
            var lvl = $scope.model.ouLevels[i];
            $scope.model.ouModes.push({value: lvl, name: lvl + ' ' + $translate.instant('level'), level: i});
        }
    }
    
    function resetParams(){
        $scope.showReportFilters = true;
        $scope.reportStarted = false;
        $scope.reportReady = false;
        $scope.noDataExists = false;
        $scope.model.reportDataElements = [];
        $scope.model.whoDoesWhatCols = [];
    }
    
    //watch for selection of org unit from tree
    $scope.$watch('selectedOrgUnit', function() {        
        $scope.model.selectedDataSets = [];
        $scope.model.selectedPeriod = null;
        $scope.model.selectedRole = null;
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
                                $scope.model.roleDataElementsById[prStDe.dataElement.id] = prStDe.dataElement.name;
                            }                            
                        });
                    }                    
                    $scope.model.programsByCode[program.actionCode] = program;
                    $scope.model.programCodesById[program.id] = program.actionCode;
                });
                
                for( var k in $scope.model.roleDataElementsById ){
                    if( $scope.model.roleDataElementsById.hasOwnProperty( k ) ){
                        $scope.model.roleDataElements.push( {id: k, name: $scope.model.roleDataElementsById[k]} );
                    }
                }
            });
            
            $scope.model.mappedOptionCombos = [];
            OptionComboService.getMappedOptionCombos().then(function(ocos){
                $scope.model.mappedOptionCombos = ocos;
            });

            $scope.model.indicators = [];
            $scope.model.dataSets = [];
            $scope.model.targetDataSets = [];
            MetaDataFactory.getAll('indicatorGroups').then(function(idgs){                
                idgs = $filter('filter')(idgs, {isAction: true});
                angular.forEach(idgs, function(idg){                    
                    if( idg.indicators && idg.indicators.length > 0 ){
                        $scope.model.indicators = $scope.model.indicators.concat( idg.indicators );
                    }
                });
                
                DataSetFactory.getActionAndTargetDataSets().then(function(dataSets){
                    $scope.model.dataSets = dataSets;                
                    angular.forEach($scope.model.dataSets, function(ds){
                        if( ds.dataSetType === 'action'){
                            if( ds.dataElements && ds.dataElements[0] && ds.dataElements[0].code ){
                                $scope.model.dataElementsByCode[ds.dataElements[0].code] = ds.dataElements[0];
                                $scope.model.dataSetsByDataElementId[ds.dataElements[0].id] = ds;
                            }
                        }
                        else{
                            $scope.model.targetDataSets.push( ds );
                        }                        
                    });
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
            status = $scope.popCoverageForm.submitted || field.$dirty;
        }
        return status;        
    };
    
    $scope.getReport = function(){
        
        //check for form validity
        $scope.popCoverageForm.submitted = true;        
        if( $scope.popCoverageForm.$invalid ){
            return false;
        }
        
        if( !$scope.model.selectedIndicators.length || $scope.model.selectedIndicators.length < 1 ){            
            var dialogOptions = {
                headerText: $translate.instant('error'),
                bodyText: $translate.instant('please_select_actions')
            };		
            DialogService.showDialog({}, dialogOptions);
            return;
        }
        
        resetParams();
        $scope.reportStarted = true;
        $scope.showReportFilters = false;        
        var pushedHeaders = [];
        
        
        
        $scope.model.selectedDataSets = [];
        $scope.model.selectedDataSets = $scope.model.selectedDataSets.concat( $scope.model.targetDataSets );
        angular.forEach($scope.model.selectedIndicators, function(ind){
            ind = ActionMappingUtils.getNumeratorAndDenominatorIds( ind );
            if( $scope.model.dataSetsByDataElementId[ind.numerator] ){
                $scope.model.selectedDataSets.push( $scope.model.dataSetsByDataElementId[ind.numerator] );
            }
        });
        
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
        angular.forEach($scope.model.selectedDataSets, function(ds){
            if( ds.dataElements && ds.dataElements[0] && ds.dataElements[0].code && $scope.model.programsByCode[ds.dataElements[0].code] ){                
                var pr = $scope.model.programsByCode[ds.dataElements[0].code];                
                if( pr ){
                    $scope.model.selectedPrograms.push( pr );
                    $scope.model.mappedRoles[pr.actionCode] = {};
                    $scope.model.reportDataElements.push( ds.dataElements[0] );
                    $scope.model.dataElementCodesById[ds.dataElements[0].id] = ds.dataElements[0].code;
                }
            }
        });        
        
        $scope.model.availableRoles = {};
        EventService.getForMultiplePrograms($scope.selectedOrgUnit.id, 'DESCENDANTS', $scope.model.selectedPrograms, null, $scope.model.selectedPeriod.startDate, $scope.model.selectedPeriod.endDate).then(function(events){            
            angular.forEach(events, function(ev){
                var _ev = {event: ev.event, orgUnit: ev.orgUnit};
                if( !$scope.model.mappedRoles[$scope.model.programCodesById[ev.program]][ev.orgUnit] ){
                    $scope.model.mappedRoles[$scope.model.programCodesById[ev.program]][ev.orgUnit] = {};
                }
                
                if( ev.dataValues ){
                    angular.forEach(ev.dataValues, function(dv){                        
                        if( dv.dataElement && $scope.model.roleDataElementsById[dv.dataElement] ){
                            _ev[dv.dataElement] = dv.value.split(",");
                            if( pushedHeaders.indexOf(dv.dataElement) === -1 ){
                                $scope.model.whoDoesWhatCols.push({id: dv.dataElement, name: $scope.model.roleDataElementsById[dv.dataElement]});
                                pushedHeaders.push( dv.dataElement );
                                $scope.model.availableRoles[dv.dataElement] = [];
                            }                            
                            $scope.model.availableRoles[dv.dataElement] = ActionMappingUtils.pushRoles( $scope.model.availableRoles[dv.dataElement], dv.value );
                        }
                    });                    
                    $scope.model.mappedRoles[$scope.model.programCodesById[ev.program]][ev.orgUnit][ev.attributeOptionCombo] = _ev;
                }
            });

            $scope.model.mappedValues = [];
            $scope.model.mappedTargetValues = {};
            DataValueService.getDataValueSet( dataValueSetUrl ).then(function( response ){
                if( response && response.dataValues ){
                    angular.forEach(response.dataValues, function(dv){
                        var oco = $scope.model.mappedOptionCombos[dv.attributeOptionCombo];
                        if( oco.displayName !== 'default' ){
                            oco.optionNames = oco.displayName.split(", ");
                            for(var i=0; i<oco.categories.length; i++){                        
                                dv[oco.categories[i].id] = [oco.optionNames[i]];
                                if( pushedHeaders.indexOf( oco.categories[i].id ) === -1 ){
                                    $scope.model.whoDoesWhatCols.push({id: oco.categories[i].id, name: oco.categories[i].name});
                                    pushedHeaders.push( oco.categories[i].id );
                                }
                            }
                        }
                        
                        if( $scope.model.dataElementCodesById[dv.dataElement] ){
                            var r = $scope.model.mappedRoles[$scope.model.dataElementCodesById[dv.dataElement]][dv.orgUnit][dv.attributeOptionCombo];
                            if( r && angular.isObject( r ) ){
                                angular.extend(dv, r);
                            }
                        }
                        else{ // target values (denominators)
                            if( !$scope.model.mappedTargetValues[dv.dataElement] ){
                                $scope.model.mappedTargetValues[dv.dataElement] = {};
                            }
                            $scope.model.mappedTargetValues[dv.dataElement][dv.orgUnit] = dv.value;
                        }
                    });                    
                    $scope.model.mappedValues = response;
                }
                else{                    
                    $scope.showReportFilters = false;
                    $scope.noDataExists = true;
                }  
                
                $scope.reportReady = true;
                $scope.reportStarted = false;
            });
        });
    };
    
    $scope.getStakeholders = function( col, deId ){        
        var filteredValues = $filter('filter')($scope.model.mappedValues.dataValues, {dataElement: deId});
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
        return role.join(", ");
    };
    
    $scope.getValuePerRole = function( col, ind ){        
        ind = ActionMappingUtils.getNumeratorAndDenominatorIds( ind );        
        var filteredNumerators = $filter('filter')($scope.model.mappedValues.dataValues, {dataElement: ind.numerator});
        var filteredDenominators = $filter('filter')($scope.model.mappedValues.dataValues, {dataElement: ind.denominator});
        
        var checkedOus = {};        
        var numerator = 0;
        angular.forEach(filteredNumerators, function(val){
            if( val[$scope.model.selectedRole.id] && 
                    val[$scope.model.selectedRole.id].length 
                    && val[$scope.model.selectedRole.id].indexOf( col ) !== -1){                
                if( $scope.model.childrenIds.indexOf( val.orgUnit ) === -1 ){
                    console.log('missing orgunit:  ', val.orgUnit);
                    return;
                }
                else{
                    if( !checkedOus[col] ){
                        checkedOus[col] = [];
                    }
                    if( $scope.model.childrenIds.indexOf( val.orgUnit ) !== -1 && checkedOus[col].indexOf( val.orgUnit ) === -1){
                        numerator = ActionMappingUtils.getSum( numerator, val.value);
                        checkedOus[col].push( val.orgUnit );
                    }
                }                
            }            
        });
        
        var denominator = 0;
        angular.forEach(filteredDenominators, function(val){            
            denominator = ActionMappingUtils.getSum( denominator, val.value);
        });
        
        return ActionMappingUtils.getPercent(numerator, denominator);
    };
});
