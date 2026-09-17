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
  - External service errors
    - Network
    - Connection timeouts
    - DNS failures
    - Network parittions
    - Handling rate limiting using exponential backoff
    - service outage
  - Input validation errors
    - format, range, required field validations
  - Configuration errors
  - Create ping services for verifying health:
    - /health, /status
  - Monitoring & observability:
    - Track error rates, performance metrics etc.
  - Tools like grafana and loki are just simple log aggregation platforms
  - Handling errors gracefully
    - Immediate error response
    - Containment and graceful degradation in case of non-recoverable errors
    - Error recovery strategies
    - Error propagation control
    - Global error handling - final safety net
  - Security implications:
    - Error messages shouldn't leak info that acts as a vector of attack
    - OWASP cheatsheet

### Configuration management

- Settings for the application which controls the behavior based on the environment.
- Some settings change more frequently compared to others: runtime and build time config
- Applications settings:
  - log level, port, connection pool size, timeout values
- Database config:
  - host, port, username, password, name
- External services:
  - email, logging & monitoring, auth
- Feature flags:
  - Can be used synonymously with experiments
- Infrasture config, security, performance tuning

- Storage of config:
  - .env
  - Fetching from AWS vault
  - JSON, yaml
  - Key value stores: redis, consul, etcd
  - Cloud: hashicorp vault, AWS parameter store etc.

### Logging, monitoring and observability

- Real time data about system: Logs, metrics, traces
- Logging, mostly errors, metrics: mostly quanitifying numbers
- Tools like grafana, prometheus helps in visually debugging these errors.
- Logging has:
  - levels: debug (mostly dev only), info (add states like success), warn, error, fatal
  - structured vs unstructured logs
- Monitoring:
  - Adding instrumentation to analyze and monitor metrics
  - Opentelemetry is used as a preferred tool

NOTE: For me the most critical layer, because it makes deliver life easy and shows public statistics to technically challenged product managagers.

### Graceful shutdown

- The backend server has to have good manners so we don't do abrupt shutdown:
  - Process lifecycle management
  - Communication between two processes happens using signals
  - SIGTERM: Terminate, OS asking the process to shut down. The process has a window to complete stuff like complete inflight request processing and clean up resources.
  - SIGINT: Interrupt like ctrl + c -> user initiated shutdown (PM2 used on cloud platforms)
  - SIGKILL: No cleanups possible, our application doesn't detect it and therefore no cleanups
  - Soft kill cleanup (called connection draining): Stop accepting new connections/requests, timeout for completing existing requests, cleanup in the reverse order of setup

### Security

- Think like an attacker: Where did the developer make an assumption (most applications are only happy path tested).
- Injection attacks:
  - Backend Application speaks multiple languages (i.e. interacts in different ways like SQL with DB, html/css/js with browser, shell with OS), where vulnerabilities are present
  - SQL injection attacks
  - Parameterized queries (prevention) - separate query from user data
  - Command injection
    - If server takes an input for filename and executes a cli command -> vulnerability if not sanitized similar to sql
- Authentication:
  - Use auth provider since it saves time and possibly saves you the headache of a lot of complexity
  - Password storage: using hashes which are one way encodings, salting to add some randomness (generated for each user) to prevent rainbow table
  - Rainbow table as the list of hashes for most common passwords
  - Don't use SHA256 but bcrypt, scrpyt (slow hashing functions)
- Sessions:
  - Stored in redis/DB
  - Stored in cookies in frontend which are automatically read/sent by the server
  - httponly -> true to prevent XSS vulnerability, https connection, same-site (to prevent CSRF)
- JWT Tokens:
  - Header (algorithm) + payload (permissions/claims + userId + iat) + signature
  - Revocation is hard: blacklisted token, short expiration with refresh token
- Rate limiting:
  - Unless you want DDoS from a teenager who has written a simple script using LLM, very important.
  - IP based limiting, per account limiting, global rate limiting (seems useful for server but not intuitive or a good user experience)
- Authorization:
  - Broken object level authorization (BOLA): At the DB level logical errors, where authentication/authorization is not done on an ID level when making queries to DB. Further, if we relay the correct error (Forbidden resource), we unintentionally leak information.
  - Indirect object references
  - Broken access control patterns: serial keys are easily guessable
  - Authorization attacks are horizontal are vertical
  - Horizontal: userA gets access to userB
  - Vertical: Getting more of a single user's unauthorized functionality
- XSS:
  - External JS executing in user's browser in a foreign website
  - For example writing a comment which includes script tags with JS, which if not sanitized, could run in other user's browser and potentially parse and steal keys
- CSRF:
  - cookie piggybacking from other websites
  - Not prevelant any more due to headers like same-site
- Misconfig:
  - Storing keys offline if possible
  - Debugging
- Good practices:
  - Centralize logic, default deny, test authorization specifically
  - Security vulnerabilities happen mostly because of data crossing some boundaries and no two entities can be completely in sync (externally like with contracts or internally).

- Resources:
  - portswigger
  - owasp

### Scaling and performance

- Latency is the main metric
  - Average is not a good baseline for knowing the metrics
  - Percentiles are preffered: P99 and P95 are preffered.
- Throughput:
  - Latency can be directly proportional to throughput
  - Counterintuitive relationship b/w utilization and latency (it exponentially increases)
  - Most systems don't work at 100% (maybe 60-70%) and we need to create some buffer
- Identifying Bottleneck:
  - Naive solutions: caching, updating postgres, horizontal scaling
- Profiling gives way to recording metrics
  - More useful for CPU bound tasks but culprits are mostly I/O bound
  - Flamegraphs help with visualizing CPU bound metrics
  - Distributed tracing
- Database:
  - N + 1 query problem: A list of profiles (N) are fetched. We fetched list of all profiles using 1 api, but it doesn't have profile image. So, we make N requests for all profiles.
  - It was mostly present at the server level, not frontend.
  - Lack of indexes: composite indexes (even order matters), covering
  - Explain analyze at the start of the query helps us show if it's a sequential or index scan
  - Cost of connections: connection pooling acts like a precomputation step, so that we don't have to make on-the-fly connections, internal and external pooler (PGBouncer)
  - Caching strategies: memoizing stuff in redis (local storage for server), cache invalidation (time based or event based), local caching vs distributed caching, caching patterns (cache-aside, write through, write behind), cache hit rate (TTL, cache size, DAP)
- Vertical scaling:
  - Code doesn't change, no problem with migrating from single to multi-instance setup
  - Ceilings to power and SPOF
  - No geographic distribution
- Horizontal scaling:
  - Linear scaling method if computing power remains the same
  - Redundancy
  - Geographic distribution
  - Disadvantages: distribution of requests? (load balancer), Synchronization, how do these servers communicate with each other
  - Statelessness enables horizontal scaling. How does blockchain keep everything in sync, despite more nodes added constantly to the chain
  - Load balancer: integral to horizontal scaling for distribution requests to different instances of servers.
