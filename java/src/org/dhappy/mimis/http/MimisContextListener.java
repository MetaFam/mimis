package org.dhappy.mimis.http;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory; 

import javax.servlet.ServletContextListener;
import javax.servlet.ServletContextEvent;

public class MimisContextListener implements ServletContextListener {
    private static final Log log = LogFactory.getLog( MimisContextListener.class );

    public void contextInitialized( ServletContextEvent event ) {
        log.debug( "Context Initialized: " + event );
    }

    public void contextDestroyed( ServletContextEvent event ) {
        log.debug( "Context Destroyed: " + event );
    }
}
