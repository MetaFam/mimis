package org.dhappy.mimis;

import org.neo4j.graphdb.Traverser;

public interface Listing extends Traverser, Holon {
    public Holon top();
    public boolean hasNext();
}
