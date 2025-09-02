FROM denoland/deno:latest AS builder

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
RUN find
RUN apt update
RUN apt install -y python3 make g++
RUN deno install --global npm:node-gyp
RUN deno install --allow-scripts
RUN deno task build

FROM nginx:alpine
COPY --from=builder /app/build/ /usr/share/nginx/html
COPY --from=builder /app/config/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]