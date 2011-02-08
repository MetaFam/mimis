package org.dhappy.mimis;

import netscape.javascript.JSObject;
import netscape.javascript.JSException;

import java.io.File;
import java.io.IOException;

import javax.activation.MimetypesFileTypeMap;

import javax.swing.JApplet;
import javax.swing.SwingUtilities;
import javax.swing.JFileChooser;

import java.util.Arrays;
import java.util.Map;
import java.util.List;
import java.util.Stack;
import java.util.Queue;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.Collection;
import java.util.Iterator;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

import java.net.InetAddress;
import java.net.UnknownHostException;

import java.security.PrivilegedAction;
import java.security.AccessController;

import java.util.logging.Logger;

import org.jivesoftware.smack.ConnectionConfiguration;
import org.jivesoftware.smack.Roster;
import org.jivesoftware.smack.RosterEntry;
import org.jivesoftware.smack.RosterGroup;
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
    Map<String,Object> store = new HashMap<String,Object>();

    String mimisValueKey = "__mimis_value";

    public interface Callback {
        public Object call( Object data );
    }

    public interface DynamicValue {
        public Object value( Callback callback );
    }

    public Object localGet( String path ) {
        return localGet( path, null );
    }

    public Object localGet( String path, Callback callback ) {
        Map<String,Object> root = store;
        Object ret = null;

        Queue<String> elems = new LinkedList<String>();
        elems.addAll( Arrays.asList( path.split( "[./,]" ) ) );

        while( ! elems.isEmpty() && root != null ) {
            String elem = elems.poll();
            ret = root.get( elem );
            if( ret instanceof Map || ret == null ) {
                root = (Map<String,Object>)ret;
            }
        }
        if( ! elems.isEmpty() ) {
            ret = null;
        } else if( ret instanceof Map ) {
            Map<String,Object> map = (Map<String,Object>)ret;
            Object val = map.get( mimisValueKey );
            if( val != null ) {
                ret = val;
            }
        }
        
        if( ret instanceof DynamicValue ) {
            ret = ((DynamicValue)ret).value( callback );
        } else if( callback != null ) {
            callback.call( ret );
        }

        return ret;
    }
    
    public Object browserGet( String path ) {
        JSObject root = window;
        Object ret = null;

        Queue<String> elems = new LinkedList<String>();
        elems.addAll( Arrays.asList( path.split( "[./,]" ) ) );

        while( ! elems.isEmpty() && root != null && ret == null ) {
            String elem = elems.poll();
            ret = root.getMember( elem );
            if( ! elems.isEmpty()
                && ( ret instanceof JSObject || ret == null ) ) {
                root = (JSObject)ret;
                ret = null;
            }
        }
        if( ! elems.isEmpty() ) {
            ret = null;
        }
        return ret;
    }

    Map<Integer,Callback> callbacks =
        new HashMap<Integer,Callback>();
    public Object browserGet( String path, Callback callback ) {
        JSObject browser = (JSObject)browserGet( "mimis.browser" );
        log.info( "get1:" + path );
        int id = callback.hashCode();
        JSObject jsCallback = (JSObject)window.eval
            ( "(function() { return function( data ) {"
              + "mimis.applet.callback( arguments.callee.mimis_id, data )"
              + "} })()" );
        jsCallback.setMember( "mimis_id", id );
        callbacks.put( id, callback );
        Object ret =
            browser.call( "get", new Object[] { path, jsCallback } );
        return ret;
    }

    public Object callback( int id, Object data ) {
        log.info( "cb:" + id );
        return callbacks.get( id ).call( data );
    }

    // Called when the applet is loaded into the browser.
    public void init() {
        final JApplet container = this;

        window = JSObject.getWindow( container );

        try {
            //container.setContentPane( chooser );
            try {
                localSet( "local.hostname",
                          new DynamicValue() {
                              String hostname = null;
                              
                              public Object value( Callback callback ) {
                                  if( hostname == null ) {
                                      hostname = "";
                                      try {
                                          InetAddress localMachine = InetAddress.getLocalHost();
                                          hostname = localMachine.getHostName();
                                      } catch( UnknownHostException uhe ) {}
                                  }
                                  if( callback != null ) {
                                      callback.call( hostname );
                                  }
                                  return hostname;
                              }
                              
                              public String toString() {
                                  return (String)value( null );
                              }
                          } );

                localSet( "file.separator",
                          new DynamicValue() {
                              public Object value( Callback callback ) {
                                  if( callback != null ) {
                                      callback.call( File.separator );
                                  }
                                  return File.separator;
                              }
                          } );


                localSet( "connection",
                          new DynamicValue() {
                              XMPPConnection connection = null;
                              String username;
                              String password;
                              String server;
                              
                              public Object value( final Callback callback ) {
                                  log.info( "get:connection" );
                                  // Called when the username and password callbacks return
                                  final Callback connector = new Callback() {
                                          public Object call( Object data ) {
                                              return AccessController.doPrivileged
                                                  ( new PrivilegedAction() {
                                                          public Object run() {
                                                              if( username != null && password != null && connection == null ) {
                                                                  String domain = username.substring( username.lastIndexOf( "@" ) + 1 );
                                                                  if( server == null || server.length() == 0 ) {
                                                                      server = domain;
                                                                  }

                                                                  int port = 5222;
                                                                  log.info( "connector:" + username + ":" + server );
                                                                  
                                                                  ConnectionConfiguration connConfig =
                                                                      new ConnectionConfiguration( server, port, domain );
                                                                  connection = new XMPPConnection( connConfig );
                                                                  
                                                                  try {
                                                                      connection.connect();
                                                                      log.info( "Connected to " + connection.getHost() );
                                                                      
                                                                      SASLAuthentication.supportSASLMechanism( "PLAIN", 0 );
                                                                      
                                                                      connection.login( username,
                                                                                        password,
                                                                                        "mimis/bot/" + localGet( "local.hostname" ) + "/" );
                                                                      
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
                                                              }
                                                              if( callback != null && connection != null ) {
                                                                  callback.call( connection );
                                                              }
                                                              return connection;
                                                          }
                                                      } );
                                          }
                                      };
                                  browserGet( "mimis.xmpp.credentials",
                                              new Callback() {
                                                  public Object call( Object data ) {
                                                      JSObject credentials = (JSObject)data;
                                                      username = (String)credentials.getMember( "username" );
                                                      password = (String)credentials.getMember( "password" );
                                                      server = (String)credentials.getMember( "server" );
                                                      log.info( "Cred:" + username );
                                                      connector.call( null );
                                                      return data;
                                                  }
                                              } );

                                  return connection;
                              }
                          } );

                ((JSObject)browserGet( "mimis.applet" ))
                    .call( "load",
                           new Object[] { makeJSObject( store ) } );
            } catch( JSException e ) {
                log.warning( "Callback Failed: " + e.getMessage() );
            }
        } catch( Exception e ) {
            e.printStackTrace();
            log.warning( "Failed to Load: " + e.getMessage()
                         + " (" + e.getClass().getName() + ")" );
        }
    }

    public Object localSet( String path, Object value ) {
        Map<String,Object> root = store;

        for( String elem : path.split( "[./,]" ) ) {
            Object next = root.get( elem );
            if( next == null ) {
                next = new HashMap<String,Object>();
                root.put( elem, next );
            }
            if( ! ( next instanceof Map ) ) {
                Map<String,Object> map = new HashMap<String,Object>();
                map.put( mimisValueKey, next );
                root.put( elem, map );
                next = map;
            }
            root = (Map<String,Object>)next;
        }
        root.put( mimisValueKey, value );
        return root;
    }

    public Object get( String key ) {
        log.info( "Single param get" );
        return get( key, null );
    }

    public Object get( String key, final Object callback ) {
        Callback castCallback = null;
        if( callback instanceof Callback ) {
            castCallback = (Callback)callback;
        } else if( callback instanceof JSObject ) {
            castCallback = new Callback() {
                    public Object call( Object data ) {
                        if( ! ( data instanceof JSObject ) ) {
                            data = makeJSObject( data );
                        }
                        ((JSObject)callback).call( "call", new Object[] { callback, data } );
                        return data;
                    }
                };
        } else if( callback != null ) {
            log.warning( getClass().getName()
                         + ".get called with callback type: "
                         + callback.getClass().getName() );
        }

        Object ret = localGet( key, castCallback );
        return ret;
    }

    public Object set( String key, Object value ) {
        return makeJSObject( localSet( key, value ) );
    }

    public Object list( final String path ) {
        log.info( "list0: " + path );
        return list( path, null );
    }

    public Object list( final String path, final Object callback ) {
        Callback castCallback = null;
        if( callback instanceof Callback ) {
            castCallback = (Callback)callback;
        } else if( callback instanceof JSObject ) {
            castCallback = new Callback() {
                    public Object call( Object data ) {
                        log.info( "Callback:" + path );
                        if( ! ( data instanceof JSObject ) ) {
                            data = makeJSObject( data );
                        }
                        ((JSObject)callback).call( "call", new Object[] { callback, data } );
                        return data;
                    }
                };
        } else {
            log.warning( getClass().getName()
                         + ".get called with callback type: "
                         + callback.getClass().getName() );
        }

        log.info( "list: " + path );
        Object ret = null;
        if( path.startsWith( "file:" ) ) {
            ret = fileList( path.substring( 5 ), castCallback );
        } else if( path.startsWith( "xmpp:" ) ) {
            ret = chatList( path.substring( 5 ), castCallback );
        }
        return ret;
    }

    public Object fileList( final String path, Callback callback ) {
        Stack<Map<String,Object>> paths = null;
        try {
            paths =
                (Stack<Map<String,Object>>)AccessController.doPrivileged
                ( new PrivilegedAction() {
                        public Object run() {
                            MimetypesFileTypeMap type = new MimetypesFileTypeMap();
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
                                    obj.put( "size",
                                             ( path.length() == 0
                                               ? file.getTotalSpace()
                                               : file.length() ) );
                                    obj.put( "readable", file.canRead() );
                                    obj.put( "writable", file.canWrite() );
                                    obj.put( "modified", file.lastModified() );
                                    obj.put( "type",
                                             ( file.isDirectory()
                                               ? "text/directory"
                                               : type.getContentType( file ) ) );
                                    paths.push( obj );
                                } catch( IOException ioe ) {
                                    log.warning( ioe.getMessage() );
                                }
                            }
                            return paths;
                        }
                    } );
            if( callback != null ) {
                callback.call( paths );
            }
        } catch( Exception e ) {
            log.warning( e.getClass().getName() );
        }
        
        return paths;
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

    public Object chatList( final String path, final Callback callback ) {
        return get( "connection",
                    new Callback() {
                        public Object call( Object data ) {
                            final XMPPConnection connection =
                                (XMPPConnection)data;
                            Stack<Map<String,Object>> paths = null;
                            try {
                                paths =
                                    (Stack<Map<String,Object>>)AccessController.doPrivileged
                                    ( new PrivilegedAction() {
                                            public Object run() {
                                                //PacketFilter filter = new MessageTypeFilter( Message.Type.chat );
                                                //connection.addPacketListener( new MessageParrot( connection ), filter );
                                                Stack<Map<String,Object>> paths =
                                                    new Stack<Map<String,Object>>();
                                                
                                                Roster roster = connection.getRoster();
                                                // roster.setSubscriptionMode( Roster.SubscriptionMode.manual );
                                                // roster.addRosterListener( new Greeter( connection ) );
                                                
                                                if( path.length() == 0 ) {
                                                    for( RosterEntry entry : roster.getEntries() ) {
                                                        Map<String,Object> obj =
                                                            new HashMap<String,Object>();
                                
                                                        String name = entry.getName();
                                                        String username = entry.getUser();
                                                        if( name == null ) {
                                                            name = username;
                                                        }
                                                        obj.put( "name", name );
                                                        obj.put( "username", username );
                                                 
                                                        Pattern botName = Pattern.compile( "^" + username
                                                                                           + "/mimis/bot"
                                                                                           + "/(.*)/([^/]+)/?" );
                                                        log.info( "name:" + username );
                                                        for( Iterator<Presence> presences =
                                                                 roster.getPresences( username );
                                                             presences.hasNext(); ) {
                                                            Presence presence = (Presence)presences.next();
                                                            Matcher match = botName.matcher( presence.getFrom() );
                                                            log.info( "presence:" + presence.getFrom() + ":" + presence.toString() );
                                                            if( match.matches() ) {
                                                                String location = match.group( 1 );
                                                                String id = match.group( 2 );
                                                                log.info( "presence:" + presence.toString() );
                                                                obj.put( "location", location );
                                                            }
                                                        }
                                                        paths.push( obj );
                                                    }
                                                } else {
                                                    // google bounces back the default message types, you must use chat
                                                    Message msg = new Message( "wholcomb@gmail.com",
                                                                               Message.Type.chat );
                                                    msg.setBody( "Test" );
                                                    connection.sendPacket( msg );
                                                }
                                                return paths;
                                            }
                                        } );
                                if( callback != null ) {
                                    callback.call( paths );
                                }
                            } catch( Exception e ) {
                                e.printStackTrace();
                                log.warning( e.getClass().getName() );
                            }
                            return paths;
                        }
                    } );
    }

    public void stop() {
        /*
        if( connection != null ) {
            connection.disconnect();
            connection = null;
        }
        */
    }

    public Object makeJSObject( Object input ) {
        Object ret = null;
        
        try {
            if( input.getClass().isArray() ) {
                input = Arrays.asList( input );
            }
            if( input instanceof List ) {
                log.info( ((List)input).size() + " : " + input.toString() );
                String script = "[]"; //"(function() { return [] })()";
                JSObject obj = (JSObject)window.eval( script );
                int index = 0;
                for( Object child : (List)input ) {
                    obj.setSlot( index++, makeJSObject( child ) );
                }
                ret = obj;
            } else if( input instanceof Map ) {
                String script = "(function() { return {} })()";
                JSObject obj = (JSObject)window.eval( script );
                for( Map.Entry<String, Object> entry :
                         ( (Map<String, Object>)input ).entrySet() ) {
                    obj.setMember( entry.getKey(),
                                   makeJSObject( entry.getValue() ) );
                }
                ret = obj;
            } else if( input instanceof JSObject
                       || input instanceof Integer
                       || input instanceof Boolean
                       || input instanceof String ) {
                ret = input;
            } else {
                ret = input;
            }
        } catch( Exception e ) {
            log.warning( e.getClass().getName() + ": " + e.getMessage() );
        }
        
        return ret;
    }
}
