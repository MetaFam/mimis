package org.dhappy.test;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory; 

import org.dhappy.mimis.Mimis;
import org.dhappy.mimis.SaveSpot;

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

import java.math.BigInteger;
import java.util.Map;
import java.util.Collection;
import java.util.Iterator;
import java.util.HashMap;
import java.util.Stack;
import java.io.File;
import java.io.InputStream;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;

import org.dhappy.mimis.FileList;
import org.dhappy.mimis.TraversalListener;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class FilesystemWalker {
    private static final Log log = LogFactory.getLog( FilesystemWalker.class );

    static boolean local = true;

    public static void main( String[] args ) {
        try {
	    String dir = args.length == 0 ? File.separator : args[0];
            log.debug( "dir=" + dir );
	    
            File fsRoot = new File( dir );
	    
	    String machType = System.getenv( "MACHTYPE" );
	    if( machType == null ) {
		machType = System.getProperty( "MACHTYPE" );
	    }
	    boolean cygwin =
		( machType != null && machType.matches( ".*-cygwin" ) );

	    String sep = cygwin ? "/" : File.separator;
	    String path = fsRoot.getCanonicalPath();
	    if( cygwin ) {
		path = path.replaceAll( ( File.separator.equals( "\\" )
					  ? "\\\\" : File.separator ),
					"\\" + sep );
	    }
	    path = path.replaceAll( ":", "" );
	    String dbPath = ( ".mimis"
                              + sep
                              + FilesystemWalker.class.getName()
                              + sep
                              + path
                              + fsRoot.getName() );

            log.debug( "dbPath:" + dbPath );

            log.debug( "Traversing: " + dir );

            GraphDatabaseService graph = getGraph( dbPath );
            GraphDuplicator duper
                = new GraphDuplicator( graph );
            FileList files = new FileList( fsRoot );
            files.traverse( duper );

            Transaction testTx = graph.beginTx();
            try {
                Node ref = graph.getReferenceNode();
                Node child = graphDb.createNode();
                Relationship relationship =
                    ref.createRelationshipTo( child,
                                              FilesystemRelations.CHILD );
                
                ref.setProperty( "test", "test" );
                child.setProperty( "test", "test" );
                relationship.setProperty( "test", "test" );
                testTx.success();
            } finally {
                testTx.finish();
            }

            Traverser list = local ? list( dir ) : Mimis.list( dir );
            //if( list.
            log.info( "main:list = " + list.toString() );

            for( Node node : list ) {
                log.info( ":list[] = " + node );
                try {
                    log.info( ":[][name] = " + node.getProperty( "name" ) );
                } catch( NotFoundException e ) {
                    log.info( ":[][name] = \\0" );
                }
            }
            log.info( "main:list = " + list.toString() );
        } catch( Exception e ) {
            log.error( "NeoTraverse:main", e );
        } finally {
            log.info( "Shutting Down" );
            //local ? graphDb.shutdown() : Mimis.shutdown();
            if( local ) {
                graphDb.shutdown();
            } else {
                Mimis.shutdown();
            }
        }
    }

    public static void load( )
        throws IOException {
        //log.debug( "resource:name = " + resource.getName() );
        //load( resource.getName(), resource.getInputStream() );
        //Transaction tx = graphDb.beginTx();
        return; // getGraph().getReferenceNode();
    }

    public static Traverser list( ) {
        return list( null );
    }

    public static Traverser list( String path ) {
        log.debug( "list:" + path );
	GraphDatabaseService graphDb = getGraph();
        final ReturnableEvaluator returnable =
            ( path == null
              ? ReturnableEvaluator.ALL
              : new ReturnableEvaluator() {
                      public boolean isReturnableNode( TraversalPosition position ) {
                          log.info( "Passing: " + position );
                          return true;
                          //return elements.get( position.depth() ).equals( position.currentNode().getProperty ( "name" ) );
                      }
                      
                      public String toString() { return "NeoTraverse:list:returnable"; }
                  } );
        log.debug( "list:returnable = " + returnable );

        return new OneOffTraverser( new HashMap<String, Object>() {{
                    put( "order", Traverser.Order.DEPTH_FIRST );
                    put( "stop", StopEvaluator.END_OF_GRAPH );
                    put( "return", returnable );
                    put( "type", FilesystemRelations.CHILD );
                    put( "direction", Direction.OUTGOING );
                }} );
    }

    public static void set( Map<String, Object> config ) {
    }

    public static GraphDatabaseService getGraph() {
        return getGraph( null );
    }

    protected static EmbeddedGraphDatabase graphDb;

    public static GraphDatabaseService getGraph( String dbURI ) {
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

    public enum FilesystemRelations implements RelationshipType {
	CHILD
    }

    public static class GraphDuplicator implements TraversalListener {
        GraphDatabaseService graphDb;
        Node currentNode;
        Transaction currentTx;
        
        GraphDuplicator( GraphDatabaseService graphDb ) {
            this.graphDb = graphDb;
        }

        int readBufferSize = 8192;

        public void visitFile( File file ) {
	    try {
		log.debug( "visit:" + file.getAbsolutePath()
			   + " (link:" + FileList.isSymlink( file ) + ")" );
	    } catch(IOException ioe ) {}
            if( file.isFile() ) {
                try {
                    String algorithm = "SHA-256";
                    MessageDigest digest = MessageDigest.getInstance( algorithm );
                    InputStream input = new FileInputStream( file );
                    byte[] buffer = new byte[ readBufferSize ];

                    try {
                        int read = 0;
                        while( ( read = input.read( buffer ) ) > 0 ) {
                            digest.update( buffer, 0, read );
                        }
                        byte[] sum = digest.digest();
                        BigInteger bigInt = new BigInteger( 1, sum );
                        String output = bigInt.toString( 16 );
                        log.debug( algorithm + ":" + output );

			Node node = graphDb.createNode();
			Relationship relationship =
			    currentNode.createRelationshipTo( node,
							      FilesystemRelations.CHILD );
			node.setProperty( algorithm, output );
			node.setProperty( "size", file.length() );
			node.setProperty( "modified", file.lastModified() );
                    } catch(IOException e) {
                        log.error( "Unable to process: " + file, e );
                    } finally {
                        try {
                            input.close();
                        } catch(IOException e) {
                            log.error( "Unable to close: " + file, e);
                        }
                    }
                } catch( FileNotFoundException fnfe ) {
                    log.error( fnfe );
                } catch( NoSuchAlgorithmException nsae ) {
                    log.error( nsae );
                }
            }
        }

        Stack<Node> path = new Stack<Node>();

        //Invoke the pattern matching method on each directory.
        public void preVisitDirectory( File dir ) {
            Node node = graphDb.createNode();
            Relationship relationship =
                currentNode.createRelationshipTo( node,
                                                  FilesystemRelations.CHILD );
 
            node.setProperty( "name", dir.getName() );
            path.push( currentNode );
            currentNode = node;
        }

        public void postVisitDirectory( File dir ) {
            currentNode = path.pop();
        }

        public void startTraverse( File root ) {
            currentTx = graphDb.beginTx();
            currentNode = graphDb.getReferenceNode();
	    log.debug( "start" );
        }

        public void endTraverse( File root ) {
            currentTx.success();
            currentTx.finish();
            currentNode = null;
        }
    }
}
