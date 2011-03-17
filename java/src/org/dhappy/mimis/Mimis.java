package org.dhappy.mimis;

import org.apache.cocoon.sax.component.XMLGenerator;
import org.apache.cocoon.sax.component.XMLSerializer;
import org.apache.cocoon.sax.SAXPipelineComponent;
import org.apache.cocoon.pipeline.NonCachingPipeline;
import org.apache.cocoon.pipeline.Pipeline;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory; 

import org.neo4j.kernel.EmbeddedGraphDatabase;
import org.neo4j.graphdb.RelationshipType;
import org.neo4j.graphdb.GraphDatabaseService;
import org.neo4j.graphdb.Node;
import org.neo4j.graphdb.Relationship;
import org.neo4j.graphdb.Traverser;
import org.neo4j.graphdb.TraversalPosition;
import org.neo4j.graphdb.Traverser.Order;
import org.neo4j.graphdb.Transaction;
import org.neo4j.graphdb.StopEvaluator;
import org.neo4j.graphdb.ReturnableEvaluator;
import org.neo4j.graphdb.Direction;
import org.neo4j.graphdb.NotFoundException;

import org.jivesoftware.smack.Chat;
import org.jivesoftware.smack.ConnectionConfiguration;
import org.jivesoftware.smack.MessageListener;
import org.jivesoftware.smack.PacketListener;
import org.jivesoftware.smack.filter.PacketFilter;
import org.jivesoftware.smack.Roster;
import org.jivesoftware.smack.RosterEntry;
import org.jivesoftware.smack.XMPPConnection;
import org.jivesoftware.smack.XMPPException;
import org.jivesoftware.smack.SASLAuthentication;
import org.jivesoftware.smack.packet.Packet;
import org.jivesoftware.smack.packet.Message;

import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.FileNotFoundException;
import java.util.Collections;
import java.util.Map;
import java.util.HashMap;
import java.util.Collection;
import java.util.Stack;
import java.util.Iterator;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

public class Mimis {
    private static final Log log = LogFactory.getLog( Mimis.class );

    protected static EmbeddedGraphDatabase graphDb;
    static Pattern pathSplitter;

    public static GraphDatabaseService getGraph() {
        return getGraph( null );
    }

    protected static GraphDatabaseService getGraph( String dbURI ) {
        if( graphDb != null && dbURI != null
	    && dbURI != graphDb.getStoreDir() ) {
            graphDb.shutdown();
            graphDb = null;
        }
            
        if( graphDb == null ) {
	    // Default database URI
	    dbURI = ( dbURI == null ) ? ".mimis/host/files" : dbURI;
            graphDb = new EmbeddedGraphDatabase( dbURI );
        }
	return graphDb;
    }
    
    public static Holon load( String key ) throws IOException {
        //( key -== "/" ) // key = key[1] == "/" ? key[1:] : key // whole line suceeds or fails
        //&& ( key []: =
        log.debug( "Searching for: " + key );
        //key =: 1 // key = key[1:]
        if( key.startsWith( "/" ) ) { // Load from local filesystem
            key = key.substring( 1 );
            if( key.startsWith( "~/" ) ) {
                key = ( System.getProperty( "user.home" ) + File.separator
                        + key.substring( 2 ) );
            }
            try {
                return load( key, new FileInputStream( key ) );
            } catch( FileNotFoundException fnf ) {
                log.info( "Not Found: " + key );
            }
        }
        return null;
    }

    public static Holon load( String key, File input ) throws IOException {
        Holon position = load( key, new FileInputStream( input ) );
        // ToDo: Save extra metadata
        return position;
    }

    public static Holon load( String key, InputStream input ) throws IOException {
        log.debug( "Input: " + key );
        FileOutputStream output = null;
        try {
            output = new FileOutputStream( "target/pipeline." + input.hashCode() + ".out" );
            return load( key, input, output );
        } finally {
            if( output != null ) {
                output.close();
            }
        }
    }
    
    public static Holon load( String key, InputStream input, OutputStream output ) throws IOException {
        try {
            MutableHolon mark = null;
            log.info( "Loading: " + key );
            try {
            mark = new MutableHolon( getGraph() );
            SaveSpot recorder = new SaveSpot( mark );
            Pipeline<SAXPipelineComponent> pipeline =
                new NonCachingPipeline<SAXPipelineComponent>();
            pipeline.addComponent( new XMLGenerator( input ));
            
            pipeline.addComponent( recorder.getSAXPipeline() );
            pipeline.addComponent( new XMLSerializer() );
            
            pipeline.setup( output );
            pipeline.execute();
            mark.commit();
            } catch(Exception e) {
                log.error( "Load Error: ", e );
            }

            return mark;
        } catch( Exception ex ) {
            throw new IOException( ex );
        }
    }

    static class PathTracker {
        int lastDepth = -1; // Traversal depth starts at 0
        Stack<String> seekPath = new Stack<String>();
        Stack<String> currentPath = new Stack<String>();
        
        public PathTracker( String key ) {
            Mimis.decomposeKey( key, seekPath );
        }

        public void step( int depth, Node location ) {
            String name = "";
            try {
                name = location.getProperty( "name" ).toString();
            } catch( NotFoundException nfe ) {
            }
            step( depth, name );
        }

        public void step( int depth, String name ) {
            if( depth == lastDepth
                && ( name.length() == 0
                     || ( currentPath.size() > 0
                          && currentPath.peek().equals( name ) ) ) ) {
                return;
            }
            
            int delta = depth - lastDepth;
            lastDepth = depth;

            if( delta > 1 ) {
                log.info( "Unexpected Delta: [" + name + "]: " + delta );
            }
            
            // Child of last node and not empty
            if( delta >= 0 && name.length() > 0 ) {
                if( delta == 0 ) { // Sibling
                    currentPath.pop();
                }
                currentPath.push( name );
            } else if( delta < 0 ) { // Traversal returning
                currentPath.pop();
            }

            if( currentPath.size() <= seekPath.size() ) {
                int seekIdx = Math.max( 0, currentPath.size() - 1 );
                log.debug( "list:[" + lastDepth + "][" + name + "] ?== " +
                           seekPath.elementAt( seekIdx ) );
            }
            
        }

        public boolean returnable() {
            log.debug( "list:returnable:equal: " + currentPath.equals( seekPath ) );
            return currentPath.equals( seekPath );
        }

        public boolean viable() {
            log.debug( "list:viable:sublist: " + Collections.indexOfSubList( seekPath, currentPath ) );
            return ( seekPath.size() < currentPath.size()
                     && Collections.indexOfSubList( seekPath, currentPath ) != 0 );
        }
    }

    public static Listing list() {
        return list( null );
    }

    public static Listing list( final Object key ) {
        final String path = key == null ? "" : key.toString();
        log.debug( "list:path = " + path );

        Map config = new HashMap<String, Object>() {{
                put( "order", Traverser.Order.DEPTH_FIRST );
                put( "type", SaveSpot.SaveType.DOCSYSTEM );
                put( "direction", Direction.OUTGOING );
            }};

        if( key == null ) {
            //config.put( "stop", StopEvaluator.DEPTH_ONE );
            config.put( "stop", StopEvaluator.END_OF_GRAPH );
            config.put( "return", ReturnableEvaluator.ALL_BUT_START_NODE );
        } else {
            final PathTracker tracker = new PathTracker( path );
            config.put( "return", new ReturnableEvaluator() {
                public boolean isReturnableNode( TraversalPosition position ) {
                    tracker.step( position.depth(), position.currentNode() );
                    return tracker.returnable();
                } } );
            config.put( "stop", new StopEvaluator() {
                public boolean isStopNode( TraversalPosition position ) {
                    tracker.step( position.depth(), position.currentNode() );
                    return tracker.viable();
                } } );
        }

        return new OneOffTraverser( config );
    }

    public static Node createNode( Map<String, Object> config ) {
        Node node = getGraph().createNode();

        for( Map.Entry<String, Object> e : config.entrySet() ) {
            node.setProperty( e.getKey(), e.getValue() );
        }
        return node;
    }

    public static Stack<String> decomposeKey( String key ) {
        return decomposeKey( key, new Stack<String>() );
    }

    public static Stack<String> decomposeKey( String key, Stack<String> path ) {
        if( pathSplitter == null ) {
            impress( new HashMap<String, Object>() {{
                        put( "separators", "\\s+|/|:|\\.|,|-" );
                    }} );
        }
        Matcher match = pathSplitter.matcher( key );
        while( match.find() ) {
            for( int i = 1; i <= match.groupCount(); i++ ) {
                path.push( match.group( i ) );
            }
        }
        return path;
    }

    public static void impress( Map<String, Object> config ) {
        if( config.containsKey( "separators" ) ) {
            String separators = config.get( "separators" ).toString();
            pathSplitter = Pattern.compile( "(" + separators + "|[^" + separators + "]+)" );
        }
    }

    public static void shutdown() {
        getGraph().shutdown();
        graphDb = null;
    }

    public static void main( String[] args ) {
        log.debug( "Starting Mimis" );

        // Used for signalling ending
        final Object hold = new Object();
    
        int idx = 0;
        String scheme = "jabber";
        String userid = "mimis.test@gmail.com";
        String password = "mimistest";
        String server = "talk.google.com";
        String port = "5222";
        String resource = "bot/mimis/";
        
        if( args.length == 1 ) {
            String urn = args[1];

            //[ scheme, uri ] = urn.split[:][1];
            idx = urn.indexOf( ':' );
            scheme = urn.substring( 0, idx );
            String uri = urn.substring( idx + 1 );
            
            //[ connection, resource ] = uri.split[/][1]
            idx = uri.indexOf( '/' );
            String connection = uri.substring( 0, idx );
            resource = uri.substring( idx + 1 );

            //[ credentials, server ] = connection.split[@][-1]
            idx =  connection.lastIndexOf( '@' );
            String credentials = connection.substring( 0, idx );
            server = connection.substring( idx + 1 );

            //[ server, port ] = server.split[':'][1]
            idx = server.indexOf( ':' );
            if( idx < 0 ) idx = server.length();
            port = server.substring( idx + 1 );
            server = server.substring( 0, idx );

            //[ username, password ] = credentials.split[:][1]
            idx = credentials.indexOf( ':' );
            //if( idx < 0 ) idx = credentials.length;
            if( idx < 0 ) idx = credentials.length();
            userid = credentials.substring( 0, idx );
            password = uri.substring( idx + 1 );
        }

        // [ username, domain ] = userid.split[@][1] || [ userid, server ]
        idx = userid.indexOf( '@' );
        String username = idx > 0 ? userid.substring( 0, idx ) : userid;
        String domain = idx > 0 ? userid.substring( idx + 1 ) : server;

        log.info( "Connecting: " +
                  scheme + ":" +
                  username + ":" +
                  password + "@" +
                  domain + ":" +
                  port + "/" +
                  resource + " @ " +
                  server );
        
        //config = new ConnectionConfiguration( server, (int)port, resource );
        ConnectionConfiguration config = new ConnectionConfiguration( server, Integer.valueOf( port ), domain );
        XMPPConnection.DEBUG_ENABLED = true;
        try {
            SASLAuthentication.supportSASLMechanism( "PLAIN", 0 );
            final XMPPConnection connection = new XMPPConnection( config );
            connection.connect();

            connection.login( userid, password, resource );
            
            PacketFilter mimisFilter = new PacketFilter() {
                    public boolean accept( Packet packet ) {
                        return true;
                    }
                };
            
            PacketListener mimisListener = new PacketListener() {
                    int count = 0;

                    public void processPacket( Packet packet ) {
                        count += 1;
                        if( packet instanceof Message ) {
                            Message message = (Message)packet;
                            String thread = message.getThread();
                            String subject = message.getSubject();
                            String body = message.getBody();
                            
                            Message response = new Message();
                            response.setTo( message.getFrom() );
                            response.setThread( thread );

                            Pattern command = Pattern.compile( "(ls|die|load)(?:\\s+(.*\\S))?\\s*$" );
                            Matcher match = command.matcher( body );
                            if( match.matches() ) {
                                String cmd = match.group( 1 );
                                String arg = match.group( 2 );

                                String sub = "packet[" + count + "]:" + cmd + ":" + arg;
                                response.setSubject( sub );
                                log.info( sub );

                                StringBuffer out = new StringBuffer();
                                String msg;

                                if( "ls".equals( cmd ) ) {
                                    try {
                                    Traverser list = list( arg );
                                    msg = "packet[" + count + "]:list[][name]";
                                    out.append( msg + "\n" );
                                    for( Node node : list ) {
                                        try {
                                            msg = "[][name] = " + node.getProperty( "name" );
                                        } catch( NotFoundException e ) {
                                            msg = "[][name] = \\0";
                                        }
                                        out.append( msg + "\n" );
                                    }
                                    log.debug( "Done Listing" );
                                    } catch(Exception e) {
                                        log.error( "List", e );
                                    }
                                } else if( "load".equals( cmd ) ) {
                                    msg = "packet[" + count + "]:load";
                                    try {
                                        load( arg );
                                    } catch( IOException ioe ) {
                                        msg += " = \\0";
                                    }
                                    log.debug( msg );
                                    out.append( msg + "\n" );
                                } else if( "die".equals( cmd ) ) {
                                    msg = "packet[" + count + "]:die";
                                    log.debug( msg );
                                    out.append( msg + "\n" );
                                    synchronized (hold) {
                                        hold.notify();
                                    }
                                } else {
                                    msg = "packet[" + count + "]:" + cmd;
                                    log.debug( msg );
                                    out.append( cmd + "\n" );
                                }
                                response.setBody( out.toString() );
                            } else {
                                log.error( "Unknown: " + body );
                                response.setSubject( "Unknown" );
                                response.setBody( "..." );
                            }
                            connection.sendPacket( response );
                        } else {
                            log.debug( "Packet: " + packet );
                        }
                    } };
            connection.addPacketListener( mimisListener, mimisFilter );
        } catch( XMPPException ex ) {
            log.error( "Connection Error", ex );
        }

        try {
            log.info( "Holding" );
            synchronized (hold) {
                hold.wait();
            }
        } catch( InterruptedException ie ) {
        } finally {
            log.info( "Shutting Down" );
            Mimis.shutdown();
        }
    }

    static class OneOffTraverser implements Listing, Iterator<Node> {
        Transaction tx = graphDb.beginTx();
        Traverser traverser;
        
        Iterator<Node> iterator;
        Node current;
        Node next;
        TraversalPosition currentPosition;
 
        Node start;
        
        public OneOffTraverser( Map<String, Object> config ) {
            impress( config );
            if( start == null ) {
                start = graphDb.getReferenceNode();
            }
            traverser = start.traverse( (Traverser.Order)config.get( "order" ),
                                        (StopEvaluator)config.get( "stop" ),
                                        (ReturnableEvaluator)config.get( "return" ),
                                        (RelationshipType)config.get( "type" ),
                                        (Direction)config.get( "direction" ) );
        }

        public void impress( Map<String, Object> config ) {
            if( config.containsKey( "start" ) && config.containsKey( "tx" ) ) {
                if( tx != null ) {
                    tx.finish();
                }
                start = (Node)config.get( "start" );
                tx = (Transaction)config.get( "tx" );
            }
        }

        public TraversalPosition currentPosition() {
            return currentPosition;
        }

        public Collection<Node> getAllNodes() {
            return null;
        }

        public Iterator<Node> iterator() {
            return this;
        }

        public void remove() {
            throw new UnsupportedOperationException();
        }

        public void prime() {
            if( iterator == null ) {
                iterator = traverser.iterator();
                next();
            }
        }

        public boolean hasNext() {
            prime();
            boolean hasNext = next != null;
            if( ! hasNext ) {
                log.debug( "Listing Finished" );
                tx.success();
                tx.finish();
            }
            return hasNext;
        }
        
        public Node next() {
            if( iterator == null ) {
                prime();
            }
            current = next;
            currentPosition = traverser.currentPosition();
            next = iterator.hasNext() ? iterator.next() : null;
            return current;
        }

        public Node getNode() {
            return current;
        }

        public Holon top() {
            final Node current = this.current;
            return new Holon() {
                public Node getNode() { return current; }
                public void impress( Map<String, Object> config ) {}
            };
        }

        public void finalize() {
            if( tx != null ) {
                tx.finish();
            }
        }
    }
}
