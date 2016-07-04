/* global angular, moment, dhis2 */

'use strict';

/* Services */

var actionMappingServices = angular.module('actionMappingServices', ['ngResource'])

.factory('PMTStorageService', function(){
    var store = new dhis2.storage.Store({
        name: "dhis2sunpmt",
        adapters: [dhis2.storage.IndexedDBAdapter, dhis2.storage.DomSessionStorageAdapter, dhis2.storage.InMemoryAdapter],
        objectStores: ['dataSets', 'optionSets', 'dataElementGroups', 'dataElementGroupSets', 'indicatorGroups', 'indicatorGroupSets', 'categoryCombos', 'constants', 'attributes']
    });
    return{
        currentStore: store
    };
})

/* current selections */
.service('PeriodService', function(DateUtils){
    
    this.getPeriods = function(periodType, periodOffset){
        periodOffset = angular.isUndefined(periodOffset) ? 0 : periodOffset;
        var availablePeriods = [];
        if(!periodType){
            return availablePeriods;
        }        

        var pt = new PeriodType();
        var d2Periods = pt.get(periodType).generatePeriods({offset: periodOffset, filterFuturePeriods: false, reversePeriods: false});
        angular.forEach(d2Periods, function(p){
            p.endDate = DateUtils.formatFromApiToUser(p.endDate);
            p.startDate = DateUtils.formatFromApiToUser(p.startDate);
            if(moment(DateUtils.getToday()).isAfter(p.endDate)){                    
                availablePeriods.push( p );
            }
        });        
        return availablePeriods;
    };
})

/* Factory to fetch optionSets */
.factory('OptionSetService', function($q, $rootScope, PMTStorageService) { 
    return {
        getAll: function(){
            
            var def = $q.defer();
            
            PMTStorageService.currentStore.open().done(function(){
                PMTStorageService.currentStore.getAll('optionSets').done(function(optionSets){
                    $rootScope.$apply(function(){
                        def.resolve(optionSets);
                    });                    
                });
            });            
            
            return def.promise;            
        },
        get: function(uid){
            
            var def = $q.defer();
            
            PMTStorageService.currentStore.open().done(function(){
                PMTStorageService.currentStore.get('optionSets', uid).done(function(optionSet){                    
                    $rootScope.$apply(function(){
                        def.resolve(optionSet);
                    });
                });
            });                        
            return def.promise;            
        },        
        getCode: function(options, key){
            if(options){
                for(var i=0; i<options.length; i++){
                    if( key === options[i].name){
                        return options[i].code;
                    }
                }
            }            
            return key;
        },        
        getName: function(options, key){
            if(options){
                for(var i=0; i<options.length; i++){                    
                    if( key === options[i].code){
                        return options[i].name;
                    }
                }
            }            
            return key;
        }
    };
})

/* Factory to fetch programs */
.factory('DataSetFactory', function($q, $rootScope, $filter, SessionStorageService, PMTStorageService, orderByFilter, CommonUtils) { 
  
    return {        
        getAll: function(){            
            var roles = SessionStorageService.get('USER_ROLES');
            var userRoles = roles && roles.userCredentials && roles.userCredentials.userRoles ? roles.userCredentials.userRoles : [];
            var def = $q.defer();
            
            PMTStorageService.currentStore.open().done(function(){
                PMTStorageService.currentStore.getAll('dataSets').done(function(dss){
                    var dataSets = [];
                    angular.forEach(dss, function(ds){                            
                        if( CommonUtils.userHasValidRole(ds,'dataSets',userRoles )){
                            dataSets.push(ds);
                        }
                    });
                    $rootScope.$apply(function(){
                        def.resolve(dataSets);
                    });
                });
            });            
            return def.promise;            
        },
        get: function(uid){
            
            var def = $q.defer();
            
            PMTStorageService.currentStore.open().done(function(){
                PMTStorageService.currentStore.get('dataSets', uid).done(function(ds){                    
                    $rootScope.$apply(function(){
                        def.resolve(ds);
                    });
                });
            });                        
            return def.promise;            
        },
        getByOu: function(ou, selectedDataSet){
            var roles = SessionStorageService.get('USER_ROLES');
            var userRoles = roles && roles.userCredentials && roles.userCredentials.userRoles ? roles.userCredentials.userRoles : [];
            var def = $q.defer();
            
            PMTStorageService.currentStore.open().done(function(){
                PMTStorageService.currentStore.getAll('dataSets').done(function(dss){
                    var dataSets = [];
                    angular.forEach(dss, function(ds){                            
                        if(ds.organisationUnits.hasOwnProperty( ou.id ) && CommonUtils.userHasValidRole(ds,'dataSets', userRoles)){
                            dataSets.push(ds);
                        }
                    });
                    
                    dataSets = orderByFilter(dataSets, '-displayName').reverse();
                    
                    if(dataSets.length === 0){
                        selectedDataSet = null;
                    }
                    else if(dataSets.length === 1){
                        selectedDataSet = dataSets[0];
                    } 
                    else{
                        if(selectedDataSet){
                            var continueLoop = true;
                            for(var i=0; i<dataSets.length && continueLoop; i++){
                                if(dataSets[i].id === selectedDataSet.id){                                
                                    selectedDataSet = dataSets[i];
                                    continueLoop = false;
                                }
                            }
                            if(continueLoop){
                                selectedDataSet = null;
                            }
                        }
                    }
                                        
                    if(!selectedDataSet || angular.isUndefined(selectedDataSet) && dataSets.legth > 0){
                        selectedDataSet = dataSets[0];
                    }
                    
                    $rootScope.$apply(function(){
                        def.resolve({dataSets: dataSets, selectedDataSet: selectedDataSet});
                    });                      
                });
            });            
            return def.promise;
        }
    };
})

/* factory to fetch and process programValidations */
.factory('MetaDataFactory', function($q, $rootScope, PMTStorageService, orderByFilter) {  
    
    return {        
        get: function(store, uid){
            
            var def = $q.defer();
            
            PMTStorageService.currentStore.open().done(function(){
                PMTStorageService.currentStore.get(store, uid).done(function(pv){                    
                    $rootScope.$apply(function(){
                        def.resolve(pv);
                    });
                });
            });                        
            return def.promise;
        },
        getAll: function(store){
            var def = $q.defer();            
            PMTStorageService.currentStore.open().done(function(){
                PMTStorageService.currentStore.getAll(store).done(function(objs){                    
                    objs = orderByFilter(objs, '-name').reverse();                    
                    $rootScope.$apply(function(){
                        def.resolve(objs);
                    });
                });                
            });            
            return def.promise;
        }
    };        
})

.factory('ResultsFrameworkFactory', function($http, DialogService, $translate) {   
    
    var errorNotifier = function(response){
        if( response && response.data && response.data.status === 'ERROR'){
            var dialogOptions = {
                headerText: response.data.status,
                bodyText: response.data.message ? response.data.message : $translate.instant('unable_to_fetch_data_from_server')
            };		
            DialogService.showDialog({}, dialogOptions);
        }
    };
    
    return {
        
        get: function(uid){            
            var promise = $http.get('../api/resultsFrameworks/' + uid + '.json?fields=id,name,code,description,active,impacts[id,name,indicators[name]],outcomes[id,name,indicators[name]],outputs[id,name,indicators[name]],programms[id,name,code,description,outcomes[id,name,indicators[name]],outputs[id,name,indicators[name]],subProgramms[id,name,code,description,outputs[id,name,indicators[name]]]]').then(function(response){               
                return response.data;
            }, function(response){
                errorNotifier(response);
            });            
            return promise;
        },
        getAll: function(){            
            var promise = $http.get('../api/resultsFrameworks.json?fields=id,name,code,description,active,impacts[id,name],outcomes[id,name],outputs[id,name],programms[id,name,code,description,outcomes[id,name],outputs[id,name],subProgramms[id,name,code,description,outputs[id,name]]]&paging=false').then(function(response){               
                return response.data;
            }, function(response){
                errorNotifier(response);
            });            
            return promise;
        },
        create: function(resultsFramework){    
            var promise = $http.post('../api/resultsFrameworks.json', resultsFramework).then(function(response){
                return response.data;           
            });
            return promise;            
        },
        delete: function(resultsFramework){
            var promise = $http.delete('../api/resultsFrameworks/' + resultsFramework.id).then(function(response){
                return response.data;               
            });
            return promise;           
        },
        update: function(resultsFramework){   
            var promise = $http.put('../api/resultsFrameworks/' + resultsFramework.id, resultsFramework).then(function(response){
                return response.data;         
            });
            return promise;
        }
    };    
})

.service('AnalyticsService', function($http, DialogService, $translate) {   
    
    var errorNotifier = function(response){
        if( response && response.data && response.data.status === 'ERROR'){
            var dialogOptions = {
                headerText: response.data.status,
                bodyText: response.data.message ? response.data.message : $translate.instant('unable_to_fetch_data_from_server')
            };		
            DialogService.showDialog({}, dialogOptions);
        }
    };
    
    return {
        
        fetchData: function(url, filterUrl, baselineDimension, progressDimension, targetDimension){
            
            if( filterUrl && !angular.isUndefined( filterUrl )){
                url = url + filterUrl;
            }
            
            var promise = $http.get('../api/analytics.json?' + url).then(function(response){
                
                response.data.report = {};
                
                angular.forEach(response.data.rows, function(row){
                    
                    if( !response.data.report[row[0]] ){
                        response.data.report[row[0]] = {baseline: 0};
                    }
                    
                    if( !response.data.report[row[0]][row[1]] ){
                        response.data.report[row[0]][row[1]] = {};
                    }
                    
                    if( row[2] === baselineDimension.id ){
                        response.data.report[row[0]].baseline = row[3];
                    }
                    else{
                        
                        if( !response.data.report[row[0]][row[2]] ){
                            response.data.report[row[0]][row[2]] = {annualTarget: 0};
                        }
                    
                        response.data.report[row[0]][row[2]].annualTarget += parseInt( row[3] );
                        
                        /*if( row[2] === progressDimension.id ){
                            response.data.report[row[0]].annualTarget += row[3];
                        }
                        if( row[2] === targetDimension.id ){
                            response.data.report[row[0]].annualTarget += row[3];
                        }*/
                        
                        response.data.report[row[0]][row[1]][row[2]] = row[3];
                    }                    
                });
                
                return response.data;
                
            }, function(response){
                errorNotifier(response);
            });            
            return promise;
        }
    };    
})

.service('ActionMappingUtils', function(){
    return {
        getSum: function( op1, op2 ){
            op1 = dhis2.validation.isNumber(op1) ? parseInt(op1) : 0;
            op2 = dhis2.validation.isNumber(op2) ? parseInt(op2) : 0;        
            return op1 + op2;
        },
        getPercent: function(op1, op2){        
            op1 = dhis2.validation.isNumber(op1) ? parseInt(op1) : 0;
            op2 = dhis2.validation.isNumber(op2) ? parseInt(op2) : 0;        
            if( op2 === 0 ){
                return 0;
            }        
            return parseFloat((op1 / op2)*100).toFixed(2) + '%';
        }
    };
})

/*Orgunit service for local db */
.service('IndexDBService', function($window, $q){
    
    var indexedDB = $window.indexedDB;
    var db = null;
    
    var open = function( dbName ){
        var deferred = $q.defer();
        
        var request = indexedDB.open( dbName );
        
        request.onsuccess = function(e) {
          db = e.target.result;
          deferred.resolve();
        };

        request.onerror = function(){
          deferred.reject();
        };

        return deferred.promise;
    };
    
    var get = function(storeName, uid){
        
        var deferred = $q.defer();
        
        if( db === null){
            deferred.reject("DB not opened");
        }
        else{
            var tx = db.transaction([storeName]);
            var store = tx.objectStore(storeName);
            var query = store.get(uid);
                
            query.onsuccess = function(e){
                deferred.resolve(e.target.result);           
            };
        }
        return deferred.promise;
    };
    
    return {
        open: open,
        get: get
    };
});