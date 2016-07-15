/* global angular */

'use strict';

var sunPMT = angular.module('sunPMT');

//Controller for settings page
sunPMT.controller('StakeholderRoleController',
        function($scope,
                $modalInstance,
                period,
                program,
                currentEvent,
                currentOrgUnitId,
                currentOrgUnitName,
                attributeCategoryOptions,
                stakeholderRoles,
                optionSets,
                EventService) {            
    
    $scope.period = period;
    $scope.program = program;
    $scope.currentEvent = currentEvent;
    $scope.attributeCategoryOptions = attributeCategoryOptions;
    $scope.currentOrgunitId = currentOrgUnitId;
    $scope.currentOrgUnitName = currentOrgUnitName;
    $scope.stakeholderRoles = stakeholderRoles;
    $scope.optionSets = optionSets;
                
    $scope.saveRole = function( dataElementId ){
        
        var events = {events: []};
        
        if( $scope.stakeholderRoles[dataElementId].indexOf( "[Add New Stakeholder]") !== -1 ){
            $scope.stakeholderRoles[dataElementId] = $scope.stakeholderRoles[dataElementId].slice(0,-1);
            //showAddStakeholder( $scope.model.stakeholderCategory );
            return;
        }
        
        var dataValue = {dataElement: dataElementId, value: $scope.stakeholderRoles[dataElementId].join()};
        if( $scope.currentEvent[$scope.currentOrgunitId] && $scope.currentEvent[$scope.currentOrgunitId].event ){                
            var updated = false;
            for( var i=0; i<$scope.currentEvent[$scope.currentOrgunitId].dataValues.length; i++ ){
                if( $scope.currentEvent[$scope.currentOrgunitId].dataValues[i].dataElement === dataElementId ){
                    $scope.currentEvent[$scope.currentOrgunitId].dataValues[i] = dataValue;
                    updated = true;
                    break;
                }
            }
            if( !updated ){
                $scope.currentEvent[$scope.currentOrgunitId].dataValues.push( dataValue );
            }

            //update event
            EventService.update( $scope.currentEvent[$scope.currentOrgunitId] ).then(function(response){
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
                console.log('adding events:  ', response);
            });
        }
    };
    
    $scope.close = function(status) {        
        $modalInstance.close( status );
    };
});