'use strict';

/* App Module */

var sunPMT = angular.module('sunPMT',
        ['ui.bootstrap', 
         'ngRoute', 
         'ngCookies',
         'ngSanitize',
         'ngMessages',
         'actionMappingServices',
         'actionMappingFilters',
         'actionMappingDirectives', 
         'actionMappingControllers',
         'd2Directives',
         'd2Filters',
         'd2Services',
         'd2Controllers',
         'angularLocalStorage',
         'ui.select',
         'ui.select2',
         'd2HeaderBar',
         'pascalprecht.translate'])
              
.value('DHIS2URL', '..')

.config(function($httpProvider, $routeProvider, $translateProvider) {    
            
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
    
    $routeProvider.when('/', {
        templateUrl:'components/action-mapping/action-mapping.html',
        controller: 'actionMappingController'
    }).otherwise({
        redirectTo : '/'
    });  
    
    $translateProvider.preferredLanguage('en');
    $translateProvider.useSanitizeValueStrategy('escaped');
    $translateProvider.useLoader('i18nLoader');    
})

.run(function($rootScope){    
    $rootScope.maxOptionSize = 50;
});
