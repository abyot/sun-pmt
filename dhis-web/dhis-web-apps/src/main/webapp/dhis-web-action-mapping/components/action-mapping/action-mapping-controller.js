/* global angular */

'use strict';

/* Controllers */
var actionMappingControllers = angular.module('actionMappingControllers', [])

//Controller for settings page
.controller('actionMappingController',
        function($scope,
                SessionStorageService,
                storage,
                DialogService,
                DataSetFactory,
                PeriodService,
                IndexDBService,
                MetaDataFactory) {
    $scope.periodOffset = 0;
    $scope.model = {invalidDimensions: false, 
                    childrenOu: [],
                    selectedAttributeCategoryCombo: null,
                    standardDataSets: [],
                    multiDataSets: [],
                    dataSets: [],
                    categoryOptionsReady: false,
                    selectedOptions: []};
                
    var systemSetting = storage.get('SYSTEM_SETTING');
    $scope.model.allowMultiOrgUnitEntry = systemSetting && systemSetting.multiOrganisationUnitForms ? systemSetting.multiOrganisationUnitForms : false;
    //watch for selection of org unit from tree
    $scope.$watch('selectedOrgUnit', function() {
        $scope.model.periods = [];
        $scope.model.dataSets = [];
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
        $scope.pushedIds = [];
        if (angular.isObject($scope.selectedOrgUnit)) {            
            DataSetFactory.getAll().then(function(dataSets){ 
                var multiDs = angular.copy(dataSets);
                angular.forEach(dataSets, function(ds){
                    if( ds.organisationUnits.hasOwnProperty( $scope.selectedOrgUnit.id ) ){
                        ds.entryMode = 'Single Entry';
                        $scope.model.dataSets.push(ds);
                    }
                });
                
                if( $scope.model.allowMultiOrgUnitEntry ){
                    $scope.model.childrenOu = [];
                    IndexDBService.open('dhis2ou').then(function(){
                        IndexDBService.get('ou', $scope.selectedOrgUnit.id).then(function(ou){
                            if( ou && ou.c ){
                                angular.forEach(ou.c, function(c){                                    
                                    angular.forEach(multiDs, function(ds){                                        
                                        if( ds.organisationUnits.hasOwnProperty( c ) && $scope.pushedIds.indexOf( ds.id ) === -1){
                                            ds.entryMode = 'Multiple Entry';
                                            $scope.model.dataSets.push(ds);
                                            $scope.pushedIds.push( ds.id );
                                        }
                                    });
                                    
                                    IndexDBService.get('ou', c).then(function(ou){
                                        if( ou && ou.n ){
                                            $scope.model.childrenOu.push({id: c, name: ou.n});
                                        }                                                       
                                    });
                                });
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
        $scope.model.categoryOptionsReady = false;
        if( angular.isObject($scope.model.selectedDataSet) && $scope.model.selectedDataSet.id){
            $scope.loadDataSetDetails();
        }
    });
    
    $scope.$watch('model.selectedPeriod', function(){
        $scope.loadDataEntryForm();
    });
    
    $scope.loadDataEntryForm = function(){
        if( angular.isObject( $scope.model.selectedPeriod) && $scope.model.selectedPeriod.id){
            //fetch data values...
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
            });
            
            $scope.model.selectedCategoryCombo = null;            
            angular.forEach($scope.model.selectedDataSet.dataElements, function(de){
                
                console.log('data element:  ', de);
                
                /*if(!$scope.model.selectedCategoryCombo && de.categoryCombo && !de.categoryCombo.isDefault){
                    $scope.model.selectedCategoryCombo = de.categoryCombo;
                }
                                
                if(!selectedDataElementGroupSetId && de.dataElementGroups && de.dataElementGroups[0] && de.dataElementGroups[0].dataElementGroupSet){
                    selectedDataElementGroupSetId = de.dataElementGroups[0].dataElementGroupSet.id;
                }
                
                $scope.model.dimensionUrl +=  de.id + ';';*/
            });
            
            /*if( $scope.model.selectedCategoryCombo ){
                if( $scope.model.selectedCategoryCombo.categories && 
                        $scope.model.selectedCategoryCombo.categories.length === 1 &&
                        $scope.model.selectedCategoryCombo.categories[0].dimension &&
                        $scope.model.selectedCategoryCombo.categories[0].categoryOptions){
                
                    $scope.model.optionUrl = 'dimension=' + $scope.model.selectedCategoryCombo.categories[0].id + ':';
                    angular.forEach($scope.model.selectedCategoryCombo.categories[0].categoryOptions, function(op){                        
                        
                        $scope.model.optionUrl +=  op.id + ';';
                        
                        if( op.name === 'Baseline' ){
                            $scope.model.baselineOption = op;
                        }
                        else if( op.name === 'Target' ){
                            $scope.model.targetOption = op;
                        }
                        else if( op.name === 'Progress' ){
                            $scope.model.progressOption = op;
                        }
                    });                    
                }
                else{
                    $scope.invalidCategoryDimensionConfiguration('error', 'data_set_have_invalid_dimension');
                    return;
                }
            }
            else{
                $scope.invalidCategoryDimensionConfiguration('error', 'data_set_have_invalid_dimension');
                return;
            }*/
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
                $scope.model.selectedOptions.push($scope.model.selectedAttributeCategoryCombo.categories[i].selectedOption.id);
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
