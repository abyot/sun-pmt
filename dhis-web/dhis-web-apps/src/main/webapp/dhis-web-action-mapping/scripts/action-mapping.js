/* global dhis2, angular, selection, i18n_ajax_login_failed, _ */

dhis2.util.namespace('dhis2.rf');
dhis2.util.namespace('dhis2.tc');

// whether current user has any organisation units
dhis2.rf.emptyOrganisationUnits = false;

var i18n_no_orgunits = 'No organisation unit attached to current user, no data entry possible';
var i18n_offline_notification = 'You are offline';
var i18n_online_notification = 'You are online';
var i18n_ajax_login_failed = 'Login failed, check your username and password and try again';

var optionSetsInPromise = [];
var attributesInPromise = [];
var batchSize = 50;

dhis2.rf.store = null;
dhis2.tc.metaDataCached = dhis2.rf.metaDataCached || false;
dhis2.rf.memoryOnly = $('html').hasClass('ie7') || $('html').hasClass('ie8');
var adapters = [];    
if( dhis2.rf.memoryOnly ) {
    adapters = [ dhis2.storage.InMemoryAdapter ];
} else {
    adapters = [ dhis2.storage.IndexedDBAdapter, dhis2.storage.DomLocalStorageAdapter, dhis2.storage.InMemoryAdapter ];
}

dhis2.rf.store = new dhis2.storage.Store({
    name: 'dhis2sunpmt',
    adapters: [dhis2.storage.IndexedDBAdapter, dhis2.storage.DomSessionStorageAdapter, dhis2.storage.InMemoryAdapter],
    objectStores: ['dataSets', 'optionSets', 'categoryCombos', 'programs']
});

(function($) {
    $.safeEach = function(arr, fn)
    {
        if (arr)
        {
            $.each(arr, fn);
        }
    };
})(jQuery);

/**
 * Page init. The order of events is:
 *
 * 1. Load ouwt 
 * 2. Load meta-data (and notify ouwt) 
 * 
 */
$(document).ready(function()
{
    $.ajaxSetup({
        type: 'POST',
        cache: false
    });

    $('#loaderSpan').show();
});

$(document).bind('dhis2.online', function(event, loggedIn)
{
    if (loggedIn)
    {
        if (dhis2.rf.emptyOrganisationUnits) {
            setHeaderMessage(i18n_no_orgunits);
        }
        else {
            setHeaderDelayMessage(i18n_online_notification);
        }
    }
    else
    {
        var form = [
            '<form style="display:inline;">',
            '<label for="username">Username</label>',
            '<input name="username" id="username" type="text" style="width: 70px; margin-left: 10px; margin-right: 10px" size="10"/>',
            '<label for="password">Password</label>',
            '<input name="password" id="password" type="password" style="width: 70px; margin-left: 10px; margin-right: 10px" size="10"/>',
            '<button id="login_button" type="button">Login</button>',
            '</form>'
        ].join('');

        setHeaderMessage(form);
        ajax_login();
    }
});

$(document).bind('dhis2.offline', function()
{
    if (dhis2.rf.emptyOrganisationUnits) {
        setHeaderMessage(i18n_no_orgunits);
    }
    else {
        setHeaderMessage(i18n_offline_notification);
    }
});

function ajax_login()
{
    $('#login_button').bind('click', function()
    {
        var username = $('#username').val();
        var password = $('#password').val();

        $.post('../dhis-web-commons-security/login.action', {
            'j_username': username,
            'j_password': password
        }).success(function()
        {
            var ret = dhis2.availability.syncCheckAvailability();

            if (!ret)
            {
                alert(i18n_ajax_login_failed);
            }
        });
    });
}

// -----------------------------------------------------------------------------
// Metadata downloading
// -----------------------------------------------------------------------------

function downloadMetaData()
{
    console.log('Loading required meta-data');
    var def = $.Deferred();
    var promise = def.promise();

    promise = promise.then( dhis2.rf.store.open );
    promise = promise.then( getUserRoles );
    promise = promise.then( getSystemSetting );
    promise = promise.then( getCalendarSetting );
    
    //fetch category combos
    promise = promise.then( getMetaCategoryCombos );
    promise = promise.then( filterMissingCategoryCombos );
    promise = promise.then( getCategoryCombos );
    
    //fetch met attributes
    /*promise = promise.then( getMetaAttributes );
    promise = promise.then( filterMissingAttributes );
    promise = promise.then( getAttributes );
    
    //fetch constants
    promise = promise.then( getMetaConstants );
    promise = promise.then( filterMissingConstants );
    promise = promise.then( getConstants );
    
    //fetch data element group sets
    promise = promise.then( getMetaDataElementGroupSets );
    promise = promise.then( filterMissingDataElementGroupSets );
    promise = promise.then( getDataElementGroupSets );
    
    //fetch data element groups
    promise = promise.then( getMetaDataElementGroups );
    promise = promise.then( filterMissingDataElementGroups );
    promise = promise.then( getDataElementGroups );
    
    //fetch indicator group sets
    promise = promise.then( getMetaIndicatorGroupSets );
    promise = promise.then( filterMissingIndicatorGroupSets );
    promise = promise.then( getIndicatorGroupSets );
    
    //fetch indicator groups
    promise = promise.then( getMetaIndicatorGroups );
    promise = promise.then( filterMissingIndicatorGroups );
    promise = promise.then( getIndicatorGroups ); */    
    
    //fetch data sets
    promise = promise.then( getMetaDataSets );
    promise = promise.then( filterMissingDataSets );
    promise = promise.then( getDataSets );
    
    //fetch programs
    promise = promise.then( getMetaPrograms );
    promise = promise.then( filterMissingPrograms );
    promise = promise.then( getPrograms );
    
    promise.done(function() {        
        //Enable ou selection after meta-data has downloaded
        $( "#orgUnitTree" ).removeClass( "disable-clicks" );
        dhis2.tc.metaDataCached = true;
        dhis2.availability.startAvailabilityCheck();
        console.log( 'Finished loading meta-data' );        
        selection.responseReceived(); 
    });

    def.resolve();    
}
function getUserRoles(){
    var SessionStorageService = angular.element('body').injector().get('SessionStorageService');    
    if( SessionStorageService.get('USER_ROLES') ){
       return; 
    }    
    return dhis2.metadata.getMetaObject(null, 'USER_ROLES', '../api/me.json', 'fields=id,displayName,userCredentials[userRoles[id,authorities,dataSets]]', 'sessionStorage', dhis2.rf.store);
}

function getSystemSetting(){   
    if(localStorage['SYSTEM_SETTING']){
       return; 
    }    
    return dhis2.metadata.getMetaObject(null, 'SYSTEM_SETTING', '../api/systemSettings', '', 'localStorage', dhis2.rf.store);
}

function getCalendarSetting(){   
    if(localStorage['CALENDAR_SETTING']){
       return; 
    }    
    return dhis2.metadata.getMetaObject(null, 'CALENDAR_SETTING', '../api/systemSettings', 'key=keyCalendar&key=keyDateFormat', 'localStorage', dhis2.rf.store);
}

function getMetaCategoryCombos(){
    return dhis2.metadata.getMetaObjectIds('categoryCombos', '../api/categoryCombos.json', 'paging=false&fields=id,version');
}

function filterMissingCategoryCombos( objs ){
    return dhis2.metadata.filterMissingObjIds('categoryCombos', dhis2.rf.store, objs);
}

function getCategoryCombos( ids ){    
    return dhis2.metadata.getBatches( ids, batchSize, 'categoryCombos', 'categoryCombos', '../api/categoryCombos.json', 'paging=false&fields=id,displayName,code,skipTotal,isDefault,categoryOptionCombos[id,displayName],categories[id,displayName,categoryOptions[id,displayName,code]]', 'idb', dhis2.rf.store);
}

function getMetaDataSets(){
    return dhis2.metadata.getMetaObjectIds('dataSets', '../api/dataSets.json', 'paging=false&fields=id,version');
}

function filterMissingDataSets( objs ){
    return dhis2.metadata.filterMissingObjIds('dataSets', dhis2.rf.store, objs);
}

function getDataSets( ids ){    
    return dhis2.metadata.getBatches( ids, batchSize, 'dataSets', 'dataSets', '../api/dataSets.json', 'paging=false&fields=id,periodType,displayName,version,categoryCombo[id],attributeValues[value,attribute[id,name,code]],organisationUnits[id,name],dataElements[id,code,displayName,description,formName,valueType,optionSetValue,optionSet[id],categoryCombo[id,isDefault,categories[id]]]', 'idb', dhis2.rf.store, dhis2.metadata.processObject);
}

function getMetaPrograms(){
    return dhis2.metadata.getMetaObjectIds('programs', '../api/programs.json', 'filter=programType:eq:WITHOUT_REGISTRATION&paging=false&fields=id,version');
}

function filterMissingPrograms( objs ){
    return dhis2.metadata.filterMissingObjIds('programs', dhis2.rf.store, objs);
}

function getPrograms( ids ){    
    return dhis2.metadata.getBatches( ids, batchSize, 'programs', 'programs', '../api/programs.json', 'paging=false&fields=*,attributeValues[value,attribute[id,name,code]],categoryCombo[id,isDefault],organisationUnits[id,displayName],programStages[*,dataEntryForm[*],programStageDataElements[*,dataElement[*,optionSet[id]]]]', 'idb', dhis2.rf.store, dhis2.metadata.processObject);
}