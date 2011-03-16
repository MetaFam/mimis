package org.dhappy.mimis.cocoon;

import java.io.IOException;
import java.util.Map;
import java.util.Stack;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory; 

import org.xml.sax.helpers.AttributesImpl;
import org.xml.sax.SAXException;

import org.neo4j.kernel.EmbeddedGraphDatabase;
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

import org.apache.cocoon.pipeline.ProcessingException;
import org.apache.cocoon.sax.AbstractSAXGenerator;
import org.apache.cocoon.sax.SAXConsumer;
import org.apache.cocoon.xml.sax.ImmutableAttributesImpl;
import org.xml.sax.SAXException;

import org.apache.commons.logging.LogFactory;

public class GraphWalkGenerator extends AbstractSAXGenerator {
    //implements CacheableProcessingComponent { 
    AttributesImpl emptyAttr = new AttributesImpl();
    static String dbPath = "var/neo4j";
    private final static GraphDatabaseService graphDb = new EmbeddedGraphDatabase(dbPath);
    private final Log logger = LogFactory.getLog(this.getClass());

    public enum TagRelationshipTypes implements RelationshipType {
        CHILD, DOCUMENT
    }

    public GraphWalkGenerator() {
    }

    /*
    public void setup(SourceResolver resolver, Map objectModel, String src, Parameters params)
        throws ProcessingException, SAXException, IOException {
        super.setup(resolver, objectModel, src, params);
    }

    public void recycle() {
        super.recycle();
        graphDb.shutdown();
    }
    */

    public void execute() {
        SAXConsumer consumer = this.getSAXConsumer();
        Node doc;
        Transaction tx = graphDb.beginTx();
        
        try {
            Node root = graphDb.getReferenceNode();
            if( root.hasRelationship(TagRelationshipTypes.DOCUMENT) ) {
                doc = root.getRelationships(TagRelationshipTypes.DOCUMENT).iterator().next().getEndNode();
            } else {
                doc = graphDb.createNode();
                root.createRelationshipTo(doc, TagRelationshipTypes.DOCUMENT);
                Node child = graphDb.createNode();
                Relationship relationship = doc.createRelationshipTo(child, TagRelationshipTypes.CHILD);
            
                doc.setProperty("tag", "example");
                child.setProperty("data", "world");
                relationship.setProperty("owner", "will");
            }
            tx.success();
        } catch(NotFoundException nfe) {
            logger.error("Could not retrieve reference node for " + dbPath);
            throw new IllegalStateException(nfe);
        } finally {
            tx.finish();
        }

        try {
            consumer.startDocument();
            tx = graphDb.beginTx();
            Stack<String> pathToRoot = new Stack<String>();
            try {
                Traverser tree = doc.traverse(Order.DEPTH_FIRST,
                                              StopEvaluator.END_OF_GRAPH, ReturnableEvaluator.ALL,
                                              TagRelationshipTypes.CHILD, Direction.OUTGOING);
                for(Node child : tree) {
                    if(child.hasProperty("tag")) {
                        String tagName = (String)child.getProperty("tag");
                        consumer.startElement("", tagName, tagName, emptyAttr);
                        pathToRoot.push(tagName);
                    } else if(child.hasProperty("data")) {
                        String data = (String)child.getProperty("data");
                        consumer.characters(data.toCharArray(), 0, data.length());
                    }
                }
                tx.success();
                for(String tagName : pathToRoot) {
                    consumer.endElement("", tagName, tagName);
                }
            } finally {
                tx.finish();
            }
            consumer.endDocument();
        } catch( SAXException e ) {
            throw new ProcessingException(e);
        }
    }
}
