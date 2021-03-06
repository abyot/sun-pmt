package org.hisp.dhis.mobile.action.incoming;

/*
 * Copyright (c) 2004-2017, University of Oslo
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

import org.hisp.dhis.sms.incoming.IncomingSms;
import org.hisp.dhis.sms.incoming.IncomingSmsListener;
import org.hisp.dhis.sms.incoming.IncomingSmsService;
import org.hisp.dhis.sms.incoming.SmsMessageStatus;
import org.springframework.beans.factory.annotation.Autowired;

import com.opensymphony.xwork2.Action;

public class ReimportSMSAction
    implements Action
{
    // -------------------------------------------------------------------------
    // Dependencies
    // -------------------------------------------------------------------------

    private IncomingSmsService incomingSmsService;

    private List<IncomingSmsListener> listeners;

    // -------------------------------------------------------------------------
    // Input & Output
    // -------------------------------------------------------------------------

    private String incomingSMSId;

    private IncomingSms incomingSMS;

    @Autowired
    public void setListeners( List<IncomingSmsListener> listeners )
    {
        this.listeners = listeners;
    }

    public IncomingSmsService getIncomingSmsService()
    {
        return incomingSmsService;
    }

    public void setIncomingSmsService( IncomingSmsService incomingSmsService )
    {
        this.incomingSmsService = incomingSmsService;
    }

    public String getIncomingSMSId()
    {
        return incomingSMSId;
    }

    public void setIncomingSMSId( String incomingSMSId )
    {
        this.incomingSMSId = incomingSMSId;
    }

    public IncomingSms getIncomingSMS()
    {
        return incomingSMS;
    }

    public void setIncomingSMS( IncomingSms incomingSMS )
    {
        this.incomingSMS = incomingSMS;
    }

    private String message;

    public String getMessage()
    {
        return message;
    }

    public void setMessage( String message )
    {
        this.message = message;
    }

    // -------------------------------------------------------------------------
    // Action Implementation
    // -------------------------------------------------------------------------

    @Override
    public String execute()
        throws Exception
    {
        incomingSMS = incomingSmsService.findBy( Integer.parseInt( incomingSMSId ) );        

        if ( incomingSMS == null )
        {
            return "error";
        }

        try
        {
            for ( IncomingSmsListener listener : listeners )
            {
                if ( listener.accept( incomingSMS ) )
                {
                    listener.receive( incomingSMS );
                   
                    incomingSMS.setStatus( SmsMessageStatus.PROCESSED );
                    incomingSmsService.update( incomingSMS );
                    
                    message = "SMS imported";
                    return SUCCESS;
                }
            }
            message = "No Command Found";
        }
        catch ( Exception e )
        {
            message = e.getMessage();
            return "error";
        }

        return SUCCESS;
    }
}
