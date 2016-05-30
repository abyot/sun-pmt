package org.hisp.dhis.trackedentityattributevalue;
/*
 * Copyright (c) 2004-2016, University of Oslo
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 * Neither the name of the HISP project nor the names of its contributors may
 * be used to endorse or promote products derived from this software without
 * specific prior written permission.
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

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import java.util.List;

import org.hisp.dhis.DhisSpringTest;
import org.hisp.dhis.organisationunit.OrganisationUnit;
import org.hisp.dhis.organisationunit.OrganisationUnitStore;
import org.hisp.dhis.trackedentity.TrackedEntityAttribute;
import org.hisp.dhis.trackedentity.TrackedEntityAttributeStore;
import org.hisp.dhis.trackedentity.TrackedEntityInstance;
import org.hisp.dhis.trackedentity.TrackedEntityInstanceStore;
import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;

public class TrackedEntityAttributeReservedValueServiceTest 
    extends DhisSpringTest
{
    private TrackedEntityAttribute trackedEntityAttributeA;
    private TrackedEntityAttribute trackedEntityAttributeB;
    private TrackedEntityInstance trackedEntityInstanceA;
    
    @Autowired
    private TrackedEntityAttributeReservedValueService trackedEntityAttributeReservedValueService;
    
    @Autowired
    private TrackedEntityAttributeReservedValueStore trackedEntityAttributeReservedValueStore;
    
    @Autowired
    private TrackedEntityAttributeStore trackedEntityAttributeStore;
    
    @Autowired
    private TrackedEntityInstanceStore trackedEntityInstanceStore;
    
    @Autowired
    private OrganisationUnitStore organisationUnitStore;
    
    @Override
    public void setUpTest()
    {
        trackedEntityAttributeA = createTrackedEntityAttribute( 'A' );
        trackedEntityAttributeB = createTrackedEntityAttribute( 'B' );
        trackedEntityAttributeA.setGenerated( true );
        trackedEntityAttributeB.setGenerated( false );
        
        trackedEntityAttributeStore.save( trackedEntityAttributeA );
        trackedEntityAttributeStore.save( trackedEntityAttributeB );
        
        
        OrganisationUnit ou = createOrganisationUnit( 'A' );
        organisationUnitStore.save( ou );
        
        trackedEntityInstanceA = createTrackedEntityInstance( 'A', ou );
        trackedEntityInstanceStore.save( trackedEntityInstanceA );
    }
    
    @Test
    public void testMarkAsUtilized()
    {
        TrackedEntityAttributeReservedValue reservedValue = new TrackedEntityAttributeReservedValue(
            trackedEntityAttributeA, "value");
        reservedValue = trackedEntityAttributeReservedValueStore.saveTrackedEntityAttributeReservedValue( reservedValue );
        
        reservedValue.setValueUtilizedByTEI( trackedEntityInstanceA );
        
        TrackedEntityAttributeReservedValue saved = trackedEntityAttributeReservedValueService.markTrackedEntityAttributeReservedValueAsUtilized( 
            trackedEntityAttributeA, trackedEntityInstanceA, "value" );
        assertNotNull( saved );
        assertTrue( saved.getValueUtilizedByTEI() == reservedValue.getValueUtilizedByTEI() );
    }
    
    @Test
    public void testReserveOneTrackedEntityAttributeValue() 
    {
        List<TrackedEntityAttributeReservedValue> reservedValues = trackedEntityAttributeReservedValueService.createTrackedEntityReservedValues( trackedEntityAttributeA, 1 );
        
        assertTrue( reservedValues.size() == 1 );
    }
    
    @Test
    public void testReserveTrackedEntityAttributeValues() 
    {
        List<TrackedEntityAttributeReservedValue> reservedValues = trackedEntityAttributeReservedValueService.createTrackedEntityReservedValues( trackedEntityAttributeA, 10 );
        
        assertTrue( reservedValues.size() == 10 );
        assertTrue( reservedValues.get( 0 ).getValue() != null );
        assertTrue( reservedValues.get( 0 ).getValue() != reservedValues.get( 1 ).getValue() );
    }
}
