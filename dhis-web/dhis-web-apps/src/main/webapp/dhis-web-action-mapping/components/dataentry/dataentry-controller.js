/* global angular */

'use strict';

var sunPMT = angular.module('sunPMT');

//Controller for settings page
sunPMT.controller('dataEntryController',
        function($scope,
                $filter,
                $modal,
                $window,
                orderByFilter,
                SessionStorageService,
                storage,
                DataSetFactory,
                PeriodService,
                MetaDataFactory,
                ActionMappingUtils,
                DataValueService,
                EventService) {
    $scope.periodOffset = 0;
    $scope.saveStatus = {};
    var addNewOption = {code: 'ADD_NEW_OPTION', id: 'ADD_NEW_OPTION', displayName: '[Add New Stakeholder]'};
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
                    stakeholderCategory: null,
                    attributeCategoryUrl: null,
                    valueExists: false};
    
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
        $scope.model.basicAuditInfo = {};
        $scope.model.selectedEvent = {};
        $scope.model.orgUnitsWithValues = [];
        $scope.model.categoryOptionsReady = false;
        $scope.model.valueExists = false;
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
                        options.push('[Add New Stakeholder]');
                        
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
                    if( cat.displayName === 'Field Implementer' ){                        
                        $scope.model.stakeholderCategory = cat;
                        if( cat.displayName === 'Field Implementer' && cat.categoryOptions.indexOf( addNewOption) === -1 ){
                            cat.categoryOptions.push(addNewOption);
                        }
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
        $scope.model.valueExists = false;
        if (angular.isObject($scope.selectedOrgUnit)) {            
            DataSetFactory.getActionDataSets( $scope.selectedOrgUnit ).then(function(dataSets){ 
                $scope.model.dataSets = $filter('filter')(dataSets, {entryMode: 'Multiple Entry'}); //dataSets;
                $scope.model.dataSets = orderByFilter($scope.model.dataSets, '-displayName').reverse();
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
        $scope.model.valueExists = false;
        if( angular.isObject($scope.model.selectedDataSet) && $scope.model.selectedDataSet.id){
            $scope.loadDataSetDetails();
        }
    });
    
    $scope.$watch('model.selectedPeriod', function(){        
        $scope.model.dataValues = {};
        $scope.model.valueExists = false;
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
            $scope.model.dataElements = [];
            angular.forEach($scope.model.selectedDataSet.dataElements, function(de){
                $scope.model.selectedProgram = $scope.model.programs[de.code];
                $scope.model.dataElements[de.id] = de.code;
                
                MetaDataFactory.get('categoryCombos', de.categoryCombo.id).then(function(coc){
                    if( coc.isDefault ){
                        $scope.model.defaultCategoryCombo = coc;
                    }
                    $scope.model.selectedCategoryCombos[de.categoryCombo.id] = coc;
                });                
            });
        }
    };
    
    var resetParams = function(){
        $scope.model.dataValues = {};
        $scope.model.roleValues = {};
        $scope.model.orgUnitsWithValues = [];
        $scope.model.selectedEvent = {};
        $scope.model.valueExists = false;
        $scope.model.stakeholderRoles = {};
        $scope.model.basicAuditInfo = {};
        $scope.model.basicAuditInfo.exists = false;
    };
    
    $scope.loadDataEntryForm = function(){
        
        resetParams();
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

            //fetch events containing stakholder-role mapping
            $scope.model.attributeCategoryUrl = {cc: $scope.model.selectedAttributeCategoryCombo.id, default: $scope.model.selectedAttributeCategoryCombo.isDefault, cp: ActionMappingUtils.getOptionIds($scope.model.selectedOptions)};
            $scope.model.commonOrgUnit = null;
            
            EventService.getByOrgUnitAndProgram($scope.selectedOrgUnit.id, 'CHILDREN', $scope.model.selectedProgram.id, $scope.model.attributeCategoryUrl, $scope.model.selectedPeriod.startDate, $scope.model.selectedPeriod.endDate).then(function(events){
                var roleValues = [];
                angular.forEach(events, function(ev){
                    if( ev.event ){
                        $scope.model.selectedEvent[ev.orgUnit] = {event: ev.event, dataValues: ev.dataValues};
                        $scope.model.commonOrgUnit = ev.orgUnit;
                        angular.forEach(ev.dataValues, function(dv){
                            var val = ActionMappingUtils.pushRoles( $scope.model.stakeholderRoles[ev.orgUnit][dv.dataElement], dv.value );
                            $scope.model.stakeholderRoles[ev.orgUnit][dv.dataElement] = val;
                            roleValues.push( val );
                        });
                    }
                });
                
                if( !$scope.model.commonOrgUnit ){
                    $scope.model.commonOrgUnit = 'DEFAULT';
                }
            });
            
            //fetch data values...
            DataValueService.getDataValueSet( dataValueSetUrl ).then(function(response){
                if( response && response.dataValues && response.dataValues.length > 0 ){
                    $scope.model.valueExists = true;
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
                    response.dataValues = orderByFilter(response.dataValues, '-created').reverse();                    
                    $scope.model.basicAuditInfo.created = $filter('date')(response.dataValues[0].created, 'dd MMM yyyy');
                    $scope.model.basicAuditInfo.storedBy = response.dataValues[0].storedBy;
                    $scope.model.basicAuditInfo.exists = true;
                }                
            });
        }
    };
    
    function checkOptions(){
        resetParams();
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
                $window.location.reload();
            }
        });
    };    
    
    $scope.getCategoryOptions = function(category){
        $scope.model.categoryOptionsReady = false;
        $scope.model.selectedOptions = [];
        
        if( category && category.selectedOption && category.selectedOption.id === 'ADD_NEW_OPTION' ){
            category.selectedOption = null;
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
        
        if( $scope.model.stakeholderRoles[$scope.model.commonOrgUnit][dataElementId].indexOf( "[Add New Stakeholder]") !== -1 ){
            $scope.model.stakeholderRoles[$scope.model.commonOrgUnit][dataElementId] = $scope.model.stakeholderRoles[$scope.model.commonOrgUnit][dataElementId].slice(0,-1);
            showAddStakeholder( $scope.model.stakeholderCategory );
            return;
        }
        
        var newEvents = {};
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
                    EventService.update( $scope.model.selectedEvent[ou] ).then(function(){                        
                    });
                    
                }
                else{                    
                    if( newEvents[ou] ){
                        event = newEvents[ou].dataValues.push( dataValue );
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
                        newEvents[ou] = event;
                    }                    
                }
            });            
            
            angular.forEach($scope.selectedOrgUnit.c, function(ou){
                if( newEvents[ou] ){
                    events.events.push( newEvents[ou] );
                }                
            });
        }
        /*else{
            
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
        }*/
        
        if( events.events.length > 0 ){
            //add event            
            EventService.create(events).then(function ( json ) {
                if( json && json.response && json.response.importSummaries && json.response.importSummaries.length ){                            
                    for( var i=0; i<json.response.importSummaries.length; i++){
                        if( json.response.importSummaries[i] && 
                                json.response.importSummaries[i].status === 'SUCCESS' && 
                                json.response.importSummaries[i].reference ){                            
                            var ev = events.events[i];
                            $scope.model.selectedEvent[ev.orgUnit] = {event: json.response.importSummaries[i].reference, dataValues: ev.dataValues};
                        }
                    }
                }
            });
        }
    };
    
    $scope.saveDataValue = function( ouId, deId, ocId ){
        
        $scope.saveStatus[ouId + '-' + deId + '-' + ocId] = {saved: false, pending: true, error: false};
        
        var dataValue = {ou: ouId,
                    pe: $scope.model.selectedPeriod.id,
                    de: deId,
                    co: ocId,
                    cc: $scope.model.selectedAttributeCategoryCombo.id,
                    cp: ActionMappingUtils.getOptionIds($scope.model.selectedOptions),
                    value: $scope.model.dataValues[ouId][deId][ocId].value
                };
                
        DataValueService.saveDataValue( dataValue ).then(function(response){
           $scope.saveStatus[ouId + '-' + deId + '-' + ocId].saved = true;
           $scope.saveStatus[ouId + '-' + deId + '-' + ocId].pending = false;
           $scope.saveStatus[ouId + '-' + deId + '-' + ocId].error = false;
        }, function(){
            $scope.saveStatus[ouId + '-' + deId + '-' + ocId].saved = false;
            $scope.saveStatus[ouId + '-' + deId + '-' + ocId].pending = false;
            $scope.saveStatus[ouId + '-' + deId + '-' + ocId].error = true;
        });
    };    
    
    $scope.getInputNotifcationClass = function(ouId, deId, ocId){

        var currentElement = $scope.saveStatus[ouId + '-' + deId + '-' + ocId];        
        
        if( currentElement ){
            if(currentElement.pending){
                return 'form-control input-pending';
            }

            if(currentElement.saved){
                return 'form-control input-success';
            }            
            else{
                return 'form-control input-error';
            }
        }    
        
        return 'form-control';
    };
    
    $scope.showEditStakeholderRoles = function( ouId, ouName ){
        
        var modalInstance = $modal.open({
            templateUrl: 'components/stakeholder/stakeholder-role.html',
            controller: 'StakeholderRoleController',
            windowClass: 'modal-full-window',
            resolve: {
                period: function(){
                    return $scope.model.selectedPeriod;
                },
                program: function () {
                    return $scope.model.selectedProgram;
                },
                currentOrgUnitId: function(){
                    return  ouId;
                },
                currentOrgUnitName: function(){
                    return  ouName;
                },
                currentEvent: function(){
                    return $scope.model.selectedEvent[ouId];
                },
                attributeCategoryOptions: function(){
                    return ActionMappingUtils.getOptionIds($scope.model.selectedOptions);
                },
                stakeholderRoles: function(){
                    return $scope.model.stakeholderRoles[ouId];
                },
                optionSets: function(){
                    return $scope.model.optionSets;
                }
            }
        });

        modalInstance.result.then(function () {
        });        
    };
});
