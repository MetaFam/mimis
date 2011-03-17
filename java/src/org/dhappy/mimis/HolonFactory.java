package org.dhappy.mimis;

import org.neo4j.graphdb.RelationshipType;
import org.neo4j.graphdb.GraphDatabaseService;
import org.neo4j.graphdb.Node;
import org.neo4j.graphdb.Transaction;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Map;
import java.util.Date;
import java.util.TimeZone;

public class HolonFactory {
    public static DateFormat format = new SimpleDateFormat( "yyyy/MM/dd@HH:mm:ss.SSS" );

    {
        format.setTimeZone( TimeZone.getTimeZone( "GMT" ) );
    }

    public static enum Scale implements RelationshipType {
        Identifies, Identified, Signifier, Signifies, Superset, Subset
            }
    
    public static Holon mark( GraphDatabaseService graphDb ) {
        Transaction tx = graphDb.beginTx();
        try {
            Node center = graphDb.getReferenceNode();
            
            Node time = graphDb.createNode();
            time.setProperty( "time", format.format( new Date() ) );
            center.createRelationshipTo( time, Scale.Identifies );

            return new NodeWrapper( center );
        } finally {
            tx.finish();
        }
    }

    static class NodeWrapper implements Holon {
        Node node;

        public NodeWrapper( Node node ) {
            this.node = node;
        }
        
        public Node getNode() {
            return node;
        }

        public void impress( Map<String, Object> map ) {}
    }
}
