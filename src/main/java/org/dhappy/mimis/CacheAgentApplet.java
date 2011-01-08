package org.dhappy.mimis;

import javax.swing.JApplet;
import javax.swing.SwingUtilities;

import java.util.logging.Logger;

public class CacheAgentApplet extends JApplet {
    private static Logger log =
	Logger.getLogger( CacheAgentApplet.class.getName() );

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
        } catch( Exception e ) {
            log.warning( "Failed to Load: " + e.getMessage() );
        }
    }
}