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
import java.util.Collection;

import java.security.PrivilegedAction;
import java.security.AccessController;

import java.util.logging.Logger;

import org.jivesoftware.smack.ConnectionConfiguration;
import org.jivesoftware.smack.Roster;
import org.jivesoftware.smack.RosterEntry;
import org.jivesoftware.smack.PacketListener;
import org.jivesoftware.smack.RosterListener;
import org.jivesoftware.smack.XMPPConnection;
import org.jivesoftware.smack.XMPPException;
import org.jivesoftware.smack.SASLAuthentication;
import org.jivesoftware.smack.filter.MessageTypeFilter;
import org.jivesoftware.smack.filter.PacketFilter;
import org.jivesoftware.smack.packet.Message;
import org.jivesoftware.smack.packet.Packet;
import org.jivesoftware.smack.packet.Presence;

public class CacheAgentApplet extends JApplet {
    private static Logger log =
	Logger.getLogger( CacheAgentApplet.class.getName() );
    JSObject window;
    XMPPConnection connection;
    
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
                window.call( "mimis_file_applet_load",
                             new Object[] { obj } );
            } catch( JSException e ) {
                log.warning( "Callback Failed: " + e.getMessage() );
            }

            String username = "mimis.test";
            String password = "mimistest";

            ConnectionConfiguration connConfig =
                new ConnectionConfiguration( "talk.google.com", 5222, "gmail.com" );
            connection = new XMPPConnection( connConfig );
        
            try {
                connection.connect();
                log.info( "Connected to " + connection.getHost() );
            } catch ( XMPPException ex ) {
                ex.printStackTrace();
                connection = null;
                log.warning( "Failed to connect to " + connection.getHost() );
            }

            try {
                SASLAuthentication.supportSASLMechanism( "PLAIN", 0 );
                            
                connection.login( username + "@gmail.com", password );
                log.info( "Logged in as " + connection.getUser() );
                            
                Presence presence = new Presence( Presence.Type.available );
                connection.sendPacket( presence );
            } catch( XMPPException ex ) {
                ex.printStackTrace();
                // XMPPConnection only remember the username if login is succesful
                // so we can't use connection.getUser() unless we log in correctly
                connection = null;
                log.warning( "Failed to log in as " + username );
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
        if( path.startsWith( "file:" ) ) {
            return fileList( path.substring( 5 ) );
        } else if( path.startsWith( "xmpp:" ) ) {
            return chatList( path.substring( 5 ) );
        }
        return null;
    }

    public Object fileList( final String path ) {
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
                                    obj.put( "size", file.length() );
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
        } catch( Exception e ) {
            log.warning( e.getClass().getName() );
        }
        
        return makeJSObject( paths );
    }

    public class Greeter implements RosterListener {
        private XMPPConnection connection;

        public Greeter( XMPPConnection connection ) {
            this.connection = connection;
        }
        
        public void entriesAdded( Collection<String> addresses ) {}
        public void entriesDeleted( Collection<String> addresses ) {}
        public void entriesUpdated( Collection<String> addresses ) {}

        public void presenceChanged( Presence presence ) {
            log.info("Got presence: " + presence.getType() );
            
            if( presence.getType() == Presence.Type.subscribe ) {
                Presence reply = new Presence( Presence.Type.subscribed );
                reply.setTo( presence.getFrom() );
                connection.sendPacket( reply );
            }
        }
    };

    public Object chatList( final String path ) {
        log.info( "Listing: " + path );
        
        Stack<Map<String,Object>> paths =
            (Stack<Map<String,Object>>)AccessController.doPrivileged
            ( new PrivilegedAction() {
                    public Object run() {
                        //PacketFilter filter = new MessageTypeFilter( Message.Type.chat );
                        //connection.addPacketListener( new MessageParrot( connection ), filter );
                        
                        Roster roster = connection.getRoster();
                        roster.setSubscriptionMode( Roster.SubscriptionMode.manual );
                        roster.addRosterListener( new Greeter( connection ) );
                        
                        // google bounces back the default message types, you must use chat
                        Message msg = new Message( "wholcomb@gmail.com", Message.Type.chat );
                        msg.setBody( "Test" );
                        connection.sendPacket( msg );
                        return null;
                    }
                } );
        return null;
    }

    public void stop() {
        connection.disconnect();
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
