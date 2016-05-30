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

import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;

import org.hisp.dhis.common.DxfNamespaces;
import org.hisp.dhis.common.view.DetailedView;
import org.hisp.dhis.common.view.ExportView;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;

/**
 * @author Zubair <rajazubair.asghar@gmail.com>
 */

@JacksonXmlRootElement( localName = "programMessageRecipients", namespace = DxfNamespaces.DXF_2_0 )
public class ProgramMessageRecipients
    implements Serializable
{
    private static final long serialVersionUID = 1141462154959329242L;

    private String trackedEntityInstanceUid;

    private String organisationUnitUid;

    private Set<String> phoneNumbers = new HashSet<>();

    private Set<String> emailAddresses = new HashSet<>();

    // -------------------------------------------------------------------------
    // Constructors
    // -------------------------------------------------------------------------

    public ProgramMessageRecipients()
    {
        super();
    }

    public ProgramMessageRecipients( Set<String> phoneNumbers, Set<String> emailAddresses )
    {
        super();
        this.phoneNumbers = phoneNumbers;
        this.emailAddresses = emailAddresses;
    }

    public ProgramMessageRecipients( String trackedEntityInstanceUid, String organisationUnitUid, Set<String> phoneNumbers,
        Set<String> emailAddresses )
    {
        super();
        this.trackedEntityInstanceUid = trackedEntityInstanceUid;
        this.organisationUnitUid = organisationUnitUid;
        this.phoneNumbers = phoneNumbers;
        this.emailAddresses = emailAddresses;
    }

    // -------------------------------------------------------------------------
    // Logic
    // -------------------------------------------------------------------------

    public boolean hasTrackedEntityInstance()
    {
        return trackedEntityInstanceUid != null;
    }

    public boolean hasOrganisationUnit()
    {
        return organisationUnitUid != null;
    }

    // -------------------------------------------------------------------------
    // Setters and getters
    // -------------------------------------------------------------------------

    @JsonProperty( value = "trackedEntityInstanceUid" )
    @JsonView( { DetailedView.class, ExportView.class } )
    @JacksonXmlProperty( localName = "trackedEntityInstanceUid" )
    public String getTrackedEntityInstanceUid()
    {
        return trackedEntityInstanceUid;
    }

    public void setTrackedEntityInstanceUid( String trackedEntityInstanceUid )
    {
        this.trackedEntityInstanceUid = trackedEntityInstanceUid;
    }

    @JsonProperty( value = "organisationUnitUid" )
    @JsonView( { DetailedView.class, ExportView.class } )
    @JacksonXmlProperty( localName = "organisationUnitUid" )
    public String getOrganisationUnitUid()
    {
        return organisationUnitUid;
    }

    public void setOrganisationUnitUid( String organisationUnitUid )
    {
        this.organisationUnitUid = organisationUnitUid;
    }

    @JsonProperty( value = "phoneNumbers" )
    @JsonView( { DetailedView.class, ExportView.class } )
    @JacksonXmlProperty( localName = "phoneNumbers" )
    public Set<String> getPhoneNumbers()
    {
        return phoneNumbers;
    }

    public void setPhoneNumbers( Set<String> phoneNumbers )
    {
        this.phoneNumbers = phoneNumbers;
    }

    @JsonProperty( value = "emailAddresses" )
    @JsonView( { DetailedView.class, ExportView.class } )
    @JacksonXmlProperty( localName = "emailAddresses" )
    public Set<String> getEmailAddresses()
    {
        return emailAddresses;
    }

    public void setEmailAddresses( Set<String> emailAddress )
    {
        this.emailAddresses = emailAddress;
    }

    @Override
    public String toString()
    {
        return "ProgramMessageRecipients[ " + phoneNumbers != null ? " " + phoneNumbers + " "
            : " " + emailAddresses != null ? " " + emailAddresses + " " : "" + " ]";
    }
}
