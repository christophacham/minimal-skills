# C4 Worked Example: Internet Banking System (standard Mermaid)

A complete walkthrough of one fictional system at every zoom level, in standard Mermaid (no plugins). Scenario: a bank's engineering team builds an Internet Banking System on top of an existing off-the-shelf Core Banking System and Amazon SES. Reuse the shape conventions (rounded systems, square containers, cylinders for data stores, dashed subgraph boundaries) and change the content.

Shape/key convention used throughout:

```mermaid
flowchart LR
  P["Name<br/>[Person]<br/>Description"]
  S(["Name<br/>[Software System]<br/>Description"])
  C["Name<br/>[Container: Technology]<br/>Description"]
  D[("Name<br/>[Container: Technology]<br/>Description")]
  P -->|"Intent label [protocol]"| C
```

## Level 1: System Context

Build it in steps: the system alone, then users, then each external dependency.

```mermaid
flowchart TB
  Cust["Personal Banking Customer<br/>[Person]<br/>A customer of the bank with personal bank accounts"]
  IBS(["Internet Banking System<br/>[Software System]<br/>Allows customers to view account information and make payments online"])
  CBS(["Core Banking System<br/>[Software System]<br/>Stores all core banking information about customers, accounts, transactions"])
  SES(["E-mail System<br/>[Software System: Amazon SES]<br/>Sends e-mail to customers"])
  Cust -->|"Views account balances and makes payments using"| IBS
  IBS -->|"Gets account information from and makes payments using"| CBS
  IBS -->|"Sends e-mail using"| SES
```

Title: `System Context view: Internet Banking System`. Note the absence of any technology or protocol: intent only.

## Level 2: Container

Zoom into the same system. Same people and external systems for continuity, plus the boundary box, plus technology and protocol everywhere. The story: SPA in the browser, static content served separately, a Java/Spring Boot backend (browser cannot securely reach the Core Banking System directly), a MySQL schema for credentials (the off-the-shelf CBS is too costly to change), and an S3 bucket caching PDF statements (the CBS is slow for old transactions).

```mermaid
flowchart TB
  Cust["Personal Banking Customer<br/>[Person]<br/>A customer of the bank with personal bank accounts"]
  subgraph IBS["Internet Banking System [Software System]"]
    SC["Static Content<br/>[Container: Directory]<br/>HTML, CSS and JavaScript for the single-page app"]
    UI["Single-Page Application<br/>[Container: JavaScript and Angular]<br/>Delivers the internet banking experience in the browser"]
    BE["Backend<br/>[Container: Java and Spring Boot]<br/>JSON/HTTP API for internet banking features"]
    DB[("Database<br/>[Container: MySQL schema]<br/>Stores user credentials and hashed passwords")]
    SS[("Statement Store<br/>[Container: Amazon S3 bucket]<br/>Caches generated PDF bank statements")]
    SC -->|"Delivers to the browser"| UI
    UI -->|"Makes API calls to [JSON/HTTPS]"| BE
    BE -->|"Reads from and writes to [SQL/TCP]"| DB
    BE -->|"Reads from and writes to [S3 API/HTTPS]"| SS
  end
  CBS(["Core Banking System<br/>[Software System]<br/>Stores all core banking information"])
  SES(["E-mail System<br/>[Software System: Amazon SES]<br/>Sends e-mail to customers"])
  Cust -->|"Visits ib.example.com using [HTTPS]"| SC
  Cust -->|"Views balances and makes payments using"| UI
  BE -->|"Makes API calls to [XML/HTTPS]"| CBS
  BE -->|"Sends e-mail using [SMTP/HTTPS API]"| SES
```

Title: `Container view: Internet Banking System`.

Two modeling decisions worth copying:

- **SES is a software system; the S3 bucket is a container.** SES is an external API dependency we treat as opaque. The bucket's contents, layout, and formats are owned by this system, so it is an integral data store despite being hosted by AWS.
- **"Static Content" is a directory, not "nginx".** The serving mechanism varies per environment (nginx in dev, S3+Cloudflare in prod), so it belongs on the deployment diagrams, not here.

## Level 3: Component (backend only)

One container per diagram. Story order: sign-in first, then accounts, then statements, then payments.

```mermaid
flowchart TB
  UI["Single-Page Application<br/>[Container: JavaScript and Angular]"]
  subgraph IBS["Internet Banking System [Software System]"]
    subgraph BE["Backend [Container: Java and Spring Boot]"]
      SIA["Sign In API<br/>[Component: Spring Web MVC]<br/>Authenticates users and issues session tokens"]
      ASA["Accounts Summary API<br/>[Component: Spring Web MVC]<br/>Lists a customer's bank accounts"]
      STA["Statement API<br/>[Component: Spring Web MVC]<br/>Returns or generates PDF statements"]
      PAY["Payments API<br/>[Component: Spring Web MVC]<br/>Makes payments on behalf of the customer"]
      SEC["Security Component<br/>[Component: Spring bean]<br/>Validates credentials and session tokens"]
      EMAIL["E-mail Component<br/>[Component: Spring bean]<br/>Sends e-mail for MFA and fraud alerts"]
      CBSA["Core Banking System Adapter<br/>[Component: Spring bean]<br/>Translates between our domain and the CBS XML API"]
      SIA -->|"Validates credentials via"| SEC
      SIA -->|"Sends MFA e-mail via"| EMAIL
      ASA -->|"Validates session via"| SEC
      ASA -->|"Fetches accounts via"| CBSA
      STA -->|"Validates session via"| SEC
      STA -->|"Fetches statement data via"| CBSA
      PAY -->|"Validates session via"| SEC
      PAY -->|"Makes payments via"| CBSA
      PAY -->|"Sends fraud alerts via"| EMAIL
    end
    DB[("Database<br/>[Container: MySQL schema]")]
    SS[("Statement Store<br/>[Container: Amazon S3 bucket]")]
    SEC -->|"Reads user records from [SQL/TCP]"| DB
    STA -->|"Reads and writes statements [S3 API]"| SS
  end
  CBS(["Core Banking System<br/>[Software System]"])
  SES(["E-mail System<br/>[Software System: Amazon SES]"])
  UI -->|"Submits credentials to [JSON/HTTPS]"| SIA
  UI -->|"Requests accounts from [JSON/HTTPS]"| ASA
  UI -->|"Requests statements from [JSON/HTTPS]"| STA
  UI -->|"Submits payments to [JSON/HTTPS]"| PAY
  EMAIL -->|"Sends e-mail using"| SES
  CBSA -->|"Makes API calls to [XML/HTTPS]"| CBS
```

Title: `Component view: Internet Banking System, Backend`. In-process component-to-component arrows carry intent only (no protocol). This diagram is already near the clutter limit; beyond this, split by feature slice (see `advanced.md`).

## Level 4: Code (one component)

Zoom into the Core Banking System Adapter. Pattern being taught: every CBS call is a request/response class pair behind a pooled connection.

```mermaid
classDiagram
  class CoreBankingSystemAdapter {
    <<interface>>
  }
  class CoreBankingSystemAdapterImpl {
    -connectionPool
  }
  class CoreBankingSystemConnection {
    +sendXml()
    +receiveXml()
  }
  class BankAccountsRequest
  class BankAccountsResponse
  class DomainAccount
  CoreBankingSystemAdapter <|.. CoreBankingSystemAdapterImpl
  CoreBankingSystemAdapterImpl --> CoreBankingSystemConnection
  CoreBankingSystemAdapterImpl --> BankAccountsRequest
  CoreBankingSystemAdapterImpl --> BankAccountsResponse
  BankAccountsResponse --> DomainAccount
```

Title: `Code view: Core Banking System Adapter component`. Hand-drawn and deliberately sparse; the IDE can generate the full version on demand.

## Dynamic: sign-in flow (both styles)

Sequence style:

```mermaid
sequenceDiagram
  participant UI as Single-Page Application
  participant API as Sign In API
  participant SEC as Security Component
  participant DB as Database
  UI->>API: 1. Submit credentials [JSON/HTTPS]
  API->>SEC: 2. Validate credentials
  SEC->>DB: 3. Get user account info
  DB-->>SEC: 4. User record
  SEC-->>API: 5. Session token (if valid)
  API-->>UI: 6. Session token
```

Collaboration style (same information, free-form layout, numbered arrows):

```mermaid
flowchart TB
  UI["Single-Page Application"]
  API["Sign In API"]
  SEC["Security Component"]
  DB[("Database")]
  UI -->|"1. Submit credentials [JSON/HTTPS]"| API
  API -->|"2. Validate credentials"| SEC
  SEC -->|"3. Get user account info"| DB
  DB -->|"4. User record"| SEC
  SEC -->|"5. Session token"| API
  API -->|"6. Session token"| UI
```

Title either way: `Dynamic view: sign-in feature (component level)`.

## Deployment: development environment

Everything on the developer laptop inside the bank WAN. Local substitutes for cloud services: nginx via Docker for static content, MySQL via Docker, MinIO as the S3-compatible statement store, a mock SES that logs instead of sending. The Core Banking System is an opaque shared dev instance in the data center.

```mermaid
flowchart TB
  subgraph WAN["Bank WAN [Deployment node]"]
    subgraph Laptop["Developer Laptop, Windows or macOS [Deployment node]"]
      Browser["Web Browser [Deployment node]"]
      UI["Single-Page Application [Container instance]"]
      subgraph DNg["Docker, nginx [Deployment node]"]
        SC["Static Content [Container instance]"]
      end
      subgraph JVM["Java Virtual Machine [Deployment node]"]
        BE["Backend [Container instance]"]
      end
      subgraph DMy["Docker, MySQL [Deployment node]"]
        DB[("Database schema [Container instance]")]
      end
      subgraph DMi["Docker, MinIO [Deployment node]"]
        SS[("Statement Store [Container instance]")]
      end
      subgraph DSe["Docker, mock SES [Deployment node]"]
        SES["Mock E-mail System [Software System instance]"]
      end
      Browser --- UI
      SC -->|"Serves static files to [HTTP]"| Browser
      UI -->|"Makes API calls to [HTTP localhost:8080]"| BE
      BE -->|"Reads from and writes to [SQL/TCP]"| DB
      BE -->|"Reads from and writes to [S3 API]"| SS
      BE -->|"Sends e-mail using"| SES
    end
    CBS["Core Banking System, dev instance on corebanking-dev [Software System instance]"]
    BE -->|"Makes API calls to [XML/HTTPS]"| CBS
  end
```

Title: `Deployment view: Internet Banking System, development`. Plain HTTP locally; no TLS certificate hassle.

## Deployment: live environment

```mermaid
flowchart TB
  Cust["Personal Banking Customer [Person]"]
  subgraph CF["Cloudflare [Organizational boundary]"]
    DNS1["ib.example.com CNAME (proxied, cached) [Infrastructure node]"]
    DNS2["ib-api.example.com CNAME (not proxied) [Infrastructure node]"]
  end
  subgraph Internet["Customer device"]
    Browser["Web Browser [Deployment node]"]
    UI["Single-Page Application [Container instance]"]
    Browser --- UI
  end
  subgraph AWS["Amazon Web Services, eu-west-1 [Organizational boundary]"]
    subgraph S3Static["S3 bucket, static website [Deployment node]"]
      SC["Static Content [Container instance]"]
    end
    ALB["Application Load Balancer [Infrastructure node]"]
    subgraph Fargate["AWS Fargate [Deployment node]"]
      BE["Backend [Container instance, Docker image]"]
    end
    subgraph RDS["Amazon RDS [Deployment node]"]
      DB[("Database schema [Container instance]")]
    end
    SS[("Statement Store, S3 bucket [Container instance]")]
    SES["E-mail System [Software System instance: Amazon SES]"]
    ALB -->|"Forwards API requests to [HTTPS]"| BE
    BE -->|"Reads from and writes to [SQL/TCP]"| DB
    BE -->|"Reads from and writes to [S3 API/HTTPS]"| SS
    BE -->|"Sends e-mail using [SMTP/HTTPS API]"| SES
  end
  subgraph Bank["Bank data center [Organizational boundary]"]
    CBS["Core Banking System on corebanking-live [Software System instance]"]
  end
  Cust -->|"Accesses the internet banking site using"| Browser
  DNS1 -->|"Aliases, proxied and cached"| S3Static
  Browser -->|"Loads app from [HTTPS]"| DNS1
  UI -->|"Makes API calls to [JSON/HTTPS]"| DNS2
  DNS2 -->|"Aliases, not proxied"| ALB
  BE -->|"Makes API calls to [XML/HTTPS via AWS Direct Connect]"| CBS
```

Title: `Deployment view: Internet Banking System, live`. Note HTTPS everywhere now, org-boundary boxes, and deliberate omissions for brevity (availability zones, subnets, the Docker registry).

## System Landscape

Context diagram without a single-system focus, widened to the bank:

```mermaid
flowchart TB
  Cust["Personal Banking Customer [Person]"]
  subgraph Bank["Big Bank [Organizational boundary]"]
    Support["Customer Support Staff [Person]"]
    BackOffice["Back Office Staff [Person]"]
    ATM(["ATM<br/>[Software System]<br/>Cash withdrawal and balance enquiries"])
    IBS(["Internet Banking System<br/>[Software System]"])
    CBS(["Core Banking System<br/>[Software System]"])
    Support -->|"Manages customer issues using"| CBS
    BackOffice -->|"Performs back-office tasks using"| CBS
    ATM -->|"Retrieves account data from"| CBS
    IBS -->|"Gets account information from"| CBS
  end
  subgraph Amazon["Amazon Web Services [Organizational boundary]"]
    SES(["E-mail System<br/>[Software System: Amazon SES]"])
  end
  Cust -->|"Views balances and makes payments using"| IBS
  Cust -->|"Withdraws cash using"| ATM
  Cust -->|"Asks for help from"| Support
  IBS -->|"Sends e-mail using"| SES
```

Title: `System Landscape view: Big Bank (partial)`. The customer-to-support-staff relationship is included because it explains *why* support staff use the Core Banking System.
