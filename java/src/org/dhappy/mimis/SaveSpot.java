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
    MutableHolon root;

    public enum SaveType implements RelationshipType {
        SOCIAL, DOCSYSTEM, DOCUMENT
    }

    public SaveSpot( MutableHolon root ) {
        this.root = root;
    }

    public SAXPipelineComponent getSAXPipeline() {
        return this;
    }

    public void startDocument() throws SAXException {
        super.startDocument();

        if( location == null ) {
            // Timestamps should have all fields offset from 0
            //DateFormat format = new SimpleDateFormat( "%y/%M/%d@%H:(%m - 1):(%s - 1).%S" );
            DateFormat format = new SimpleDateFormat( "yyyy/MM/dd HH:mm:ss.SSS" );
            location = format.format( new Date() );
        }
        root.grow( location, SaveType.DOCSYSTEM );
        log.debug( "Starting Document: " + location );
    }

    public void startElement( final String uri, final String localName, final String qName, Attributes attributes ) throws SAXException {
        super.startElement( uri, localName, qName, attributes );

        root.push( new HashMap<String, Object>() {{
                    put( "name", localName );
                    put( "type", "tag" );
                    put( "namespace", uri );
                }},
            SaveType.DOCUMENT );
    }

    public void endElement( String uri, String localName, String qName ) throws SAXException {
        super.endElement( uri, localName, qName );
    }

    public void endDocument() throws SAXException {
        super.endDocument();
    }

    public void impress( Map<String, Object> config ) {
        if( config.containsKey( "location" ) ) {
            location = config.get( "location" ).toString();
        }
    }

    public void finish() {
        //this.transaction.finish();
    }
}
