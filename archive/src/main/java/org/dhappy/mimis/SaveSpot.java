package org.dhappy.mimis;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory; 

import org.neo4j.graphdb.RelationshipType;
import org.neo4j.graphdb.GraphDatabaseService;
import org.neo4j.graphdb.Node;
import org.neo4j.graphdb.Relationship;
import org.neo4j.graphdb.Traverser;
import org.neo4j.graphdb.Traverser.Order;
import org.neo4j.graphdb.Transaction;
import org.neo4j.graphdb.StopEvaluator;
import org.neo4j.graphdb.ReturnableEvaluator;
import org.neo4j.graphdb.Direction;
import org.neo4j.graphdb.NotFoundException;

import org.xml.sax.SAXException;
import org.xml.sax.Attributes;
import org.apache.cocoon.sax.AbstractSAXTransformer;
import org.apache.cocoon.sax.SAXPipelineComponent;
import org.apache.cocoon.pipeline.component.PipelineComponent;

import java.util.Stack;
import java.util.Map;
import java.util.HashMap;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

import java.util.Date;
import java.text.DateFormat;
import java.text.SimpleDateFormat;

public class SaveSpot extends AbstractSAXTransformer {
    private static final Log log = LogFactory.getLog( SaveSpot.class );

    String location;
    GraphDatabaseService graphDb;
    Transaction transaction;
    Stack<Node> root = new Stack<Node>();

    public enum SaveType implements RelationshipType {
        FILESYSTEM, DOCUMENT
    }

    public SaveSpot( GraphDatabaseService graphDb ) {
        this.graphDb = graphDb;
    }

    public SAXPipelineComponent getSAXPipelineComponent() {
        return this;
    }

    public void startDocument() throws SAXException {
        super.startDocument();
        this.transaction = graphDb.beginTx();

        if( location == null ) {
            //DateFormat format = new SimpleDateFormat( "%y/%M/%d %H:(%m - 1):(%s - 1).%S" );
            DateFormat format = new SimpleDateFormat( "yyyy/MM/dd HH:mm:ss.SSS" );
            location = format.format( new Date() );
        }
        log.debug( "Starting Document: " + location );
        Stack<String> path = Mimis.getPathDecomposition( location );

        root.push( graphDb.getReferenceNode() );
        
        int i = 0;
        for( String element : path ) {
            final String name = element;
            final String type = ++i % 2 == 0 ? "separator" : "identifier";
            push( new HashMap<String, Object>() {{
                        put( "name", name );
                        put( "type", type );
                    }},
                SaveType.FILESYSTEM );
        }
    }

    public Node push( HashMap<String, Object> state, SaveType type ) {
        Node nextElement = graphDb.createNode();
        for( Map.Entry<String, Object> e : state.entrySet() ) {
            nextElement.setProperty( e.getKey(), e.getValue() );
        }
        root.peek().createRelationshipTo( nextElement, type );
        root.push( nextElement );
        return nextElement;
    }

    public Node pop() {
        return root.pop();
    }

    public void startElement( final String uri, final String localName, final String qName, Attributes attributes ) throws SAXException {
        super.startElement( uri, localName, qName, attributes );

        push( new HashMap<String, Object>() {{
                    put( "name", localName );
                    put( "type", "tag" );
                    put( "namespace", uri );
                }},
            SaveType.DOCUMENT );
    }

    public void endElement( String uri, String localName, String qName ) throws SAXException {
        super.endElement( uri, localName, qName );
        pop();
    }

    public void endDocument() throws SAXException {
        super.endDocument();
        this.transaction.success();

        Traverser traverser = graphDb.getReferenceNode().traverse
            ( Traverser.Order.DEPTH_FIRST,
              StopEvaluator.END_OF_GRAPH,
              ReturnableEvaluator.ALL_BUT_START_NODE,
              SaveType.FILESYSTEM,
              Direction.OUTGOING );
        for( Node node : traverser ) {
            log.info( node.getProperty( "name" ) );
        }
    }

    public void setProperty( String name, Object value ) {
        if( "location".equals( name ) ) {
            location = value.toString();
        }
    }

    public void finish() {
        this.transaction.finish();
    }
}
