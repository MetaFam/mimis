ALTER DATABASE neo4j SET DEFAULT LANGUAGE CYPHER 25;
ALTER DATABASE system SET DEFAULT LANGUAGE CYPHER 25;


// Not supported in the community edition
//
// CREATE USER readonly IF NOT EXISTS SET PASSWORD 'readonly' CHANGE NOT REQUIRED;
// CREATE ROLE reader IF NOT EXISTS;
// GRANT TRAVERSE ON GRAPH * TO reader;
// GRANT READ { * } ON GRAPH * TO reader;
// GRANT MATCH { * } ON GRAPH * TO reader;
// GRANT ROLE reader TO readonly;


CALL apoc.trigger.install(
  'neo4j', 'webhook_all_changes', '
    WITH apoc.convert.toJson({
          createdNodes: $createdNodes,
          createdRelationships: $createdRelationships,
          deletedNodes: $deletedNodes,
          deletedRelationships: $deletedRelationships
        }) AS json,
        "http://mimis:3000/diff" AS webhookURL
    CALL apoc.load.jsonParams(
      webhookURL,
      { method: "POST" },
      json
    ) YIELD value AS response
    RETURN response
  ', { phase: "afterAsync" }
) YIELD name
RETURN name