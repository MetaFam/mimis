package org.dhappy.mimis;

import java.util.Map;
import org.neo4j.graphdb.Node;

public interface Holon {
    public Node getNode();
    public void impress( Map<String, Object> state );
}
