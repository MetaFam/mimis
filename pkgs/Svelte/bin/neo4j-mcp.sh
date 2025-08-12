#!/usr/bin/env bash
declare ROOT="$(dirname $0)"
declare -a KEYS=(
  'NEO4J_URI'
  'NEO4J_USERNAME'
  'NEO4J_PASSWORD'
  'NEO4J_DATABASE'
  'NEO4J_TRANSPORT'
  'NEO4J_MCP_SERVER_HOST'
  'NEO4J_MCP_SERVER_PORT'
  'NEO4J_MCP_SERVER_PATH'
)
declare -A VALS

for key in ${KEYS[*]}; do
  declare WHOLE=$(cat "$ROOT/../.env"* | grep "$key" | head -n1)
  [[ -z "$WHOLE" ]] && continue
  declare VAL="${WHOLE#*=}"
  [[ $VAL =~ ^\".*\"$ ]] && VAL="${VAL:1:-1}"
  VALS[$key]="$VAL"
done

PORT=${VALS['NEO4J_MCP_SERVER_PORT']:-7878}

declare -a CMD=("docker" "run" "--rm" "-p" "$PORT:$PORT")
for key in ${KEYS[*]}; do
  [[ -n "${VALS[$key]}" ]] && CMD+=("-e" "${key}=${VALS[$key]}")
done
CMD+=("mcp/neo4j-cypher:latest")
printf '%q ' "${CMD[@]}"
"${CMD[@]}"