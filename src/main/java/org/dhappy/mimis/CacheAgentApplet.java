package org.dhappy.mimis;

import javax.swing.JApplet;
import javax.swing.SwingUtilities;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

public class CacheAgentApplet extends JApplet {
    private static final Log log = LogFactory.getLog( CacheAgentApplet.class );

    //Called when this applet is loaded into the browser.
    public void init() {
        //Execute a job on the event-dispatching thread; creating this applet's GUI.
        try {
            SwingUtilities.invokeAndWait(new Runnable() {
		    public void run() {
			//setContentPane(newContentPane);        
			log.info( "Applet Started" );
		    }
		});
        } catch ( Exception e ) {
            log.error( "Failed to Load", e );
        }
    }
}