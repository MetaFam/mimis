#!/bin/bash

USERNAME="${PUBLIC_NEO4J_USER:-neo4j}"
PASSWORD="${PUBLIC_NEO4J_PASS:-Password from within Docker.}"
echo "SETUP: Adding read-only user & establishing triggers: $USERNAME / $PASSWORD"

cypher-shell \
  --username "$USERNAME" \
  --password "$PASSWORD" \
  --file initialize.cypher
