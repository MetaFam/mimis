FROM denoland/deno:latest AS builder

ARG PUBLIC_APPKIT_PROJECT_ID
ENV PUBLIC_APPKIT_PROJECT_ID=${PUBLIC_APPKIT_PROJECT_ID}

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