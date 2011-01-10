package org.dhappy.mimis;

import netscape.javascript.JSObject;
import java.io.File;
import java.io.IOException;
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
                        JSObject win = JSObject.getWindow(this);
                        JSObject doc = (JSObject) win.getMember("document");
                        JSObject loc = (JSObject) doc.getMember("location");

                        String s = (String) loc.getMember("href");  // document.location.href
                        win.call("f", null);       // Call f() in HTML page
			for( File root : File.listRoots() ) {
			    try {
				log.info( root.getCanonicalPath() );
			    } catch( IOException ioe ) {
				log.warning( "File Error: " + ioe.getMessage() );
			    }
			}
		    }
		});
        } catch( Exception e ) {
            log.warning( "Failed to Load: " + e.getMessage() );
        }
    }
}
