/* global angular */

'use strict';

var sunPMT = angular.module('sunPMT');

//Controller for settings page
sunPMT.controller('StakeholderRoleController',
        function($scope,
                $modalInstance,
                $translate,
                period,
                program,
                currentEvent,
                currentOrgUnitId,
                currentOrgUnitName,
                attributeCategoryOptions,
                stakeholderRoles,
                optionSets,
                stakeholderCategory,
                EventService,
                DialogService) {            
    
    $scope.period = period;
    $scope.program = program;
    $scope.currentEvent = currentEvent;
    $scope.attributeCategoryOptions = attributeCategoryOptions;
    $scope.currentOrgunitId = currentOrgUnitId;
    $scope.currentOrgUnitName = currentOrgUnitName;
    $scope.stakeholderRoles = stakeholderRoles;
    $scope.optionSets = optionSets;
    $scope.stakeholderCategory = stakeholderCategory;
                
    $scope.saveRole = function( dataElementId ){
        
        var events = {events: []};
        
        if( $scope.stakeholderRoles[dataElementId].indexOf( "[Add New Stakeholder]") !== -1 ){
            $scope.stakeholderRoles[dataElementId] = $scope.stakeholderRoles[dataElementId].slice(0,-1);
            var dialogOptions = {
                headerText: $translate.instant('info'),
                bodyText: $translate.instant('please_do_this_from_main_screen')
            };		
            DialogService.showDialog({}, dialogOptions);
            return;
        }
        
        var dataValue = {dataElement: dataElementId, value: $scope.stakeholderRoles[dataElementId].join()};
        if( $scope.currentEvent && $scope.currentEvent.event ){                
            var updated = false;
            for( var i=0; i<$scope.currentEvent.dataValues.length; i++ ){
                if( $scope.currentEvent.dataValues[i].dataElement === dataElementId ){
                    $scope.currentEvent.dataValues[i] = dataValue;
                    updated = true;
                    break;
                }
            }
            if( !updated ){
                $scope.currentEvent.dataValues.push( dataValue );
            }

            //update event            
            EventService.update( $scope.currentEvent ).then(function(response){
            });
        }
        else{
            var event = {
                program: $scope.program.id,
                programStage: $scope.program.programStages[0].id,
                status: 'ACTIVE',
                orgUnit: $scope.currentOrgunitId,
                eventDate: period.endDate,
                dataValues: [dataValue],
                attributeCategoryOptions: $scope.attributeCategoryOptions
            };

            events.events.push( event );
        }
        
        if( events.events.length > 0 ){
            //add event
            EventService.create(events).then(function (response) {                
            });
        }
    };
    
    $scope.close = function(status) {        
        $modalInstance.close( status );
    };
});