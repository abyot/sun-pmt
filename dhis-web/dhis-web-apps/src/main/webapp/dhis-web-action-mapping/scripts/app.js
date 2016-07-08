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
         'd2Directives',
         'd2Filters',
         'd2Services',
         'd2Controllers',
         'angularLocalStorage',
         'ui.select',
         'ui.select2',
         'd2HeaderBar',
         'pascalprecht.translate'])
              
.value('DHIS2URL', '../api')

.config(function($httpProvider, $routeProvider, $translateProvider) {    
            
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
    
    $routeProvider.when('/dataentry', {
        templateUrl:'components/dataentry/dataentry.html',
        controller: 'dataEntryController'
    }).when('/reports', {
        templateUrl:'components/reports/reports.html',
        controller: 'reportsController'
    }).otherwise({
        redirectTo : '/dataentry'
    });  
    
    $translateProvider.preferredLanguage('en');
    $translateProvider.useSanitizeValueStrategy('escaped');
    $translateProvider.useLoader('i18nLoader');    
})

.run(function($rootScope){    
    $rootScope.maxOptionSize = 50;
});
