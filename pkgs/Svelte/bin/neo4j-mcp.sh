#!/usr/bin/env bash
declare ROOT="$(dirname $0)"
declare -A KEYS=(
  ['NEO4J_URI']="db-url"
  ['NEO4J_USERNAME']="username"
  ['NEO4J_PASSWORD']="password"
  ['NEO4J_DATABASE']="database"
  ['NEO4J_TRANSPORT']="transport"
  ['NEO4J_MCP_SERVER_PORT']="port"
)
declare -A VALS

for key in ${!KEYS[@]}; do
  declare WHOLE=$(cat "$ROOT/../.env"* | grep "$key" | head -n1)
  [[ -z "$WHOLE" ]] && continue
  declare VAL="${WHOLE#*=}"
  [[ $VAL =~ ^\".*\"$ ]] && VAL="${VAL:1:-1}"
  VALS[$key]="$VAL"
done

PORT=${VALS['NEO4J_MCP_SERVER_PORT']:-7878}
unset VALS['NEO4J_MCP_SERVER_PORT']

declare -a CMD=("docker" "run" "--rm" "-p" "$PORT:$PORT" "mcp/neo4j-cypher:latest" "mcp-neo4j-cypher")
for key in ${!KEYS[@]}; do
  [[ -n "${VALS[$key]}" ]] && CMD+=("--${KEYS[$key]}" "${VALS[$key]}")
done

printf "%q " "${CMD[@]}"
echo

"${CMD[@]}"