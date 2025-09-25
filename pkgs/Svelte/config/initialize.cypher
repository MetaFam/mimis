CREATE USER readonly SET PASSWORD 'readonly' CHANGE NOT REQUIRED;
CREATE ROLE reader;
GRANT TRAVERSE ON GRAPH * TO reader;
GRANT READ { * } ON GRAPH * TO reader;
GRANT MATCH { * } ON GRAPH * TO reader;
GRANT ROLE reader TO readonly;


WITH '
  CALL apoc.convert.toJson($transaction) YIELD value AS json
  WITH json, apoc.env("NEO4J_DIFF_WEBHOOK", "https://localhost:64209/diff") AS webhookURL
  CALL apoc.load.jsonParams(
    webhookURL,
    { method: "POST", payload: json },
    null
  ) YIELD value AS response
  RETURN response
' AS statement
USE system CALL apoc.trigger.install(
  'neo4j', 'webhook_all_changes', statement, { phase: "after" }
)