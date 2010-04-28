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

public class NeoTraverse {
    private static final Log log = LogFactory.getLog( NeoTraverse.class );

    public static GraphDatabaseService graphDb;
    static boolean local = true;
    static String arg = null;

    public static void main( String[] args ) {
        try {
            log.debug( "Starting Traverse: " + graphDb );

            if( args.length > 0 ) {
                arg = args[0];
            }
            arg = ".../";

            Traverser list = local ? list( arg ) : Mimis.list( arg );
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



    public static Traverser list( ) {
        return list( null );
    }

    public static Traverser list( String path ) {
        log.debug( "list:" + path );
        if( graphDb == null ) {
            set( new HashMap<String, Object>() {{
                        put( "db:path", "NeoTraverse/db" );
                    }} );
        }
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
        if( graphDb == null && config.containsKey( "db:path" ) ) {
            graphDb = new EmbeddedGraphDatabase( config.get( "db:path" ).toString() );
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
