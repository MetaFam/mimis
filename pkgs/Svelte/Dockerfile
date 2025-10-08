FROM denoland/deno:latest AS builder
# FROM node:lts AS builder

ARG PUBLIC_APPKIT_PROJECT_ID
ENV PUBLIC_APPKIT_PROJECT_ID=${PUBLIC_APPKIT_PROJECT_ID}
ENV PUBLIC_NEO4J_USER=neo4j
ENV PUBLIC_NEO4J_PASS="Password from within Docker."
ENV PUBLIC_NEO4J_URI="neo4j://localhost"
ENV PUBLIC_IPFS_PATTERN="https://{cid}.ipfs.w3s.link{path}?format=raw"
ENV PUBLIC_IPFS_API="http://localhost:5001/api/v0/"

WORKDIR /app

COPY *.json *.ts *.js ./
COPY src src
COPY static static
COPY config config

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt update \
    && apt install -y --no-install-recommends --no-install-suggests \
    python3 make g++ curl dnsutils ca-certificates

RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
RUN bash -c "source /root/.bashrc && nvm install node"

RUN deno install --global npm:node-gyp

# RUN --mount=type=cache,target=node_modules/,sharing=locked \
RUN \
    # npm install
    deno install --allow-scripts
    # deno install
# RUN --mount=type=cache,target=node_modules/,sharing=locked \
RUN \
    # npm run build
    deno task build

# FROM denoland/deno:latest AS production
# FROM node:lts AS production

WORKDIR /app

#COPY --from=builder /app/build/ ./

EXPOSE 3000

# CMD ["node", "--env-file=.env", "build"]
CMD [ \
      "deno", \
      "--allow-env", \
      "--allow-read", \
      "--allow-net", \
      "--allow-sys", \
      "--allow-run", \
      "build/index.js" \
    ]