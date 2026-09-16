import type { LearnModule } from "../learnContent";

const swdbs401: LearnModule = {
  slug: "l4-specific-modules-swdbs401-backend-system-design",
  moduleCode: "SWDBS401",
  title: "Backend System Design",
  tier: "l4",
  trackName: "L4 — Specific Modules",
  xpReward: 80,
  estimatedMinutes: 240,
  description:
    "Design a Backend System. Covers analyzing system requirements using FURPS, developing system structure with UML/SSADM/OOAD, and building system design with DFDs, physical data models, and documentation.",
  outcomes: [
    {
      number: 1,
      title: "Analyze System Backend",
      learningHours: 17,
      indicativeContents: [
        {
          id: "swdbs401-lo1-ic1",
          title: "Gathering FURPS Requirements",
          topics: [
            {
              id: "swdbs401-lo1-ic1-t1",
              title: "Key Terms and Backend Development Technologies",
              blocks: [
                {
                  id: "swdbs401-lo1-ic1-t1-text1",
                  type: "text",
                  content: `## Backend System Design — Key Concepts

**Backend** refers to the server-side of a web application that handles business logic, data storage, and API communication.

### Key Terms:
| Term | Definition |
|------|-----------|
| **Backend** | Server-side logic and data layer |
| **Server** | A computer that provides services or resources to clients |
| **Database** | Organised collection of structured data |
| **Operating System** | Software managing hardware and software resources |
| **SDLC** | System Development Life Cycle — phases for building software |
| **API** | Application Programming Interface — rules for system communication |
| **JSON** | JavaScript Object Notation — lightweight data exchange format |
| **Framework** | Pre-built code structure for faster development |
| **UML** | Unified Modeling Language — visual system modelling |
| **FURPS** | Functionality, Usability, Reliability, Performance, Supportability |

### SDLC Models:
- **Agile** — Iterative, flexible, continuous delivery
- **Waterfall** — Linear sequential phases
- **V-Shaped** — Testing paired with each development phase
- **Prototyping** — Build early prototypes for feedback

### Backend Technologies:
| Language | Frameworks |
|----------|-----------|
| Python | Django, Flask, FastAPI |
| PHP | Laravel, Symfony, CodeIgniter |
| Java | Spring Boot, Jakarta EE |
| JavaScript | Node.js/Express, NestJS |
| Ruby | Ruby on Rails |`,
                },
                {
                  id: "swdbs401-lo1-ic1-t1-quiz1",
                  type: "quiz",
                  questions: [],
                },
              ],
            },
            {
              id: "swdbs401-lo1-ic1-t2",
              title: "System Analysis Tools and Data Gathering",
              blocks: [
                {
                  id: "swdbs401-lo1-ic1-t2-text1",
                  type: "text",
                  content: `## System Analysis Tools

Analysis tools help understand and document existing or planned systems.

### Common System Analysis Tools:
- **Grid Chart** — Tabular representation of system components and their relationships
- **System Flowchart** — Visual flow of data/processes through a system
- **Decision Tree** — Branching diagram showing decision paths
- **Decision Table** — Matrix mapping conditions to actions
- **Simulation** — Modelling real-world system behaviour for testing

### Data Gathering Methods:
| Method | When to Use |
|--------|------------|
| **Interview** | Deep qualitative insights from stakeholders |
| **Questionnaire** | Broad data collection from many users |
| **Observation** | Understand actual workflows in practice |
| **Documentation Review** | Analyse existing reports, manuals, forms |

### Identifying FURPS Requirements:
- **Functionality**: What must the system do? (features, capabilities)
- **Usability**: How easy is it to use? (UI, accessibility, documentation)
- **Reliability**: How often does it fail? (uptime, error recovery)
- **Performance**: How fast? How scalable? (response times, throughput)
- **Supportability**: How maintainable? (testability, adaptability)`,
                },
                {
                  id: "swdbs401-lo1-ic1-t2-quiz1",
                  type: "quiz",
                  questions: [],
                },
              ],
            },
            {
              id: "swdbs401-lo1-ic1-t3",
              title: "Main Objects and System Interaction",
              blocks: [
                {
                  id: "swdbs401-lo1-ic1-t3-text1",
                  type: "text",
                  content: `## Main Objects of a Backend System

When scoping a backend system, identify these core objects:

- **Database** — Persistent storage of application data
- **APIs** — Endpoints that expose functionality to clients
- **Servers** — Hosts that run application code
- **Frameworks** — Libraries/tools structuring the application

### System Interaction Components:

| Component | Role |
|-----------|------|
| **Web Server** | Handles HTTP requests (e.g., Nginx, IIS) |
| **Application Server** | Runs business logic (e.g., Node.js, Tomcat) |
| **Database Server** | Stores and queries data (e.g., MySQL, PostgreSQL) |
| **External APIs** | Third-party services (e.g., payment gateways, SMS) |
| **Message Queues** | Asynchronous communication (e.g., RabbitMQ, Redis) |

### System Backend Requirements Report Structure:
1. **Executive Summary** — High-level overview
2. **Detailed Analysis of Current State** — As-is system description
3. **Findings on Gaps and Issues** — Problems identified
4. **Recommendations** — Proposed solutions`,
                },
                {
                  id: "swdbs401-lo1-ic1-t3-chk1",
                  type: "checklist",
                  items: [
                    "I can identify FURPS requirements for a given scenario",
                    "I understand the five main backend objects: DB, APIs, Servers, Frameworks",
                    "I can describe how web, app, and database servers interact",
                    "I can structure a requirements report with the four sections",
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      number: 2,
      title: "Develop System Structure",
      learningHours: 31,
      indicativeContents: [
        {
          id: "swdbs401-lo2-ic1",
          title: "System Design Tools",
          topics: [
            {
              id: "swdbs401-lo2-ic1-t1",
              title: "UML and Design Diagram Types",
              blocks: [
                {
                  id: "swdbs401-lo2-ic1-t1-text1",
                  type: "text",
                  content: `## System Design Tools

### UML (Unified Modeling Language) Diagrams:

| Diagram | Purpose |
|---------|---------|
| **Use Case Diagram** | Shows actors and system functionality |
| **Class Diagram** | Shows classes, attributes, methods, relationships |
| **Flowchart** | Step-by-step process flow |
| **Data Flow Diagram (DFD)** | Shows how data moves through a system |
| **Entity Relationship Diagram (ERD)** | Database table relationships |
| **Context Diagram** | High-level system boundary (DFD Level 0) |
| **Decision Table** | Maps conditions to actions in tabular form |
| **Decision Tree** | Visual branching of decision logic |

### Recommended Software Tools:
- **Microsoft Visio** — Professional diagramming
- **Visual Paradigm** — UML and BPMN modelling
- **EdrawMax** — General diagramming including ERD, DFD
- **draw.io / diagrams.net** — Free browser-based diagramming`,
                },
                {
                  id: "swdbs401-lo2-ic1-t1-quiz1",
                  type: "quiz",
                  questions: [],
                },
              ],
            },
            {
              id: "swdbs401-lo2-ic1-t2",
              title: "SSADM and Object-Oriented Analysis & Design",
              blocks: [
                {
                  id: "swdbs401-lo2-ic1-t2-text1",
                  type: "text",
                  content: `## SSADM — Structured System Analysis and Design Methods

SSADM is a structured approach to system analysis used widely in government and enterprise projects.

### SSADM Techniques:
| Technique | Description |
|-----------|-------------|
| **Logical Data Modelling** | Define entities, attributes, and relationships |
| **Data Flow Modelling** | Show data movement through processes |
| **Entity Behaviour Modelling** | Define how entities change state over time |

### Stages for Drawing SSADM:
1. Feasibility study
2. Requirements analysis
3. Requirements specification
4. Logical system specification
5. Physical design

---

## Object-Oriented Analysis and Design (OOAD)

OOAD models a system as interacting objects.

### Phases in OOAD:
| Phase | Activities |
|-------|-----------|
| **Analysis** | Identify objects, attributes, relationships from requirements |
| **Design** | Define classes, interfaces, data structures, architecture |
| **Implementation** | Write code based on design classes |

### Advantages of OOAD:
- Reusability via inheritance
- Modularity and encapsulation
- Easier maintenance and testing
- Natural mapping to real-world entities`,
                },
                {
                  id: "swdbs401-lo2-ic1-t2-quiz1",
                  type: "quiz",
                  questions: [],
                },
                {
                  id: "swdbs401-lo2-ic1-t2-chk1",
                  type: "checklist",
                  items: [
                    "I can identify and use the correct UML diagram for a given task",
                    "I understand the three SSADM techniques",
                    "I can explain the three phases of OOAD",
                    "I can draw a context diagram using EdrawMax or Visual Paradigm",
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      number: 3,
      title: "Build System Design",
      learningHours: 32,
      indicativeContents: [
        {
          id: "swdbs401-lo3-ic1",
          title: "Data Flow Diagrams (DFD)",
          topics: [
            {
              id: "swdbs401-lo3-ic1-t1",
              title: "DFD Elements, Rules, and Levels",
              blocks: [
                {
                  id: "swdbs401-lo3-ic1-t1-text1",
                  type: "text",
                  content: `## Data Flow Diagrams (DFD)

A DFD shows how data flows between processes, data stores, and external entities.

### Elements of a DFD:
| Symbol | Element | Description |
|--------|---------|-------------|
| Rectangle | **External Entity** | Actor outside the system (user, other system) |
| Circle/Bubble | **Process** | Transforms input data to output data |
| Open Rectangle | **Data Store** | Persistent data storage (file, database) |
| Arrow | **Data Flow** | Movement of data between elements |

### DFD Levels:
| Level | Name | Description |
|-------|------|-------------|
| **Level 0** | Context Diagram | Single process representing the entire system |
| **Level 1** | Top-Level DFD | Major processes broken out from the context |
| **Level 2** | Function Decomposition | Each Level 1 process expanded into sub-processes |

### Rules for Drawing a DFD:
- Every process must have at least one input and one output
- Data stores cannot directly communicate — must go through a process
- External entities cannot directly access data stores
- Label all arrows with the data they carry
- Use consistent naming (verb phrases for processes, noun phrases for flows)`,
                },
                {
                  id: "swdbs401-lo3-ic1-t1-quiz1",
                  type: "quiz",
                  questions: [],
                },
              ],
            },
          ],
        },
        {
          id: "swdbs401-lo3-ic2",
          title: "Physical Data Model and System Documentation",
          topics: [
            {
              id: "swdbs401-lo3-ic2-t1",
              title: "Physical Data Model Design",
              blocks: [
                {
                  id: "swdbs401-lo3-ic2-t1-text1",
                  type: "text",
                  content: `## Physical Data Model

The Physical Data Model translates the logical design into actual database objects.

### Steps:
1. **Identify Database Objects** — Tables, columns, indexes, constraints
2. **Design Tables** — Define column names, data types, sizes
3. **Define Relationships** — Foreign keys linking tables

### Example Physical Table Design:
| Column | Data Type | Constraints |
|--------|-----------|-------------|
| product_id | INT | PRIMARY KEY, AUTO_INCREMENT |
| product_name | VARCHAR(100) | NOT NULL |
| price | DECIMAL(10,2) | NOT NULL |
| category_id | INT | FOREIGN KEY → categories(id) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |`,
                },
                {
                  id: "swdbs401-lo3-ic2-t1-code1",
                  type: "code",
                  language: "sql",
                  caption: "Physical schema SQL example",
                  code: `-- Physical Data Model: Pharmacy System
CREATE TABLE medicines (
  medicine_id   INT           PRIMARY KEY AUTO_INCREMENT,
  name          VARCHAR(100)  NOT NULL,
  category      VARCHAR(50),
  unit_price    DECIMAL(10,2) NOT NULL,
  stock_qty     INT           DEFAULT 0
);

CREATE TABLE branches (
  branch_id     INT           PRIMARY KEY AUTO_INCREMENT,
  branch_name   VARCHAR(100)  NOT NULL,
  location      VARCHAR(200)
);

CREATE TABLE stock_transfers (
  transfer_id   INT           PRIMARY KEY AUTO_INCREMENT,
  medicine_id   INT           NOT NULL,
  from_branch   INT           NOT NULL,
  to_branch     INT           NOT NULL,
  quantity      INT           NOT NULL,
  transfer_date DATETIME      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medicine_id)  REFERENCES medicines(medicine_id),
  FOREIGN KEY (from_branch)  REFERENCES branches(branch_id),
  FOREIGN KEY (to_branch)    REFERENCES branches(branch_id)
);`,
                },
              ],
            },
            {
              id: "swdbs401-lo3-ic2-t2",
              title: "System Design Documentation",
              blocks: [
                {
                  id: "swdbs401-lo3-ic2-t2-text1",
                  type: "text",
                  content: `## System Design Documentation

Good documentation is essential for developers, testers, and stakeholders.

### Types of Design Documents:
| Document | Contents |
|----------|---------|
| **System Design Document (SDD)** | Architecture, components, interfaces |
| **Functional Specification Document (FSD)** | What the system does (functional requirements) |
| **Technical Specification Document (TSD)** | How the system is built (tech stack, APIs) |
| **Database Design Document** | Schema, ERD, data dictionary |
| **Use Case Document** | Actor–system interaction scenarios |

### Documentation Audience:
- **System Documentation** — For developers and maintainers
- **User Documentation** — For end users and administrators (manuals, guides)`,
                },
                {
                  id: "swdbs401-lo3-ic2-t2-quiz1",
                  type: "quiz",
                  questions: [],
                },
                {
                  id: "swdbs401-lo3-ic2-t2-chk1",
                  type: "checklist",
                  items: [
                    "I can draw a DFD Level 0 and Level 1 for a given scenario",
                    "I can design a physical data model with tables and foreign keys",
                    "I understand the five types of system design documents",
                    "I can distinguish system documentation from user documentation",
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export default swdbs401;
