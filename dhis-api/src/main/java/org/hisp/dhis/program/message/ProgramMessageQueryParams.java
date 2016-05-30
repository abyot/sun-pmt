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

import java.util.Date;
import java.util.Set;

import org.hisp.dhis.organisationunit.OrganisationUnit;
import org.hisp.dhis.program.ProgramInstance;
import org.hisp.dhis.program.ProgramStageInstance;
import org.hisp.dhis.trackedentity.TrackedEntityInstance;

/**
 * @author Zubair <rajazubair.asghar@gmail.com>
 */

public class ProgramMessageQueryParams
{
    private TrackedEntityInstance trackedEntityInstance;

    private Set<OrganisationUnit> organisationUnit;

    private ProgramMessageStatus messageStatus;

    private Set<DeliveryChannel> deliveryChannels;

    private ProgramMessageCategory category;

    private ProgramInstance programInstance;

    private ProgramStageInstance programStageInstance;

    private String emailAddress;

    private Set<String> phoneNumbers;

    private Date fromDate;

    private Date toDate;

    private Date afterDate;

    private Date beforeDate;

    private Integer page;

    private Integer pageSize;

    // -------------------------------------------------------------------------
    // Constructors
    // -------------------------------------------------------------------------

    public ProgramMessageQueryParams()
    {
        super();
    }

    public ProgramMessageQueryParams( TrackedEntityInstance trackedEntityInstance,
        Set<OrganisationUnit> organisationUnit, ProgramMessageStatus messageStatus, Set<DeliveryChannel> deliveryChannels,
        ProgramMessageCategory category, ProgramInstance programInstance, ProgramStageInstance programStageInstance,
        String emailAddress, Set<String> phoneNumbers, Date fromDate, Date toDate, Integer page, Integer pageSize )
    {
        super();
        this.trackedEntityInstance = trackedEntityInstance;
        this.organisationUnit = organisationUnit;
        this.messageStatus = messageStatus;
        this.deliveryChannels = deliveryChannels;
        this.category = category;
        this.programInstance = programInstance;
        this.programStageInstance = programStageInstance;
        this.emailAddress = emailAddress;
        this.phoneNumbers = phoneNumbers;
        this.fromDate = fromDate;
        this.toDate = toDate;
        this.page = page;
        this.pageSize = pageSize;
    }

    // -------------------------------------------------------------------------
    // Logic
    // -------------------------------------------------------------------------

    public boolean hasOrignisationUnit()
    {
        return organisationUnit != null;
    }

    public boolean hasProgramInstance()
    {
        return programInstance != null;
    }

    public boolean hasProgramStageInstance()
    {
        return programStageInstance != null;
    }

    public boolean hasTrackedEntityInstance()
    {
        return trackedEntityInstance != null;
    }

    public boolean hasPaging()
    {
        return page != null && pageSize != null;
    }

    public boolean hasPhoneNumbers()
    {
        return phoneNumbers != null && !phoneNumbers.isEmpty();
    }

    public boolean hasEmailAddress()
    {
        return emailAddress != null && !emailAddress.isEmpty();
    }

    public boolean hasFromDate()
    {
        return fromDate != null;
    }

    public boolean hasToDate()
    {
        return toDate != null;
    }

    // -------------------------------------------------------------------------
    // Getters and Setters
    // -------------------------------------------------------------------------

    public ProgramInstance getProgramInstrance()
    {
        return programInstance;
    }

    public void setProgramInstance( ProgramInstance programInstance )
    {
        this.programInstance = programInstance;
    }

    public ProgramStageInstance getProgramStageInstance()
    {
        return programStageInstance;
    }

    public void setProgramStageInstance( ProgramStageInstance programStageInstance )
    {
        this.programStageInstance = programStageInstance;
    }

    public TrackedEntityInstance getTrackedEntityInstance()
    {
        return trackedEntityInstance;
    }

    public void setTrackedEntityInstance( TrackedEntityInstance trackedEntityInstance )
    {
        this.trackedEntityInstance = trackedEntityInstance;
    }

    public Set<OrganisationUnit> getOrganisationUnit()
    {
        return organisationUnit;
    }

    public void setOrganisationUnit( Set<OrganisationUnit> organisationUnit )
    {
        this.organisationUnit = organisationUnit;
    }

    public Date getFromDate()
    {
        return fromDate;
    }

    public void setFromDate( Date fromDate )
    {
        this.fromDate = fromDate;
    }

    public Date getToDate()
    {
        return toDate;
    }

    public void setToDate( Date toDate )
    {
        this.toDate = toDate;
    }

    public Set<String> getPhoneNumbers()
    {
        return phoneNumbers;
    }

    public void setPhoneNumbers( Set<String> phoneNumbers )
    {
        this.phoneNumbers = phoneNumbers;
    }

    public String getEmailAddress()
    {
        return emailAddress;
    }

    public void setEmailAddress( String emailAddress )
    {
        this.emailAddress = emailAddress;
    }

    public Set<DeliveryChannel> getDeliveryChannels()
    {
        return deliveryChannels;
    }

    public void setDeliveryChannels( Set<DeliveryChannel> deliveryChannels )
    {
        this.deliveryChannels = deliveryChannels;
    }

    public Integer getPage()
    {
        return page;
    }

    public void setPage( Integer page )
    {
        this.page = page;
    }

    public Integer getPageSize()
    {
        return pageSize;
    }

    public void setPageSize( Integer pageSize )
    {
        this.pageSize = pageSize;
    }

    public ProgramMessageStatus getMessageStatus()
    {
        return messageStatus;
    }

    public void setMessageStatus( ProgramMessageStatus messageStatus )
    {
        this.messageStatus = messageStatus;
    }

    public ProgramMessageCategory getCategory()
    {
        return category;
    }

    public void setCategory( ProgramMessageCategory category )
    {
        this.category = category;
    }

    public Date getAfterDate()
    {
        return afterDate;
    }

    public void setAfterDate( Date afterDate )
    {
        this.afterDate = afterDate;
    }

    public Date getBeforeDate()
    {
        return beforeDate;
    }

    public void setBeforeDate( Date beforeDate )
    {
        this.beforeDate = beforeDate;
    }
}
