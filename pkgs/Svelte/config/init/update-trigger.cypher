CALL apoc.trigger.install(
  'neo4j', 'webhook_all_changes', '
    WITH apoc.convert.toJson({
          createdNodes: $createdNodes,
          createdRelationships: $createdRelationships,
          deletedNodes: $deletedNodes,
          deletedRelationships: $deletedRelationships,
          metadata: $metaData
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