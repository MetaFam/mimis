FROM denoland/deno:latest AS builder
# FROM node:lts AS builder

ARG PUBLIC_APPKIT_PROJECT_ID
ENV PUBLIC_APPKIT_PROJECT_ID=${PUBLIC_APPKIT_PROJECT_ID}
ENV PUBLIC_NEO4J_USER=neo4j
ENV PUBLIC_NEO4J_PASS="Password from within Docker."
ENV PUBLIC_NEO4J_URI="neo4j://neo4j"
ENV PUBLIC_IPFS_PATTERN="https://w3s.link/ipfs/{cid}{path}"
ENV PUBLIC_IPFS_API="http://localhost:5001/api/v0/"

WORKDIR /app

COPY *.json *.ts *.js ./
COPY src src
COPY static static
COPY config config

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt update
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt install -y python3 make g++ npm

# RUN npm install --global npm:node-gyp
RUN --mount=type=cache,target=node_modules/,sharing=locked \
    # npm install
    deno install --allow-scripts
RUN --mount=type=cache,target=node_modules/,sharing=locked \
    # npm run build
    deno task build

FROM denoland/deno:latest AS production
# FROM node:lts AS production

WORKDIR /app

COPY --from=builder /app/build/ ./

EXPOSE 3000

# CMD ["node", "--env-file=.env", "build"]
CMD ["deno", "--allow-env", "--allow-read", "--allow-net", "build/index.js"]