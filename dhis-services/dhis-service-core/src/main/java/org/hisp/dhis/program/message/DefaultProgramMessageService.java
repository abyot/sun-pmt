package org.hisp.dhis.program.message;

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

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Date;
import java.util.HashMap;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import org.hisp.dhis.common.IllegalQueryException;
import org.hisp.dhis.message.MessageSender;
import org.hisp.dhis.organisationunit.OrganisationUnitService;
import org.hisp.dhis.program.ProgramInstanceService;
import org.hisp.dhis.program.ProgramStageInstanceService;
import org.hisp.dhis.sms.outbound.GatewayResponse;
import org.hisp.dhis.trackedentity.TrackedEntityInstance;
import org.hisp.dhis.trackedentity.TrackedEntityInstanceService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author Zubair <rajazubair.asghar@gmail.com>
 */

@Transactional
public class DefaultProgramMessageService
    implements ProgramMessageService
{
    private static final Log log = LogFactory.getLog( DefaultProgramMessageService.class );

    // -------------------------------------------------------------------------
    // Dependencies
    // -------------------------------------------------------------------------

    @Autowired
    private ProgramMessageStore programMessageStore;

    @Autowired
    private OrganisationUnitService organisationUnitService;

    @Autowired
    private TrackedEntityInstanceService trackedEntityInstanceService;

    @Autowired
    private ProgramInstanceService programInstanceService;

    @Autowired
    private ProgramStageInstanceService programStageInstanceService;

    @Autowired
    private List<MessageSender> messageSenders;

    // -------------------------------------------------------------------------
    // Implementation methods
    // -------------------------------------------------------------------------

    @Override
    public ProgramMessageQueryParams getFromUrl( Set<String> ou, String trackedEntityInstance, String emailAddress,
        String programInstance, String programStageInstance, ProgramMessageStatus messageStatus,
        Set<DeliveryChannel> deliveryChannels, ProgramMessageCategory category, Integer page, Integer pageSize,
        Date fromDate, Date toDate, Date afterDate, Date beforeDate )
    {
        ProgramMessageQueryParams params = new ProgramMessageQueryParams();

        if ( ou != null )
        {
            for ( String uid : ou )
            {
                params.getOrganisationUnit().add( organisationUnitService.getOrganisationUnit( uid ) );
            }
        }

        if ( trackedEntityInstance != null )
        {
            params.setTrackedEntityInstance(
                trackedEntityInstanceService.getTrackedEntityInstance( trackedEntityInstance ) );
        }

        if ( programInstance != null )
        {
            params.setProgramInstance( programInstanceService.getProgramInstance( programInstance ) );
        }

        if ( programStageInstance != null )
        {
            params
                .setProgramStageInstance( programStageInstanceService.getProgramStageInstance( programStageInstance ) );
        }

        params.setCategory( category );
        params.setDeliveryChannels( deliveryChannels );
        params.setMessageStatus( messageStatus );
        params.setEmailAddress( emailAddress );
        params.setPage( page );
        params.setPageSize( pageSize );
        params.setFromDate( fromDate );
        params.setToDate( toDate );
        params.setAfterDate( afterDate );
        params.setBeforeDate( beforeDate );

        return params;
    }

    @Override
    public boolean exists( String uid )
    {
        return programMessageStore.exists( uid );
    }

    @Override
    public ProgramMessage getProgramMessage( int id )
    {
        return programMessageStore.get( id );
    }

    @Override
    public ProgramMessage getProgramMessage( String uid )
    {
        return programMessageStore.getByUid( uid );
    }

    @Override
    public List<ProgramMessage> getAllProgramMessages()
    {
        return programMessageStore.getAll();
    }

    @Override
    public List<ProgramMessage> getProgramMessages( ProgramMessageQueryParams params )
    {
        hasAccess( params );
        validateParams( params );

        return programMessageStore.getProgramMessages( params );
    }

    @Override
    public int saveProgramMessage( ProgramMessage programMessage )
    {
        return programMessageStore.save( programMessage );
    }

    @Override
    public void updateProgramMessage( ProgramMessage programMessage )
    {
        programMessageStore.update( programMessage );
    }

    @Override
    public void deleteProgramMessage( ProgramMessage programMessage )
    {
        programMessageStore.delete( programMessage );
    }

    @Override
    public String sendMessage( ProgramMessage programMessage )
    {
        String result = "";

        ProgramMessage tmp = fillAttributes( programMessage );

        Map<DeliveryChannel, Set<String>> to = fillRecipients( tmp );

        for ( MessageSender messageSender : messageSenders )
        {
            if ( messageSender.accept( programMessage.getDeliveryChannels() ) )
            {
                if ( messageSender.isServiceReady() )
                {
                    log.info( "Invoking " + messageSender.getClass().getSimpleName() );

                    result = messageSender.sendMessage( tmp.getSubject(), tmp.getText(),
                        to.get( messageSender.getDeliveryChannel() ) );
                }
                else
                {
                    return GatewayResponse.RESULT_CODE_503.getResponseMessage();
                }
            }
        }

        if ( programMessage.getStoreCopy() )
        {
            programMessage.setProcessedDate( new Date() );
            programMessage.setMessageCategory( ProgramMessageCategory.OUTGOING );
            programMessage.setMessageStatus(
                result.equals( "success" ) ? ProgramMessageStatus.SENT : ProgramMessageStatus.FAILED );

            saveProgramMessage( programMessage );
        }

        return result;
    }

    @Override
    public void hasAccess( ProgramMessageQueryParams params )
    {

    }

    @Override
    public void validateParams( ProgramMessageQueryParams params )
    {
        String violation = null;

        if ( params.hasOrignisationUnit() && params.hasPhoneNumbers() )
        {
            violation = "OrganisationUnit and PhoneNumber cannot co-exist";
        }

        if ( params.hasTrackedEntityInstance() && params.hasPhoneNumbers() )
        {
            violation = "TrackedEntityInstance and PhoneNumber cannot co-exist";
        }

        if ( params.hasProgramStageInstance() && !params.hasProgramInstance() )
        {
            violation = "ProgramInstance should be there with ProgramStageInstance";
        }

        if ( params.hasFromDate() && !params.hasToDate() )
        {
            violation = "fromDate should be accompanied with toDate";
        }

        if ( !params.hasFromDate() && params.hasToDate() )
        {
            violation = "fromDate should be accompanied with toDate";
        }

        if ( violation != null )
        {
            log.warn( "Param Validation failed: " + violation );

            throw new IllegalQueryException( violation );
        }
    }

    @Override
    public void validateProgramMessagePayload( ProgramMessage message )
    {
        String violation = null;

        ProgramMessageRecipients recipients = message.getRecipients();

        if ( message.getText() == null )
        {
            violation = "Message content must be provided";
        }

        if ( message.getDeliveryChannels().isEmpty() )
        {
            violation = "Delivery Channel must be provided";
        }

        if ( message.getDeliveryChannels().contains( DeliveryChannel.SMS ) )
        {
            if ( !recipients.hasOrganisationUnit() && !recipients.hasTrackedEntityInstance()
                && recipients.getPhoneNumbers().isEmpty() )
            {
                violation = "No destination found for SMS";
            }
        }

        if ( message.getDeliveryChannels().contains( DeliveryChannel.EMAIL ) )
        {
            if ( !recipients.hasOrganisationUnit() && !recipients.hasTrackedEntityInstance()
                && recipients.getEmailAddresses().isEmpty() )
            {
                violation = "No destination found for EMAIL";
            }
        }

        if ( violation != null )
        {
            log.info( "Message Validation Failed: " + violation );

            throw new IllegalQueryException( violation );
        }
        else
        {
            log.info( "Message Validation Successful" );
        }
    }

    // ---------------------------------------------------------------------
    // Supportive Methods
    // ---------------------------------------------------------------------

    private ProgramMessage fillAttributes( ProgramMessage message )
    {
        String ou = message.getRecipients().getOrganisationUnitUid();

        String tei = message.getRecipients().getTrackedEntityInstanceUid();

        if ( message.getDeliveryChannels().contains( DeliveryChannel.EMAIL ) )
        {
            if ( ou != null )
            {
                message.getRecipients().getEmailAddresses()
                    .add( organisationUnitService.getOrganisationUnit( ou ).getEmail() );
            }

            if ( tei != null )
            {
                message.getRecipients().getEmailAddresses().add(
                    getTrackedEntityInstanceParameter( trackedEntityInstanceService.getTrackedEntityInstance( tei ) ) );
            }
        }

        if ( message.getDeliveryChannels().contains( DeliveryChannel.SMS ) )
        {
            if ( ou != null )
            {
                message.getRecipients().getPhoneNumbers()
                    .add( organisationUnitService.getOrganisationUnit( ou ).getPhoneNumber() );
            }

            if ( tei != null )
            {
                message.getRecipients().getPhoneNumbers().add(
                    getTrackedEntityInstanceParameter( trackedEntityInstanceService.getTrackedEntityInstance( tei ) ) );
            }
        }

        return message;
    }

    private Map<DeliveryChannel, Set<String>> fillRecipients( ProgramMessage tmp )
    {
        Map<DeliveryChannel, Set<String>> mapper = new HashMap<>();

        mapper.put( DeliveryChannel.EMAIL, tmp.getRecipients().getEmailAddresses() );
        mapper.put( DeliveryChannel.SMS, tmp.getRecipients().getPhoneNumbers() );

        return mapper;
    }

    private String getTrackedEntityInstanceParameter( TrackedEntityInstance tei )
    {
        // fetch phonenumber for trackentity instance
        return null;
    }
}
