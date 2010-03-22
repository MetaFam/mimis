package org.dhappy.mimis;

/**
 * From: http://www.igniterealtime.org/community/message/148543#148543
 */
import java.io.IOException;
import java.util.Collection;
import org.jivesoftware.smack.ConnectionConfiguration;
import org.jivesoftware.smack.Roster;
import org.jivesoftware.smack.RosterEntry;
import org.jivesoftware.smack.PacketListener;
import org.jivesoftware.smack.RosterListener;
import org.jivesoftware.smack.XMPPConnection;
import org.jivesoftware.smack.XMPPException;
import org.jivesoftware.smack.SASLAuthentication;
import org.jivesoftware.smack.filter.MessageTypeFilter;
import org.jivesoftware.smack.filter.PacketFilter;
import org.jivesoftware.smack.packet.Message;
import org.jivesoftware.smack.packet.Packet;
import org.jivesoftware.smack.packet.Presence;
import org.jivesoftware.smack.util.StringUtils;

public class SmackGMailConnection {
    private static String username = "mimis.test";
    private static String password = "mimistest";
    
    public static class MessageParrot implements PacketListener {
        private XMPPConnection connection;
        
        public MessageParrot( XMPPConnection connection ) {
            this.connection = connection;
        }
        
        public void processPacket( Packet packet ) {
            Message message = (Message)packet;
            if( message.getBody() != null ) {
                StringBuffer out = new StringBuffer();
               
                String cmd = message.getBody().toLowerCase();
                if( cmd.equals( "roster" ) ) {
                    Roster roster = connection.getRoster();
                    Collection<RosterEntry> entries = roster.getEntries();
                    for( RosterEntry entry : entries ) {
                        out.append(entry + "\n");
                    }
                } else {
                    out.append( "Unknown: \"" + cmd + "\"");
                }
                
                Message reply = new Message();
                reply.setTo( message.getFrom() );
                reply.setBody( out.toString() );
                connection.sendPacket( reply );
            }
        }
    };

    public static class Greeter implements RosterListener {
        private XMPPConnection connection;

        public Greeter( XMPPConnection connection ) {
            this.connection = connection;
        }
        
        public void entriesAdded( Collection<String> addresses ) {}
        public void entriesDeleted( Collection<String> addresses ) {}
        public void entriesUpdated( Collection<String> addresses ) {}

        public void presenceChanged( Presence presence ) {
            System.out.println("Got presence: " + presence.getType() );
            
            if( presence.getType() == Presence.Type.subscribe ) {
                Presence reply = new Presence( Presence.Type.subscribed );
                reply.setTo( presence.getFrom() );
                connection.sendPacket( reply );
            }
        }
    };
        
    public static void main( String[] args ) {
        
        System.out.println("Starting IM client");
        
        // gtalk requires this or your messages bounce back as errors
        ConnectionConfiguration connConfig = new ConnectionConfiguration( "talk.google.com", 5222, "gmail.com" );
        XMPPConnection connection = new XMPPConnection( connConfig );
        
        try {
            connection.connect();
            System.out.println( "Connected to " + connection.getHost() );
        } catch ( XMPPException ex ) {
            ex.printStackTrace();
            System.out.println( "Failed to connect to " + connection.getHost() );
            System.exit( 1 );
        }
        try {
            SASLAuthentication.supportSASLMechanism( "PLAIN", 0 );
            
            connection.login( username + "@gmail.com", password );
            System.out.println( "Logged in as " + connection.getUser() );
            
            Presence presence = new Presence( Presence.Type.available );
            connection.sendPacket( presence );
        } catch (XMPPException ex) {
            ex.printStackTrace();
            // XMPPConnection only remember the username if login is succesful
            // so we can''t use connection.getUser() unless we log in correctly
            System.out.println( "Failed to log in as " + username );
            System.exit( 1 );
        }
        
        PacketFilter filter = new MessageTypeFilter( Message.Type.chat );
        connection.addPacketListener( new MessageParrot( connection ), filter );

        Roster roster = connection.getRoster();
        roster.setSubscriptionMode( Roster.SubscriptionMode.manual );
        roster.addRosterListener( new Greeter( connection ) );
        
        if( args.length > 0 ) {
            // google bounces back the default message types, you must use chat
            Message msg = new Message( args[0], Message.Type.chat );
            msg.setBody( "Test" );
            connection.sendPacket( msg );
        }
        
        System.out.println( "Press enter to disconnect\n" );
        
        try {
            System.in.read();
        } catch ( IOException ex ) {
            //ex.printStackTrace();
        }
        
        connection.disconnect();
    }
}
