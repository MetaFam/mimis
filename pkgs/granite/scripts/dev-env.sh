#!/usr/bin/env bash
# Development environment for Granite: anvil + Kubo (pubsub) + Gremlin
# Server (TinkerGraph), a freshly deployed GraniteRegistry, and a funded
# dev key. Starts only what isn't already running and, on exit, stops
# only what it started. Leaves granite.dev.json behind for --config /
# the printed exports.
set -euo pipefail

cd "$(dirname "$0")/.."

RPC_URL=${GRANITE_RPC_URL:-http://127.0.0.1:8545}
KUBO_URL=${GRANITE_KUBO:-http://127.0.0.1:5001}
GREMLIN_WS=${GRANITE_GREMLIN:-ws://127.0.0.1:8182/gremlin}
GREMLIN_CONTAINER=granite-dev-gremlin
CONFIG=granite.dev.json
LOGS=.dev-env
mkdir -p "$LOGS"

started_pids=()
started_container=''

cleanup() {
  echo
  echo '— shutting down what dev-env started…'
  for pid in "${started_pids[@]:-}"; do
    [ -n "$pid" ] && kill "$pid" 2>/dev/null || true
  done
  if [ -n "$started_container" ]; then
    docker stop "$GREMLIN_CONTAINER" >/dev/null 2>&1 || true
  fi
  echo '— done'
}
trap cleanup EXIT INT TERM

rpc_up() {
  curl -sf --max-time 2 -X POST -H 'content-type: application/json' \
    -d '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' \
    "$RPC_URL" >/dev/null 2>&1
}

kubo_up() {
  curl -sf --max-time 2 -X POST "$KUBO_URL/api/v0/version" >/dev/null 2>&1
}

gremlin_up() {
  # Gremlin Server speaks only websocket, so probe the TCP port rather
  # than HTTP (a plain request would hang awaiting a response).
  (exec 3<>/dev/tcp/127.0.0.1/8182) 2>/dev/null && exec 3>&- 3<&-
}

wait_for() {
  local what=$1 check=$2 tries=${3:-60}
  for _ in $(seq "$tries"); do
    if "$check"; then
      echo "  ✓ $what ready"
      return 0
    fi
    sleep 1
  done
  echo "  ✗ $what did not come up" >&2
  exit 1
}

echo '— anvil'
if rpc_up; then
  echo '  ✓ already running'
else
  anvil --silent > "$LOGS/anvil.log" 2>&1 &
  started_pids+=($!)
  wait_for anvil rpc_up
fi

echo '— kubo (pubsub enabled)'
if kubo_up; then
  echo '  ✓ already running (ensure pubsub is enabled for `granite follow`)'
else
  ipfs daemon --enable-pubsub-experiment > "$LOGS/ipfs.log" 2>&1 &
  started_pids+=($!)
  wait_for kubo kubo_up 120
fi

echo '— gremlin server (TinkerGraph)'
if gremlin_up; then
  echo '  ✓ already running'
else
  docker run -d --rm --name "$GREMLIN_CONTAINER" -p 8182:8182 \
    tinkerpop/gremlin-server:3.8 > /dev/null
  started_container=yes
  wait_for 'gremlin server' gremlin_up
fi

echo '— deploying GraniteRegistry'
REGISTRY=$(GRANITE_RPC_URL="$RPC_URL" pnpm run --silent deploy:registry | tail -1)
echo "  ✓ registry at $REGISTRY"

echo '— generating & funding a dev key'
KEYJSON=$(node src/cli.ts keys generate --json 2>/dev/null)
KEY=$(printf '%s' "$KEYJSON" | sed -E 's/.*"key":"([^"]*)".*/\1/')
ADDRESS=$(printf '%s' "$KEYJSON" | sed -E 's/.*"address":"([^"]*)".*/\1/')
curl -sf -X POST -H 'content-type: application/json' \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"anvil_setBalance\",\"params\":[\"$ADDRESS\",\"0x8AC7230489E80000\"]}" \
  "$RPC_URL" > /dev/null
echo "  ✓ $ADDRESS funded with 10 ETH"

cat > "$CONFIG" <<EOF
{
  "kubo": "$KUBO_URL",
  "gremlin": "$GREMLIN_WS",
  "chain": {
    "rpcUrl": "$RPC_URL",
    "registry": "$REGISTRY"
  },
  "maxMountDepth": 8
}
EOF
echo "— wrote $CONFIG"

cat <<EOF

Ready. In another shell:

  export GRANITE_RPC_URL=$RPC_URL
  export GRANITE_REGISTRY=$REGISTRY
  export GRANITE_KUBO=$KUBO_URL
  export GRANITE_GREMLIN=$GREMLIN_WS
  export GRANITE_KEY=$KEY

  granite publish tree.json --config $CONFIG
  pnpm run test:integration

Ctrl-C here tears down whatever dev-env started.
EOF

if [ "${#started_pids[@]}" -eq 0 ] && [ -z "$started_container" ]; then
  # Everything was already running — nothing to babysit, but stay
  # resident so the workflow is the same either way.
  sleep infinity
else
  wait
fi
