FROM janusgraph/janusgraph:1.2

USER root
RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*
USER janusgraph