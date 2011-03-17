package org.dhappy.mimis;

import java.util.List;
import java.util.Iterator;
import java.util.Arrays;
import java.util.Queue;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.Collections;
import java.io.File;
import java.io.IOException;
import java.io.FileNotFoundException;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory; 

import org.dhappy.mimis.TraversalListener;

/**
 * @author Will Holcomb <wholcomb@gmail.com>
 * @date February 2008
 * 
 * Iterate over the files in a directory tree.
 */
public class FileList implements Iterable<File>, Iterator<File> {
    private static final Log log = LogFactory.getLog( FileList.class );

    LinkedList<File> directories = new LinkedList<File>();
    LinkedList<File> currentFiles = new LinkedList<File>();

    File root;

    public FileList( File baseDir ) {
        this.root = baseDir;
        directories.add( baseDir );
    }

    boolean followSymlinks = false;

    public boolean setFollowSymlinks( boolean followSymlinks ) {
        this.followSymlinks = followSymlinks;
        return this.followSymlinks;
    }

    public boolean hasNext() {
        return !( directories.isEmpty() && currentFiles.isEmpty() );
    }

    public void remove() {
        throw new UnsupportedOperationException();
    }

    // From: http://stackoverflow.com/questions/813710/java-1-6-determine-symbolic-links
    public static boolean isSymlink( File file ) throws IOException {
        if( file == null ) {
            throw new NullPointerException( "File must not be null" );
        }
        File canon;
        if( file.getParent() == null ) {
            canon = file;
        } else {
            File canonDir = file.getParentFile().getCanonicalFile();
            canon = new File( canonDir, file.getName() );
        }
        return !canon.getCanonicalFile().equals( canon.getAbsoluteFile() );
    }

    public File next() {
        // Send all files first, so make sure the next element isn't a directory
        try {
            while( !currentFiles.isEmpty() && currentFiles.peek().isDirectory() ) {
                File directory = currentFiles.remove();
                log.debug( isSymlink( directory ) );
                directories.add( directory );
            }
        } catch( IOException ioe ) {
        }
        if( currentFiles.isEmpty() ) {
            File directory = directories.remove();
            File[] files = directory.listFiles();
            if( files != null ) {
                currentFiles.addAll( Arrays.asList( files ) );
            }
            return directory;
        } else {
            return currentFiles.remove();
        }
    }

    public Iterator<File> iterator() {
        return this;
    }

    public void traverse( TraversalListener listener ) {
        traverse( root, listener );
    }

    public void traverse( File root,
                          TraversalListener listener ) {
        traverse( root, listener, 1 );
    }

    
    protected void traverse( File root,
                             TraversalListener listener,
                             int depth ) {
        //log.debug( "traverse:root = " + root.getName() );
        if( depth == 1 ) {
            listener.startTraverse( root );
        }
        try {
	    log.debug( root.getCanonicalPath() + ":" + root.isDirectory() + ":" + isSymlink( root ) );
            // Disallow symlink traversal except for root
            if( root.isDirectory()
                && ( !isSymlink( root ) || depth == 1 ) ) {
		log.debug( "root:" + root.listFiles() );
                listener.preVisitDirectory( root );
                File[] files = root.listFiles();
                if( files != null ) {
                    for( File file : files ) {
                        traverse( file, listener, depth + 1 );
                    }
                }
                listener.postVisitDirectory( root );
            } else {
                listener.visitFile( root );
            }
        } catch( IOException ioe ) {
            log.error( ioe );
        }
        if( depth == 1 ) {
            listener.endTraverse( root );
        }
    }

    /**
     * @param args - list of directories to be read
     */
    public static void main( String... args ) throws FileNotFoundException {
        if( args.length == 0 ) {
            log.info( "Recursively list the contents of a directory." );
            System.exit( -1 );
        }
        for( String dirName : args ) {
            File baseDir = new File( dirName );
            FileList files = new FileList( baseDir );
            for( File file : files ) {
                log.info( file.getName() );
            }
        }
    }
}
