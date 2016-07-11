/* global angular */

'use strict';

var sunPMT = angular.module('sunPMT');

//Controller for settings page
sunPMT.controller('dataEntryController',
        function($scope,
                $filter,
                $translate,
                $modal,
                $window,
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
    var addNewOption = {code: 'ADD_NEW_OPTION', id: 'ADD_NEW_OPTION', displayName: $translate.instant('add_new_option')};
    $scope.model = {invalidDimensions: false, 
                    childrenOu: [],
                    selectedAttributeCategoryCombo: null,
                    standardDataSets: [],
                    multiDataSets: [],
                    dataSets: [],
                    optionSets: null,
                    programs: null,
                    categoryOptionsReady: false,
                    allowMultiOrgUnitEntry: false,
                    selectedOptions: [],
                    roleHeders: ActionMappingUtils.getRoleHeaders(),
                    stakeholderRoles: {},
                    dataValues: {},
                    roleValues: {},
                    orgUnitsWithValues: [],
                    selectedProgram: null,
                    selectedAttributeOptionCombos: {},
                    selectedAttributeOptionCombo: null,
                    selectedEvent: {},
                    attributeCategoryUrl: null};
    
    //watch for selection of org unit from tree
    $scope.$watch('selectedOrgUnit', function() {
        $scope.model.periods = [];
        $scope.model.dataSets = [];
        $scope.model.selectedDataSet = null;
        $scope.model.selectedPeriod = null;
        $scope.model.selectedAttributeCategoryCombo = null;
        $scope.model.selectedAttributeOptionCombos = {};
        $scope.model.selectedAttributeOptionCombo = null;
        $scope.model.selectedProgram = null;
        $scope.model.stakeholderRoles = {};
        $scope.model.dataValues = {};
        $scope.model.selectedEvent = {};
        $scope.model.orgUnitsWithValues = [];
        $scope.model.categoryOptionsReady = false;
        $scope.stakeholderList = null;
        if( angular.isObject($scope.selectedOrgUnit)){            
            SessionStorageService.set('SELECTED_OU', $scope.selectedOrgUnit); 
            var systemSetting = storage.get('SYSTEM_SETTING');
            $scope.model.allowMultiOrgUnitEntry = systemSetting && systemSetting.multiOrganisationUnitForms ? systemSetting.multiOrganisationUnitForms : false;
            loadOptionSets();
            $scope.loadDataSets($scope.selectedOrgUnit);
        }
    });
        
    function loadOptionSets() {        
        if(!$scope.model.optionSets){
            $scope.model.optionSets = [];
            MetaDataFactory.getAll('optionSets').then(function(optionSets){
                angular.forEach(optionSets, function(optionSet){
                    if( optionSet.StakeholderRole === 'Funder' ){
                        $scope.stakeholderList = optionSet;
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
    }
    
    function loadOptionCombos(){
        $scope.model.selectedAttributeCategoryCombo = null;     
        if( $scope.model.selectedDataSet && $scope.model.selectedDataSet.categoryCombo && $scope.model.selectedDataSet.categoryCombo.id ){
            MetaDataFactory.get('categoryCombos', $scope.model.selectedDataSet.categoryCombo.id).then(function(coc){
                $scope.model.selectedAttributeCategoryCombo = coc;
                if( $scope.model.selectedAttributeCategoryCombo && $scope.model.selectedAttributeCategoryCombo.isDefault ){
                    $scope.model.categoryOptionsReady = true;
                }                
                angular.forEach($scope.model.selectedAttributeCategoryCombo.categoryOptionCombos, function(oco){
                    $scope.model.selectedAttributeOptionCombos['"' + oco.displayName + '"'] = oco.id;
                });

                angular.forEach($scope.model.selectedAttributeCategoryCombo.categories, function(cat){
                    if( cat.displayName === 'Field Implementer' && cat.categoryOptions.indexOf( addNewOption) === -1 ){
                        cat.categoryOptions.push(addNewOption);
                    }
                });
            });
        }
    }    
    
    //load datasets associated with the selected org unit.
    $scope.loadDataSets = function(orgUnit) {
        $scope.selectedOrgUnit = orgUnit;
        $scope.model.dataSets = [];
        $scope.model.selectedAttributeCategoryCombo = null;
        $scope.model.selectedAttributeOptionCombos = {};
        $scope.model.selectedAttributeOptionCombo = null;
        $scope.model.selectedProgram = null;
        $scope.model.selectedPeriod = null;  
        $scope.model.stakeholderRoles = {};
        $scope.model.orgUnitsWithValues = [];
        $scope.model.selectedEvent = {};
        $scope.model.dataValues = {};
        if (angular.isObject($scope.selectedOrgUnit)) {            
            DataSetFactory.getAll( $scope.selectedOrgUnit ).then(function(dataSets){ 
                $scope.model.dataSets = dataSets; 
                if(!$scope.model.programs){
                    $scope.model.programs = [];
                    MetaDataFactory.getAll('programs').then(function(programs){
                        angular.forEach(programs, function(program){
                            $scope.model.programs[program.actionCode] = program;
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
        $scope.model.selectedProgram = null;
        $scope.model.selectedEvent = {};
        $scope.model.orgUnitsWithValues = [];
        if( angular.isObject($scope.model.selectedDataSet) && $scope.model.selectedDataSet.id){
            $scope.loadDataSetDetails();
        }
    });
    
    $scope.$watch('model.selectedPeriod', function(){        
        $scope.model.dataValues = {};
        $scope.loadDataEntryForm();
    });    
        
    $scope.loadDataSetDetails = function(){
        if( $scope.model.selectedDataSet && $scope.model.selectedDataSet.id && $scope.model.selectedDataSet.periodType){ 
            
            $scope.model.periods = PeriodService.getPeriods($scope.model.selectedDataSet.periodType, $scope.model.periodOffset);
            
            if(!$scope.model.selectedDataSet.dataElements || $scope.model.selectedDataSet.dataElements.length < 1){                
                $scope.invalidCategoryDimensionConfiguration('error', 'missing_data_elements_indicators');
                return;
            }            
            
            loadOptionCombos();            
            
            $scope.model.selectedCategoryCombos = {};
            $scope.model.roleDataElements = [];
            $scope.model.dataElements = [];
            angular.forEach($scope.model.selectedDataSet.dataElements, function(de){
                $scope.model.selectedProgram = $scope.model.programs[de.code];
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
    
    
    $scope.loadDataEntryForm = function(){
        $scope.model.dataValues = {};
        $scope.model.roleValues = {};
        $scope.model.orgUnitsWithValues = [];
        $scope.model.selectedEvent = {};
        if( angular.isObject( $scope.selectedOrgUnit ) && $scope.selectedOrgUnit.id &&
                angular.isObject( $scope.model.selectedDataSet ) && $scope.model.selectedDataSet.id &&
                angular.isObject( $scope.model.selectedPeriod) && $scope.model.selectedPeriod.id &&
                angular.isObject( $scope.model.selectedProgram) && $scope.model.selectedProgram.id && $scope.model.selectedProgram.programStages &&
                $scope.model.categoryOptionsReady ){
            
            var dataValueSetUrl = 'dataSet=' + $scope.model.selectedDataSet.id + '&period=' + $scope.model.selectedPeriod.id;

            if( $scope.model.allowMultiOrgUnitEntry && $scope.model.selectedDataSet.entryMode === 'Multiple Entry'){
                angular.forEach($scope.selectedOrgUnit.c, function(c){
                    dataValueSetUrl += '&orgUnit=' + c;
                    
                    if( $scope.model.selectedProgram && $scope.model.selectedProgram.programStages ){
                        angular.forEach($scope.model.selectedProgram.programStages[0].programStageDataElements, function(prStDe){
                            if( !$scope.model.stakeholderRoles[c] ){
                                $scope.model.stakeholderRoles[c] = {};
                            }                            
                            $scope.model.stakeholderRoles[c][prStDe.dataElement.id] = [];
                        });
                    }
                });
            }
            else{
                dataValueSetUrl += '&orgUnit=' + $scope.selectedOrgUnit.id;
                if( $scope.model.selectedProgram && $scope.model.selectedProgram.programStages ){
                    angular.forEach($scope.model.selectedProgram.programStages[0].programStageDataElements, function(prStDe){
                        if( !$scope.model.stakeholderRoles[$scope.selectedOrgUnit.id] ){
                            $scope.model.stakeholderRoles[$scope.selectedOrgUnit.id] = {};
                        }                            
                        $scope.model.stakeholderRoles[$scope.selectedOrgUnit.id][prStDe.dataElement.id] = [];
                    });
                }
            }
            
            $scope.model.selectedAttributeOptionCombo = ActionMappingUtils.getOptionComboIdFromOptionNames($scope.model.selectedAttributeOptionCombos, $scope.model.selectedOptions);

            //fetch data values...            
            DataValueService.getDataValueSet( dataValueSetUrl ).then(function(response){                
                angular.forEach($filter('filter')(response.dataValues, {attributeOptionCombo: $scope.model.selectedAttributeOptionCombo}), function(dv){
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
                });
            });
            
            //fetch events - for stakholder-role mapping
            $scope.model.attributeCategoryUrl = {cc: $scope.model.selectedAttributeCategoryCombo.id, default: $scope.model.selectedAttributeCategoryCombo.isDefault, cp: ActionMappingUtils.getOptionIds($scope.model.selectedOptions)};
            $scope.model.commonOrgUnit = null;
            
            EventService.getByOrgUnitAndProgram($scope.selectedOrgUnit.id, 'CHILDREN', $scope.model.selectedProgram.id, $scope.model.attributeCategoryUrl, $scope.model.selectedPeriod.startDate, $scope.model.selectedPeriod.endDate).then(function(events){                
                angular.forEach(events, function(ev){
                    if( ev.event ){
                        $scope.model.selectedEvent[ev.orgUnit] = ev;
                        $scope.model.commonOrgUnit = ev.orgUnit;
                        angular.forEach(ev.dataValues, function(dv){
                            $scope.model.stakeholderRoles[ev.orgUnit][dv.dataElement] = ActionMappingUtils.pushRoles( $scope.model.stakeholderRoles[ev.orgUnit][dv.dataElement], dv.value );                            
                        });
                    }
                });
                
                if( !$scope.model.commonOrgUnit ){
                    $scope.model.commonOrgUnit = 'DEFAULT';
                }
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
    
    function checkOptions(){               
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
    
    function showAddStakeholder( category ) {
        var modalInstance = $modal.open({
            templateUrl: 'components/stakeholder/stakeholder.html',
            controller: 'StakeholderController',
            resolve: {
                categoryCombo: function(){
                    return $scope.model.selectedAttributeCategoryCombo;
                },
                category: function () {
                    return category;
                },
                optionSet: function(){
                    return $scope.stakeholderList;
                }
            }
        });

        modalInstance.result.then(function ( status ) {
            if( status ){
                //loadOptionSets();
                //loadOptionCombos();
                $window.location.reload();
            }
        });
    };    
    
    $scope.getCategoryOptions = function(category){
        $scope.model.categoryOptionsReady = false;
        $scope.model.selectedOptions = [];
        
        if( category.selectedOption.id === 'ADD_NEW_OPTION' ){
            showAddStakeholder( category );
        }        
        else{
            checkOptions();
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

        var events = {events: []};
        if( $scope.model.allowMultiOrgUnitEntry && $scope.model.selectedDataSet.entryMode === "Multiple Entry" ){            
            angular.forEach($scope.selectedOrgUnit.c, function(ou){
                
                var dataValue = {dataElement: dataElementId, value: $scope.model.stakeholderRoles[$scope.model.commonOrgUnit][dataElementId].join()};
                
                if( $scope.model.selectedEvent[ou] && $scope.model.selectedEvent[ou].event ){            
                    var updated = false;
                    for( var i=0; i<$scope.model.selectedEvent[ou].dataValues.length; i++ ){
                        if( $scope.model.selectedEvent[ou].dataValues[i].dataElement === dataElementId ){
                            $scope.model.selectedEvent[ou].dataValues[i] = dataValue;
                            updated = true;
                            break;
                        }
                    }
                    if( !updated ){
                        $scope.model.selectedEvent[ou].dataValues.push( dataValue );
                    }
                    
                    //update event
                    EventService.update( $scope.model.selectedEvent[ou] ).then(function(response){                        
                    });
                    
                }
                else{
                    var event = {
                        program: $scope.model.selectedProgram.id,
                        programStage: $scope.model.selectedProgram.programStages[0].id,
                        status: 'ACTIVE',
                        orgUnit: ou,
                        eventDate: $scope.model.selectedPeriod.endDate,
                        dataValues: [dataValue],
                        attributeCategoryOptions: ActionMappingUtils.getOptionIds($scope.model.selectedOptions)
                    };
                    events.events.push( event );
                }
            });            
        }
        else{
            
            var dataValue = {dataElement: dataElementId, value: $scope.model.stakeholderRoles[$scope.selectedOrgUnit.id][dataElementId].join()};
            if( $scope.model.selectedEvent[$scope.selectedOrgUnit.id] && $scope.model.selectedEvent[$scope.selectedOrgUnit.id].event ){                
                var updated = false;
                for( var i=0; i<$scope.model.selectedEvent[$scope.selectedOrgUnit.id].dataValues.length; i++ ){
                    if( $scope.model.selectedEvent[$scope.selectedOrgUnit.id].dataValues[i].dataElement === dataElementId ){
                        $scope.model.selectedEvent[$scope.selectedOrgUnit.id].dataValues[i] = dataValue;
                        updated = true;
                        break;
                    }
                }
                if( !updated ){
                    $scope.model.selectedEvent[$scope.selectedOrgUnit.id].dataValues.push( dataValue );
                }
                
                //update event
                EventService.update( $scope.model.selectedEvent[$scope.selectedOrgUnit.id] ).then(function(response){
                });
            }
            else{
                var event = {
                    program: $scope.model.selectedProgram.id,
                    programStage: $scope.model.selectedProgram.programStages[0].id,
                    status: 'ACTIVE',
                    orgUnit: $scope.selectedOrgUnit.id,
                    eventDate: $scope.model.selectedPeriod.endDate,
                    dataValues: [dataValue],
                    attributeCategoryOptions: ActionMappingUtils.getOptionIds($scope.model.selectedOptions)
                };
                
                events.events.push( event );
            }
        }
        
        if( events.events.length > 0 ){
            //add event
            EventService.create(events).then(function (response) {
                console.log('adding events:  ', response);
            });
        }
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
                
        DataValueService.saveDataValue( dataValue ).then(function(response){
        });
    };
    
    $scope.editStakeholderRoles = function( ouId){
        console.log('ouId:  ', ouId);
    };
});
