"use strict";

/*
 * Copyright (c) 2004-2014, University of Oslo
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * * Redistributions of source code must retain the above copyright notice, this
 *   list of conditions and the following disclaimer.
 * * Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 * * Neither the name of the HISP project nor the names of its contributors may
 *   be used to endorse or promote products derived from this software without
 *   specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

dhis2.util.namespace('dhis2.metadata');

dhis2.metadata.chunk = function( array, size ){
	if( !array || !array.length || !size || size < 1 ){
            return [];
	}
	
	var groups = [];
	var chunks = array.length / size;
	for (var i = 0, j = 0; i < chunks; i++, j += size) {
        groups[i] = array.slice(j, j + size);
    }
	
    return groups;
};

dhis2.metadata.processMetaDataAttribute = function( obj )
{
    if(!obj){
        return;
    }
    
    if(obj.attributeValues){
        for(var i=0; i<obj.attributeValues.length; i++){
            if(obj.attributeValues[i].value && obj.attributeValues[i].attribute && obj.attributeValues[i].attribute.code && obj.attributeValues[i].attribute.valueType){
            	if( obj.attributeValues[i].attribute.valueType === 'BOOLEAN' ){
                    obj[obj.attributeValues[i].attribute.code] = obj.attributeValues[i].value === 'true' ? true : false;
            	}
            	else if( obj.attributeValues[i].attribute.valueType === 'NUMBER' && obj.attributeValues[i].value ){
                    obj[obj.attributeValues[i].attribute.code] = parseInt( obj.attributeValues[i].value );
            	}
                else{
                    obj[obj.attributeValues[i].attribute.code] = obj.attributeValues[i].value;
                }
                
            }
        }
    }
    
    //delete obj.attributeValues;
   
    return obj;    
};

dhis2.metadata.getMetaObjectIds = function( objNames, url, filter )
{
    var def = $.Deferred();
    var objs = [];
    $.ajax({
        url: url,
        type: 'GET',
        data:filter
    }).done( function(response) {
        _.each( _.values( response[objNames] ), function ( obj ) {        
        	objs.push( obj );
        });
        def.resolve( objs );
        
    }).fail(function(){
        def.resolve( null );
    });
    
    return def.promise();    
};

dhis2.metadata.filterMissingObjIds  = function( store, db, objs )
{   
    if( !objs || !objs.length || objs.length < 1){
        return;
    }
    
    var mainDef = $.Deferred();
    var mainPromise = mainDef.promise();

    var def = $.Deferred();
    var promise = def.promise();

    var builder = $.Deferred();
    var build = builder.promise();

    var missingObjIds = [];
    _.each( _.values( objs ), function ( obj ) {
        build = build.then(function() {
            var d = $.Deferred();
            var p = d.promise();
            db.get(store, obj.id).done(function(o) {
                if( !o ) {                    
                	missingObjIds.push( obj.id );
                }
                else{
                	if( obj.version && o.version != obj.version ){
                		missingObjIds.push( obj.id );
                	}
                }
                d.resolve();
            });

            return p;
        });
    });

    build.done(function() {
        def.resolve();
        promise = promise.done( function () {            
            mainDef.resolve( missingObjIds );
        } );
    }).fail(function(){
        mainDef.resolve( null );
    });

    builder.resolve();

    return mainPromise;
};

dhis2.metadata.getBatches = function( ids, batchSize, store, objs, url, filter, storage, db, func )
{    
    if( !ids || !ids.length || ids.length < 1){
        return;
    }
    
    var batches = dhis2.metadata.chunk( ids, batchSize );

    var mainDef = $.Deferred();
    var mainPromise = mainDef.promise();

    var def = $.Deferred();
    var promise = def.promise();

    var builder = $.Deferred();
    var build = builder.promise();
    
    _.each( _.values( batches ), function ( batch ) {        
        promise = promise.then(function(){
            return dhis2.metadata.fetchBatchItems( batch, store, objs, url, filter, storage, db, func );
        });
    });

    build.done(function() {
        def.resolve();
        promise = promise.done( function () {
            mainDef.resolve();
        } );        
        
    }).fail(function(){
        mainDef.resolve( null );
    });

    builder.resolve();

    return mainPromise;
};

dhis2.metadata.fetchBatchItems = function( batch, store, objs, url, filter, storage, db, func )
{   
    var ids = '[' + batch.toString() + ']';             
    filter = filter + '&filter=id:in:' + ids;    
    return dhis2.metadata.getMetaObjects( store, objs, url, filter, storage, db, func );    
};

dhis2.metadata.getMetaObjects = function( store, objs, url, filter, storage, db, func )
{
    var def = $.Deferred();

    $.ajax({
        url: url,
        type: 'GET',
        data: filter
    }).done(function(response) {
        if(response[objs]){            
            _.each( _.values( response[objs] ), function ( obj ) {        
                obj = dhis2.metadata.processMetaDataAttribute( obj );
                if( func ) {
                    obj = func(obj, 'organisationUnits');
                }                
                if( store === 'categoryCombos' && obj.categoryOptionCombos ){                     
                    if( obj.categoryOptionCombos && obj.categories ){
                        
                        var cats =JSON.parse( JSON.stringify( obj.categories ) );
                        
                        _.each( _.values( cats ), function( c ){
                            if( c.categoryOptions ){
                                c.categoryOptions = $.map(c.categoryOptions, function(o){return o.displayName;});
                            }
                        });
                        
                        _.each( _.values( obj.categoryOptionCombos ), function ( coc ) {                            
                            if( coc.categoryOptions ){
                                var opts = [];
                                var _opts = $.map(coc.categoryOptions, function(o){return o.displayName;});
                                for( var i=0; i<cats.length; i++ ){                                    
                                    if( cats[i].categoryOptions && cats[i].categoryOptions.length ){                                        
                                        for(var j=0; j<cats[i].categoryOptions.length; j++){
                                            if( _opts.indexOf( cats[i].categoryOptions[j] ) !== -1 ){                                                
                                                opts.push( cats[i].categoryOptions[j] );
                                                break;
                                            }
                                        }
                                    }
                                }
                                
                                coc.displayName = opts && opts.length && opts.length > 0 ? opts.join() : coc.displayName.replace(", ", ",");
                            }
                            //delete coc.categoryOptions;
                        });
                    }
                }
            });            
            
            if(storage === 'idb'){
                db.setAll( store, response[objs] );                
            }
            if(storage === 'localStorage'){                
                localStorage[store] = JSON.stringify(response[objs]);
            }            
            if(storage === 'sessionStorage'){
                var SessionStorageService = angular.element('body').injector().get('SessionStorageService');
                SessionStorageService.set(store, response[objs]);
            }
        }
        
        if(storage === 'temp'){
            def.resolve(response[objs] ? response[objs] : []);
        }
        else{
            def.resolve();
        }    
    }).fail(function(){
        def.resolve( null );
    });

    return def.promise();
};

dhis2.metadata.getMetaObject = function( id, store, url, filter, storage, db )
{
    var def = $.Deferred();
    
    if(id){
        url = url + '/' + id + '.json';
    }
        
    $.ajax({
        url: url,
        type: 'GET',            
        data: filter
    }).done( function( response ){
        if(storage === 'idb'){
            if( response && response.id) {
                db.set( store, response );
            }
        }
        if(storage === 'localStorage'){
            localStorage[store] = JSON.stringify(response);
        }            
        if(storage === 'sessionStorage'){
            var SessionStorageService = angular.element('body').injector().get('SessionStorageService');
            SessionStorageService.set(store, response);
        } 
        
        def.resolve();
    }).fail(function(){
        def.resolve();
    });
    
    return def.promise();
};

dhis2.metadata.processObject = function(obj, prop){    
    var oo = {};
    _.each(_.values( obj[prop]), function(o){
        oo[o.id] = o.name;
    });
    obj[prop] = oo;
    return obj;
};