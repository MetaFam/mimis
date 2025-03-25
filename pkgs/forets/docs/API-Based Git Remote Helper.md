I'm contemplating what the structure of the Git remote helper to enable the `mimis://` protocol.

My current impulse is to put all the Cypher generation and awareness of Neo4j in the Next.js server, and communicate a high-level description of the process via a HTTP API.