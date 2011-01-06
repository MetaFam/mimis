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

import java.util.Map;
import java.util.Collection;
import java.util.Iterator;
import java.util.HashMap;
import java.io.File;
import java.io.IOException;

import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;

import java.io.*;
import static java.nio.file.FileVisitResult.*;
import static java.nio.file.FileVisitOption.*;
import java.util.*;

import org.apache.tools.ant.types.Resource;
import org.apache.tools.ant.Project;
import org.apache.tools.ant.types.FileSet;

public class NeoTraverse {
    protected static String dbURI = "NeoTraverse/db";

    private static final Log log = LogFactory.getLog( NeoTraverse.class );

    protected static GraphDatabaseService graphDb;
    static boolean local = true;

    public static void main( String[] args ) {
        try {
	    String dir = "...";
            if( args.length > 0 ) {
               dir = args[0];
            }

            GraphDuplicator duper = new GraphDuplicator();
            Files.walkFileTree( dir, duper );

	    log.debug( "Matched " + files.size() + " files" );

	    for( Iterator iter = files.iterator(); iter.hasNext(); ) {
		Resource resource = (Resource)iter.next();
		try {
		    load( resource );
                } catch( IOException ioe ) {
                    log.error( "Loading: " + resource.getName(), ioe );
                }
            }
        
            //Mimis.shutdown();
        
            log.debug( "Traversing: " + dir );

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

    public static void load( Resource resource )
        throws IOException {
        log.debug( "resource:name = " + resource.getName() );
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
                    put( "type", SaveSpot.SaveType.DOCSYSTEM );
                    put( "direction", Direction.OUTGOING );
                }} );
    }

    public static void set( Map<String, Object> config ) {
    }

    public static GraphDatabaseService getGraph() {
        if( graphDb == null ) {
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

    public static class GraphDuplicator extends SimpleFileVisitor<Path> {
        private final PathMatcher matcher;
        private int numMatches = 0;

        GraphDuplicator( String pattern ) {
            matcher = FileSystems.getDefault().getPathMatcher( "glob:" + pattern );
        }

        //Compares the glob pattern against the file or directory name.
        void find( Path file ) {
            Path name = file.getName();
            if( name != null && matcher.matches( name ) ) {
                numMatches++;
                log.debug( file );
            }
        }

        //Prints the total number of matches to standard out.
        void done() {
            log.debug( "Matched: " + numMatches );
        }

        //Invoke the pattern matching method on each file.
        @Override
            public FileVisitResult visitFile( Path file,
                                              BasicFileAttributes attrs ) {
            find( file );
            return CONTINUE;
        }

        //Invoke the pattern matching method on each directory.
        @Override
            public FileVisitResult preVisitDirectory( Path dir,
                                                      BasicFileAttributes attrs ) {
            find(dir);
            return CONTINUE;
        }

        @Override
            public FileVisitResult visitFileFailed( Path file,
                                                    IOException e ) {
            log.error( e );
            return CONTINUE;
        }
    }
}
