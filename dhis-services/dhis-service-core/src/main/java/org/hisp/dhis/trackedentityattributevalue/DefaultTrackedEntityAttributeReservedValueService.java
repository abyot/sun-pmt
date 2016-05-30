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

import org.apache.commons.lang.NotImplementedException;
import org.hisp.dhis.trackedentity.TrackedEntityAttribute;
import org.hisp.dhis.trackedentity.TrackedEntityInstance;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.ArrayList;
import java.util.List;

/**
 * @author Markus Bekken
 */
public class DefaultTrackedEntityAttributeReservedValueService
    implements TrackedEntityAttributeReservedValueService
{
    @Autowired
    private TrackedEntityAttributeReservedValueStore trackedEntityAttributeReservedValueStore;
    
    @Autowired
    private TrackedEntityAttributeValueService trackedEntityAttributeValueService;

    @Override
    public TrackedEntityAttributeReservedValue markTrackedEntityAttributeReservedValueAsUtilized(
        TrackedEntityAttribute attribute, 
        TrackedEntityInstance trackedEntityInstance,
        String value )
    {
        TrackedEntityAttributeReservedValue utilized = findTrackedEntityAttributeReservedValue(
            attribute, value );

        utilized.setValueUtilizedByTEI( trackedEntityInstance );
        utilized = trackedEntityAttributeReservedValueStore.saveTrackedEntityAttributeReservedValue( utilized );
        
        return utilized;
    }

    @Override
    public List<TrackedEntityAttributeReservedValue> createTrackedEntityReservedValues(
        TrackedEntityAttribute trackedEntityAttribute, int numberOfValuesToCreate )
    {
        ArrayList<TrackedEntityAttributeReservedValue> reservedValues = new ArrayList<TrackedEntityAttributeReservedValue>();
        
        if ( trackedEntityAttribute.isGenerated() )
        {
            int timeout = 0;
            
            while ( reservedValues.size() < numberOfValuesToCreate && timeout < 10000 ) 
            {
                String candidate = generateRandomValueInPattern( trackedEntityAttribute.getPattern() );
                
                if ( !trackedEntityAttributeValueService.exists( trackedEntityAttribute, candidate ) )
                {
                    //The generated ID was available. Check that it is not already reserved:
                    if ( findTrackedEntityAttributeReservedValue( trackedEntityAttribute, candidate ) == null ) 
                    {
                        //The generated ID was not reserved previously, and can be reserved now.
                        TrackedEntityAttributeReservedValue newReservation = 
                            new TrackedEntityAttributeReservedValue( trackedEntityAttribute, candidate );
                        newReservation = trackedEntityAttributeReservedValueStore.saveTrackedEntityAttributeReservedValue( newReservation );
                        reservedValues.add( newReservation );
                    }
                    else
                    {
                        timeout++;
                    }
                }
                else
                {
                    timeout ++;
                }
            }
        }
        
        return reservedValues;
    }
    
    private String generateRandomValueInPattern( String pattern ) 
    {
        if ( pattern.isEmpty() ) {
            //No pattern is given. Generate a random number between 1 000 000 and 9 999 999.
            return String.valueOf( 1000000 + (int)( Math.random() * 9999999 ) ); 
        }
        else if ( pattern.matches( "[0-9]+" ) && pattern.length() > 0 )
        {
            //This is a simplified pattern, 
            //Generate a random number with the same number of digits as given in the pattern.
            int min = 10^( pattern.length() - 1 );
            int max = ( 10^( pattern.length() ) ) - 1;
            return String.valueOf( min + (int)( Math.random() * max ) ); 
        }
        else 
        {
            //Regex generation, not covered yet.
            throw new NotImplementedException();
        }
    }
    
    private TrackedEntityAttributeReservedValue findTrackedEntityAttributeReservedValue(
        TrackedEntityAttribute attribute, 
        String value )
    {
        List<TrackedEntityAttributeReservedValue> values = 
            trackedEntityAttributeReservedValueStore.getTrackedEntityReservedValues( 
                attribute, value );
        if ( values.size() == 1 ) 
        {
           return values.get( 0 );
        }
        else if ( values.size() > 1 ) 
        {
            throw new IllegalStateException( "Duplicate values reserved for attribute " 
                + attribute.getUid() + " value " + value, null );
        }
        else
        {
            return null;
        }
    }

}
