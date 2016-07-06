/* global angular */

'use strict';

/* Controllers */
var actionMappingControllers = angular.module('actionMappingControllers', [])

//Controller for settings page
.controller('actionMappingController',
        function($scope,
                $filter,
                SessionStorageService,
                storage,
                DialogService,
                DataSetFactory,
                PeriodService,
                MetaDataFactory,
                ActionMappingUtils,
                DataValueService) {
    $scope.periodOffset = 0;
    $scope.model = {invalidDimensions: false, 
                    childrenOu: [],
                    selectedAttributeCategoryCombo: null,
                    standardDataSets: [],
                    multiDataSets: [],
                    dataSets: [],
                    optionSets: null,
                    categoryOptionsReady: false,
                    allowMultiOrgUnitEntry: false,
                    selectedOptions: [],
                    roleHeders: ActionMappingUtils.getRoleHeaders(),
                    stakeholderRoles: {},
                    dataValues: {},
                    roleValues: {},
                    orgUnitsWithValues: [],
                    selectedAttributeOptionCombos: {},
                    selectedAttributeOptionCombo: null};
    
    //watch for selection of org unit from tree
    $scope.$watch('selectedOrgUnit', function() {
        $scope.model.periods = [];
        $scope.model.dataSets = [];
        $scope.model.selectedDataSet = null;
        $scope.model.selectedPeriod = null;
        $scope.model.selectedAttributeCategoryCombo = null;
        $scope.model.selectedAttributeOptionCombos = {};
        $scope.model.selectedAttributeOptionCombo = null;
        $scope.model.stakeholderRoles = {};
        $scope.model.dataValues = {};
        $scope.model.orgUnitsWithValues = [];
        $scope.model.categoryOptionsReady = false;
        if( angular.isObject($scope.selectedOrgUnit)){            
            SessionStorageService.set('SELECTED_OU', $scope.selectedOrgUnit); 
            var systemSetting = storage.get('SYSTEM_SETTING');
            $scope.model.allowMultiOrgUnitEntry = systemSetting && systemSetting.multiOrganisationUnitForms ? systemSetting.multiOrganisationUnitForms : false;
            $scope.loadDataSets($scope.selectedOrgUnit);
        }
    });   
    
    //load datasets associated with the selected org unit.
    $scope.loadDataSets = function(orgUnit) {
        $scope.selectedOrgUnit = orgUnit;
        $scope.model.dataSets = [];
        $scope.model.selectedAttributeCategoryCombo = null;
        $scope.model.selectedAttributeOptionCombos = {};
        $scope.model.selectedAttributeOptionCombo = null;
        $scope.model.selectedPeriod = null;  
        $scope.model.stakeholderRoles = {};
        $scope.model.orgUnitsWithValues = [];
        $scope.model.dataValues = {};
        if (angular.isObject($scope.selectedOrgUnit)) {            
            DataSetFactory.getAll( $scope.selectedOrgUnit ).then(function(dataSets){ 
                $scope.model.dataSets = dataSets;                
                if(!$scope.model.optionSets){
                    $scope.model.optionSets = [];
                    MetaDataFactory.getAll('optionSets').then(function(optionSets){
                        angular.forEach(optionSets, function(optionSet){
                            if( optionSet.StakeholderRole === 'Funder' ){
                                //$scope.model.optionSets['Funder'] = optionSet;
                                var o = angular.copy( optionSet );
                                var options = [];
                                angular.forEach(o.options, function(_o){
                                   options.push( _o.displayName ); 
                                });
                                o.options = options;
                                $scope.model.optionSets['Funder'] = o;
                            }
                            else if( optionSet.StakeholderRole === 'ResponsibleMinistry' ){
                                //$scope.model.optionSets['Responsible Ministry'] = optionSet;
                                var o = angular.copy( optionSet );
                                var options = [];
                                angular.forEach(o.options, function(_o){
                                   options.push( _o.displayName ); 
                                });
                                o.options = options;
                                $scope.model.optionSets['Responsible Ministry'] = o;                                
                            }
                            else{
                                $scope.model.optionSets[optionSet.id] = optionSet;
                            }
                        });
                    });
                }
            });
        }        
    }; 
    
    //watch for selection of data set
    $scope.$watch('model.selectedDataSet', function() {        
        $scope.model.periods = [];
        $scope.model.selectedPeriod = null;
        $scope.model.categoryOptionsReady = false;
        $scope.model.stakeholderRoles = {};
        $scope.model.dataValues = {};
        $scope.model.orgUnitsWithValues = [];
        if( angular.isObject($scope.model.selectedDataSet) && $scope.model.selectedDataSet.id){
            $scope.loadDataSetDetails();
        }
    });
    
    $scope.$watch('model.selectedPeriod', function(){
        $scope.model.stakeholderRoles = {};
        $scope.model.dataValues = {};
        $scope.loadDataEntryForm();
    });
    
    $scope.loadDataEntryForm = function(){
        $scope.model.stakeholderRoles = {};
        $scope.model.dataValues = {};
        $scope.model.roleValues = {};
        $scope.model.orgUnitsWithValues = [];
        if( angular.isObject( $scope.selectedOrgUnit ) && $scope.selectedOrgUnit.id &&
                angular.isObject( $scope.model.selectedDataSet ) && $scope.model.selectedDataSet.id &&
                angular.isObject( $scope.model.selectedPeriod) && $scope.model.selectedPeriod.id &&
                $scope.model.categoryOptionsReady ){
            
            var dataValueSetUrl = 'dataSet=' + $scope.model.selectedDataSet.id + '&period=' + $scope.model.selectedPeriod.id;

            if( $scope.model.allowMultiOrgUnitEntry ){
                angular.forEach($scope.selectedOrgUnit.c, function(c){
                    dataValueSetUrl += '&orgUnit=' + c;
                });
            }
            else{
                dataValueSetUrl += '&orgUnit=' + $scope.selectedOrgUnit.id;
            }
            
            $scope.model.selectedAttributeOptionCombo = ActionMappingUtils.getOptionComboIdFromOptionNames($scope.model.selectedAttributeOptionCombos, $scope.model.selectedOptions);
                        
            //fetch data values...            
            DataValueService.getDataValueSet( dataValueSetUrl ).then(function(response){                
                angular.forEach($filter('filter')(response.dataValues, {attributeOptionCombo: $scope.model.selectedAttributeOptionCombo}), function(dv){
                    var code = $scope.model.dataElements[dv.dataElement];
                    if( code && code === 'Catalyst' ||  code === 'Funder' || code === 'Responsible Ministry'){                        
                        if( !$scope.model.stakeholderRoles[dv.dataElement] ){
                            $scope.model.stakeholderRoles[dv.dataElement] = [];
                            $scope.model.stakeholderRoles[dv.dataElement] = ActionMappingUtils.pushRoles( $scope.model.stakeholderRoles[dv.dataElement], dv.value );
                        }
                        else{
                            $scope.model.stakeholderRoles[dv.dataElement] = ActionMappingUtils.pushRoles( $scope.model.stakeholderRoles[dv.dataElement], dv.value );
                        }
                    }
                    else{
                        if(!$scope.model.dataValues[dv.orgUnit]){
                            $scope.model.dataValues[dv.orgUnit] = {};
                            $scope.model.dataValues[dv.orgUnit][dv.dataElement] = {};
                            $scope.model.dataValues[dv.orgUnit][dv.dataElement][dv.categoryOptionCombo] = dv;
                        }
                        else{
                            if(!$scope.model.dataValues[dv.orgUnit][dv.dataElement]){
                                $scope.model.dataValues[dv.orgUnit][dv.dataElement] = {};
                            }
                            $scope.model.dataValues[dv.orgUnit][dv.dataElement][dv.categoryOptionCombo] = dv;
                        }
                    }                    
                });
            });
        }
    };
    
    $scope.loadDataSetDetails = function(){
        if( $scope.model.selectedDataSet && $scope.model.selectedDataSet.id && $scope.model.selectedDataSet.periodType){ 
            
            $scope.model.periods = PeriodService.getPeriods($scope.model.selectedDataSet.periodType, $scope.model.periodOffset);
            
            if(!$scope.model.selectedDataSet.dataElements || $scope.model.selectedDataSet.dataElements.length < 1){                
                $scope.invalidCategoryDimensionConfiguration('error', 'missing_data_elements_indicators');
                return;
            }            
            
            $scope.model.selectedAttributeCategoryCombo = null;            
            MetaDataFactory.get('categoryCombos', $scope.model.selectedDataSet.categoryCombo.id).then(function(coc){
                $scope.model.selectedAttributeCategoryCombo = coc;
                if( $scope.model.selectedAttributeCategoryCombo && $scope.model.selectedAttributeCategoryCombo.isDefault ){
                    $scope.model.categoryOptionsReady = true;
                }                
                angular.forEach($scope.model.selectedAttributeCategoryCombo.categoryOptionCombos, function(oco){
                    $scope.model.selectedAttributeOptionCombos['"' + oco.displayName + '"'] = oco.id;
                });
            });
            
            $scope.model.selectedCategoryCombos = {};
            $scope.model.roleDataElements = [];
            $scope.model.dataElements = [];
            angular.forEach($scope.model.selectedDataSet.dataElements, function(de){
                $scope.model.dataElements[de.id] = de.code;
                if( de.code === 'Catalyst' || de.code === 'Funder' || de.code === 'Responsible Ministry' ){
                    $scope.model.roleDataElements.push( de );
                }
                
                MetaDataFactory.get('categoryCombos', de.categoryCombo.id).then(function(coc){
                    if( coc.isDefault ){
                        $scope.model.defaultCategoryCombo = coc;
                    }
                    $scope.model.selectedCategoryCombos[de.categoryCombo.id] = coc;
                });                
            });
        }
    };
    
    $scope.invalidCategoryDimensionConfiguration = function( headerText, bodyText){
        $scope.model.invalidDimensions = true;
        var dialogOptions = {
            headerText: headerText,
            bodyText: bodyText
        };
        DialogService.showDialog({}, dialogOptions);
    };
    
    $scope.getCategoryOptions = function(){
        $scope.model.categoryOptionsReady = false;
        $scope.model.selectedOptions = [];        
        for(var i=0; i<$scope.model.selectedAttributeCategoryCombo.categories.length; i++){
            if($scope.model.selectedAttributeCategoryCombo.categories[i].selectedOption && $scope.model.selectedAttributeCategoryCombo.categories[i].selectedOption.id){
                $scope.model.categoryOptionsReady = true;
                $scope.model.selectedOptions.push($scope.model.selectedAttributeCategoryCombo.categories[i].selectedOption);
            }
            else{
                $scope.model.categoryOptionsReady = false;
                break;
            }
        }        
        if($scope.model.categoryOptionsReady){
            $scope.loadDataEntryForm();
        }
    };
    
    $scope.getPeriods = function(mode){
        
        if( mode === 'NXT'){
            $scope.periodOffset = $scope.periodOffset + 1;
            $scope.model.selectedPeriod = null;
            $scope.model.periods = PeriodService.getPeriods($scope.model.selectedDataSet.periodType, $scope.periodOffset);
        }
        else{
            $scope.periodOffset = $scope.periodOffset - 1;
            $scope.model.selectedPeriod = null;
            $scope.model.periods = PeriodService.getPeriods($scope.model.selectedDataSet.periodType, $scope.periodOffset);
        }
    };
    
    $scope.saveRole = function( dataElementId ){
        
        var dataValues = {dataValues: []};
        
        var dataValue = $scope.model.stakeholderRoles[dataElementId].join();
        
        if( $scope.model.allowMultiOrgUnitEntry ){
            
            angular.forEach($scope.selectedOrgUnit.c, function(c){
                
                dataValues.dataValues.push({
                    dataElement: dataElementId,
                    period: $scope.model.selectedPeriod.id,
                    orgUnit: c,
                    categoryOptionCombo: $scope.model.defaultCategoryCombo.categoryOptionCombos[0].id,                
                    attributeOptionCombo: $scope.model.selectedAttributeOptionCombo,
                    value: dataValue
                });
            });
        }
        else{
            dataValues.dataValues.push({
                dataElement: dataElementId,
                period: $scope.model.selectedPeriod.id,
                orgUnit: $scope.selectedOrgUnit.id,
                categoryOptionCombo: $scope.model.defaultCategoryCombo.categoryOptionCombos[0].id,                
                attributeOptionCombo: $scope.model.selectedAttributeOptionCombo,
                value: dataValue
            });
        }
                
        DataValueService.saveDataValueSet( dataValues ).then(function(){        
        });
        
    };
    
    $scope.saveDataValue = function( ouId, deId, ocId ){
        
        var dataValue = {ou: ouId,
                    pe: $scope.model.selectedPeriod.id,
                    de: deId,
                    co: ocId,
                    cc: $scope.model.selectedAttributeCategoryCombo.id,
                    cp: ActionMappingUtils.getOptionIds($scope.model.selectedOptions),
                    value: $scope.model.dataValues[ouId][deId][ocId].value
                };
        
        
        console.log('I am going to save:  ', dataValue);
        DataValueService.saveDataValue( dataValue ).then(function(response){        
            console.log('response:  ', response);
        });
    };
});
