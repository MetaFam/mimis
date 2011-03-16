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

import java.io.InputStream;
import java.io.OutputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Map;
import java.util.HashMap;
import java.util.Collection;
import java.util.Stack;
import java.util.Iterator;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

public class Mimis {
    private static final Log log = LogFactory.getLog( Mimis.class );

    static String dbPath = "var/mimis";
    public final static GraphDatabaseService graphDb = new EmbeddedGraphDatabase( dbPath );
    static Pattern pathSplitter;

    public static SaveSpot load( InputStream input ) throws IOException {
        FileOutputStream output = null;
        try {
            output = new FileOutputStream( "target/pipeline." + input.hashCode() + ".out" );
            return load( input, output );
        } finally {
            if( output != null ) {
                output.close();
            }
        }
    }
    
    public static SaveSpot load( InputStream input, OutputStream output ) throws IOException {
        try {
            SaveSpot mark = mark();
            Pipeline<SAXPipelineComponent> pipeline = new NonCachingPipeline<SAXPipelineComponent>();
            pipeline.addComponent( new XMLGenerator( input ));
            pipeline.addComponent( mark.getSAXPipelineComponent() );
            pipeline.addComponent( new XMLSerializer() );
            
            pipeline.setup( output );
            pipeline.execute();
            return mark;
        } catch( Exception ex ) {
            throw new IOException( ex );
        }
    }

    public static SaveSpot mark() {
        return new SaveSpot( graphDb );
    }

    public static Traverser list() {
        return new OneOffTraverser( new HashMap<String, Object>() {{
                    put( "order", Traverser.Order.DEPTH_FIRST );
                    put( "stop", StopEvaluator.END_OF_GRAPH );
                    put( "return", ReturnableEvaluator.ALL );
                    put( "type", SaveSpot.SaveType.FILESYSTEM );
                    put( "direction", Direction.OUTGOING );
                }} );
    }

    public static Traverser list( final Object key ) {
        final String path = key == null ? "" : key.toString();
        log.debug( "list:path = " + path );

        final ReturnableEvaluator returnable = new ReturnableEvaluator() {
                Stack<String> elements = Mimis.getPathDecomposition( path );
                public boolean isReturnableNode( TraversalPosition position ) {
                    //return name[depth] == current[name]
                    log.info( "Shorting Out" );
                    return false;
                    //return elements.get( position.depth() ).equals( position.currentNode().getProperty ( "name" ) );
                }
            };
        
        log.debug( "list:returnable = " + returnable.toString() );
        log.debug( "list:returnable:null = " + returnable.isReturnableNode( null ) );
        return new OneOffTraverser( new HashMap<String, Object>() {{
                    put( "order", Traverser.Order.DEPTH_FIRST );
                    put( "stop", StopEvaluator.END_OF_GRAPH );
                    put( "return", returnable );
                    put( "type", SaveSpot.SaveType.FILESYSTEM );
                    put( "direction", Direction.OUTGOING );
                }} );
    }

    public static Stack<String> getPathDecomposition( String path ) {
        Stack<String> elements = new Stack<String>();

        if( pathSplitter == null ) {
            setProperty( "separators", "\\s+|/|:|\\.|,|-" );
        }
        Matcher match = pathSplitter.matcher( path );
        while( match.find() ) {
            for( int i = 1; i <= match.groupCount(); i++ ) {
                elements.push( match.group( i ) );
            }
        }
        return elements;
    }

    public static void setProperty( String name, Object value ) {
        if( "separators".equals( name ) ) {
            String separators = value.toString();
            pathSplitter = Pattern.compile( "(" + separators + "|[^" + separators + "]+)" );
        }
    }

    public static void shutdown() {
        graphDb.shutdown();
    }

    public static void main( String[] args ) {
        log.debug( "Starting Mimis" );
    
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

                            Pattern command = Pattern.compile( "(ls|die)(?: (.*))?" );
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
                                    Traverser list = arg == null ? list() : list( arg );
                                    msg = "packet[" + count + "]:list[][name]";
                                    out.append( msg + "\n" );
                                    for( Node node : list() ) {
                                        try {
                                            msg = "[][name] = " + node.getProperty( "name" );
                                        } catch( NotFoundException e ) {
                                            msg = "[][name] = \\0";
                                        }
                                        out.append( msg + "\n" );
                                    }
                                } else if( "die".equals( cmd ) ) {
                                    // Doesn't work
                                    throw new IllegalStateException( "Command: Die" );
                                }
                                response.setBody( out.toString() );
                            } else {
                                log.error( "Unknown: " + body );
                                response.setSubject( "Unknown" );
                                response.setBody( "..." );
                            }
                            connection.sendPacket( response );
                        } else {
                        }
                    } };
            connection.addPacketListener( mimisListener, mimisFilter );
        } catch( XMPPException ex ) {
            log.error( "Connection Error", ex );
        }

        try {
            log.info( "Holding" );
            System.in.read();
        } catch( IOException ioe ) {
        } finally {
            log.info( "Shutting Down" );
            Mimis.shutdown();
        }
    }

    static class OneOffTraverser implements Traverser, Iterator<Node> {
        Transaction tx = graphDb.beginTx();
        Traverser traverser;
        
        Iterator<Node> iterator;
        Node next;
        TraversalPosition currentPosition;

        Node start;
        
        public OneOffTraverser( Map<String, Object> config ) {
            config( config );
            if( start == null ) {
                start = graphDb.getReferenceNode();
            }
            traverser = start.traverse( (Traverser.Order)config.get( "order" ),
                                        (StopEvaluator)config.get( "stop" ),
                                        (ReturnableEvaluator)config.get( "return" ),
                                        (RelationshipType)config.get( "type" ),
                                        (Direction)config.get( "direction" ) );
        }

        public void config( Map<String, Object> config ) {
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
                tx.finish();
            }
            return hasNext;
        }
        
        public Node next() {
            if( iterator == null ) {
                prime();
            }
            Node current = next;
            currentPosition = traverser.currentPosition();
            next = iterator.hasNext() ? iterator.next() : null;
            return current;
        }
    }
}
