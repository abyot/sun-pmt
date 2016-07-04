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
                    categoryOptionsReady: false,
                    selectedOptions: [],
                    programs: null,
                    roleHeders: ActionMappingUtils.getRoleHeaders(),
                    stakeholderRoles: {},
                    dataValues: {},
                    selectedAttributeOptionCombos: {}};
                
    var systemSetting = storage.get('SYSTEM_SETTING');
    $scope.model.allowMultiOrgUnitEntry = systemSetting && systemSetting.multiOrganisationUnitForms ? systemSetting.multiOrganisationUnitForms : false;
    
    //watch for selection of org unit from tree
    $scope.$watch('selectedOrgUnit', function() {
        $scope.model.periods = [];
        $scope.model.dataSets = [];
        $scope.model.selectedDataSet = null;
        $scope.model.selectedPeriod = null;
        $scope.model.selectedAttributeCategoryCombo = null;
        $scope.model.selectedAttributeOptionCombos = {};
        $scope.model.stakeholderRoles = {};
        $scope.model.dataValues = {};
        $scope.model.categoryOptionsReady = false;
        if( angular.isObject($scope.selectedOrgUnit)){            
            SessionStorageService.set('SELECTED_OU', $scope.selectedOrgUnit);            
            $scope.loadDataSets($scope.selectedOrgUnit);
        }
    });   
    
    //load datasets associated with the selected org unit.
    $scope.loadDataSets = function(orgUnit) {
        $scope.selectedOrgUnit = orgUnit;
        $scope.model.dataSets = [];
        $scope.model.selectedAttributeCategoryCombo = null;
        $scope.model.selectedAttributeOptionCombos = {};
        $scope.model.selectedPeriod = null;  
        $scope.model.stakeholderRoles = {};
        $scope.model.dataValues = {};
        if (angular.isObject($scope.selectedOrgUnit)) {            
            DataSetFactory.getAll( $scope.selectedOrgUnit ).then(function(dataSets){ 
                $scope.model.dataSets = dataSets;
                
                if(!$scope.model.programs){
                    $scope.model.programs = [];
                    MetaDataFactory.getAll('programs').then(function(programs){
                        angular.forEach(programs, function(pr){
                            if( pr.actionCode ){
                                $scope.model.programs[pr.actionCode] = pr;
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
            
            var selectedAttributeOcobo = ActionMappingUtils.getOptionComboIdFromOptionNames($scope.model.selectedAttributeOptionCombos, $scope.model.selectedOptions);
            console.log('the attributeOcobo:  ', selectedAttributeOcobo);
            
            //fetch data values...            
            DataValueService.getDataValueSets( dataValueSetUrl ).then(function(response){
                
                console.log(response);
                
                angular.forEach($filter('filter')(response.dataValues, {attributeOptionCombo: selectedAttributeOcobo}), function(dv){
                    if(!$scope.model.dataValues[dv.orgUnit]){
                        $scope.model.dataValues[dv.orgUnit] = {};
                        $scope.model.dataValues[dv.orgUnit][dv.categoryOptionCombo] = dv;
                    }
                    else{
                        $scope.model.dataValues[dv.orgUnit][dv.categoryOptionCombo] = dv;
                    }
                });
                
                console.log('mapped values:  ', $scope.model.dataValues);
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
            
            $scope.model.selectedCategoryCombos = [];            
            angular.forEach($scope.model.selectedDataSet.dataElements, function(de){
                MetaDataFactory.get('categoryCombos', de.categoryCombo.id).then(function(coc){
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
});
