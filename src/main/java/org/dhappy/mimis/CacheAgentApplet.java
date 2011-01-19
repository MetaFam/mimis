package org.dhappy.mimis;

import netscape.javascript.JSObject;
import netscape.javascript.JSException;

import java.io.File;
import java.io.IOException;

import javax.swing.JApplet;
import javax.swing.SwingUtilities;
import javax.swing.JFileChooser;

import java.util.Arrays;
import java.util.Map;
import java.util.List;
import java.util.Stack;
import java.util.HashMap;

import java.security.PrivilegedAction;
import java.security.AccessController;

import java.util.logging.Logger;

public class CacheAgentApplet extends JApplet {
    private static Logger log =
	Logger.getLogger( CacheAgentApplet.class.getName() );
    JSObject window;
    
    // Called when the applet is loaded into the browser.
    public void init() {
        final JApplet container = this;

        try {
            //container.setContentPane( chooser );

            window = JSObject.getWindow( container );
            JSObject doc = (JSObject)window.getMember( "document" );
            JSObject loc = (JSObject)doc.getMember( "location" );
            
            String href = (String)loc.getMember( "href" );
            log.info( "document.location.href = " + href );
            
            try {
                String script = "(function() { return { test : 'test' } })()";
                JSObject obj = (JSObject)window.eval( script );
                obj.setMember( "testing", "test" );
                window.call( "mimis_applet_load",
                             new Object[] { obj } );
            } catch( JSException e ) {
                log.warning( "Callback Failed: " + e.getMessage() );
            }

        } catch( Exception e ) {
            log.warning( "Failed to Load: " + e.getMessage()
                         + " (" + e.getClass().getName() + ")" );
        }
    }

    public Object get( String key ) {
        return retrieve( key );
    }

    public Object retrieve( String key ) {
        log.info( "retrieve:" + key );
        return new String[] { key };
    }

    public Object list( final String path ) {
        log.info( "Listing: " + path );
        
        Stack<Map<String,Object>> paths = null;
        try {
            paths =
                (Stack<Map<String,Object>>)AccessController.doPrivileged
                ( new PrivilegedAction() {
                        public Object run() {
                            Stack<Map<String,Object>> paths =
                                new Stack<Map<String,Object>>();
                            File[] files =
                                ( path.length() == 0 )
                                ? File.listRoots()
                                : (new File( path )).listFiles();
                            
                            for( File file : files ) {
                                Map<String,Object> obj =
                                    new HashMap<String,Object>();
                                try {
                                    String name = file.getName();
                                    if( name.length() == 0 ) {
                                        name = file.getCanonicalPath();
                                    }
                                    obj.put( "name", name );
                                    obj.put( "length", file.length() );
                                    obj.put( "readable", file.canRead() );
                                    obj.put( "writable", file.canWrite() );
                                    obj.put( "modified", file.lastModified() );
                                    paths.push( obj );
                                } catch( IOException ioe ) {
                                    log.warning( ioe.getMessage() );
                                }
                            }
                            return paths;
                        }
                    } );
            log.info( "Listed: " + paths );
        } catch( Exception e ) {
            log.warning( e.getClass().getName() );
        }
        
        return makeJSObject( paths );
    }

    public Object makeJSObject( Object input ) {
        Object ret = null;
        
        try {
            if( input.getClass().isArray() ) {
                input = Arrays.asList( input );
            }
            if( input instanceof List ) {
                log.info( ((List)input).size() + " : " + input.toString() );
                String script = "(function() { return [] })()";
                JSObject obj = (JSObject)window.eval( script );
                int index = 0;
                for( Object child : (List)input ) {
                    obj.setSlot( index++, makeJSObject( child ) );
                }
                ret = obj;
            } else if( input instanceof Map ) {
                String script = "(function() { return {} })()";
                JSObject obj = (JSObject)window.eval( script );
                for(Map.Entry<String, Object> entry :
                        ( (Map<String, Object>)input ).entrySet() ) {
                    obj.setMember( entry.getKey(), entry.getValue() );
                }
                ret = obj;
            } else if( input instanceof String ) {
                ret = input;
            }
        } catch( Exception e ) {
            log.warning( e.getClass().getName() + ": " + e.getMessage() );
        }
        
        return ret;
    }
}
