**NOTE: no matter the mount of best practices followed by the team, you will always have the leverage on the company, if the technology is as cryptic, archaic, in-house and complex as possible.**

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
  - Load balancer: integral to horizontal scaling for distribution requests to different instances of servers. Algorithms like Round robin, weighted round robin based on instance resources, least connections (checks active HTTP connections to each instance) etc. Keeps sending extraneous status check requests to each server at some interval.
- Database scaling:
  - Read replicas: Geographically distributed replicas, to prevent stale data from write queries due to replication lag, we can temporarily get data from primary instance.
  - Sharding, horizontally slicing the tables (concurrency)
  - Distributed databases: planetscale, neon, cockroachDB
- CDN:
  - Geographically distributed caching instances like static files to reduce network latency.
  - Cloud providers used to have features and prevent downtime.
- Edge computing:
  - CDN nodes are type of edge nodes
  - Edge nodes are used for confirming authentication so that main servers isn't bombarbed with unauthenticated requests
- Asynchronous processing
  - BullMQ, which uses redis in the background
  - Background processing with near-instant request/response messaging
- Microservice vs monolith:
  - Microservice is about scaling team's performance
  - Monolight has deployment dependency. Feature flags galore solves these problems for singular modules but it can become complex.
  - Monolith has problems with scaling, tech stack binding
  - Microservice has problems with networking, debugging, data consistency etc.
- Serverless computing:
  - With servers we need decisions on capacity planning (over or under planning costs money or the service itself - auto-scaling).
  - Scaling instances:
    - Boot time
    - Configure our application to load balancer
    - limits: min-max in terms of resources or instances
    - How reactive are we to determining heavy load
  - Serverless: one layer above cloud ig, decoupling hardware from software.
  - ON demand model: If a request comes, a function is spun up. Similar to postpaid model ig. Only pay for processing
  - Cold start time is a bottleneck? A solution might be like a pre-flight request maybe to start before hand.
- Key takeaways:
  - Identify the problem we're solving. Measuring, logging and metrics is at the heart of it.
  - Simple solution instead of over-engineering
  - Specifity: Scale for the problems you have
  - How to debug problems: measure, measure and measure

### Concurrency vs parallelism

- IO vs CPU bound
- Most backend applications are I/O bound
- Some CPU bound tasks (harder problems): Image processing, encryption
- Threads: CPU scheduler picks up tasks and according to different algorithms (like pre-emptive round robin) to schedule next task on that thread, so that tasks do not starve.
  - A single core can have multiple threads. Once a thread gets an I/O bound task, it is blocked and another thread can run on that core.
  - Threads can share memory (heap) within a process
  - Overhead: memory, context switch
- Event loop
- Race conditions: Overlapping operations
  - Locks, mutexes

### Object storage

- Why should traditional databases like PostgreSQL handle it?
- Problems of storing it on the server instance: dumb, ephemeral, horizontal scaling, a disk has a fixed size, solved on one instance (synchronization), availability and durability, downloads, no transaction
- Block storage -> file system (posix standards) -> object storage (how to provide the minimum interface) [GET, PUT, DELETE]
  - Object storage called so because it doesn't have a rich set of features vailable for files
  - It doesn't have nested structure, it's available for convenience: no object modification, no heirarchy, any server can serve any request, capacity you never provision, anything that speaks to http can read it
  - An object consists of key, value, metadata, user metadata and stored inside a bucket
  - Object storage split in: metadata plane and data plane
  - eventual consistent vs strongly consistent::metadata plane vs data plane
  - Magic incoming: to solve storage replication problem across multiple servers, we divide the original data across n shards and using reed-solomon algorithm (create some extra shards). Now, any 1 of the shard is enough to reconstrunct the whole data.
  - S3 durability: eleven 9's.
  - versioning to access older data
  - metadata plane: bucket + ke -> shard locations
  - Conditional writes: Put request can now be sent with "If-None-Match", create this object only if the key does not exist (412 - precondition failure)
    - If-match on etag
    - Because of conditional writes, we have a synchronization primitives
- Uploads:
  - For small files, client->server->bucket is fine
  - For larger files, above pattern can work with streaming of files
  - Problem: idletimeouts with load balancer of 60s, nginx has body size limits
  - Pre-signed urls: a url valid for a limited amount of time (5 minutes)
    - the signed url is fetched from the server
    - A policy document can enforce stuff like content length, content-type etc.
    - Since we're bypassing, to directly upload to S3, how does server knows?
    - The actual id of the uploaded object returned by the s3 server which is given to the server which verified S3 for headobject as per policy document
  - Uploading files larger than 5GB is not supported by object storage:
    - Uploading the complete fail because of hard limit, all of nothing, througput, user experience
    - Mutipart upload solves this: converting a file into multiple chunks, sends them into parallel http calls, stores them into multiple files in the bucket, maximum of 10k chunks
    - Etags are hashes for specific chunks
    - Abort multipartupload
    - Presigned urls + multipartupload
    - Flow: upload/init -> backend -> bucket (createmultipartupload) + database (entry with status pending) + presigned urls for each part?. Browser using presigned urls -> bucket. After completion browser -> backend (with etag ids) -> bucket verification -> status ready in DB
    - presigned urls can be streamed instead of all generated and send in one go
- Downloads:
  - Do not proxy downloads through backend
  - Pattern1: Objectively public content -> make the bucket public or make the CDN hit the private bucket
  - Pattern2: Pre-sign GET, CDN wouldn't be able to cache these since everytime we get a different pre-signed url. (egress for data leaving out from cloud).
    - Instead we can move authorization and pre-signed urls being generated at edge/CDN
  - Range requests: Partial content in video for example, can work with multiple http connections getting partial content of the video for faster downloads
  - Segmented streaming: Helping us stream in resolution based on user's bandwidth
    - standards like HLS, DASH
    - transcode: rewrite the video into another format, for another purpose
    - Transode original file/video into different files (it doesn't happen on the fly, a bummer)
    - Adaptive bitrate
    - Object storage + CDN -> for streaming/serving files
- Pricing model:
  - Object storage in terms of bytes saved
  - operations aka per request: reads are less expensive than writes
  - egress: based on bandwidth (data going out)

- Recap:
  - Object storage exists since file system doesn't scale
  - No mutability
  - 11 9s of durability
  - High entropy strings as prefix for easier fetching/querying

### Real-time backends

- The client-server architecture where client always initiates the conversation doesn't necessarily work here (client hi asli mard hai matlab?)
- The naive approach: polling, increases backend load unnecessarily
  - Average delay is 1.5s which is faulty though, should do a median metric
  - Doesn't scale with scale like upwards of 10k users polling the backend
  - Cost of polling increases with users, not with events
- Long polling:
  - Server doesn't send the response, keeps the connection open until it detects a change
  - High server overhead and network traffic due to header overheads
- Server sent events:
  - content-type: text/event-stream
  - connection kept open because of keep-alive
  - last-event-id
  - used by llms
  - server speaks first
  - unidirectional
- Websockets:
  - Initialized using http
  - Protocol switching to websocket by sending a response of 101
  - Smaller header overhead
  - ping-pong model as a heartbeat (opcode 9 & 10)
  - a connection isn't just limited to ports (i.e. 65000 is not the uppercap)
  - it is identified by source_address:source_port:destination_address:destination_port
  - each connection causing about 9KB
  - at scale, epoll instead of goroutine/connection
  - Sticky sessions can make a client always stick to one specific instance of server
  - Backend follow pub-sub. Whenever a message is recieved from one socket connection, that is published to event-queue, and consumed by other instances, relaying that to the client.
    - Event queues has fire and forget pub/sub model
    - To relay some information required after a certain message, similar to server-sent events, we record the last message id that we recieved
    - Fan out: problem with one message being relayed to 20k users in realtime

### Testing for BE

- TDD:
  - guidance, documentation, catch regressions
  - To test we need runners, assertion utils etc. automated by the library
  - Unit test, mocks, integration test, e2e tests, testing pyramid
  - An alternative approach: small, medium, large tests (touching across network, db, filesystem, os operations like sleep)
  - flaky tests: touches across multiple boundaries and non-deterministic
  - functional testing: spec written first -> feature
  - security testing
  - functional, regression, perforamnce, security are just adjectives to describe the type of test, but it falls inside unit, integration or e2e only
  - Test doubles: dummy, stub, spy, mock, fake
  - Don't mock what you don't own: Just wrap what you don't own and pass that around
  - DI: instead of utility/function making it's own dependencies (like calling a database connection open), we pass that into the function
  - Shell/core: Core should be easy to test if dependency injection is followed, since it can be mocked
  - Database testing:
    - Transaction rollback with each test to have a deterministic initial state
  - hermetic testing
  - TDD workflow
    - Red, green, refactor
    - Useful the answer is deterministic and known but the approach to get there is not (how)
  - Testing the state of the system, instead of the behavior
  - Flaky test can be dangerous because it can lead to jainuine failed tests to feel flaky and con the system
  - Test coverage:
    - What is not covered in the coverage is more important that what is (obviously everyone sees your problems)
  - Mutation listening
  - Cyclomatic complexity
    - number of paths for the code path
    - should be under 10 for functions accordfing to the research paper
  - Useful tools:
    - linter
    - type checker
    - static analysis

### 12 factor app

- PasS - your code, run for you
- Applied to applications that work as a service:
- Software erosion:
  - in house servers
  - Manual installation process
  - Software eroded without any change to software due to os patch and other external stuff.
- Factor 1: Codebase
  - one codebase tracked in revision control, many deploys
  - versioning wasn't very common probably back then
  - code: shared, config: per deploy
- Dependencies:
  - List all deps explicitly at the root
  - Inception of dep managers?
  - docker is probably at the heart of it currently
- Config:
  - Should live outside the code
  - Environment variables
  - Secret manager service is the optimum service since the credentials can still be leaked if stored in environmnet variables in the deploymnet OS (linux) itself
- Backing service:
  - database, redis, smtp service (emails), s3 (all services talked to by the server)
  - treat them as attached resources
  - back in the day server lives in the same machine where the server is, so servers don't really have a resource url to be attached to
- Separate build and stage pipelines
  - Commits are the primary drivers for deployment
  - build only contains code + dependencies
  - build + config -> release
  - Run the release
  - Because builds are immutable, rolling back doesn't take much time, if the build was same
- Processes:
  - Run applications as separate isolated processes
  - no sticky sessions
- Port binding:
  - Historically, the applications like php, java used to run inside apache, tomcat etc.
- Concurrency:
  - Having different processes based on types like server, video processing/email (worker jobs) etc.
- Disposability:
  - Easy start and stop lifecycle
  - Queue: on shudown, the job can come back in the queue (reentrant)
- Dev/prod parity:
  - Time gap, personnel gap, tools gap
  - ORMs extract SQL queries based on the database. But logical errors could leak through due to certain differences/default functionality in both being different
- Logs:
  - Stream of events sorted by time to stdout
- Admin processes:
  - Run it as one off process.

### OpenAPI & contracts

- Documenting the contracts which stay in sync with code
- Manually creating postman collection also has a delay and can cause runtime failures
- OpenAPI could solve that at compile time to enforce that contract
- Configuration based: openapi.{json, yaml}
- Programs like swagger can generate contract tester, client docs generator
- YAML >>> JSON because yaml allows comments (& who cares about other features)
- File first or code first?
- Contract first works fine because it helps us work on frontend on backend in parallel (given different folks are implementing it)
- design first pipeline: write the config openapi.yaml -> lint -> mock -> client -> server -> docs -> test
- Easier to give openapi specification to agents for better context

### Webhooks

- The notification system, similar to websockets in a way
- The whole premise has been always that the client initiates the connection
- This is busted using webhooks for server to server communication
- Reverse api call
- Google engineers built a similar protocol insipred by kuchu puchu, called pubsubhubbub
- An event can be delivered multiple times
- Implementation specifics:
  - A publish looks like a simple http request
  - A subscribe is a tunnel, has a public, https hostname (ngrok, cloudflare tunnel)
  - Forwards to 8081
  - The webhook: url, json, a secret
  - Push events only
  - Each hook should be separate since headers, payload etc. could be different
  - Initial handshakes are required for security
  - Tunnels help with local development providing temporary https endpoints
  - Proof it came from a provider:
    - token in the url: can be intercepted or logged
    - ip whitelisting
    - mutual TLS
    - a signature from shared secret key, though it looks stupid (most common)
    - a signature using public key
  - HMAC does the hashing, giving fixed length string
    - Verify bytes and then deserialize to prevent corruption after deserialization
    - replay ticket: use timestamps for prevention
    - Never follow redirects in case of webhooks (status code 301,302)
  - Delivery id needs to be maintained as a unique constraint in our DB to prevent parsing and processing the same message
  - Most edge-case problems happen with inconsistency in order of messages aka race conditions
- Svix: webhooks as a service
- To prevent retries due to heavy handling on our handler side, we should do minimum possible work in the handler and then do async handling in the worker
  - Exponential backoff and jitter
  - Retry after
  - one queue per endpoint
- Example: Clerk is a service used for authentication, the users are stored in their DB though and our server could face way more latency hitting their DB compared to ours, so some folks use it for syncing/copying that data to our DB
  - Alternative approach: Background worker fetching from clerk and syncing our data (if data is not urgent), subscribing to log hooks instead and spawning a service worker

### Devops

- How does code become accessible over the internet and keep alive (making samay proud)
- Traditionally there were 2 teams:
  - Developers: want to make more deployments
  - Infra team: want to create least amount of deployment
- Some good practices started appearing:
  - Infrastructure from code, instead of scratch everytime
  - One command to build; one command to deploy
  - Feature flags to prevent deploying code unnecesarily
  - Logs, alerts, metrics shared with the developers
  - Small, cheap, boring
- DORA: surveyed tens of thousands of teams
  - Speed: merge -> live (2 hours lead time)
  - Deployment frequency
  - Stability: deloys that broke (change failure rate)
  - Failed deployment recovery
- Speed and stability doesn't have to tradeoffs
- For webapps, trunk-based branching is fine (feature -> master with feature flags as often as possible). Note that this is a little difficult when trying to overwrite the current feature.
- Most codebases do not have 1:1 parity with ci/cd pipeline and therefore, pushing and verifying fixes can take longer since developers are directly testing on ci/cd failures.
- Example: Github actions, a job (steps that run on one machine), a runner (a fresh machine), a step (an atomic command/action)
- Continuous deployment:
  - For accessing secrets, github used to give repo secrets
  - Now, the cloud (like AWS), gives a job scoped credential for deployment
- For servers, semantic versioning doesn't matter:
  - commit ID is the single source of truth
- Docker enables: Ship the environment with the code called a container
  - Doesn't have a separate kernel
  - Implemented using a mix of namespaces, control groups and layered file system
  - Eight kinds of namespaces. Namespace is what a container can see, essentially, api?
  - Always reusing the linux kernel and simulating everything else that is required. So on mac, it runs on top of linux VM
  - control groups: it's a folder and configuration files like memory limit
  - file system: overlayfs overlaps file system and we see a very thin slab at the top
  - Blob? Collection of unstructured data like text, pdf
    - Identified by sha256 of its bytes
    - the config
    - the manifest
  - Docker identity: hash of the manifest file
  - Why hashes? if two images A and B have the same base layer, that image isn't going to be computed again and again since they have the same hash
    - Order of lines is important to prevent cache invalidation
  - Registry:
    - an http server, two kinds of objects
    - blobs, by digest
    - manifests, by tag or digest
  - Docker run: who calls clone?
    - docker client -> dockerd daemon -> containerd -> runc -> the process
  - Scanner to get the vulnerabilities of base images and prevent security leakages
  - To run it we need to have:
    - one linux machine
    - the process: systemd
    - a reverse proxy: nginx (needs a certificate for https) -> ACME protocol has automated it now
- Kubernetes:
  - Container orchestration with error handling, auto-scaling, replication etc to prevent downtime
  - Immutable infrastructure: servers are replaced with the same instance
  - what do we want, declarative language
  - It has an API server, etcd, controller
  - Pod: 1 of more container, container with helpers sharing file system, scheduled as one, one IP address, killed as one, fetched by labels like pod app name
    - A replicaset
    - A deployment: owns the replica set
    - a service: a fixed name, a fixed address
    - ephemeral, internal implementation
  - Ingress/Gateway API:
    - internet -> load balancer -> service -> pods
  - Where does ready come from?
    - our service is probed by the kubelet
  - Three probes:
    - Readiness
    - Liveness
    - startup
  - Scaling in the orchestrator's world:
    - Just change a number, like replicas
- The last stages of the pipeline:
  - A green build, always deployable -> continuous delivery
  - No deployment without continuous delivery
  - Blue-green:
    - blue: live, current version
    - green: the new version, no users
    - Tradeoff is the redundant costs
  - Canary release:
    - 10 pods, new application deployed only on 1 pod, therefore test on 10% traffic
    - progressive delivery based on metrics defined by us, to increase the traffic on the new application version
  - GitOps: declarative config
    - ArgoCD, flux
  - Environments: dev, staging, production (preview environment on PR)
- Infrastructure as code;
  - AWS:handling machines, networks, permissions, configuration
  - Three kinds of tools:
    - provisioning: terraform, another fooking config, plan -> approve -> apply those to the cloud itself
    - Configuration management: ansible
    - Image baking: packer
- Terraform (over-engineering):
  - state is it's form of version control
  - drift, directly make the change in the cloud console manually

- The service runs; now operations:
  - SLI: service level indicator - a measurement users care about
  - Example, how many requests are succeeding out of all the requests
  - SLO: Target for SLI over a window
  - SLA: a contract with a customer -> betting on a number
  - 99.9% availability over a month -> 43 minutes of failure, at most
  - Every 9 added gets the 10x better

### Miscellaneous

- CAP theorem:
  - at most of the three: consistency, availability and partition tolerance
- Zookeeper
  - for distributed system manager/orchestration
  - distributed synchronization, locking etc.
  - persistent and ephemeral nodes in a tree like structure maintained by it
  - can generate snowflake id

- System design basics:
  - Functional and non-functional requirements
    - non functional has some buzzwords like latency, scale (DAU/ requests/sec), CAP, uniqueness, handling assymetric relationship of reads and writes
  - Identifying entities
  - APIs
  - High level design
  - Low level design

- Encryption/encoding:
  - Take a long unique key -> base64 encoding 6 bits converted to 1 character
  - 1:1 bijective function
