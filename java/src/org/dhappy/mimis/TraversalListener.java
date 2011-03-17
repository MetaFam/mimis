package org.dhappy.mimis;

import java.io.File;

public interface TraversalListener {
    public void preVisitDirectory( File dir );
    public void postVisitDirectory( File dir );
    public void visitFile( File file );
    public void startTraverse( File root );
    public void endTraverse( File root );
}
