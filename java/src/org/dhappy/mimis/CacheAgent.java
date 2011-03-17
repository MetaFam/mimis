import org.jivesoftware.smack.XMPPConnection;
import org.jivesoftware.smack.MessageListener;
import org.jivesoftware.smack.packet.Message;
import org.jivesoftware.smack.Chat;
import org.jivesoftware.smack.XMPPException;
import org.jivesoftware.smack.ConnectionConfiguration;

public class CacheAgent {

    public static void main( String[] args ) throws XMPPException {
        ConnectionConfiguration config = new ConnectionConfiguration( "talk.google.com", 5222, "gmail.com" );
        XMPPConnection connection = new XMPPConnection(config);
        connection.connect();
        connection.login( "wholcomb", "echodog" );
        Chat chat = connection.getChatManager().createChat( "will@dhappy.org", new MessageListener() {
                public void processMessage(Chat chat, Message message) {
                    System.out.println("Received message: " + message);
                }
            });
        chat.sendMessage("Howdy!");
    }
}
