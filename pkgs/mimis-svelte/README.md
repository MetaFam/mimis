# Mïmis

Mïmis is a variety of pages all aiming generally toward a collaborative file system stored in IPFS and indexed in Neo4j.

Unfortunately, the vision hasn't quite congealed yet, after, literally almost a decade of contemplation. This iteration is, as of 2025⁄3⁄8, about 4–6 weeks old. The most promising avenue to date is the [merge lists](https://mimis.dhappy.org/#/list) which allow users to create ordered lists of content that can be aggregated to form recommendations of undiscovered media.

## Use

### Local

Unfortuantely, the architecture currently requires API access to a [Kubo IPFS node](https://github.com/ipfs/kubo/). Kubo can be relatively easily installed using [IPFS Desktop](https://docs.ipfs.tech/install/ipfs-desktop/). After it's installed, you can edit the configuration via the GUI or using the CLI tools:

```bash
KEY="API.HTTPHeaders.Access-Control-Allow-Origin"
ipfs config --json $KEY $(
  ipfs config $KEY \
  | jq '. += ["http://localhost:5173"]' \
  | tr -d '[:space:]'
)
```

This uses `jq` to insert the address of the development server into the CORS configuration of IPFS. Once this is done, *(and the IPFS daemon is restarted)* it should be possible to run the development server using:

```bash
pnpm install && pnpm run dev
```

### [`mimis.dhappy.org`](https://mimis.dhappy.org)

Theoretically, this same method would work for a remote web server, but accessing a private network from a public one is governed by [the Private Network Access *(PNA)* specification](https://wicg.github.io/private-network-access/). It dictates that the request should contain a "`Access-Control-Request-Private-Network: true`" header, and the response a `"Access-Control-Allow-Private-Network: true`" header.

It is possible to add the header to the IPFS response headers using:

```bash
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Private-Network '["true"]'
```

However, that header is only included in the response to a `POST` request, not the preflight `OPTIONS` request, which causes the connection to fail.

Perhaps the easiest solution aside from patching Kubo is to use a reverse proxy, and add the appropriate headers as the response is en route.
