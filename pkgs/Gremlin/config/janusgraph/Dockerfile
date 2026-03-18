FROM janusgraph/janusgraph:latest

USER root
RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*
USER janusgraph