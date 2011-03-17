package org.dhappy.mimis;

import java.util.Map;
import java.util.Stack;
import java.util.HashMap;

import org.neo4j.graphdb.RelationshipType;
import org.neo4j.graphdb.GraphDatabaseService;
import org.neo4j.graphdb.Node;
import org.neo4j.graphdb.Transaction;

public class MutableHolon implements Holon {
    GraphDatabaseService graphDb;
    Stack<Node> root = new Stack<Node>();
    Transaction tx;
    
    public MutableHolon( GraphDatabaseService graphDb ) {
        this.graphDb = graphDb;
        tx = graphDb.beginTx();
        root.push( graphDb.getReferenceNode() );
    }
    
    public Node getNode() {
        return root.peek();
    }

    public void impress( Map<String, Object> state ) {
    }

    public void grow( String key, RelationshipType type ) {
        grow( Mimis.decomposeKey( key ), type );
    }

    public Node push( Map<String, Object> state, RelationshipType type ) {
        Node nextElement = Mimis.createNode( state );
        root.peek().createRelationshipTo( nextElement, type );
        root.push( nextElement );
        return nextElement;
    }

    public Node pop() {
        return root.pop();
    }

    public void grow( Stack<String> path, RelationshipType type ) {
        int i = 0;
        for( String element : path ) {
            final String name = element;
            final String significance = ++i % 2 == 0 ? "separator" : "identifier";
            push( new HashMap<String, Object>() {{
                        put( "name", name );
                        put( "significance", significance );
                    }},
                type );
        }
    }

    public void commit() {
        if( tx != null ) {
            tx.success();
            tx.finish();
        }
    }

    public void finalize() {
        if( tx != null ) {
            tx.finish();
        }
        tx = null;
    }
}
