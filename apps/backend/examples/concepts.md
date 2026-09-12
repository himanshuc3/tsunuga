## Low level design concepts (FITYMIP)

1. High level understanding
2. HTTP protocol
3. Routing
4. Serialization & deserialization
5. Auth
6. Validation and transformation
7. Middlewares
8. Request content
9. Handlers or controllers
10. CRUD deep-dive
11. REST best practices
12. Databases
13. Business logic layer (BLL)
14. Caching
15. Transactional emails
16. Task queuing and scheduling
17. Elasticsearch
18. Error handling
19. Config management
20. Logging, monitoring and observability
21. Graceful shutdown
22. Security
23. Scaling and performance
24. Concurency and parallelism
25. Object storage and large files
26. Realtime backend systems
27. Testing and code quality
28. 12 factor app principles
29. OpenAPI standard
30. Webhooks
31. DevOps for backend engineers

### High level overview

- Client makes a request -> DNS server (for IP mapping) -> AWS [if not blocked by the firewall which also includes exposed ports] -> [optional] reverse proxy like nginx (redirecting/central router) -> Sahi salamat server tak aa gyi
- Why not to have Bizness logic in frontend?

1. Security (file system access, env configs)
2. CORS
3. Database access
4. Computing power would be limited by the client

- Learning from 1st principles [Spoiler alert, all of them point to the same idea - speed]:

1. Seeing the big picture because you can see the patterns and cutting/avoiding the noise
2. Faster onboarding
3. Faster in new products/projects
4. Syntax fatigue
5. Choosing the right tool for the right job [basically making the right choices]
6. More employable [because can yap more]

### Understanding HTTP (for the millionth time)

- Features:

1. Stateless
2. client-server model

- TCP is used for establishing connection.
- In backend engineering we usually operate on application layer in OSI Model whereas rest of the layers are operated on by network engineers.

- HTTP/1.1 establishes a single persistent TCP connection to make multiple http requests.

- Request/Response messages:

1. HTTP verb/version/url.
2. Headers (Used for extensibility & acts as a remote Control) - User-agent, auth, cookie, accept, [General headers] Date, cache-control, connection,
   [Representation headers] Content-type, content-length, content-encoding, ETag, [Security Headers] Strict-Transport-Security (HSTS), CSP, X-Frame-Options, X-Content-Type-Options, Set-Cookie
3. Body

- Idempotent vs Non-idempotent:

1. Idempotent - GET, PUT, DELETE (multiple actions lead to the same result - seekhte nahi from past)
2. Non-idempotent - PATCH, POST
3. OPTIONS - Rarely used in pre-flight request to prevent CORS policy (browsers check for this header to prevent cross-domain requests)

- [Made w/ OPTIONS verb] Preflighted request is done by the browser(?) to ensure a request has to be done before the actual one to enquire on capabilities. It has to satisfy one of these conditions (not a simple request):

1. The method is not GET, POST or HEAD
2. The request includes non-smple headers (like authorization, x-custom-header)
3. The request has content-type other than application/x-www-form-urlencoded, multipart/form-data, text/plain.

- Even a different port is considered a cross-origin request?

- Response status code standards needs to be followed which are language agnostic:

1. 1xx information
2. 2xx success
   - 200 successful
   - 201 created
   - 204 successful but no content (like delete, options)
3. 3xx redirection
   - 301 requested resoure moved permanently to a new route
   - 302 temporarily redirected
   - 304 not modified
4. 4xx client error
   - 400 Bad request for invalid data
   - 401 Bad auth
   - 403 Forbidden/no authorization
   - 404 Not found
   - 405 Method/verb not allowed
   - 409 Conflict
   - 429 too many requests
5. 5xx server error
   - 500 Runtime error in server
   - 501 Currently not supported but needed in the future
   - 502 Handled by proxies and load balancers
   - 504 gateway timeout from nginx if it doesn't recieve a response from the server

- HTTP Caching [based on headers]:
  - Using headers like Cache-Control, ETag, Last Modified
  - Request headers use If-None-Match & If-Modified-Since

- Content negotiation [based on headers] (to settle on data type to be exchanged):
  - Accept
  - Accept-encoding
  - Compression like gzip for responses

- Persistent connections & keep-alive

- Handling large requests and responses
  - multipart request: header along w/ delimiter
  - response: content-type w/ text/event-stream

- SSL, HTTPS & TLS

### Routing

- Traffic controller analogy. Bug is "bas wohi button nhi dabana tha"
- path params vs query params
- route versioning: Useful for incremental migration for breaking changes
- Catch all handler

### Serialization/Deserialization

- Transforming data into a common format across different protocols of communication like HTTP, WS etc.
- Databases:
  - Postgresql, mysql, sqlite
  - Mangodb, dynamodb
- Standards: JSON, XML, YAML, Protobuf (binary)

### Authentication / Authorization

- Who are you & what can you do?
- Explicit auth -> crypto
- Hashing to store passwords
- Assymetric crypto using diffie helmann
- Multi-factor authentication
  - you know
  - you have
  - you are
- OAuth 2.0
- JWT
- Zero trust
- Passwordless

- Decentralized identity
- Behaviorial biometric
- Postquantum crypto

- Sessions, JWT, Cookies
- For stateful communication, creating sessions:
  - Create persistent sessionID (in DB or in-memory like Redis)
  - Store it in cookies and validate with persistence storage

  - Using JWT, to solve problems with memory overhead and synchronization challenges
  - Stateless, self-contained tokens

- Types of auth:
  - Stateless
  - Stateful
  - API Key - useful in machine to machine comms
  - OAuth Provider
    - To provide delegation to prevent security risk with same passwords, fatigue
    - Tokens similar to JWT for authn+authz
    - Resource owner, auth server, client, resource server
    - OAuth2.0 came w/ different flows based on platform like browser, server, mobile
    - OAuth2.0 solved for authz, not authn - solved by OIDC
    - RBAC for authz
    - Error messages should be generic for auth to prevent insights and attacks
    - Timing attacks as a vector of attack to target on username/password.

### Validations and transformations

- Repository: deals w/ db/persistent connections
- Service: deals w/ bizness logic
- Controller: request and response message handling [interfacing with outer world]
- Flow: Controller -> Service -> repository
- Data sent as per API Contract -> Transformation/validation/normalization -> Controller -> Normalization -> Adhere to API Contract

### Controllers, Services, repositories, request context

- Router hands off the request to handlers/controllers based on resource URLs.
- Steps followed in handler:
  1. Deserialization/binding of request: Converting to native format of the language, in case of golang it is struct
  2. Validation of the request message
  3. Controller calls (http related) -> service layer (synchronous non-side/effect function): service layer only processes data that
     has already been validated

- Repository is reponsible to creating and executing db queries. It is the database bridge.
- Middlewares are transformers placed anywhere between the request and response lifecycle. Useful for adding global accessories like logging, auth, error handling, security (cors, headers,rate limit), compression, output transformer like server for frontend etc. to serve the client contract.

### REST APIs

- Representational (format like json, xml), State, Transfer (client-server model)
- API: protocol://api.example.com[subdomain]/v1[version]/books[noun w/ plurality]/harry_potter[slug - human readable property]
- Idempotency: Result of 10 requests -> same as calling it once [dheet hai]: GET, PUT & DELETE satisfy the constraints
- POST API is used to also be used for performing custom actions like /send-email call.
- Resources: nouns, mostly.
- Pagination: limit, page, sortBy, sortOrder, fieldName=fieldValue & heavy delays on offset queries
- With custom actions using the post verb, we still have to mention the custom-action asthe last parameter of the request.
- Signoff w/ client:
  - Interactive documentation
  - Make it boring
  - Make is easy by adding defaults

### DAtabase

- Features:
  - Organization, Access via CRUD, Integrity, security
- Relational vs non-relational
  - Non-relational - aren't they just a parallel move from TXT w/ concurrency?
  - Relational - predefined schema, data integrity
- NOTE: Should I move my articles to CMS and fetch data from there in my blog??? Improves frequency of adding articles?
- Migrations:
  - Keeping track of changes - blaming
  - Roll back
  - Seeding test/mock data
- Parameterized queries
- Triggers are useful hooks on updates of tables
- SQL database usually prefer vertical scaling compared to noSQL which prefer horizontal scaling.
  - Creating multiple read replica instances is a common operation for handling large number of parallel requests.
  - Replication lag is introduced into replicas from write dbs.

### Caching

- Caching at edge locations because tara-rum-pum tara-rum-pum
- network, hardware and software caches
- Network level cache:
  - CDN: Edge nodes available in each region, has TTL after which it updates resources from the primary server
  - DNS
- Hardware level:
  - L1, L2, L3 cache, Main memory
- Cache eviction policies since limited capacity in main memory: LRY, LFU, TTL
- Uses of redis:
  - Query caching - for read heavy querying
  - Session - in case of cookie based tokens ig
  - external API caching
  - Rate limiting system - "X-forwarded-for" header used from nginx to extract ip and implement ip based rate limiting

### Background tasks

- Anything outside the req/res lifecycle.
- Examples:
  - Image processing
  - Sending emails
  - Pussy notifications
  - Cron jobs
- Exponential backoff followed for retries
- Many to Many Producer-Consumer model (aka pub-sub).
- Some popular message-brokers:
  - RabbitMQ
  - Kafka
  - Redis
- Visibility timeout - The time in which the task is in progress aka being consumed by the consumer. If in this period consumer doesn't respond, retry mechanism kicks in.
- Types of tasks:
  - One-off tasks
  - Recuring tasks
  - Chained tasks
  - Batch tasks
- Design considerations when working with Background tasks:
  - Idempotency
  - Error handling
  - Monitoring
  - Scaling
  - Ordering
  - Rate limiting
- Best practices:
  - keep tasks small and focused (single responsibility)
  - Avoid long running tasks
  - Use proper error handling and logging
  - Monitory queue length and worker health

### Full text search using Elastisearch

- Concept of inverse indexes for lower latency of search, typo tolerance and type-ahead queries.
- Elasticsearch uses apache lucene. BM25 is the algorithm used as internals for creating inverse indexes (parameters like term frequency, document frequency, document length, field boosting help tweak the search).
- Another alternative is KalDB which apparently handles better on scale.

### Error handling and fault tolerance system (LoL)

- Types of errors:
  - Logical errors (not an error, but something that might make you berozgaar)
  - Database errors (same philosophy as above)
    - Question: Does database pooling take each request from server and open a separate connection to the DB?
    - Constraint violation
    - Query errors
