package org.dhappy.mimis.http;

import java.io.IOException;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory; 

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class AccessPoint extends HttpServlet {
    private static final Log log = LogFactory.getLog( AccessPoint.class );

    public AccessPoint() {
        log.debug( "Creating Access Point" );
    }

    public void doGet( HttpServletRequest request, HttpServletResponse response )
        throws IOException {
        response.setContentType("text/plain");

        response.getWriter().println( "ContextPath: " + request.getContextPath() );
        response.getWriter().println( "TranslatedPath: " + request.getPathTranslated() );
        response.getWriter().println( "QueryString: " + request.getQueryString() );
        response.getWriter().println( "RequestURL: " + request.getRequestURL() );
        response.getWriter().println( "RequestURI: " + request.getRequestURI() );
        response.getWriter().println( "ServletPath: " + request.getServletPath() );
        response.getWriter().println( "PathInfo: " + request.getPathInfo() );
        response.getWriter().println( "User: " + request.getRemoteUser() );
    }
}
