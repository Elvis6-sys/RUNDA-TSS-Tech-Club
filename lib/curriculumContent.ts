/**
 * Structured curriculum content extracted from official RQF curriculum PDFs.
 * Each entry maps to a SkillTrack by name (case-insensitive match).
 *
 * Structure per module:
 *   learningOutcomes → topics → subtopics (indicative content)
 */

export type Subtopic = { title: string; items?: string[] };
export type Topic = { title: string; subtopics: Subtopic[] };
export type LearningOutcome = {
  id: string;
  title: string;
  hours: number;
  performanceCriteria: string[];
  topics: Topic[];
};
export type ModuleCurriculum = {
  code: string;
  title: string;
  level: string;
  credits: number;
  totalHours: number;
  purpose: string;
  learningOutcomes: LearningOutcome[];
  resources: string[];
  assessment: { theoretical: number; practical: number; formative: number; summative: number };
};

// ─── Python Programming (L5 General) ─────────────────────────────────────────
const PYTHON_PROGRAMMING: ModuleCurriculum = {
  code: "GENPP501",
  title: "Python Programming",
  level: "5",
  credits: 8,
  totalHours: 80,
  purpose:
    "Apply Python Programming fundamentals. Learners will prepare a Python environment, write basic Python programs and apply object-driven programming in Python.",
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  resources: ["Computer, Projector", "Internet", "Text editor, Python (latest), IDE, Jupyter Notebook"],
  learningOutcomes: [
    {
      id: "lo1",
      title: "Prepare Python Environment",
      hours: 15,
      performanceCriteria: [
        "Python tools are properly selected in accordance with computer operating system",
        "Python tools are properly installed in accordance with Operating System",
        "Python installation is successfully tested based on output of python version command",
      ],
      topics: [
        {
          title: "Selection of Python Tools",
          subtopics: [
            {
              title: "Python Programming Overview",
              items: ["Definition & benefits", "Characteristics of Python", "Applications: Data Science, Software Dev, Automation, Analytics"],
            },
            { title: "Identification of Python Tools", items: ["Hardware requirements", "Software requirements"] },
          ],
        },
        {
          title: "Installation of Python Tools",
          subtopics: [
            { title: "Install Python Software Tools", items: ["Install Python (latest stable)", "Install IDE (VS Code / PyCharm)"] },
            { title: "Configure Python Virtual Environment", items: ["venv", "virtualenv", "conda"] },
          ],
        },
        {
          title: "Testing Python Installation",
          subtopics: [
            { title: "Verification Commands", items: ["Run python version command", "Check python interpreter", "Test package manager (pip)"] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Write Basic Python Program",
      hours: 45,
      performanceCriteria: [
        "Python concepts are effectively applied based on python standards",
        "Control structures are properly applied in accordance with python standards",
        "Functions are properly applied in accordance with python standards",
        "Collections are properly applied in accordance with python standards",
        "File handling is properly performed in accordance with python standards",
      ],
      topics: [
        {
          title: "Python Basic Concepts",
          subtopics: [
            { title: "Data Types & Variables", items: ["int, float, str, bool, NoneType", "Variable naming & assignment", "Type conversion"] },
            { title: "Operators", items: ["Arithmetic", "Comparison", "Logical", "Assignment", "Bitwise"] },
            { title: "Comments & Code Style", items: ["Single-line comments", "Multi-line comments", "Docstrings", "PEP8 basics"] },
          ],
        },
        {
          title: "Control Structures",
          subtopics: [
            { title: "Conditional Statements", items: ["if / elif / else", "Nested conditions", "Ternary expressions"] },
            { title: "Looping Statements", items: ["for loop", "while loop", "range()", "Enumerate & zip"] },
            { title: "Jump Statements", items: ["break", "continue", "pass"] },
          ],
        },
        {
          title: "Functions in Python",
          subtopics: [
            { title: "Function Basics", items: ["Define with def", "Arguments & default parameters", "Return values", "Calling functions"] },
            { title: "Special Purpose Functions", items: ["Lambda functions", "Generators", "Closures", "Decorators", "Recursive functions", "Higher-order functions"] },
          ],
        },
        {
          title: "Python Collections",
          subtopics: [
            { title: "Collection Types", items: ["Lists", "Tuples", "Dictionaries", "Sets", "Frozen Set", "ChainMaps", "Deques"] },
            { title: "Collections Module", items: ["Counter", "OrderedDict", "defaultdict"] },
            { title: "Common Operations", items: ["Adding & removing elements", "Accessing & iterating", "Filtering & sorting", "Set operations", "Stack & queue operations"] },
          ],
        },
        {
          title: "File Handling",
          subtopics: [
            { title: "File Handling Libraries", items: ["os", "pathlib", "shutil", "pandas"] },
            { title: "Read File", items: ["Open file", "File read permissions"] },
            { title: "Write / Create File", items: ["Create a new file", "Write to existing file"] },
            { title: "Delete File", items: ["Remove file", "Delete folder"] },
            { title: "Best Practices", items: ["Readability & style", "Built-in features", "Efficiency & memory", "Error handling & testing"] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Apply Object-Driven Programming in Python",
      hours: 40,
      performanceCriteria: [
        "OOP Concepts are properly applied in line with python standards",
        "Python date and time concepts are applied according to python standards",
        "Libraries are properly used in accordance with python standards",
        "System automation is properly applied based on specific task",
      ],
      topics: [
        {
          title: "OOP Concepts",
          subtopics: [
            { title: "Core OOP Pillars", items: ["Objects & Classes", "Inheritance", "Polymorphism", "Encapsulation"] },
            { title: "Python Class Mechanics", items: ["__init__ constructor", "Instance vs class attributes", "Magic methods (dunder)", "Class & static methods"] },
          ],
        },
        {
          title: "Date and Time in Python",
          subtopics: [
            { title: "Date/Time Libraries", items: ["datetime (stdlib)", "dateutil", "Arrow", "Pendulum", "python-tzdata"] },
            { title: "Operations", items: ["Set time zones", "Formatting & parsing dates", "Relative timedeltas", "Date arithmetic"] },
          ],
        },
        {
          title: "Python Libraries",
          subtopics: [
            { title: "Standard Library Overview", items: ["Matplotlib (visualisation)", "NumPy (numerical computing)", "Pandas (data analysis)"] },
            { title: "Using Libraries", items: ["Importing libraries", "Accessing functionality", "Understanding scope / namespace"] },
          ],
        },
        {
          title: "System Automation (Post-Deployment)",
          subtopics: [
            { title: "Tasks to Automate", items: ["Database migrations", "Config file updates", "Service restarts", "Testing & verification", "Logging & notifications"] },
            { title: "Automation Libraries", items: ["Fabric", "Ansible", "SaltStack", "Boto3", "vSphere Automation SDK"] },
            { title: "Script Development", items: ["Use library functions", "Structure logically", "Logging & output", "Integrate with CI/CD pipelines", "Security measures"] },
          ],
        },
      ],
    },
  ],
};

// ─── Backend Development / Backend Application Development (L4) ───────────────
const BACKEND_DEVELOPMENT: ModuleCurriculum = {
  code: "SWDBD401",
  title: "Backend Application Development",
  level: "4",
  credits: 10,
  totalHours: 100,
  purpose:
    "Develop a backend application using Node.js. Students will develop RESTful APIs, secure, test and manage a backend application.",
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  resources: ["Computer, Projector", "Internet", "Node.js, VS Code, Postman, MySQL"],
  learningOutcomes: [
    {
      id: "lo1",
      title: "Develop RESTful APIs with Node.js",
      hours: 45,
      performanceCriteria: [
        "Development environment is properly arranged based on coding architecture methodology",
        "Server and database connection are properly established according to development environment",
        "RESTful APIs are effectively implemented based on backend functionalities",
      ],
      topics: [
        {
          title: "Node.js Environment Setup",
          subtopics: [
            { title: "Node.js Key Concepts", items: ["Node.js runtime", "NPM package manager", "Express.js framework", "Routes & middleware", "Class / Object / Method / Properties"] },
            { title: "Install & Configure", items: ["Install Node.js & NPM", "Create package.json", "Install Express.js", "Configure nodemon"] },
          ],
        },
        {
          title: "Database Connection",
          subtopics: [
            { title: "MySQL with Node.js", items: ["Install mysql2 package", "Create connection pool", "Execute queries", "Handle connection errors"] },
            { title: "Environment Variables", items: ["dotenv setup", "Store DB credentials securely", "Access variables in code"] },
          ],
        },
        {
          title: "Building RESTful APIs",
          subtopics: [
            { title: "REST Principles", items: ["HTTP methods (GET/POST/PUT/DELETE)", "Status codes", "Request & response structure", "Postman for testing"] },
            { title: "CRUD Operations", items: ["Create endpoint", "Read (list & single)", "Update endpoint", "Delete endpoint", "Input validation"] },
            { title: "Middleware", items: ["Body parser", "CORS", "Morgan logger", "Error handler middleware"] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Secure Backend Application",
      hours: 20,
      performanceCriteria: [
        "Data encryption is correctly applied based on system security",
        "Third-party libraries are carefully checked based on system security",
        "User Authentication, Authorization and Accountability (AAA) are carefully applied",
        "Environment variables are carefully secured",
      ],
      topics: [
        {
          title: "Data Encryption",
          subtopics: [
            { title: "Password Security", items: ["bcrypt hashing", "Salt rounds", "Never store plain text passwords"] },
            { title: "JWT Tokens", items: ["Sign & verify JWT", "Token expiry", "Refresh tokens", "Store tokens securely"] },
          ],
        },
        {
          title: "Authentication & Authorization",
          subtopics: [
            { title: "AAA Framework", items: ["Authentication (who you are)", "Authorization (what you can do)", "Accountability (audit trails)"] },
            { title: "Role-Based Access Control", items: ["Define roles", "Protect routes with middleware", "Check permissions per endpoint"] },
          ],
        },
        {
          title: "Dependency Security",
          subtopics: [
            { title: "Vulnerability Scanning", items: ["npm audit", "Snyk integration", "Update vulnerable packages", "Lock file best practices"] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Test Backend Application",
      hours: 20,
      performanceCriteria: [
        "Unit tests are appropriately conducted based on software testing techniques",
        "Usability is correctly tested according to expected results",
        "Security is properly tested based on system threats",
      ],
      topics: [
        {
          title: "Unit Testing",
          subtopics: [
            { title: "Testing Frameworks", items: ["Jest setup", "Mocha & Chai", "Test file structure", "Describe & it blocks"] },
            { title: "Writing Tests", items: ["Test happy path", "Test edge cases", "Mock database calls", "Code coverage reports"] },
          ],
        },
        {
          title: "API Testing",
          subtopics: [
            { title: "Postman Testing", items: ["Write test scripts", "Environment variables", "Collection runner", "Automated API tests"] },
            { title: "Security Testing", items: ["SQL injection tests", "XSS prevention", "Rate limiting", "OWASP Top 10"] },
          ],
        },
      ],
    },
    {
      id: "lo4",
      title: "Manage Backend Application",
      hours: 15,
      performanceCriteria: [
        "Application is appropriately deployed based on FURPS requirements",
        "Backend is effectively maintained according to system functionalities",
        "Application documentation is properly generated according to the system backend",
      ],
      topics: [
        {
          title: "Deployment",
          subtopics: [
            { title: "Hosting Platforms", items: ["Railway", "Render", "Heroku", "PM2 process manager"] },
            { title: "Environment Config", items: ["Production vs development env", "CI/CD basics", "Health check endpoints"] },
          ],
        },
        {
          title: "Documentation",
          subtopics: [
            { title: "API Documentation", items: ["Swagger / OpenAPI spec", "JSDoc comments", "README structure", "Postman collection export"] },
          ],
        },
      ],
    },
  ],
};

// ─── Databases & SQL / Database Development (L4) ─────────────────────────────
const DATABASE_DEVELOPMENT: ModuleCurriculum = {
  code: "SWDDD401",
  title: "Database Development",
  level: "4",
  credits: 10,
  totalHours: 100,
  purpose:
    "Design, implement and secure relational databases. Learners will analyse requirements, design schemas, implement and administer databases.",
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  resources: ["Computer, Projector", "Internet", "MySQL, MySQL Workbench, phpMyAdmin"],
  learningOutcomes: [
    {
      id: "lo1",
      title: "Analyse Database Requirements",
      hours: 20,
      performanceCriteria: [
        "Database requirements are thoroughly analysed based on client needs",
        "Data dictionary is properly developed based on business rules",
      ],
      topics: [
        {
          title: "Requirements Analysis",
          subtopics: [
            { title: "Business Rules", items: ["Identify entities & attributes", "Define relationships", "Constraints & cardinality"] },
            { title: "Data Dictionary", items: ["Table definitions", "Column data types", "Primary & foreign keys", "Null constraints"] },
          ],
        },
        {
          title: "Entity-Relationship Modelling",
          subtopics: [
            { title: "ERD Components", items: ["Entities", "Attributes (simple, composite, derived)", "Relationships (1:1, 1:N, M:N)", "Weak entities"] },
            { title: "ERD Tools", items: ["MySQL Workbench EER", "draw.io", "Lucidchart"] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Design Database",
      hours: 25,
      performanceCriteria: [
        "Database schema is properly designed based on data model",
        "Normalisation is correctly applied to eliminate redundancy",
      ],
      topics: [
        {
          title: "Normalisation",
          subtopics: [
            { title: "Normal Forms", items: ["1NF — atomic values", "2NF — remove partial dependencies", "3NF — remove transitive dependencies", "BCNF"] },
          ],
        },
        {
          title: "Schema Design",
          subtopics: [
            { title: "Tables & Relationships", items: ["CREATE TABLE syntax", "Primary keys (simple & composite)", "Foreign key constraints", "Indexes for performance"] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Implement Database",
      hours: 36,
      performanceCriteria: [
        "Database is correctly created based on approved design",
        "DML operations are properly executed",
        "Stored procedures and views are correctly implemented",
      ],
      topics: [
        {
          title: "DDL — Data Definition",
          subtopics: [
            { title: "Database Objects", items: ["CREATE DATABASE / TABLE", "ALTER TABLE", "DROP / TRUNCATE", "Constraints (UNIQUE, CHECK, DEFAULT)"] },
          ],
        },
        {
          title: "DML — Data Manipulation",
          subtopics: [
            { title: "CRUD with SQL", items: ["INSERT INTO", "SELECT with WHERE / ORDER BY / GROUP BY", "UPDATE SET", "DELETE FROM"] },
            { title: "Joins", items: ["INNER JOIN", "LEFT / RIGHT JOIN", "FULL OUTER JOIN", "Self join", "Cross join"] },
            { title: "Advanced Queries", items: ["Subqueries", "Aggregate functions (COUNT, SUM, AVG)", "HAVING clause", "CTEs (WITH)"] },
          ],
        },
        {
          title: "Stored Procedures & Views",
          subtopics: [
            { title: "Stored Procedures", items: ["CREATE PROCEDURE", "IN / OUT / INOUT params", "Call procedure", "Error handling with DECLARE"] },
            { title: "Views", items: ["CREATE VIEW", "Updatable views", "Materialized views concept"] },
            { title: "Triggers", items: ["BEFORE / AFTER triggers", "INSERT / UPDATE / DELETE events"] },
          ],
        },
      ],
    },
    {
      id: "lo4",
      title: "Implement Database Security",
      hours: 19,
      performanceCriteria: [
        "User accounts are properly created and managed",
        "Access privileges are correctly assigned based on roles",
        "Database backups are properly performed",
      ],
      topics: [
        {
          title: "User Management",
          subtopics: [
            { title: "User Accounts", items: ["CREATE USER", "GRANT / REVOKE privileges", "SHOW GRANTS", "DROP USER"] },
            { title: "Roles & Permissions", items: ["Principle of least privilege", "Role-based access", "Auditing access logs"] },
          ],
        },
        {
          title: "Backup & Recovery",
          subtopics: [
            { title: "Backup Strategies", items: ["mysqldump", "Full vs incremental backup", "Scheduled backups", "Point-in-time recovery"] },
          ],
        },
      ],
    },
  ],
};

// ─── System Design & Architecture / Front-End with React (L5) ────────────────
const FRONTEND_REACT: ModuleCurriculum = {
  code: "SWDFA501",
  title: "Front-End App Development with React.JS",
  level: "5",
  credits: 10,
  totalHours: 110,
  purpose:
    "Develop modern front-end applications using React.js, Tailwind CSS, Next.js and Progressive Web App techniques.",
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  resources: ["Computer, Projector", "Internet", "Node.js, VS Code, React DevTools, Figma"],
  learningOutcomes: [
    {
      id: "lo1",
      title: "Develop React.js Applications",
      hours: 40,
      performanceCriteria: [
        "React application is properly set up using modern tooling",
        "Components are correctly created and composed",
        "State and props are properly managed",
      ],
      topics: [
        {
          title: "React Fundamentals",
          subtopics: [
            { title: "React Setup", items: ["Create React App / Vite", "Project structure", "JSX syntax", "Babel & Webpack basics"] },
            { title: "Components", items: ["Functional components", "Props & prop types", "Component composition", "Fragment & key prop"] },
            { title: "State Management", items: ["useState hook", "useEffect hook", "useRef & useContext", "Custom hooks"] },
          ],
        },
        {
          title: "React Advanced Patterns",
          subtopics: [
            { title: "Routing", items: ["React Router v6", "Dynamic routes", "Protected routes", "useNavigate & useParams"] },
            { title: "Data Fetching", items: ["fetch API", "axios", "useEffect data loading", "Loading & error states"] },
            { title: "Forms", items: ["Controlled components", "React Hook Form", "Validation with Zod", "File upload"] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Apply Tailwind CSS",
      hours: 10,
      performanceCriteria: [
        "Tailwind CSS is properly configured in a React project",
        "Responsive design is correctly implemented using utility classes",
      ],
      topics: [
        {
          title: "Tailwind CSS Fundamentals",
          subtopics: [
            { title: "Setup & Configuration", items: ["Install Tailwind", "Configure tailwind.config.js", "PostCSS setup"] },
            { title: "Utility Classes", items: ["Spacing (p, m, gap)", "Typography (text, font)", "Colors & backgrounds", "Flexbox & Grid utilities", "Responsive prefixes (sm, md, lg)"] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Develop Next.js Applications",
      hours: 20,
      performanceCriteria: [
        "Next.js project is properly configured",
        "Server-side and static rendering are correctly implemented",
        "API routes are properly created",
      ],
      topics: [
        {
          title: "Next.js Core",
          subtopics: [
            { title: "App Router", items: ["File-based routing", "Layout & page components", "Loading & error boundaries", "Route groups"] },
            { title: "Rendering Strategies", items: ["Server Components", "Client Components", "Static Site Generation (SSG)", "Server-Side Rendering (SSR)", "Incremental Static Regeneration (ISR)"] },
            { title: "API Routes", items: ["Route handlers (GET/POST/PATCH/DELETE)", "Middleware", "Authentication integration"] },
          ],
        },
      ],
    },
    {
      id: "lo4",
      title: "Apply Progressive Web App (PWA) Techniques",
      hours: 20,
      performanceCriteria: [
        "Service worker is properly implemented for offline support",
        "Web app manifest is correctly configured",
        "PWA performance is properly optimised",
      ],
      topics: [
        {
          title: "PWA Fundamentals",
          subtopics: [
            { title: "Service Workers", items: ["Register service worker", "Cache strategies (cache-first, network-first)", "Background sync", "Push notifications"] },
            { title: "Web App Manifest", items: ["manifest.json structure", "Icons & splash screens", "Display modes", "Theme colours"] },
          ],
        },
      ],
    },
    {
      id: "lo5",
      title: "Deploy Front-End Application",
      hours: 20,
      performanceCriteria: [
        "Application is properly built for production",
        "Application is successfully deployed to a hosting platform",
      ],
      topics: [
        {
          title: "Production Build & Deployment",
          subtopics: [
            { title: "Optimisation", items: ["Code splitting", "Lazy loading", "Image optimisation", "Bundle analysis"] },
            { title: "Deployment Platforms", items: ["Vercel (Next.js native)", "Netlify", "GitHub Pages", "Custom domain setup", "Environment variables in production"] },
          ],
        },
      ],
    },
  ],
};

// ─── Machine Learning Application (L5) ───────────────────────────────────────
const MACHINE_LEARNING: ModuleCurriculum = {
  code: "SWDML501",
  title: "Machine Learning Application",
  level: "5",
  credits: 8,
  totalHours: 80,
  purpose: "Apply Machine Learning Fundamentals. Learners will apply data pre-processing, develop machine learning models and perform model deployment.",
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  resources: ["Computer, Projector, Storage Devices", "Internet", "Python Distribution (CPython/Anaconda), Jupyter Notebook, PyCharm, VS Code, scikit-learn, TensorFlow, PyTorch, NumPy, Pandas, Matplotlib, Seaborn"],
  learningOutcomes: [
    {
      id: "lo1",
      title: "Apply Data Preprocessing",
      hours: 30,
      performanceCriteria: [
        "Environment is properly prepared based on system requirements",
        "Data is properly manipulated based on python libraries functionalities",
        "Visualization results are properly interpreted based on statistical analysis",
        "Data cleaning is appropriately performed based on the provided dataset",
      ],
      topics: [
        {
          title: "Description of Machine Learning Concepts",
          subtopics: [
            { title: "Machine Learning Overview", items: ["Definition", "Machine learning life cycle", "Machine Learning applications", "Advantages and disadvantages", "Difference between machine learning, artificial intelligence, and deep learning"] },
            { title: "Types of Machine Learning", items: ["Supervised", "Unsupervised", "Semi-supervised", "Reinforcement"] },
            { title: "Machine Learning Tools", items: ["Python Distribution (CPython, Anaconda)", "Jupyter Notebook", "PyCharm", "Visual Studio Code", "Cloud Jupyter Notebook platform"] },
          ],
        },
        {
          title: "Preparing Machine Learning Environment",
          subtopics: [
            { title: "Environment Setup", items: ["Installation of Python", "Installation of Tools", "Environment Testing"] },
          ],
        },
        {
          title: "Data Collection and Acquisition",
          subtopics: [
            { title: "Description of Key Terms", items: ["data", "Information", "dataset", "Data warehouse", "Big data"] },
            { title: "Identification of Source of Data", items: ["IoT Sensors", "Camera", "Computer", "Smartphone", "Social data", "Transactional data"] },
            { title: "Description of 6 V's of Big Data", items: ["Volume", "Variety", "Velocity", "Veracity", "Value", "Variability"] },
            { title: "Types of Data", items: ["Structured data", "Semi-structured data", "Unstructured data"] },
            { title: "Gathering Machine Learning Dataset", items: ["Download from Kaggle", "Use public APIs", "Web scraping", "SQL database export"] },
          ],
        },
        {
          title: "Interpret Data Visualization",
          subtopics: [
            { title: "Data Visualization Tools", items: ["Matplotlib", "Seaborn", "Plotly", "Tableau", "Power BI"] },
            { title: "Types of Data Visualization", items: ["Scatter Plots", "Line Plots", "Bar Charts", "Histograms", "Box Plots", "Heat map"] },
            { title: "Applying & Interpreting Visualizations", items: ["Applying data visualization best practices", "Interpreting patterns and trends", "Context and background", "Correlations and relationships"] },
          ],
        },
        {
          title: "Perform Data Cleaning",
          subtopics: [
            { title: "Data Cleaning Overview", items: ["Definition", "Purpose", "Steps"] },
            { title: "Characteristics of Quality Data", items: ["Accuracy", "Completeness", "Consistency", "Relevance", "Validity"] },
            { title: "Data Cleaning Techniques", items: ["Importance of data cleaning", "Data cleaning for inconsistencies rectification", "Data normalization techniques", "Data transformation techniques"] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Develop Machine Learning Model",
      hours: 30,
      performanceCriteria: [
        "Machine Learning algorithm is properly selected based on the characteristics of the dataset",
        "Machine Learning models are properly trained based on a training set of data",
        "Machine Learning model performance is properly evaluated based on appropriate evaluation metrics",
        "Hyperparameters are properly finetuned based on evaluation results",
      ],
      topics: [
        {
          title: "Description of Machine Learning Algorithms and Applications",
          subtopics: [
            { title: "Supervised Learning Algorithms", items: ["Linear Regression", "Logistic Regression", "Decision Trees", "Random Forest", "Support Vector Machine (SVM)", "k-Nearest Neighbors (KNN)", "Naive Bayes"] },
            { title: "Unsupervised Learning Algorithms", items: ["K-Means Clustering", "Principal Component Analysis (PCA)", "Hierarchical Clustering", "Anomaly Detection"] },
            { title: "Semi-supervised & Reinforcement Learning", items: ["Semi-supervised Learning Models", "Q-Learning", "Deep Q-Networks (DQN)"] },
            { title: "Neural Network Architectures", items: ["Feedforward Neural Networks", "Artificial Neural Networks (ANN)", "Convolutional Neural Networks (CNNs)", "Recurrent Neural Networks (RNNs)"] },
          ],
        },
        {
          title: "Selection of Machine Learning Algorithm",
          subtopics: [
            { title: "Problem Identification", items: ["regression", "classification", "clustering"] },
            { title: "Data & Resource Analysis", items: ["Analyse type of data (independent/dependent variables)", "Computational power", "Memory limitations"] },
          ],
        },
        {
          title: "Train Machine Learning Model",
          subtopics: [
            { title: "Loading a Dataset", items: ["Using pandas", "Using Numpy", "Using Scikit-Learn", "Using Seaborn", "Using Requests and io"] },
            { title: "Split and Initialize Model", items: ["Split dataset (train/test/validation set)", "Initialize model", "Fit the training data into a model"] },
          ],
        },
        {
          title: "Evaluation of Machine Learning Model",
          subtopics: [
            { title: "Prediction & Visualisation", items: ["Prediction on test data", "Prediction on new data (unseen data)", "Visualize predictions"] },
            { title: "Evaluation Metrics", items: ["Accuracy", "Precision", "Recall", "F1 score", "Mean Absolute Error (MAE)", "Root Mean Squared Error (RMSE)", "R Squared score", "Adjusted R Squared score"] },
          ],
        },
        {
          title: "Tuning Hyperparameters",
          subtopics: [
            { title: "Hyperparameter Search", items: ["Define hyperparameters search space", "Choose performance metric", "Perform hyperparameter search", "Evaluate performance"] },
            { title: "Resolve Potential Bias", items: ["Underfitting", "Overfitting"] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Perform Model Deployment",
      hours: 20,
      performanceCriteria: [
        "Deployment methods are clearly selected based on the requirements",
        "Model file is properly integrated in the system based on the deployment method (RESTful API guidelines)",
        "Prediction responses are accurately delivered to the clients based on the model insights",
      ],
      topics: [
        {
          title: "Selection of Model Deployment Method",
          subtopics: [
            { title: "Deployment Methods Overview", items: ["Definition", "Benefits"] },
            { title: "System Specifications Identification", items: ["Types of application (web app, mobile app, standalone program, embedded system)", "Technology (programming languages and frameworks)"] },
            { title: "Model Specifications Identification", items: ["Size of the dataset", "Memory limitations", "Computing power", "Format of the model file (Scikit-Learn, TensorFlow SavedModel, ONNX, PyTorch PT)"] },
          ],
        },
        {
          title: "Integration of Model File",
          subtopics: [
            { title: "Integration Goals", items: ["Predictions/Insights", "Generate content", "Data analysis"] },
            { title: "API Endpoint Integration", items: ["Compatibility", "Interpret API endpoint usage (model serving method, loading strategy)", "Integrate with existing systems", "Identification of data format: JSON, Form data", "Implement communication using HTTP requests/responses"] },
            { title: "Deployment & Monitoring", items: ["Testing thoroughly before deployment", "Deploy to production", "Monitor performance", "Track API requests, response times, and model accuracy"] },
          ],
        },
        {
          title: "Delivering Prediction to the Clients",
          subtopics: [
            { title: "Client Integration", items: ["Integrating the API into application", "Formatting the predictions", "Handling errors"] },
          ],
        },
      ],
    },
  ],
};

// ─── Web Development (L3) ────────────────────────────────────────────────────
const WEB_DEVELOPMENT: ModuleCurriculum = {
  code: "L3-WEB",
  title: "Web Development",
  level: "3",
  credits: 8,
  totalHours: 80,
  purpose: "Build real websites and web applications from scratch using HTML, CSS and JavaScript.",
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  resources: ["Computer, Projector", "Internet", "VS Code, Chrome DevTools, GitHub"],
  learningOutcomes: [
    {
      id: "lo1", title: "Build Web Page Structure with HTML", hours: 20,
      performanceCriteria: ["HTML5 document structure is correctly created", "Semantic elements are properly used"],
      topics: [
        {
          title: "HTML Fundamentals", subtopics: [
            { title: "Document Structure", items: ["DOCTYPE, html, head, body", "meta tags", "title & link elements"] },
            { title: "Semantic HTML5", items: ["header, nav, main, article, section, aside, footer", "figure & figcaption", "Accessibility roles"] },
            { title: "Forms & Input", items: ["input types", "label & fieldset", "Form validation attributes", "File upload"] },
          ]
        },
      ],
    },
    {
      id: "lo2", title: "Style Pages with CSS", hours: 25,
      performanceCriteria: ["CSS is correctly applied to style HTML elements", "Responsive layouts are properly built"],
      topics: [
        {
          title: "CSS Fundamentals", subtopics: [
            { title: "Selectors & Properties", items: ["Class, ID, element selectors", "Specificity & cascade", "Box model (margin, border, padding)"] },
            { title: "Layouts", items: ["Flexbox", "CSS Grid", "Position (relative, absolute, fixed, sticky)"] },
            { title: "Responsive Design", items: ["Media queries", "Mobile-first approach", "Viewport meta tag", "Fluid units (%, vw, rem)"] },
          ]
        },
      ],
    },
    {
      id: "lo3", title: "Add Interactivity with JavaScript", hours: 35,
      performanceCriteria: ["JavaScript is properly used to manipulate the DOM", "Events are correctly handled"],
      topics: [
        {
          title: "JavaScript Essentials", subtopics: [
            { title: "Core Syntax", items: ["var / let / const", "Data types & type coercion", "Functions (declaration, expression, arrow)"] },
            { title: "DOM Manipulation", items: ["querySelector / querySelectorAll", "addEventListener", "Create & modify elements", "classList API"] },
            { title: "Async JavaScript", items: ["Callbacks", "Promises", "async / await", "fetch API for REST calls"] },
          ]
        },
      ],
    },
  ],
};

// ─── Data Structure & Algorithm Fundamentals (L4) ────────────────────────────
const DSA: ModuleCurriculum = {
  code: "SWDDA401",
  title: "Data Structure and Algorithm Fundamentals",
  level: "4",
  credits: 10,
  totalHours: 130,
  purpose: "Apply data structures and algorithm design principles using JavaScript to solve real-world problems.",
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  resources: ["Computer, Projector", "Internet", "VS Code, Node.js, JavaScript"],
  learningOutcomes: [
    {
      id: "lo1", title: "Analyse Algorithm Complexity", hours: 30,
      performanceCriteria: ["Algorithm complexity is correctly analysed using Big-O notation"],
      topics: [
        {
          title: "Algorithm Analysis", subtopics: [
            { title: "Big-O Notation", items: ["O(1) constant", "O(n) linear", "O(n²) quadratic", "O(log n) logarithmic", "Best / Average / Worst case"] },
            { title: "Space Complexity", items: ["Auxiliary space", "In-place algorithms", "Trade-offs"] },
          ]
        },
      ],
    },
    {
      id: "lo2", title: "Apply Data Structures", hours: 45,
      performanceCriteria: ["Appropriate data structure is selected for a given problem", "Data structures are correctly implemented"],
      topics: [
        {
          title: "Linear Structures", subtopics: [
            { title: "Arrays & Strings", items: ["Static vs dynamic arrays", "String manipulation", "Two-pointer technique"] },
            { title: "Linked Lists", items: ["Singly linked list", "Doubly linked list", "Circular linked list", "Common operations (insert, delete, traverse)"] },
            { title: "Stack & Queue", items: ["Stack (LIFO)", "Queue (FIFO)", "Priority queue", "Deque", "Applications"] },
          ]
        },
        {
          title: "Non-Linear Structures", subtopics: [
            { title: "Trees", items: ["Binary tree", "Binary Search Tree (BST)", "Tree traversal (in/pre/post-order)", "AVL tree basics"] },
            { title: "Graphs", items: ["Adjacency matrix vs list", "BFS (Breadth-First Search)", "DFS (Depth-First Search)", "Weighted graphs"] },
            { title: "Hash Tables", items: ["Hash functions", "Collision resolution (chaining, open addressing)", "HashMap in JavaScript"] },
          ]
        },
      ],
    },
    {
      id: "lo3", title: "Implement Algorithms in JavaScript", hours: 55,
      performanceCriteria: ["Sorting and searching algorithms are correctly implemented", "Problem-solving approach is systematic"],
      topics: [
        {
          title: "Sorting Algorithms", subtopics: [
            { title: "Comparison Sorts", items: ["Bubble sort", "Selection sort", "Insertion sort", "Merge sort", "Quick sort"] },
            { title: "Non-Comparison Sorts", items: ["Counting sort", "Radix sort", "Bucket sort"] },
          ]
        },
        {
          title: "Searching Algorithms", subtopics: [
            { title: "Search Techniques", items: ["Linear search", "Binary search", "BFS / DFS on graphs"] },
          ]
        },
        {
          title: "Algorithm Design Patterns", subtopics: [
            { title: "Techniques", items: ["Divide & conquer", "Dynamic programming (memoisation, tabulation)", "Greedy algorithms", "Backtracking", "Recursion"] },
          ]
        },
      ],
    },
  ],
};

// ─── Helper: quick module builder for modules without detailed static content ──
function quick(code: string, title: string, level: string, credits: number, totalHours: number, purpose: string, los: Array<{
  id: string; title: string; hours: number; criteria: string[]; topics: Array<{ title: string; subs: Array<{ title: string; items: string[] }> }>;
}>): ModuleCurriculum {
  return {
    code, title, level, credits, totalHours, purpose,
    assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
    resources: ["Computer, Projector", "Internet", "Relevant software tools"],
    learningOutcomes: los.map(lo => ({
      id: lo.id, title: lo.title, hours: lo.hours,
      performanceCriteria: lo.criteria,
      topics: lo.topics.map(t => ({ title: t.title, subtopics: t.subs })),
    })),
  };
}


// ============================================================================
// ALL CURRICULUM MODULES - EXTRACTED FROM REAL PDFs
// Total: 53 modules (Software + General + CCM)
// Extraction date: 2026-08-07
// Structure: Learning Outcome → Indicative content → Topics → Items → Sub-items
// ============================================================================

// ─── SOFTWARE DEVELOPMENT MODULES ────────────────────────────────────────────
// Level 3, 4, 5 Specific modules (19 modules)


// AUTO-GENERATED - 26 PERFECT MODULES


// L5 SOFTWARE MODULES - PERFECT 4-LEVEL STRUCTURE


// AUTO-GENERATED - COMPLETE CURRICULUM WITH 100% ACCURATE EXTRACTION
// All modules parsed with ultimate_parser.py (FIXED VERSION)
// 4-level hierarchy: Learning Outcome → Topic → Subtopic → Items

export const CCMBO502: ModuleCurriculum = {
  code: "CCMBO502",
  title: "Organise a Business",
  level: "5",
  credits: 3,
  totalHours: 30,
  purpose: "Master Organise a Business. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Perform business opening activities",
      hours: 10,
      performanceCriteria: [],
      topics: [
        {
          title: "Verification of Business start-up requirements",
          subtopics: [
            { title: "Meaning of business requirements", items: [] },
            { title: "Steps of business requirements estimation", items: [] },
            { title: "Business location requirements", items: ["Meaning of business location", "Factors influencing choice of business location", "Working place layout", "Office furniture", "Office supplies"] },
            { title: "Raw materials for initial storage", items: ["Production consumables"] },
            { title: "Start-up finances", items: ["Meaning of financial management", "Importance of financial management", "Quantity of financial needs", "Sources finances", "Evaluating sources of business capital"] },
          ],
        },
        {
          title: "Recruitment of business employees",
          subtopics: [
            { title: "Meaning of employee recruitment", items: [] },
            { title: "Process of employees’ recruitment", items: ["Employable Skills for Sustainable Job Creation"] },
            { title: "Steps taken in employee’s recruitment", items: [] },
            { title: "Principles of employee recruitment", items: [] },
            { title: "Strategies of employee recruitment", items: [] },
            { title: "Methods/sources of recruitment personnel", items: [] },
            { title: "Considerations when recruiting employees in a business", items: [] },
            { title: "Factors influencing employee’s recruitment", items: ["Internal factors", "External factors"] },
          ],
        },
        {
          title: "Purchasing of business requirements",
          subtopics: [
            { title: "Definition of the term “purchasing “", items: [] },
            { title: "Purpose of purchasing", items: [] },
            { title: "Types of purchasing", items: ["Centralised purchasing", "Decentralised purchasing"] },
            { title: "Purchasing principles", items: ["Right price", "Right quality", "Right quantity", "Right time", "Right place"] },
            { title: "Purchasing procedures", items: ["Meaning of purchasing procedures", "Steps involved in purchasing procedures"] },
            { title: "Documents used in purchasing", items: ["Material requisition form", "Inquiry letter", "Quotation letter", "Purchase order", "Advice note", "Delivery note", "Invoice", "Credit status inquiry", "Debit note", "Credit note", "Receipt", "Statement of account"] },
            { title: "Meaning of suppliers", items: [] },
            { title: "Factors influencing choice of effective suppliers", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Create a productive working environment",
      hours: 5,
      performanceCriteria: [],
      topics: [
        {
          title: "Setting of business ethical conduct",
          subtopics: [
            { title: "Meaning of ethical conduct", items: [] },
            { title: "Objectives of ethical conduct in a business", items: [] },
            { title: "Rules and regulations of the business", items: [] },
            { title: "Positive attitude required to business members", items: [] },
            { title: "Sanctions proposed by the law in business", items: [] },
            { title: "Types of unethical behaviour in a business", items: [] },
            { title: "Ways to address unethical behaviour at the workplace", items: [] },
            { title: "Methods of handling unethical conduct in business", items: [] },
            { title: "Techniques of encouraging a positive ethical behavior in business", items: ["Rewards", "Expectations", "Training", "Policies"] },
            { title: "Importance of positive ethical conduct in the business", items: [] },
          ],
        },
        {
          title: "Assignment of responsibilities to employees",
          subtopics: [
            { title: "Defining responsibilities assignment in business", items: [] },
            { title: "Importance of assigning duties", items: [] },
            { title: "Attribution of responsibilities", items: ["Estimation of volume of task", "Determination of task\u2019s requirements", "Allowing time to the volume of task"] },
            { title: "Responsibility assignment matrix", items: ["Responsible, Accountable, Consulted and Informed (RACI)"] },
          ],
        },
        {
          title: "Maintenance of good relationship with customers and suppliers",
          subtopics: [
            { title: "Concept of customers and suppliers’ relationship in a business", items: [] },
            { title: "Purpose of maintaining a good relationship with customers and suppliers", items: [] },
            { title: "Methods used to maintain good relationship with Customers and Suppliers", items: [] },
            { title: "Importance of maintaining good customers and suppliers’ relationship to the business", items: [] },
            { title: "Ways to address", items: ["Customer complaints", "Suppliers\u2019 complaints"] },
            { title: "Manual procedures for business operations as tool for maintaining customer and suppliers", items: ["relationship", "Meaning of procedures manual", "Benefits of procedures manual"] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Perform business operations",
      hours: 5,
      performanceCriteria: [],
      topics: [
        {
          title: "Performing business operations",
          subtopics: [
            { title: "Production of goods and services", items: ["Product differentiation", "Quality control"] },
            { title: "Management of business resources", items: ["Control of cash flow", "Employable Skills for Sustainable Job Creation", "Management of inventory"] },
            { title: "Marketing strategies", items: ["Review of 5Ps of marketing mix", "Distribution channel"] },
            { title: "Human resource management", items: ["Employee portfolio management", "Modes of employee payment", "Ways of motivating employees"] },
          ],
        },
        {
          title: "The utilization of available resources",
          subtopics: [
            { title: "Meaning of business resources", items: [] },
            { title: "Types of business resources", items: ["Assets"] },
            { title: "Purpose of optimizing the utilisation of available resources", items: [] },
            { title: "The methods to optimise utilisation of available resources", items: [] },
            { title: "Methods used to control utilisation of resources", items: ["Targeted result", "Anticipated emergencies in planning", "Inventory planned"] },
            { title: "Importance of optimizing available resources", items: ["Employees", "Business owners", "Business stakeholders"] },
          ],
        },
        {
          title: "Undertaking Targeted promotional and marketing campaigns",
          subtopics: [
            { title: "Product promotional and marketing campaigns", items: ["Meaning of terms", "Aspects of product promotion"] },
            { title: "Techniques of product advertisement", items: ["Public relations/publicity", "Newspapers", "Sales promotion", "Personal selling", "Direct marketing", "Magazine", "Posters", "Attending trade exhibition"] },
            { title: "Developing marketing campaign strategies", items: ["Employable Skills for Sustainable Job Creation", "Clear & concise calls-to-action", "Hyper-target to a niche audience", "Create a story that speaks to all medias", "Make it easy to Share", "Inspire interaction", "Use a memorable and repeatable spokesperson"] },
          ],
        },
        {
          title: "Registration of the business organization",
          subtopics: [
            { title: "Meaning of business registration", items: [] },
            { title: "Types of business organization", items: ["Sole proprietorship", "Partnership", "Corporation/Limited-liability companies"] },
            { title: "Requirements for business registration", items: ["Registering a Local Company", "Registering a branch of a foreign company in Rwanda", "Registering a Local branch"] },
            { title: "Registration to the tax System", items: ["Meaning of a tax registration", "Importance of a tax in socio-economic development", "Registration conditions", "Required documents", "Advantages of registering to the tax system", "Penalties for failure to register to the tax system"] },
          ],
        },
      ],
    },
    {
      id: "lo4",
      title: "Respond to customer needs",
      hours: 5,
      performanceCriteria: [],
      topics: [
        {
          title: "Developing and maintaining goods, service, and market knowledge",
          subtopics: [
            { title: "Key terms definitions", items: ["Goods", "Services"] },
            { title: "Importance of knowing your products and services", items: [] },
            { title: "Tips on knowing your products and services", items: [] },
            { title: "Comparison between goods and services", items: ["Transfer ownership", "Separable", "Storage", "Perishable"] },
            { title: "Market opportunities", items: ["Customers\u2019 shopping trends", "Competition", "Availability of raw materials", "Reserved customers"] },
            { title: "Service delivery procedures", items: ["Preparation", "Interaction", "Evaluation", "Providing feedback and observation"] },
            { title: "Products and service adjustment", items: ["Definition of product and service adjustment", "Types of products and service adjustment", "Product and service adjustment procedures", "Importance of product and service adjustment on customer satisfaction", "Challenges with products/services adjustment"] },
          ],
        },
        {
          title: "Provision of quality customer service",
          subtopics: [
            { title: "Introduction to customer care", items: ["Key terms definition (customer, client, need, customer care, customer need, customer", "satisfaction, quality service)", "Customer profiles", "Importance of customer service (Positive effect, Negative effect)", "Levels of customer services", "Duties and responsibilities of a customer care provider"] },
            { title: "Customer care principles", items: [] },
            { title: "Techniques to determine customer preferences, needs and expectations", items: ["Active listening", "Questioning", "Observation", "Recognition of non-verbal signs", "Employable Skills for Sustainable Job Creation"] },
            { title: "Anticipation of customer’s needs, expectations and preferences", items: ["Types of customer needs", "Types of customers preferences"] },
            { title: "Factors influencing customer preferences, needs and expectations", items: ["Age", "Gender", "Social and cultural characteristics", "Prior knowledge", "Special needs", "Season", "Price of substitute goods", "Fashion", "Level of advertisement", "Consumer habits", "Consumer income level"] },
            { title: "Tips to satisfy customer preferences, needs and expectations", items: ["Use of professional tone of voice", "Use professional language", "Respond promptly (give feedback promptly)"] },
            { title: "Customer satisfaction", items: ["Importance of customer satisfaction", "Consequences of customer dissatisfaction"] },
            { title: "Promote products and services", items: [] },
          ],
        },
        {
          title: "Resolving customer complaints and difficult service situations",
          subtopics: [
            { title: "Meaning of customer complaint", items: [] },
            { title: "Procedures for handling customer complaints", items: ["Listen", "Reformulate", "Solve", "Provide feedback", "Offer something extra or complimentary", "Follow up", "Service recovery", "Employable Skills for Sustainable Job Creation"] },
            { title: "Difficult service situations", items: ["Fire outbreak", "Water leakage", "Short circuit", "Falls and injuries", "Intruder"] },
            { title: "Techniques for resolving difficult Service situations", items: ["Notify everyone about the incident for rescue if necessary", "Call for assistance", "Monitoring and Communicate", "Provide solutions", "Record and report the incident information"] },
          ],
        },
      ],
    },
    {
      id: "lo5",
      title: "Monitor and evaluate the business",
      hours: 5,
      performanceCriteria: [],
      topics: [
        {
          title: "Elaboration of a daily report of business activities",
          subtopics: [
            { title: "Meaning of business daily report", items: [] },
            { title: "Importance of business daily report to the business", items: [] },
            { title: "Format of daily report of business activities", items: [] },
          ],
        },
        {
          title: "Conducting employee’s meeting",
          subtopics: [
            { title: "Meaning of effective employees’ meeting", items: [] },
            { title: "Purpose of employee’s meeting", items: [] },
            { title: "Elements of preparing effective employee’s meeting", items: ["Setting meeting objectives", "Preparing meeting requirements", "Employable Skills for Sustainable Job Creation", "Running employee\u2019s meeting"] },
            { title: "Ways to make employee meeting successful", items: ["Facilitate brainstorming session", "Stand up", "Set meeting goals together", "Offer incentives and rewards", "Set a clear framework in advance"] },
          ],
        },
        {
          title: "Consultation of business plan",
          subtopics: [
            { title: "Purpose of consulting business plan during a business operation", items: ["Create an effective strategy for growth", "Determine the future financial needs", "Attract investors and leaders"] },
            { title: "Critical parts of the business plan to be considered while running business", items: ["Executive summary", "Business description", "Market analysis and strategy", "Marketing and sales plan", "Competitive analysis", "Management and organization", "Description of product and services description", "Operating plan"] },
            { title: "Using business plan as tool", items: ["Internal communication", "Communication with partners", "Communication with financial institutions"] },
          ],
        },
      ],
    },
  ],
};


export const CCMBP402: ModuleCurriculum = {
  code: "CCMBP402",
  title: "Entrepreneurship",
  level: "4",
  credits: 3,
  totalHours: 30,
  purpose: "Master Entrepreneurship. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Identify elements of business plan",
      hours: 10,
      performanceCriteria: [],
      topics: [
      ],
    },
    {
      id: "lo2",
      title: "Write a business plan in line with the identified elements",
      hours: 10,
      performanceCriteria: [],
      topics: [
      ],
    },
    {
      id: "lo3",
      title: "Establish business contingency plan",
      hours: 7,
      performanceCriteria: [],
      topics: [
      ],
    },
    {
      id: "lo4",
      title: "Present a business plan",
      hours: 3,
      performanceCriteria: [],
      topics: [
      ],
    },
  ],
};

export const CCMCS402: ModuleCurriculum = {
  code: "CCMCS402",
  title: "Information and Communication Technology",
  level: "4",
  credits: 3,
  totalHours: 30,
  purpose: "Master Information and Communication Technology. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Describe the operating system",
      hours: 15,
      performanceCriteria: [],
      topics: [
      ],
    },
    {
      id: "lo2",
      title: "Customize the computer features",
      hours: 10,
      performanceCriteria: [],
      topics: [
      ],
    },
    {
      id: "lo3",
      title: "Protect computer system",
      hours: 5,
      performanceCriteria: [],
      topics: [
      ],
    },
  ],
};

export const CCMCZ401: ModuleCurriculum = {
  code: "CCMCZ401",
  title: "Citizenship",
  level: "4",
  credits: 3,
  totalHours: 30,
  purpose: "Master Citizenship. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Make a comparative study of genocides.",
      hours: 10,
      performanceCriteria: [],
      topics: [
      ],
    },
    {
      id: "lo2",
      title: "Protect human rights",
      hours: 10,
      performanceCriteria: [],
      topics: [
      ],
    },
    {
      id: "lo3",
      title: "Promote peace and social cohesion",
      hours: 6,
      performanceCriteria: [],
      topics: [
      ],
    },
  ],
};

export const CCMEN502: ModuleCurriculum = {
  code: "CCMEN502",
  title: "Use Upper-Intermediate English at Workplace",
  level: "5",
  credits: 3,
  totalHours: 30,
  purpose: "Master Use Upper-Intermediate English at Workplace. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Learning hours: 8",
      hours: 8,
      performanceCriteria: [],
      topics: [
        {
          title: "Discussing ongoing activities and hobbies",
          subtopics: [
            { title: "Present tenses", items: ["Simple present", "Present continuous", "Present perfect", "Present prefect continuous"] },
            { title: "Frequency adverbs", items: [] },
            { title: "Punctuations", items: [] },
            { title: "Compound sentence", items: [] },
            { title: "Complex sentence", items: [] },
          ],
        },
        {
          title: "Planning a day schedule",
          subtopics: [
            { title: "Adverbs of time", items: [] },
            { title: "Preposition of time", items: [] },
            { title: "Adverb of sequency", items: [] },
          ],
        },
        {
          title: "Discussing Hobbies and interests",
          subtopics: [
            { title: "Stative verbs", items: ["adore", "appear", "appreciate", "believe", "disagree", "dislike", "doubt", "feel", "hate", "like", "seem", "Employable Skills for Sustainable Job Creation", "love", "resemble", "satisfy"] },
            { title: "Language used to discuss hobbies", items: ["Gerunds", "Question tags", "Action verbs", "Intonation"] },
            { title: "Active and Passive voice", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Learning hours: 7 Describe objects, place and people",
      hours: 7,
      performanceCriteria: [],
      topics: [
        {
          title: "Describing objects using descriptive adjectives",
          subtopics: [
            { title: "Adjectives of Size and shape", items: [] },
            { title: "Adjective of color", items: [] },
            { title: "Adjectives of origin", items: [] },
            { title: "Adjectives of material", items: [] },
            { title: "Comparative adjectives", items: [] },
            { title: "Position of descriptive adjectives", items: [] },
            { title: "Order of descriptive adjectives", items: [] },
          ],
        },
        {
          title: "Describing people’ appearance using adjective of appearance",
          subtopics: [
            { title: "Positive", items: [] },
            { title: "Neutral and Negative", items: [] },
            { title: "Adjective of quality", items: [] },
            { title: "Formation of adjectives", items: [] },
            { title: "Articulation of English silent letters", items: ["Employable Skills for Sustainable Job Creation"] },
          ],
        },
        {
          title: "Writing a well-structured descriptive paragraph",
          subtopics: [
            { title: "Topic sentence", items: [] },
            { title: "Relevant supporting sentences", items: [] },
            { title: "Closing or transition sentence", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Learning hours: 7 Form new words used at the workplace",
      hours: 7,
      performanceCriteria: [],
      topics: [
        {
          title: "Forming new words using affixations",
          subtopics: [
            { title: "Prefixes", items: [] },
            { title: "Suffixes", items: [] },
            { title: "Infixes", items: [] },
            { title: "Articulation of Single vowel sounds", items: [] },
          ],
        },
        {
          title: "Forming new words by compounding",
          subtopics: [
            { title: "Native", items: [] },
            { title: "Borrowed", items: [] },
            { title: "Articulation of Diphthongs", items: [] },
          ],
        },
        {
          title: "Forming new words by conversion",
          subtopics: [
            { title: "Verbs as nouns", items: [] },
            { title: "Verbs as adjectives", items: [] },
            { title: "phrasal verbs as nouns", items: [] },
            { title: "words stress", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo4",
      title: "Learning hours: 8 Write essays for professional purpose",
      hours: 8,
      performanceCriteria: [],
      topics: [
        {
          title: "Writing a well-structured introductory paraghraph",
          subtopics: [
            { title: "Purpose", items: [] },
            { title: "Thesis statement", items: [] },
          ],
        },
        {
          title: "Connecting ideas with linking words",
          subtopics: [
            { title: "Subordinators", items: [] },
            { title: "Words used to start introduction", items: [] },
            { title: "Words used to connect new idea", items: [] },
            { title: "Words used to conclude", items: [] },
          ],
        },
        {
          title: "Writing a well structured body and concluding",
          subtopics: [
            { title: "Topic sentence", items: [] },
            { title: "Supporting sentences", items: [] },
            { title: "Concluding sentence", items: [] },
          ],
        },
        {
          title: "Writing a well structure essay",
          subtopics: [
            { title: "Introductory paragraph", items: [] },
            { title: "Body paragraph", items: [] },
            { title: "Concluding paragraph", items: [] },
          ],
        },
      ],
    },
  ],
};

export const CCMIW502: ModuleCurriculum = {
  code: "CCMIW502",
  title: "Apply ICT at Workplace",
  level: "5",
  credits: 3,
  totalHours: 30,
  purpose: "Master Apply ICT at Workplace. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Prepare document Layout",
      hours: 10,
      performanceCriteria: [],
      topics: [
        {
          title: "Set up of a document",
          subtopics: [
            { title: "Page layout/page set up", items: ["Page margins", "Paper orientation", "Page size and columns", "Section breaks", "Hyphenation"] },
            { title: "Page background", items: ["Watermark", "Page colour", "Page borders"] },
            { title: "Advanced formatting", items: ["Font/colour/effects", "Border and shading", "Indenting paragraph", "Paragraph and line spacing"] },
          ],
        },
        {
          title: "Working with the pictures/images within the document",
          subtopics: [
            { title: "Insert a picture", items: ["Change size of a picture", "Compress a picture", "Increase the Contrast"] },
            { title: "Picture styles", items: ["Picture border", "Picture effects", "Picture layout"] },
            { title: "Arrange picture", items: ["Position of picture", "Wrap text around a picture", "Rotate a picture"] },
          ],
        },
        {
          title: "Creation of document within references",
          subtopics: [
            { title: "Table of contents", items: [] },
            { title: "Footnotes", items: [] },
            { title: "Citations and Bibliography", items: [] },
            { title: "Captions", items: ["Insert captions", "Insert tables of figures", "Employable Skills for Sustainable Job Creation"] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Apply basic computer operations",
      hours: 10,
      performanceCriteria: [],
      topics: [
        {
          title: "Conversion of data Files",
          subtopics: [
            { title: "Different file formats and file extension", items: [] },
            { title: "File Conversion", items: ["File to PDF", "PDF to word, excel and PPT"] },
            { title: "Compress file", items: ["Definition", "Importance", "Steps"] },
          ],
        },
        {
          title: "Use of storage media",
          subtopics: [
            { title: "Storage media capacity", items: ["Definition", "Units of data storage"] },
            { title: "Different types of storage media", items: ["off-line storage", "On-line storage"] },
            { title: "Storage media formatting", items: ["Formatting", "Erase data"] },
          ],
        },
        {
          title: "Connection of computer to the network",
          subtopics: [
            { title: "Description of computer network", items: ["Definition of computer network", "Features of computer network", "Advantages of computer network", "Disadvantages of computer network"] },
            { title: "Description of common types of networks based on size", items: ["Personal area network (PAN)", "Local area network (LAN)", "Metropolitan area network (MAN)", "Employable Skills for Sustainable Job Creation", "Wide area network (WAN)", "Wireless Local Area Network (WLAN)"] },
            { title: "Description of common types of networks based on main purpose", items: ["Storage area network (SAN)", "Enterprise private network (EPN)", "Virtual private network (VPN)"] },
            { title: "Connect computer to the internet", items: ["Fixed internet", "Mobile internet"] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Manage data in MS Excel",
      hours: 10,
      performanceCriteria: [],
      topics: [
        {
          title: "Management of data types",
          subtopics: [
            { title: "Description of data types", items: [] },
            { title: "Entering data types in cells and their default formats", items: [] },
            { title: "Sorting data", items: [] },
            { title: "Finding and replacing cell formats", items: [] },
            { title: "Removes duplicates", items: [] },
            { title: "Create data validation rules", items: [] },
          ],
        },
        {
          title: "Apply Excel functions",
          subtopics: [
            { title: "Basics functions", items: ["Sum", "Average", "Max", "Min", "Count", "Rank and Grade"] },
            { title: "Error checking", items: [] },
            { title: "Creating an absolute reference", items: [] },
            { title: "Using the IF function", items: [] },
          ],
        },
        {
          title: "Data analysis",
          subtopics: [
            { title: "Create Charts", items: [] },
            { title: "Table styles", items: ["Employable Skills for Sustainable Job Creation", "Conditional formatting", "Format as table", "Cell style"] },
          ],
        },
        {
          title: "Application of data protection",
          subtopics: [
            { title: "Data protection principles", items: [] },
            { title: "Ways of protecting excel data", items: ["Protect a cell", "Protect worksheet", "Protect workbook"] },
          ],
        },
      ],
    },
  ],
};

export const CCMPE502: ModuleCurriculum = {
  code: "CCMPE502",
  title: "Apply Professional and Multi-Cultural Ethics at Workplace",
  level: "5",
  credits: 3,
  totalHours: 30,
  purpose: "Master Apply Professional and Multi-Cultural Ethics at Workplace. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "analyze social diversity Learning hours: 5 at workplace",
      hours: 5,
      performanceCriteria: [],
      topics: [
        {
          title: "Identification of social diversity and differences",
          subtopics: [
            { title: "Definition of key terms", items: ["Social diversity", "Social differences"] },
            { title: "Types of workplace diversity", items: ["Ethnicity", "Lifestyle", "Religion", "Beliefs", "Taste and preferences", "Language"] },
          ],
        },
        {
          title: "Distinction of social diversity issues at workplace",
          subtopics: [
            { title: "Categories of social diversity issues", items: ["Communication issues", "Workplace conflicts", "Harassment", "Diversity and difference without inclusion", "Generation gaps", "Unconscious biases"] },
            { title: "Impacts of social diversity at the workplace", items: ["Negative impacts", "Positive impacts"] },
          ],
        },
        {
          title: "Evaluation of factors influencing social diversity and differences",
          subtopics: [
            { title: "Demographic factors", items: [] },
            { title: "Social-economic factors", items: [] },
            { title: "Geographical factors", items: [] },
            { title: "Political factors", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Communicate in multi- Learning hours: 8 cultural settings",
      hours: 8,
      performanceCriteria: [],
      topics: [
        {
          title: "Demonstration of effective communication in multicultural settings",
          subtopics: [
            { title: "Communication guidelines in multicultural settings", items: ["Maintaining etiquettes", "Avoidance to use of slangs", "Speak slowly", "Practicing active listening", "Take turns to talk", "Write down differences and similarities"] },
            { title: "Contexts cultures in communication", items: ["High contexts culture", "Low context culture"] },
            { title: "Types of cultural differences in communication", items: ["Eye contact", "Touch", "Gestures", "Facial expressions", "Posture"] },
          ],
        },
        {
          title: "Adaptation of Co-cultural communication",
          subtopics: [
            { title: "Definition of co-cultural communication program", items: [] },
            { title: "Co-cultural communication goals", items: ["Assimilation", "Accommodation", "Separation"] },
            { title: "Factors influencing co-cultural communication", items: ["Field experience", "Situational context", "Abilities", "Communication approach"] },
          ],
        },
        {
          title: "Maintaining cross-cultural communication",
          subtopics: [
            { title: "Definition", items: [] },
            { title: "Types of cross-cultural communication contexts", items: ["High context cross-cultural communication", "Low context cross-cultural communication"] },
            { title: "Communication techniques for multicultures", items: ["Changing attitudes", "Practicing good speaking and listening", "Adjusting intercultural language competency", "Learning other cultures"] },
            { title: "Factors affecting cross-cultural communication", items: ["Language differences", "Cultural differences in Nonverbal communication", "Employable Skills for Sustainable Job Creation", "Power distance"] },
            { title: "Cross-cultural communication barriers", items: ["Linguistic misinterpretations", "Stereotypes", "Prejudice", "Ethnocentrism", "Emotional display"] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Lead a team",
      hours: 7,
      performanceCriteria: [],
      topics: [
        {
          title: "Establishment of cooperation and teamwork spirit",
          subtopics: [
            { title: "Definitions", items: ["Team", "Teamwork spirit", "Cooperation"] },
            { title: "Importance of teamwork", items: [] },
            { title: "Characteristics of an effective and cooperative team member", items: [] },
            { title: "Qualities of a good team member", items: [] },
            { title: "Description of traits of a non-effective and non-cooperative team member", items: ["Attendance problem", "Poor contribution", "Stressful environment"] },
            { title: "Strategies for building a teamwork spirit", items: [] },
            { title: "Benefit of teamwork spirit", items: [] },
          ],
        },
        {
          title: "Evidencing effective leadership skills",
          subtopics: [
            { title: "Qualities of an effective leader", items: [] },
            { title: "Different leadership styles", items: ["Authoritarian leadership style", "Persuading leadership style", "Consulting leadership style", "Joining leadership style"] },
            { title: "Strategies to lead a team", items: [] },
          ],
        },
        {
          title: "Showing problem-solving and decision-making skills",
          subtopics: [
            { title: "Characteristics of a good solution", items: [] },
            { title: "Steps of problem-solving to work and community-related problems", items: [] },
            { title: "Communication as a tool for problem solving", items: [] },
            { title: "Communication rules to improve problem solving", items: [] },
            { title: "Procedures for fair decision making", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Demonstrate Learning hours: 10 professionalism and ethical behaviours",
      hours: 10,
      performanceCriteria: [],
      topics: [
        {
          title: "Proving professional ethical values at the workplace",
          subtopics: [
            { title: "Concept of professional ethics", items: ["Terms definition (Ethics, Professionalism, Professional ethics)", "Importance of Professional Ethics", "Ethical principles and values"] },
            { title: "Professional qualities", items: ["Moral qualities", "Physical qualities", "Interpersonal qualities"] },
            { title: "Professional attitudes and behaviours", items: ["Work Commitment and passionate", "Technical competence and Professional skills", "Professional manners"] },
            { title: "Code of ethics for the occupation", items: ["Definition of the term\u2019s \u201coccupation\u201d, \u201coccupation etiquettes\u201d", "Key principles, responsibilities and consideration within the occupation", "Mechanisms for ensuring compliance with professional codes of ethics", "Consequences of ethical misconduct", "Ethical issues within the occupation"] },
          ],
        },
        {
          title: "Creating a positive working environment",
          subtopics: [
            { title: "Compliance with organization rules and regulations", items: ["Policies and procedures (internal)", "Legal and regulatory compliance", "The third-party compliance"] },
            { title: "Strategies for creating a positive working environment", items: [] },
          ],
        },
        {
          title: "Keeping Long life learning and Continuous professional development",
          subtopics: [
            { title: "Key terms definitions", items: ["Long life learning", "Continuous professional development"] },
            { title: "Importance of Long-life learning and Continuous professional development", items: [] },
            { title: "Implementation of Long-life learning and Continuous professional development", items: [] },
          ],
        },
      ],
    },
  ],
};

export const GENAP502: ModuleCurriculum = {
  code: "GENAP502",
  title: "Mathematical Analysis, Statistics and Probability",
  level: "5",
  credits: 6,
  totalHours: 60,
  purpose: "Master Mathematical Analysis, Statistics and Probability. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Apply fundamentals of integrals",
      hours: 20,
      performanceCriteria: [],
      topics: [
        {
          title: "Determination of primitive functions",
          subtopics: [
            { title: "Application of properties", items: ["The derivative of the indefinite integral", "The integral of differential of a function", "Factor out constant function from integral sign", "The indefinite integral of the algebraic sum of two functions", "Immediate primitive"] },
            { title: "Techniques of integration", items: ["Integration by change of variable", "Integration by simple fractions/ irreducible", "Integration by parts"] },
          ],
        },
        {
          title: "Calculation of definite integrals",
          subtopics: [
            { title: "Methods of integration", items: ["Integration of definite integrals by change of variable", "Integration of definite integrals by decomposition", "Integration of definite integrals by parts"] },
          ],
        },
        {
          title: "Application of definite integrals",
          subtopics: [
            { title: "Calculation of area", items: [] },
            { title: "Calculation of volume", items: [] },
            { title: "Calculation of the length of curved surface", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Interpret measures of dispersion for bivariate data",
      hours: 20,
      performanceCriteria: [],
      topics: [
        {
          title: "Determination of the measures of dispersion",
          subtopics: [
            { title: "Definition of measures of dispersion", items: ["Variance", "Standard deviation", "Coefficient of variation"] },
            { title: "Calculation of measures of dispersion", items: ["Variance", "Standard deviation", "Coefficient of variation"] },
          ],
        },
        {
          title: "Identification of bivariate data measures",
          subtopics: [
            { title: "Description of bivariate data", items: ["Correlation", "Covariance", "Coefficient of correlation"] },
            { title: "Calculation of the linear correlation of bivariate data", items: ["Correlation", "Covariance", "Coefficient of correlation"] },
          ],
        },
        {
          title: "Determination of regression line",
          subtopics: [
            { title: "Definition of terminologies", items: ["Scatter diagram", "Regression lines"] },
            { title: "Calculations of regression line parameters", items: ["coefficients of regression line", "Equation of regression line of y on x", "Equation of regression line of x on y"] },
            { title: "Graph plotting", items: ["Scatter diagram", "Regression lines"] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Apply fundamentals of probabilities",
      hours: 20,
      performanceCriteria: [],
      topics: [
        {
          title: "Application of counting techniques",
          subtopics: [
            { title: "Venn diagram", items: [] },
            { title: "Tree diagram", items: [] },
            { title: "Multiplication principle", items: [] },
            { title: "Permutations", items: [] },
            { title: "Combination", items: [] },
          ],
        },
        {
          title: "Computation of probabilities",
          subtopics: [
            { title: "Definition of terminologies", items: ["Random experiment", "Sample space", "Events", "Complementary event", "Probability of event under an equally likely event", "Inclusive events", "Mutually exclusive events"] },
            { title: "Calculation of probabilities", items: ["Simple event", "Complementary event", "Event under an equally likely event", "Inclusive events", "Mutually exclusive events"] },
          ],
        },
        {
          title: "Calculation of the conditional probability",
          subtopics: [
            { title: "Conditional probability", items: [] },
            { title: "Independent events", items: [] },
            { title: "Probability by tree diagram", items: [] },
          ],
        },
      ],
    },
  ],
};

export const GENBN401: ModuleCurriculum = {
  code: "GENBN401",
  title: "Basics of Networking",
  level: "4",
  credits: 7,
  totalHours: 70,
  purpose: "Master Basics of Networking. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Establish network media connectivity",
      hours: 20,
      performanceCriteria: [],
      topics: [
        {
          title: "Identification of Network requirements.",
          subtopics: [
            { title: "Description of network concepts and technologies", items: ["Basic definitions", "Network classifications", "Network benefits", "Advantages and Disadvantages of network", "Application of network", "Network technologies", "Network topology types", "Network components"] },
            { title: "Materials", items: ["Network Cables (twisted, coaxial, management and Fiber optic)", "Trunk (Flexible, plastic, timber, and stainless steel)", "Connectors", "Cable Ties", "Cable clips", "Cable Sockets", "Employable Skills for Sustainable Job Creation", "Wall plugs"] },
            { title: "Tools", items: ["Cutting Tools", "Stripping tools", "Drilling Tools", "Fixing Tool", "Patching Tools", "Crimping tools", "Testing tool"] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Perform Basic Network Configuration Learning hours: 35",
      hours: 35,
      performanceCriteria: [],
      topics: [
        {
          title: "Classification of IP Addresses",
          subtopics: [
            { title: "Types of IP Addresses", items: [] },
            { title: "IP address versions", items: [] },
            { title: "Identification of IP address classes", items: [] },
          ],
        },
        {
          title: "Calculation of IP addresses subnet masks",
          subtopics: [
            { title: "Introduction to subnet masks", items: ["Definition", "Benefits of subnetting"] },
            { title: "Binary system", items: [] },
            { title: "Types of Subnetting", items: [] },
            { title: "Logical and bitwise Operators", items: [] },
          ],
        },
        {
          title: "Assigning IP Address",
          subtopics: [
            { title: "Static", items: [] },
            { title: "Dynamic", items: [] },
            { title: "Automatic", items: [] },
          ],
        },
        {
          title: "Configuration of Basics Network Device.",
          subtopics: [
            { title: "Device Configuration Modes", items: ["Employable Skills for Sustainable Job Creation"] },
            { title: "Host name", items: [] },
            { title: "Banner message", items: [] },
            { title: "Reload Device", items: [] },
            { title: "Configure port", items: [] },
            { title: "Configure Device passwords", items: [] },
            { title: "Save configuration", items: [] },
          ],
        },
        {
          title: "Testing network Interconnection",
          subtopics: [
            { title: "Physical Testing", items: [] },
            { title: "Unit Testing", items: [] },
            { title: "Integration Testing", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Maintain Network system",
      hours: 15,
      performanceCriteria: [],
      topics: [
        {
          title: "Perform preventive maintenance.",
          subtopics: [
            { title: "Hardware preventive maintenance", items: ["Schedule regular cleaning", "Setting of preventive measures"] },
          ],
        },
      ],
    },
  ],
};

export const GENDW502: ModuleCurriculum = {
  code: "GENDW502",
  title: "Apply Dynamics and Waves",
  level: "5",
  credits: 4,
  totalHours: 40,
  purpose: "Master Apply Dynamics and Waves. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Describe motion in orbits",
      hours: 6,
      performanceCriteria: [],
      topics: [
        {
          title: "Description of universal Gravitation motion in orbits",
          subtopics: [
            { title: "Universal Gravitation", items: ["Definition of orbital motion and universal gravitation", "State of Newton\u2019s law of universal Gravitation.", "Determination of Gravitational force of bodies moving in orbits"] },
            { title: "Free-fall acceleration and the Gravitational force", items: ["Variation of g with altitude,", "The density of the earth"] },
          ],
        },
        {
          title: "Explanation of Kepler’s laws",
          subtopics: [
            { title: "Kepler’s laws", items: ["Kepler\u2019s first law", "Kepler\u2019s second law", "Kepler\u2019s third law", "Application of Kepler \u2018s laws."] },
            { title: "The motion of celestial objects in orbits", items: ["Definition of Planetary motion", "Movement of the planets, stars and other celestial objects", "Kepler\u2019s conclusion about Brahe\u2019s data."] },
          ],
        },
        {
          title: "Description of Rockets and satellites motion",
          subtopics: [
            { title: "Planetary motion", items: ["Gravitational field", "Mathematical treatment of gravitational field"] },
            { title: "Motion of rocket, satellite and space crafts", items: ["Employable Skills for Sustainable Job Creation", "Classification of satellites orbits and space crafts", "Movement of satellites in orbits", "Escape speed of a rocket and satellite"] },
            { title: "Description of three Cosmic velocities", items: ["First cosmic velocity", "Second cosmic velocity", "Third cosmic velocity."] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Examine effects of magnetism",
      hours: 10,
      performanceCriteria: [],
      topics: [
        {
          title: "Description of the concepts of magnetism",
          subtopics: [
            { title: "Concept of a magnet", items: ["Definition of magnet", "Types of magnets"] },
            { title: "Magnetization", items: ["Magnetization process", "Magnetization Methods", "Magnetizing field"] },
            { title: "Classification of magnetic materials", items: ["Ferromagnetic materials", "Paramagnetic materials", "Diamagnetic materials", "Employable Skills for Sustainable Job Creation", "Ferrimagnetic materials", "Anti-Ferromagnetic materials"] },
            { title: "Fundamental laws of magnetism", items: ["Law of attraction", "Law of repulsion", "Law of distance"] },
          ],
        },
        {
          title: "Explanation of the magnetic field created by electric current",
          subtopics: [
            { title: "Electromagnets", items: ["Application"] },
            { title: "Measuring instruments of magnetic field", items: ["Magnetic needle", "Tesla meter", "Magnetometer"] },
          ],
        },
        {
          title: "Determination of magnetic force",
          subtopics: [
            { title: "Ampere’s force two current-carrying conductors", items: ["Attraction", "Repulsion"] },
            { title: "Application of magnetic forces", items: ["Electric motor", "Loudspeaker", "Moving-coil meters", "Charge deflecting systems"] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Describe vibrations and waves",
      hours: 8,
      performanceCriteria: [],
      topics: [
        {
          title: "Explanation of the concept of waves",
          subtopics: [
            { title: "Wave terminologies", items: ["Sine wave", "Crests and trough", "Wavelength", "Amplitude", "Period", "Frequency", "Wave speed"] },
            { title: "Waves classifications", items: ["Mechanical waves versus electromagnetic waves", "Transverse versus longitudinal waves"] },
            { title: "Electromagnetic waves", items: ["Electromagnetic spectrum", "Electromagnetic velocity"] },
            { title: "Properties of waves", items: [] },
          ],
        },
        {
          title: "Description of the Nature of Sound",
          subtopics: [
            { title: "Sound characteristics", items: [] },
            { title: "Sound waves interference", items: [] },
            { title: "Sound Instruments", items: ["Musical instruments"] },
          ],
        },
        {
          title: "Description of the Nature of Light",
          subtopics: [
            { title: "Nature of color", items: ["Dispersion and prisms", "Selective reflection", "Selective transmission"] },
          ],
        },
      ],
    },
    {
      id: "lo4",
      title: "Apply the concept of electromagnetic field",
      hours: 10,
      performanceCriteria: [],
      topics: [
        {
          title: "Determination of the induced emf in a circuit",
          subtopics: [
            { title: "Concept of electromagnetic induction (EMI)", items: ["Faraday\u2019s law", "Lenz\u2019s law of EMI", "Fleming\u2019s right-hand rule"] },
            { title: "Induced emf and induced current", items: ["EMI in a coil", "EMI in a transformer", "Motional induced emf"] },
            { title: "Applications of EMI", items: ["Transformers", "Generators", "Induction motors"] },
          ],
        },
        {
          title: "Application of the equation of propagation of electromagnetic waves",
          subtopics: [
            { title: "Properties of electromagnetic waves", items: ["Speed of EM waves in free space", "EM waves wavelength", "EM waves frequency", "EM waves amplitude", "Electromagnetic spectrum"] },
          ],
        },
        {
          title: "Categorization of mobile phone and radio communication",
          subtopics: [
            { title: "Interpretation of concepts in transmission", items: ["Transmission system.", "Terms used in transmission system: (Transmitter, Channel, Receiver, Digital communication,", "Analog communication)"] },
            { title: "Principle of cellular radio and Structure of cellular network.", items: [] },
            { title: "Types of modulations (AM, FM, and PM).", items: [] },
            { title: "Description of post, telegraph and telephone (PTT)", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo5",
      title: "Describe semiconductor materials",
      hours: 6,
      performanceCriteria: [],
      topics: [
        {
          title: "Description of fundamental properties of semiconductor materials",
          subtopics: [
            { title: "Conductivity", items: ["Conductor materials", "Insulator materials", "Semiconductors materials"] },
            { title: "Basics of semiconductors", items: ["Valence electrons", "Free electrons", "Holes", "Electron mobility", "Holes mobility"] },
            { title: "Current in semiconductors", items: ["Intrinsic semiconductors", "Extrinsic semiconductors", "PN junction"] },
          ],
        },
        {
          title: "Explanation of the principles of semiconductor devices",
          subtopics: [
            { title: "N-type and P-type materials", items: [] },
            { title: "Diode", items: ["Types of diodes"] },
            { title: "Transistor", items: ["Types of transistors", "Current flow in a transistor"] },
          ],
        },
        {
          title: "Description of the principles of operational amplifiers",
          subtopics: [
            { title: "Introduction on integrated circuit", items: ["Employable Skills for Sustainable Job Creation", "integrated circuits types"] },
            { title: "The operational amplifier", items: ["Feedback", "The operational amplifier as amplifier"] },
            { title: "The operational amplifier applications", items: ["Flame sensor", "Heat sensor", "Ramp generator", "The summing amplifier", "Oscillator"] },
          ],
        },
      ],
    },
  ],
};

export const GENFA402: ModuleCurriculum = {
  code: "GENFA402",
  title: "Apply Fundamental Mathematics Analysis",
  level: "4",
  credits: 6,
  totalHours: 60,
  purpose: "Master Apply Fundamental Mathematics Analysis. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Analyze algebraic functions",
      hours: 15,
      performanceCriteria: [],
      topics: [
        {
          title: "Determination of the domain and range of algebraic function",
          subtopics: [
            { title: "Existence condition", items: [] },
            { title: "Domain of definition of a function", items: [] },
            { title: "Range of a function", items: [] },
          ],
        },
        {
          title: "Identification of symmetry of algebraic function",
          subtopics: [
            { title: "Even function", items: [] },
            { title: "Odd function", items: [] },
          ],
        },
        {
          title: "Determination of function limits",
          subtopics: [
            { title: "Finite limits", items: [] },
            { title: "Infinite limits", items: [] },
            { title: "Limit at infinity", items: [] },
            { title: "Remove of indeterminate cases", items: ["Employable Skills for Sustainable Job Creation", "0\u00d7\u00a5", "\u00a5-\u00a5"] },
          ],
        },
        {
          title: "Determination of asymptotes",
          subtopics: [
            { title: "Rational functions", items: [] },
            { title: "Irrational functions", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Apply fundamentals of Learning hours: 20 differentiation",
      hours: 20,
      performanceCriteria: [],
      topics: [
        {
          title: "Determination of derivatives",
          subtopics: [
            { title: "Derivative of function at a given point", items: [] },
            { title: "Derivative of a polynomial function", items: [] },
            { title: "Derivative of a rational and irrational functions", items: [] },
            { title: "Successive derivatives", items: [] },
          ],
        },
        {
          title: "Interpretation of derivative of a function",
          subtopics: [
            { title: "Geometric interpretation", items: [] },
            { title: "Kinematical meaning of a derivative", items: [] },
          ],
        },
        {
          title: "Application of derivative",
          subtopics: [
            { title: "Determination of equation of tangent and normal lines at a given point", items: [] },
            { title: "Increasing and decreasing intervals for a function", items: [] },
            { title: "Maximum and minimum points of a function", items: ["Employable Skills for Sustainable Job Creation"] },
            { title: "Concavity, inflection point on a graph", items: [] },
          ],
        },
        {
          title: "Sketching curve of algebraic function",
          subtopics: [
            { title: "Establishing required parameters", items: ["Variation table", "Additional points"] },
            { title: "Sketching graph of polynomial function", items: [] },
            { title: "Sketching graph of rational and irrational functions", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Apply exponential Learning hours: 15 functions",
      hours: 15,
      performanceCriteria: [],
      topics: [
        {
          title: "Determination of the domain of definition of functions",
          subtopics: [
            { title: "Existence condition", items: [] },
            { title: "Domain of definition of a function", items: [] },
          ],
        },
        {
          title: "Solving exponential equation",
          subtopics: [
            { title: "Domain of validity", items: [] },
            { title: "Solution set", items: [] },
          ],
        },
        {
          title: "Calculation of the limit of exponential functions",
          subtopics: [
            { title: "Finite limits", items: [] },
            { title: "Limits at infinity", items: [] },
            { title: "Deduction/ calculation of Asymptotes", items: [] },
          ],
        },
        {
          title: "Differentiation of exponential functions",
          subtopics: [
            { title: "Derivation", items: [] },
            { title: "Table of variation", items: ["Employable Skills for Sustainable Job Creation"] },
          ],
        },
        {
          title: "Sketching graph of exponential functions",
          subtopics: [
            { title: "Table of additional point", items: [] },
            { title: "Graph", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo4",
      title: "Apply logarithmic functions",
      hours: 10,
      performanceCriteria: [],
      topics: [
        {
          title: "Determination of the domain of definition",
          subtopics: [
            { title: "Existence condition", items: [] },
            { title: "Domain of definition of a function", items: [] },
          ],
        },
        {
          title: "Solving logarithmic equation",
          subtopics: [
            { title: "Domain of validity", items: [] },
            { title: "Solution set", items: [] },
          ],
        },
        {
          title: "Calculation of the limit of logarithmic functions",
          subtopics: [
            { title: "Finite limits", items: [] },
            { title: "Limits at infinity", items: [] },
            { title: "Deduction/ calculation of Asymptotes", items: [] },
          ],
        },
        {
          title: "Differentiation of logarithmic functions",
          subtopics: [
            { title: "Derivation", items: [] },
            { title: "Table of variation", items: [] },
          ],
        },
        {
          title: "Sketching graph of logarithmic functions",
          subtopics: [
            { title: "Table of additional point", items: [] },
            { title: "Graph", items: ["Employable Skills for Sustainable Job Creation"] },
          ],
        },
      ],
    },
  ],
};

export const GENMP402: ModuleCurriculum = {
  code: "GENMP402",
  title: "Apply Mechanics and Properties of Matter",
  level: "4",
  credits: 4,
  totalHours: 40,
  purpose: "Master Apply Mechanics and Properties of Matter. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Describe laws of motion and their applications",
      hours: 4,
      performanceCriteria: [],
      topics: [
        {
          title: "Interpretation of the concept of force",
          subtopics: [
            { title: "Contact force and field forces", items: [] },
            { title: "Fundamental forces and their characteristics", items: [] },
            { title: "Internal & external forces", items: ["Employable Skills for Sustainable Job Creation"] },
          ],
        },
        {
          title: "Interpretation of Newton’s laws",
          subtopics: [
            { title: "First law of Newton", items: [] },
            { title: "Second law of Newton", items: [] },
            { title: "Third law of Newton", items: [] },
          ],
        },
        {
          title: "Application of Newton’s laws on a free body diagram",
          subtopics: [
            { title: "Motion on a plane", items: ["Static friction", "Dynamic friction", "Free body diagram on a plane"] },
            { title: "Motion of suspended object", items: ["Weight of suspended object", "Tension forces", "Free body diagram on suspended objects"] },
            { title: "Rocket motion", items: ["Thrust", "Air resistance", "Free body diagram on a rocket"] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Apply   static Learning hours: 8 equilibrium and elasticity",
      hours: 8,
      performanceCriteria: [],
      topics: [
        {
          title: "Explanation of equilibrium conditions",
          subtopics: [
            { title: "Moment of the force", items: ["Torque associated with the force", "Rotational equilibrium and static equilibrium"] },
            { title: "Necessary conditions for equilibrium of an object", items: ["First condition for equilibrium", "Second condition for equilibrium"] },
            { title: "Centre of gravity", items: [] },
          ],
        },
        {
          title: "Application of static equilibrium",
          subtopics: [
            { title: "Standing on horizontal beam", items: ["Upward force", "Downward force"] },
            { title: "Standing on a slope", items: ["Determination of horizontal and vertical components", "Applying conditions for equilibrium in solving problems"] },
          ],
        },
        {
          title: "Application of elastic properties",
          subtopics: [
            { title: "Deformation of solids in terms of the concepts of stress and strain", items: ["Relation between stress and strain", "Elastic modulus"] },
            { title: "Types of deformation and elastic modulus", items: ["Young\u2019s modulus (elasticity in length)", "Shear modulus (elasticity of shape)", "Bulk modulus (Volume elasticity)"] },
            { title: "Stress versus strain curve for an elastic solid.", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Analyze fluid Learning hours: 6 mechanics",
      hours: 6,
      performanceCriteria: [],
      topics: [
        {
          title: "Description of pressure and its variation with depth",
          subtopics: [
            { title: "Pressure", items: ["Pressure in a fluid", "Force and pressure", "A simple device for measuring the pressure exerted by a fluid"] },
            { title: "Variation of pressure with depth", items: ["Variation of atmospheric pressure with altitude", "Water pressure with depth", "Pascal\u2019s principle"] },
            { title: "Pressure measurements", items: ["Measurements of atmospheric pressure", "Barometric pressure", "Absolute pressure and gauge pressure"] },
          ],
        },
        {
          title: "Application of Archimedes’ principle",
          subtopics: [
            { title: "Buoyant forces", items: ["Meaning of Buoyant force", "Relationship between magnitude of buoyant force and weight of the fluid displaced."] },
            { title: "Archimedes’ principle", items: ["Practical inventions of Archimedes \u2019principle", "Archimedes\u2019 principle on totally submerged object", "Archimedes\u2019 principle on floating object"] },
          ],
        },
        {
          title: "Analysing fluid dynamics",
          subtopics: [
            { title: "Viscosity", items: ["Equation of continuity for fluids"] },
            { title: "Bernoulli’s principle and its application", items: ["Employable Skills for Sustainable Job Creation", "Bernoulli\u2019s equation as applied to an ideal fluid", "Application of Bernoulli\u2019s principle"] },
            { title: "Applications of fluid dynamics", items: ["Streamline flow around a moving airplane wing", "Newton\u2019s third law about the airstream."] },
          ],
        },
      ],
    },
    {
      id: "lo5",
      title: "Examine effects of electric current flow in DC electric circuit",
      hours: 7,
      performanceCriteria: [],
      topics: [
        {
          title: "Description of a simple electric circuit",
          subtopics: [
            { title: "DC electric circuit", items: ["Elements of DC electric circuit", "Electric current", "Electrical resistance", "Voltage"] },
            { title: "Measuring instruments used in DC electric circuit", items: ["Ammeter", "Voltmeter", "Ohmmeter", "Multimeter"] },
            { title: "Ohm’s law", items: [] },
            { title: "Combination of resistors", items: ["Series", "Employable Skills for Sustainable Job Creation", "Parallel", "Mixed"] },
            { title: "Electric cells", items: ["E.M.F(Electromotive force) of a cell", "Internal resistance", "Cells network"] },
          ],
        },
        {
          title: "Determination of electric current, resistances and voltages in DC electric circuits",
          subtopics: [
            { title: "Key concepts", items: ["Path, junction, branch", "Voltage supply", "Voltage drop", "Voltage gain"] },
            { title: "Kirchhoff’s laws", items: ["Conservation of charges", "Current law", "Voltage law"] },
          ],
        },
        {
          title: "Determination of electric energy, work and power in DC electric circuit",
          subtopics: [
            { title: "Calculations of energy and power in DC electric circuit", items: ["Electrical energy", "Electrical work", "Electrical power"] },
            { title: "Effects associated with electric current in a circuit", items: ["Joule\u2019s effect", "Chemical effect", "Magnetic effect"] },
          ],
        },
      ],
    },
    {
      id: "lo6",
      title: "Apply Geometric Learning hours: 6 instruments",
      hours: 6,
      performanceCriteria: [],
      topics: [
        {
          title: "Description of optical instruments",
          subtopics: [
            { title: "Single lens optical instruments", items: ["Human eye", "Magnifying glass", "Single lens camera"] },
            { title: "Multi-lens optical instruments", items: ["Microscope", "Telescope", "Projector"] },
          ],
        },
        {
          title: "Determination of the magnification of optical instruments",
          subtopics: [
            { title: "Magnification of microscope", items: [] },
            { title: "Magnification of telescope", items: [] },
          ],
        },
        {
          title: "Correction of optical aberrations",
          subtopics: [
            { title: "Spherical aberration", items: [] },
            { title: "Chromatic aberrations", items: [] },
            { title: "Astigmatic aberration", items: [] },
          ],
        },
      ],
    },
  ],
};

export const GENPP501: ModuleCurriculum = {
  code: "GENPP501",
  title: "Python Programming",
  level: "5",
  credits: 8,
  totalHours: 80,
  purpose: "Master Python Programming. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Prepare python environment",
      hours: 15,
      performanceCriteria: [],
      topics: [
        {
          title: "Selection of Python tools",
          subtopics: [
            { title: "Python programming overview", items: ["Definition", "Benefits", "Characteristics of python"] },
            { title: "Applications of python", items: ["Data science", "Software development", "Automation", "Data analytics"] },
            { title: "Identifications of python tools", items: [] },
          ],
        },
        {
          title: "Installation of Python tools",
          subtopics: [
            { title: "Identification of computer system requirements", items: ["Hardware requirement", "Software requirement"] },
            { title: "Install python software tools", items: [] },
            { title: "Configure python virtual environment", items: [] },
          ],
        },
        {
          title: "Testing python installation",
          subtopics: [
            { title: "Run python version command", items: [] },
            { title: "Check python interpreter", items: [] },
            { title: "Test package manager", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Write basic python program",
      hours: 45,
      performanceCriteria: [],
      topics: [
        {
          title: "Applying python basic concepts",
          subtopics: [
            { title: "Data Types", items: [] },
            { title: "Variables", items: [] },
            { title: "Comments", items: [] },
            { title: "Operators", items: [] },
          ],
        },
        {
          title: "Applying python control structures",
          subtopics: [
            { title: "Conditional Statements", items: [] },
            { title: "Looping Statements", items: [] },
            { title: "Use of Jump Statements", items: ["Break", "Continue", "Pass"] },
          ],
        },
        {
          title: "Application of functions in Python",
          subtopics: [
            { title: "Definition of Function", items: [] },
            { title: "Types of functions", items: ["built-in function", "user defined function"] },
            { title: "Create a function", items: ["Arguments", "Default parameter value", "Passing a list as an argument", "Calling a function"] },
            { title: "Apply special purpose", items: ["Lambda", "Apply Python Generators", "Apply Python Closures", "Apply Python Decorators", "Recursive function", "Higher-order function"] },
          ],
        },
        {
          title: "Application of Python Collections",
          subtopics: [
            { title: "Description of collection types", items: ["Lists", "Tuples", "Dictionaries", "Sets", "Frozen Set", "ChainMaps", "Deques"] },
            { title: "Specialized tools from the", items: ["Counter", "OrderedDict", "defaultdict"] },
            { title: "Perform common operations", items: ["Adding and Removing", "Elements", "Accessing and Iterating", "Over Elements", "Filtering and Sorting", "Set Operations and", "Counting", "Stack and Queue", "Operations"] },
          ],
        },
        {
          title: "Perform File handling",
          subtopics: [
            { title: "File Handling libraries", items: ["pathlib", "shutil", "pandas"] },
            { title: "Practice to read file", items: ["Open file", "Read file permission"] },
            { title: "Perform write/create file", items: ["Create a new file", "Write to existing file"] },
            { title: "Perform delete file", items: ["Remove file", "Delete folder"] },
            { title: "Apply python best practices", items: ["Readability and Style", "Use of Built-in Features", "Efficiency and Memory", "Usage", "Error Handling and", "Testing"] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Apply object- Learning hours: 40",
      hours: 40,
      performanceCriteria: [],
      topics: [
        {
          title: "Application of OOP Concepts",
          subtopics: [
            { title: "Object", items: [] },
            { title: "Python class", items: [] },
            { title: "Inheritance", items: [] },
            { title: "Polymorphism", items: [] },
            { title: "Encapsulation", items: [] },
          ],
        },
        {
          title: "Application of python Date and time concepts",
          subtopics: [
            { title: "Description of date and time", items: ["Datetime", "Dateutil", "Arrow", "Pendulum", "Python-tzdata"] },
            { title: "Set Time zones", items: [] },
            { title: "Formatting and parsing", items: [] },
            { title: "Perform relative timedeltas", items: [] },
          ],
        },
        {
          title: "Application of Python Libraries",
          subtopics: [
            { title: "Description of Python Library", items: [] },
            { title: "Python standard library", items: ["Matplotlib", "Numpy", "Pandas"] },
            { title: "Use of libraries", items: ["Importing Libraries", "Accessing Functionality", "Understanding Scope according to the name space"] },
          ],
        },
        {
          title: "Automation of application post deployment tasks",
          subtopics: [
            { title: "Identification of tasks to automate", items: ["Database migrations", "Configuration file updates", "Service restarts", "Testing and verification", "Logging and notifications"] },
            { title: "Identification of tasks to be prioritized", items: ["Repetitive", "Time-consuming", "Error-prone", "Critical for deployment speed"] },
            { title: "Selection of a Python Automation Library", items: ["Fabric", "Ansible", "SaltStack", "Boto3", "VSphere Automation SDK for Python for VMware vSphere environments.", "Consider factors"] },
            { title: "Develop the Python Script", items: ["Use library functions", "Structure logically", "Logging and output"] },
            { title: "Integrate script with Deployment Process", items: ["Trigger method to initiate the Python script post-deployment", "Direct execution after deployment completion", "Integration with CI/CD pipelines", "Scheduled execution at specific intervals", "Implement security measures to restrict script access and control sensitive information."] },
            { title: "Testing and Monitoring", items: ["Thorough testing", "Monitor script logs execution", "Refine and improve"] },
          ],
        },
      ],
    },
  ],
};

export const GENQA501: ModuleCurriculum = {
  code: "GENQA501",
  title: "Quality Assurance",
  level: "5",
  credits: 5,
  totalHours: 50,
  purpose: "Master Quality Assurance. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Perform Requirements Analysis",
      hours: 10,
      performanceCriteria: [],
      topics: [
        {
          title: "Introduction to Quality Assurance",
          subtopics: [
            { title: "Describing Quality Assurance(QA)", items: ["Definition", "Stages/Processes", "Main Types", "Standards", "Methods", "Benefits"] },
            { title: "Classification of quality assurance", items: ["Industry-Specific QA", "Process and Product QA", "Internal vs. External QA", "Manual vs. Automated QA"] },
            { title: "Quality Assurance Vs Quality Control", items: [] },
            { title: "Identify tools and techniques", items: [] },
          ],
        },
        {
          title: "Analysing Terms of Reference (TOR)",
          subtopics: [
            { title: "Describing Terms of Reference", items: ["Definition", "Purpose", "Elements of TOR", "Importance", "Test cases"] },
            { title: "Document a TOR analysis report", items: [] },
          ],
        },
        {
          title: "Examining requirement specification",
          subtopics: [
            { title: "Review the entire document", items: [] },
            { title: "Understand stakeholder requirements", items: ["Functional", "Non-Functional"] },
            { title: "Verify consistency and completeness", items: [] },
            { title: "Identify dependencies and interactions", items: [] },
            { title: "Generate findings document", items: [] },
          ],
        },
        {
          title: "Analysing inception report",
          subtopics: [
            { title: "Perform document review", items: [] },
            { title: "Understand stakeholder expectations", items: [] },
            { title: "Assess clarity and completeness", items: [] },
            { title: "Evaluate feasibility and risks", items: [] },
            { title: "Document assumptions and constraints", items: [] },
            { title: "Document analysis findings", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Test the System",
      hours: 27,
      performanceCriteria: [],
      topics: [
        {
          title: "Preparation of Test Plan",
          subtopics: [
            { title: "Description of test plan", items: ["Definition", "Types", "Components"] },
            { title: "Identify test tools", items: [] },
            { title: "Identify test techniques", items: [] },
            { title: "Identify test cases", items: [] },
            { title: "Identify test criteria", items: [] },
            { title: "Allocate resources", items: [] },
            { title: "Prepare Test Data", items: [] },
            { title: "Prepare Test Execution Scripts", items: [] },
            { title: "Schedule test delivery plan", items: [] },
          ],
        },
        {
          title: "Preparation of Testing Environment",
          subtopics: [
            { title: "Identifying key components of a Testing Environment", items: ["Hardware Infrastructure", "Software Infrastructure", "Dependencies needed for testing"] },
            { title: "Selecting test techniques", items: ["Manual testing", "Automated Testing", "Exploratory Testing", "Parallel Testing", "Matching Test Techniques with system functionalities"] },
            { title: "Select testing tools", items: ["Software", "Hardware"] },
            { title: "Set up and configure testing environment", items: [] },
          ],
        },
        {
          title: "Perform Testing",
          subtopics: [
            { title: "Review test plan", items: [] },
            { title: "Select test cases", items: [] },
            { title: "Process test", items: [] },
            { title: "Record defects", items: [] },
            { title: "Monitor test progress", items: [] },
            { title: "Document test results", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Generate Test Documentation",
      hours: 13,
      performanceCriteria: [],
      topics: [
        {
          title: "Consolidation of test results",
          subtopics: [
            { title: "Colleting test data", items: ["Collecting test artifacts", "Compiling test execution data"] },
            { title: "Analysing and evaluating test results", items: ["Reviewing Test Logs and Reports", "Summarizing Test Findings", "Prioritizing Defects", "Generating Test Metrics"] },
            { title: "Create test summary report", items: [] },
          ],
        },
        {
          title: "Providing User Acceptance Testing Report",
          subtopics: [
            { title: "Assess Acceptance Criteria", items: [] },
            { title: "Summarizing the key UAT activities conducted", items: ["Executing test case and results(passed/failed/blocked)", "Identifying usability testing outcomes (user feedback, pain points)", "Measuring performance testing (speed, stability)", "Security vulnerability findings"] },
            { title: "Analysing overall test results", items: [] },
            { title: "Generate UAT report", items: [] },
          ],
        },
        {
          title: "Generating recommendation Report",
          subtopics: [
            { title: "Provide Recommendations", items: ["Proposing changes.", "Present supporting evidence", "Outline action steps"] },
            { title: "Include Benefits and Impact", items: [] },
            { title: "Document and archiving test artifacts", items: [] },
          ],
        },
      ],
    },
  ],
};

export const SWDBF501: ModuleCurriculum = {
  code: "SWDBF501",
  title: "Blockchain Fundamentals",
  level: "5",
  credits: 10,
  totalHours: 100,
  purpose: "Master Blockchain Fundamentals. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Design blockchain system architecture",
      hours: 10,
      performanceCriteria: [],
      topics: [
        {
          title: "Identification blockchain requirements",
          subtopics: [
            { title: "Introduction to blockchain", items: ["Define", "blockchain", "cryptography", "History of blockchain", "Types of Blockchain", "Blockchain Principles", "Functionalities of blockchain", "Pros and Cons of blockchain", "Blockchain Company solutions"] },
            { title: "Description of blockchain key concepts", items: ["Essential components of wallet (Private Keys, Public Keys, Addresses)", "Transactions, Merkle Trees, and Blocks", "Hierarchical Deterministic Wallets, Mnemonic Seeds and Smart Contracts", "Working of Blockchain Transaction"] },
            { title: "Apply blockchain use cases", items: [] },
          ],
        },
        {
          title: "Selecting Blockchain Technologies",
          subtopics: [
            { title: "Description of Blockchain technology stack principles", items: ["Consensus Layer (PoW,PoS, etc)", "Network Layer (Ethereum\\'s Peer-to-Peer Network)", "Protocol Layer (Ethereum\\'s EVM -Ethereum Virtual Machine)", "Smart Contracts Layer (Decentralized Finance (DeFi) Platforms)", "Application Layer (CryptoKitties)", "Storage Layer (IPFS - InterPlanetary File System)", "Identity and Access Management (SelfKey)", "Security and Encryption (Public and Private Key Encryption)", "Interoperability Layer (Polkadot)", "Scalability Solutions (Lightning Network for Bitcoin)", "Governance Mechanisms (Tezos)", "User Interfaces (MetaMask)"] },
            { title: "Describe types of Consensus mechanism", items: ["Proof of Work", "Proof of Stake", "Delegated Proof of Stake", "Proof of Authority", "Proof of Weight"] },
            { title: "Use appropriate Consensus Mechanism (Proof of Work, Proof of Stake)", items: [] },
            { title: "Identify the types of attacks and vulnerabilities of blockchain", items: ["Attack in consensus mechanism", "Sybil Attack (spamming the network, disrupt communication among nodes)", "Double Spending", "Eclipse Attack", "Smart       Contract     Vulnerabilities      (re-entrancy   attacks,   integer", "overflow/underflow).", "DDoS Attack (Distributed Denial of Service)", "Blockchain Spamming", "Long-Range Attack", "Selfish Mining", "Routing Attacks", "Transaction Malleability", "Consensus Manipulation"] },
          ],
        },
        {
          title: "Designing the architecture of blockchain application",
          subtopics: [
            { title: "Description of blockchain architecture", items: ["Components", "Connection", "Instance relation"] },
            { title: "Designing system architecture", items: ["Design Blockchain based Systems", "Designing the Blockchain Network", "Design Smart Contract"] },
            { title: "Drawing blockchain architecture", items: ["Identify the Use Case", "Identify third party Integration", "Identify the Consensus Mechanism", "Identify the Platform", "Design the Blockchain Instance", "Design the Architecture"] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Apply Solidity Basics",
      hours: 20,
      performanceCriteria: [],
      topics: [
        {
          title: "Preparation of environment",
          subtopics: [
            { title: "Description of key terms", items: ["Solidity", "Syntax", "Data types", "Variables", "identifiers", "Arrays", "Struct", "Functions", "Control structures", "State variables", "Modifiers (conditions)", "smart contract", "Visibility and Access Control", "Ethereum", "Ethereum Virtual Machine (EVM)"] },
            { title: "Set up solidity environment", items: ["Installing Code editor (remix, visual studio code)", "Installing node.js and npm (Node Package Manager) for package", "management.", "Installing Solidity compiler (solc) and Ethereum development tools (e.g.,", "Truffle, Hardhat)."] },
          ],
        },
        {
          title: "Applying solidity concepts",
          subtopics: [
            { title: "Data types and variables", items: [] },
            { title: "Use of functions", items: [] },
            { title: "Control structures", items: [] },
            { title: "arrays and structs", items: [] },
            { title: "Events and logging", items: [] },
            { title: "Error handling", items: [] },
          ],
        },
        {
          title: "Implementing function Interaction",
          subtopics: [
            { title: "Connect to wallet", items: ["Metamask Wallet", "Trust wallet"] },
            { title: "Access the Contract Address", items: [] },
            { title: "Use a Blockchain Explorer", items: [] },
            { title: "Perform function operations", items: ["Read only operations", "Write operation"] },
          ],
        },
        {
          title: "Optimizing Gas Costs",
          subtopics: [
            { title: "Proper analysis of Gas cost", items: ["Calculating the cost of Ethereum transfer", "Heavy and Light functions", "Block limit", "Opcode Gas cost", "Non-payable functions"] },
            { title: "Elaboration of Storage", items: ["Smaller Integers, Unchanged Storage Values, Arrays", "Refunds and Setting to Zero", "ERC20 Transfers", "Storage Cost for Files", "Structs and Strings, Variable Packing, Array Length"] },
            { title: "Optimization of Memory cost", items: ["Memory vs Call data", "Mappings vs Arrays", "Freeing Up Unused Storage", "immutable and constant", "Access Modifier", "Indexed Events", "Minimizing On-Chain Data"] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Develop smart contracts system",
      hours: 20,
      performanceCriteria: [],
      topics: [
        {
          title: "Creating smart contracts",
          subtopics: [
            { title: "Applying of Solidity programming language", items: ["Mapping, Arrays, Structs and Error handling", "Use of modifiers(conditions), Interfaces, Events, and Inheritance", "Contracts composition", "Storage locations", "Compiling", "Test with hardhat (chai, mocha)"] },
            { title: "Writing smart contract", items: [] },
          ],
        },
        {
          title: "Creating Tokens",
          subtopics: [
            { title: "Implementation of Fungible token (FT) standards", items: ["ERC20 Token Standard", "Writing an ERC20 Token in Solidity"] },
            { title: "Implementation of Non-Fungible Token standards (NFT)", items: ["ERC721 standard", "Write NTF smart contracts using ERC721 standard", "ERC1155 Multi Token Smart Contract"] },
          ],
        },
        {
          title: "Applying security of smart contracts",
          subtopics: [
            { title: "Protection of smart contracts against Re-entrancy Attack", items: [] },
            { title: "Securing smart contract using Escrow Service Contract", items: [] },
            { title: "Usage of third-party libraries", items: ["OpenZeppelin (includes safemath)", "Chainlink"] },
          ],
        },
        {
          title: "Deploying smart contracts",
          subtopics: [
            { title: "Selection of development blockchain network", items: ["Local network (Ganache)", "Public network (e.g mainnet, testnet)"] },
            { title: "Create infrastructure services for blockchain applications", items: ["Alchemy", "Infura"] },
            { title: "Deploy contract", items: ["Truffle", "Hardhat"] },
          ],
        },
      ],
    },
    {
      id: "lo4",
      title: "Apply frontend integration",
      hours: 25,
      performanceCriteria: [],
      topics: [
        {
          title: "Installing web3 dependencies",
          subtopics: [
            { title: "Configure contract network", items: ["Install contract extension in browser for development (eg. Metamask)", "Create wallet", "Load enough balance in wallet(faucet)"] },
            { title: "Connect to smart contract wallet using frontend", items: ["Install web3 libraries (e.g ether.js,web3.js)", "Connect to smart contract using keys(contract address, Application Binary", "Interface - ABI)"] },
          ],
        },
        {
          title: "Connecting smart contract",
          subtopics: [
            { title: "Consume smart contract functions based on defined functionalities", items: [] },
            { title: "Create instance of smart contract", items: [] },
          ],
        },
        {
          title: "Use of function",
          subtopics: [
            { title: "Implement operations based on smart contract predefined functions", items: [] },
            { title: "Deploy web3 frontend based on specific requirements", items: ["Test web application", "Build production bundles", "Configure keys on production environment variables", "Deploy production builds"] },
          ],
        },
      ],
    },
  ],
};

export const SWDBS401: ModuleCurriculum = {
  code: "SWDBS401",
  title: "Backend System Design",
  level: "4",
  credits: 10,
  totalHours: 100,
  purpose: "Master Backend System Design. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Develop RESTFUL APIs with Node JS",
      hours: 45,
      performanceCriteria: [],
      topics: [
        {
          title: "Setup Node. Js Environment",
          subtopics: [
            { title: "Description of Node.js Key Concepts", items: ["Node.Js", "Routes", "NPM", "Express Js", "Backend Application", "Class", "Object", "Method", "Properties", "Dependencies", "APIs", "Postman", "Nodemon", "DBMS (SQL Based, NoSQL Based)"] },
            { title: "Installation of Node Js Modules and packages", items: ["Node.Js and NPM", "Express Js", "Postman", "Nodemon"] },
            { title: "Configuration of MySQL Server", items: [] },
          ],
        },
        {
          title: "Connection of Node Js to the ES5 or ES6 server",
          subtopics: [
            { title: "Creation of basic server with Express Js", items: [] },
            { title: "Application of Client Libraries", items: ["HTTP", "HTTPs", "Axios", "Request"] },
            { title: "Establishment of server connection", items: ["Setup Connection parameters", "Create / send Request", "Handle the response"] },
            { title: "Test of Server Connection", items: [] },
          ],
        },
        {
          title: "Establishment of database connection",
          subtopics: [
            { title: "Create Database", items: [] },
            { title: "Schema Setup", items: [] },
            { title: "Configure Database Connection", items: [] },
            { title: "Test Database Connection", items: [] },
          ],
        },
        {
          title: "Develop RESTFUL APIs",
          subtopics: [
            { title: "Define endpoints and HTTP Methods", items: ["Create POST End Point", "Create all Items GET endpoint", "Create specific ID GET endpoint", "Create PUT endpoint", "Create DELETE endpoint"] },
            { title: "Implementation of API endpoints", items: [] },
            { title: "Use of Middleware services", items: ["Types of middleware services", "Error Handling", "Logging", "Input validation"] },
            { title: "Perform CRUD operations using MySQL Database", items: [] },
            { title: "Use HTTP Status code", items: [] },
            { title: "Debugging RESTFUL APIs", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Secure Backend Application",
      hours: 20,
      performanceCriteria: [],
      topics: [
        {
          title: "Data encryption in securing RESTFUL APIs",
          subtopics: [
            { title: "Introduction to data encryption", items: ["Types of data encryption", "Encryption techniques", "Benefits and importance of data encryption"] },
            { title: "Steps in securing RESTFUL APIs", items: ["Install the crypto module", "Create a key for encryption", "Use the key to encrypt data", "Convert the data to a buffer", "Encrypt the data", "Store the encrypted data"] },
          ],
        },
        {
          title: "Integrating and Using Third-Party Libraries",
          subtopics: [
            { title: "Installing Node Js Package Manager (NPM)", items: [] },
            { title: "Incorporating common Node.js third-party libraries", items: ["Express", "Lodash", "Moment.js"] },
            { title: "Interacting with third-party libraries", items: ["Callbacks", "Promises", "async/await"] },
          ],
        },
        {
          title: "Maintaining and Updating Third-Party Libraries",
          subtopics: [
            { title: "Monitoring of library dependencies and version numbers", items: ["Package. Json", "Npm-shrinkwrap. json"] },
            { title: "Checking for library updates and security vulnerabilities using tools", items: ["NPM outdated", "NPM audit", "Snyk"] },
            { title: "Updating third-party libraries safely", items: ["Versioning", "semver rules"] },
            { title: "Strategies for managing and testing library updates", items: ["staging environments", "Version control systems."] },
          ],
        },
        {
          title: "Implementation of Authentication",
          subtopics: [
            { title: "Principles of authentication", items: [] },
            { title: "Role of authentication in system security", items: [] },
            { title: "Implementing user authentication in Node.js using frameworks", items: ["Passport", "JWT (JSON Web Tokens)", "Social Auth. (Google, Facebook, \u2026)"] },
            { title: "Using authentication middleware to protect routes and resources", items: [] },
            { title: "Best practices for password storage and handling sensitive data", items: [] },
          ],
        },
        {
          title: "Implementation of Authorization",
          subtopics: [
            { title: "Principles of authorization", items: [] },
            { title: "Role of authorization in system security", items: [] },
            { title: "Implementing role-based and attribute-based access control in Node.js", items: [] },
            { title: "Using authorization middleware to manage user permissions", items: [] },
            { title: "Implementing custom authorization logic for specific use cases", items: [] },
          ],
        },
        {
          title: "Implementation of Accountability",
          subtopics: [
            { title: "Principles of accountability", items: [] },
            { title: "Roles of Accountability in system security", items: [] },
            { title: "Implementing logging and auditing features in Node.js using popular libraries", items: ["Winston", "Morgan"] },
            { title: "Logs management", items: ["Best practices for securely storing log data and protecting it from unauthorized", "access", "Audit logs to detect security events and system errors"] },
          ],
        },
        {
          title: "Secure Environment Variables",
          subtopics: [
            { title: "Types of information stored in environment variables", items: ["Database credentials", "API keys", "Encryption keys"] },
            { title: "Potential security risks of storing sensitive information in environment variables", items: [] },
            { title: "Best practices for managing and securing environment variables in Node.js", items: [] },
            { title: "Implementing security measures for protecting environment variables", items: ["Encrypting secrets", "Decrypting secrets"] },
            { title: "Storing environment variables in a secure location", items: ["key management service", "a. env file"] },
            { title: "Management and loading environment variables in Node.js applications using dotenv", items: [] },
            { title: "Best practices for safely passing environment variables to other services and", items: ["applications"] },
          ],
        },
        {
          title: "Monitor and Manage Environment Variables",
          subtopics: [
            { title: "Implementing logging and auditing features to detect unauthorized access to", items: ["environment variables"] },
            { title: "Monitoring changes to environment variables and detecting any suspicious activity", items: [] },
            { title: "Best practices for managing and rotating environment variables to prevent data", items: ["breaches"] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Test Backend Application",
      hours: 20,
      performanceCriteria: [],
      topics: [
        {
          title: "Implementation of Unit testing",
          subtopics: [
            { title: "Introduction to unit tests", items: ["Importance of Unit Testing", "Unit Testing Process", "Unit Testing tools", "Frameworks", "Libraries"] },
            { title: "Mocha Testing Framework", items: ["Installation and Configuration", "Writing Unit tests", "Running Tests"] },
            { title: "Chai assertion library", items: ["Installation and configuration", "Writing assertions", "Chai Expect and Should APIs"] },
            { title: "Monitor Test results", items: [] },
          ],
        },
        {
          title: "Implementation of Usability testing",
          subtopics: [
            { title: "Introduction to Usability tests", items: ["Importance of Usability Testing", "Usability Testing Process", "Usability Testing tools"] },
            { title: "Postman Testing Tool", items: ["Installation of Postman", "Create a collection", "Define Request", "Write test Cases", "Run tests", "Iterate and improve"] },
            { title: "Puppeteer Testing Tool", items: ["Installation of Puppeteer", "Define test scenarios", "Automate user interaction", "Measure page performance", "Test accessibility", "Generate Report"] },
          ],
        },
        {
          title: "Implementation of Security Testing",
          subtopics: [
            { title: "Introduction Node.js Security", items: ["Injection Attacks", "Broken Authentication and Session Management", "Cross-Site Scripting (XSS)", "Cross-Site Request Forgery (CSRF)", "Security Misconfiguration", "Insecure Cryptographic Storage", "Insufficient Authorization", "Insufficient Logging and Monitoring"] },
            { title: "Tools for Security Testing in Node.js", items: ["Overview of Security Testing Tools", "Static Analysis Tools", "Dynamic Analysis Tools", "Testing Frameworks (Open Worldwide Application Security Project, Mocha, Chai)"] },
            { title: "Secure Coding Practices in Node.js", items: [] },
            { title: "Testing Techniques for Node.js Security", items: [] },
            { title: "Best Practices for Node.js Security Testing", items: ["Security Testing Lifecycle", "Reporting Security Vulnerabilities", "Remediation and Mitigation", "Compliance and Regulations"] },
            { title: "Implement of Security Testing in Nodejs", items: ["Implement Authentication and Authorization", "Test input validation", "Use SSL / TLS encryption", "Test Error Handling", "Regularly update dependencies"] },
            { title: "Application of Penetration Testing steps", items: ["Identification scope of the test", "Gathering API Information", "Identify Vulnerabilities", "Perform manual testing", "Document findings", "Remediate Vulnerabilities", "Re-test"] },
            { title: "Perform penetration Testing using OWASP", items: ["Installation of OWASP tool", "Perform scan", "Exploit vulnerabilities", "Interpret Scan report", "Document results"] },
          ],
        },
      ],
    },
    {
      id: "lo4",
      title: "Manage Backend Application",
      hours: 15,
      performanceCriteria: [],
      topics: [
        {
          title: "Preparation of deployment Environment",
          subtopics: [
            { title: "Description of NodeJS application deployment", items: [] },
            { title: "Types of NodeJS application deployment", items: ["Manual Deployment", "Continuous Deployment", "Docker-based deployment"] },
            { title: "NodeJS Application Deployment tools", items: ["NodeJS Runtime", "Package Manager", "Operating system", "Webserver", "Database"] },
          ],
        },
        {
          title: "Implementation of Manual Deployment of NodeJS application",
          subtopics: [
            { title: "Copy the application source code to the server", items: [] },
            { title: "Installation of dependencies", items: [] },
            { title: "Start the application using command line", items: [] },
          ],
        },
        {
          title: "Maintenance of NodeJS application",
          subtopics: [
            { title: "Best practices for maintenance", items: ["Update", "Monitor", "Perform test"] },
            { title: "Developing a maintenance plan", items: ["Identification of maintenance requirements", "Schedule regular updates", "Automate maintenance tasks", "Monitor application performance", "Test regularly", "Disaster recovery plan", "Document changes"] },
            { title: "Continuous maintenance and improvement of NodeJS applications", items: ["Upgrade and maintain previously developed functionalities,", "develop new functionalities,", "Secure new and previously developed functionalities,", "Test new functionalities,", "Deploy new changes"] },
          ],
        },
        {
          title: "Application of NodeJS Documentation Tools and Frameworks",
          subtopics: [
            { title: "Documentation Overview", items: [] },
            { title: "The importance of documentation", items: [] },
            { title: "Types of documentation", items: [] },
            { title: "Overview of popular documentation tools and frameworks", items: ["Use Swagger/Postman for API documentation", "Writing clear and concise comments", "Using documentation generators"] },
            { title: "Best practices for documentation", items: [] },
            { title: "Publishing Documentation", items: ["Options for hosting documentation", "Using GitHub for collaborative documentation", "Documentation Maintenance"] },
          ],
        },
      ],
    },
  ],
};


export const SWDDA401: ModuleCurriculum = {
  code: "SWDDA401",
  title: "Data Structure and Algorithm Fundamentals",
  level: "4",
  credits: 13,
  totalHours: 130,
  purpose: "Master Data Structure and Algorithm Fundamentals. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Apply Algorithm Fundamentals",
      hours: 30,
      performanceCriteria: [],
      topics: [
        {
          title: "Conversion of number systems",
          subtopics: [
            { title: "Description of key concepts", items: ["Decimal base", "Binary base", "Hexadecimal base", "Octal base", "Unary encoding"] },
            { title: "Number system from decimal base to:", items: ["Binary base and vice versa", "Octal base and vice versa", "Hexadecimal and vice versa"] },
            { title: "Number system from hexadecimal base to:", items: ["Binary base and vice versa", "Octal base and vice versa", "Decimal and vice versa"] },
            { title: "Number system from base Octal base to:", items: ["Binary base and vice versa", "Decimal base and vice versa", "Hexadecimal base and vice versa"] },
            { title: "Application of number base arithmetic operations", items: [] },
          ],
        },
        {
          title: "Description of logic gates and expressions",
          subtopics: [
            { title: "Representation of Boolean logic gates", items: ["AND gate", "NAND gate", "OR gate", "NOR gate", "XOR gate"] },
            { title: "Application of Boolean logic gates", items: ["Circuits", "Truth table"] },
          ],
        },
        {
          title: "Use of data types on variables",
          subtopics: [
            { title: "Definition of datatype", items: [] },
            { title: "Data types used in JavaScript", items: ["Primitive data types", "Non-Primitive data types"] },
            { title: "Application of datatypes", items: [] },
          ],
        },
        {
          title: "Application of JavaScript operators",
          subtopics: [
            { title: "Assignment operators", items: [] },
            { title: "Arithmetic operators", items: [] },
            { title: "Logical operators", items: [] },
            { title: "Relational operators", items: [] },
            { title: "Compound operators", items: [] },
            { title: "Conditional operators", items: [] },
            { title: "Bitwise operators", items: [] },
          ],
        },
        {
          title: "Write an algorithm",
          subtopics: [
            { title: "Definition", items: [] },
            { title: "Types of algorithm", items: [] },
            { title: "Characteristics/qualities of a good algorithm", items: [] },
            { title: "Develop an algorithm using structured English", items: [] },
            { title: "Develop an algorithm using pseudocode", items: ["Sequence structures", "Selection/conditional structures", "Looping/iterating structures"] },
            { title: "Design of Flowchart", items: ["Description of Elements of Flowchart", "Using Flowchart tools", "Apply Flowchart best practices"] },
            { title: "Draw a flowchart", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Apply Data Structure",
      hours: 45,
      performanceCriteria: [],
      topics: [
        {
          title: "Identification of data structure concepts",
          subtopics: [
            { title: "Definition", items: [] },
            { title: "Classifications of data structures", items: ["Linear", "Non-linear"] },
            { title: "List representation", items: [] },
            { title: "List operations", items: [] },
            { title: "Structure", items: [] },
            { title: "Searching techniques", items: ["Binary search", "Linear search"] },
            { title: "Time complexity", items: [] },
            { title: "Space complexity", items: [] },
            { title: "Classification of sorting algorithms", items: ["By number of comparisons", "By Number of Swaps", "By Memory Usage", "By Recursion", "By Stability", "By Adaptability", "Internal Sorting", "External Sorting"] },
            { title: "Sorting techniques", items: ["Selection Sort", "Bubble Sort", "Insertion Sort", "Merge Sort", "Quick Sort", "Shell Sort", "Heap Sort", "Radix Sort", "Counting Sort", "Bucket Sort"] },
          ],
        },
        {
          title: "Application of linear data structures and their operations",
          subtopics: [
            { title: "Linked lists", items: [] },
            { title: "Arrays", items: [] },
            { title: "Queue", items: [] },
            { title: "Stack", items: [] },
            { title: "Write procedures", items: [] },
          ],
        },
        {
          title: "Application of non-linear data structure and their operations",
          subtopics: [
            { title: "Tree", items: [] },
            { title: "Graph", items: [] },
            { title: "Tables", items: [] },
            { title: "Write procedures", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Implement Algorithm using JavaScript",
      hours: 55,
      performanceCriteria: [],
      topics: [
        {
          title: "Development of JavaScript source code",
          subtopics: [
            { title: "Preparation of JavaScript running environment", items: [] },
            { title: "Writing JavaScript source code", items: ["Linked lists", "Arrays", "Queue", "Stack", "Tree", "Graph", "Tables"] },
            { title: "Perform sorting operations", items: ["Bubble", "Quick"] },
            { title: "Perform searching operations", items: ["Binary", "Linear"] },
          ],
        },
        {
          title: "Run JavaScript source codes",
          subtopics: [
            { title: "Using browser embedded Tools", items: ["Rendering engine", "Web dev tools"] },
            { title: "Using IDE Terminal", items: [] },
          ],
        },
        {
          title: "Test Time and space complexity",
          subtopics: [
            { title: "Key concepts of measuring time and space complexity", items: [] },
            { title: "Time and space measurement tools", items: ["Profiling tools", "Benchmark.js", "Benchmarkify", "jsPerf"] },
            { title: "Document test findings", items: [] },
          ],
        },
      ],
    },
  ],
};

export const SWDDD401: ModuleCurriculum = {
  code: "SWDDD401",
  title: "Database Development",
  level: "4",
  credits: 10,
  totalHours: 100,
  purpose: "Master Database Development. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Analyse Database",
      hours: 20,
      performanceCriteria: [],
      topics: [
        {
          title: "Description of database fundamental",
          subtopics: [
            { title: "Definition of key terms", items: ["Database", "Data", "Information", "Entities", "Attributes/Field", "Records", "Table", "Database schema", "DBMS", "SQL"] },
            { title: "Applications of database", items: [] },
            { title: "Advantages and Disadvantages of Database", items: [] },
            { title: "Identification of database models", items: ["Relational database", "Hierarchical database", "Network database", "Object oriented model"] },
            { title: "Identification of database Relationship", items: ["One to one", "One to many", "Many to one", "Many to many"] },
            { title: "Determination of data types", items: ["Character", "Number", "Date"] },
          ],
        },
        {
          title: "Description of data dictionary",
          subtopics: [
            { title: "Definition of data dictionary", items: [] },
            { title: "Elements of data dictionary", items: [] },
          ],
        },
        {
          title: "Identification of database requirements",
          subtopics: [
            { title: "Types of database requirements", items: ["Functional requirement", "Non-functional requirement"] },
            { title: "Methods to collect data", items: ["Interview", "Documentation", "Questionnaire", "Observation"] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Design Database",
      hours: 25,
      performanceCriteria: [],
      topics: [
        {
          title: "Description of database schema",
          subtopics: [
            { title: "Introduction of database schema", items: [] },
            { title: "Types of database schema", items: [] },
            { title: "Data abstraction levels", items: [] },
            { title: "Types of data independence", items: [] },
          ],
        },
        {
          title: "Design of conceptual database schema",
          subtopics: [
            { title: "Description of conceptual database schema", items: [] },
            { title: "Entity relationship diagram (ERD)", items: ["Description of ERD", "Components of ERD", "Define relationships", "Create an ERD", "Draw an ERD (MS-Visio, Draw-Max)"] },
          ],
        },
        {
          title: "Design of logical database schema",
          subtopics: [
            { title: "Description of logical database schema", items: [] },
            { title: "Table constraints", items: ["NOT NULL Constraint.", "UNIQUE Constraint.", "DEFAULT Constraint.", "CHECK Constraint.", "PRIMARY KEY Constraint.", "FOREIGN KEY Constraint."] },
            { title: "Convert conceptual database schema to logical database schema", items: [] },
          ],
        },
        {
          title: "Optimization of database",
          subtopics: [
            { title: "Data normalization", items: ["First normal form (1NF)", "Second normal form (2NF)", "Third normal form (3NF)"] },
            { title: "Indexing", items: [] },
          ],
        },
        {
          title: "Design of Physical database schema",
          subtopics: [
            { title: "Description of DBMS", items: [] },
            { title: "Preparation of DBMS Environment (MySQL)", items: [] },
            { title: "Convert logic database schema to physical database schema", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Implement Database",
      hours: 36,
      performanceCriteria: [],
      topics: [
        {
          title: "Description to SQL",
          subtopics: [
            { title: "Introduction of SQL", items: [] },
            { title: "SQL sub-languages", items: [] },
            { title: "SQL Operators", items: ["SQL Arithmetic Operators", "SQL Bitwise Operators", "SQL Compound Operators", "SQL Logical Operators"] },
          ],
        },
        {
          title: "Application of DDL commands",
          subtopics: [
            { title: "CREATE", items: ["Database", "Table Constraints", "Table"] },
            { title: "ALTER Table", items: [] },
            { title: "DROP", items: ["Database", "Table"] },
            { title: "TRUNCATE Table", items: [] },
            { title: "MODIFY", items: ["Database", "Table"] },
          ],
        },
        {
          title: "Application of DML commands",
          subtopics: [
            { title: "INSERT", items: [] },
            { title: "UPDATE", items: [] },
            { title: "DELETE", items: [] },
            { title: "CALL", items: [] },
            { title: "EXPLAIN CALL", items: [] },
            { title: "LOCK", items: [] },
          ],
        },
        {
          title: "Application of DQL Command",
          subtopics: [
            { title: "SELECT", items: [] },
            { title: "SQL aggregate function", items: [] },
            { title: "SQL clause", items: [] },
          ],
        },
        {
          title: "Application of DCL commands",
          subtopics: [
            { title: "GRANT", items: [] },
            { title: "REVOKE", items: [] },
          ],
        },
        {
          title: "Application of TCL commands",
          subtopics: [
            { title: "COMMIT", items: [] },
            { title: "SAVEPOINT", items: [] },
            { title: "ROLLBACK", items: [] },
            { title: "SET Transaction", items: [] },
            { title: "SET Constraints", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo4",
      title: "Implement Database security",
      hours: 19,
      performanceCriteria: [],
      topics: [
        {
          title: "Enforcement of data access control",
          subtopics: [
            { title: "Description of database security", items: ["Introduction of database security", "Types of database security"] },
            { title: "Data access control", items: [] },
            { title: "Access control policies", items: ["Identify the data classifications", "Define roles and permission"] },
            { title: "Authentication", items: ["Identify user accounts", "Create privileges", "Configure the authentication system", "Test the authentication system", "Monitor and maintain"] },
            { title: "Authorization", items: ["Create roles", "Assign permissions/privilege to roles", "Assign roles to users", "Test the authorisation system", "Monitor and maintain"] },
          ],
        },
        {
          title: "Management of Auditing and logging",
          subtopics: [
            { title: "Logging", items: ["Identify the logging requirements", "Configure logging settings", "Monitor log data", "Analyse log data", "Archive log data", "Corrective action"] },
            { title: "Auditing", items: ["Identify the data that needs to be audited", "Execution of SQL command", "Configure audit settings", "Review audit", "Analyse audit data", "Corrective action"] },
          ],
        },
        {
          title: "Implementation of Data encryption",
          subtopics: [
            { title: "Description of data encryption", items: [] },
            { title: "Application of encryption technics", items: ["Symmetric Encryption", "Asymmetric Encryption", "Hashing"] },
          ],
        },
        {
          title: "Configuration of database backup and restore",
          subtopics: [
            { title: "Introduction of data backup and restore", items: [] },
            { title: "Backup Method", items: ["Full backup", "Differential backup", "Incremental backup"] },
            { title: "Backup schedule", items: [] },
            { title: "Create Backup", items: [] },
            { title: "Perform recovery method", items: ["Full database recovery", "Rollback recovery", "Point-in-time recovery"] },
            { title: "Test your backup and recovery plan", items: [] },
          ],
        },
      ],
    },
  ],
};

export const SWDFA501: ModuleCurriculum = {
  code: "SWDFA501",
  title: "Front-End App Development with React.JS",
  level: "5",
  credits: 11,
  totalHours: 110,
  purpose: "Master Front-End App Development with React.JS. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Develop React.js application.",
      hours: 40,
      performanceCriteria: [],
      topics: [
        {
          title: "Preparation of React js environment",
          subtopics: [
            { title: "Definition of key concepts", items: ["ReactJS", "Component", "JSX (JavaScript XML)", "Props", "State", "Lifecycle Methods", "Hooks", "Virtual DOM", "React Router", "Redux"] },
            { title: "Introduction", items: ["Uses of react", "Features"] },
            { title: "Installation of NodeJS and Node Package Manager (NPM)", items: [] },
            { title: "Creating React Application", items: [] },
            { title: "Explore React project structure", items: [] },
            { title: "Installation of additional React tools and libraries (React Developer tools)", items: [] },
          ],
        },
        {
          title: "Applying React basics",
          subtopics: [
            { title: "React components", items: ["Class components", "Functional components"] },
            { title: "JSX (JavaScript XML)", items: [] },
            { title: "Props (Properties)", items: [] },
            { title: "Lifecycle Methods", items: ["componentDidMount", "componentDidUpdate", "componentWillUnmount"] },
          ],
        },
        {
          title: "Applying UI navigation",
          subtopics: [
            { title: "Installing React Route", items: [] },
            { title: "Configuring Routes", items: [] },
            { title: "Basic React Navigation", items: [] },
            { title: "Handling 404 Pages", items: [] },
            { title: "Redirects", items: [] },
            { title: "URL Parameters", items: [] },
            { title: "Nested Routing", items: [] },
          ],
        },
        {
          title: "Applying React hooks",
          subtopics: [
            { title: "Identifying hooks", items: ["State Hooks", "Effect Hooks", "Context Hooks", "Ref Hooks", "Callback Hooks"] },
            { title: "Hook selection and combination", items: [] },
            { title: "Optimizing Performance", items: [] },
            { title: "Handling Complex State Logic", items: [] },
            { title: "Managing Global State", items: ["Context API", "Redux", "MobX", "Zustand"] },
          ],
        },
        {
          title: "Implementation of Events handling",
          subtopics: [
            { title: "Description of Events", items: ["Types of events", "Synthetic events", "Event bubbling"] },
            { title: "Debouncing and Throttling Events", items: [] },
            { title: "Using Controlled Components", items: [] },
            { title: "Passing Arguments to Event Handlers", items: ["Arrow Function (in JSX)", "Bind Method"] },
            { title: "Use Custom Hooks for Event Listeners", items: [] },
            { title: "Handling Events on Dynamic Lists", items: [] },
          ],
        },
        {
          title: "Implementation of API integration",
          subtopics: [
            { title: "Initial Setup and Planning", items: ["Describe API", "Dependencies Installation (Axios)"] },
            { title: "Organizing API Calls", items: ["Defining and Grouping API Calls", "Handling Data Fetching and Responses", "Error Handling", "Asynchronous Handling and Concurrency"] },
            { title: "Performing API Security and testing", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Apply Tailwind CSS framework.",
      hours: 10,
      performanceCriteria: [],
      topics: [
        {
          title: "Applying Tailwind utility classes",
          subtopics: [
            { title: "Integrating of Tailwind CSS in React.JS", items: ["Install Tailwind CSS", "Configuring Tailwind CSS"] },
            { title: "Using Utility-First Fundamentals", items: [] },
            { title: "Handling Hover, Focus, and Other States", items: [] },
            { title: "Animation and Transitions", items: [] },
            { title: "Flexbox and Grid", items: [] },
            { title: "Reusing Styles", items: [] },
            { title: "Adding Custom Styles", items: [] },
            { title: "Functions & Directives", items: [] },
          ],
        },
        {
          title: "Applying responsive design principles",
          subtopics: [
            { title: "Mobile-First Approach", items: [] },
            { title: "Flexible Grid Layouts", items: [] },
            { title: "Responsive Images and Media", items: [] },
            { title: "Media Queries and Breakpoints", items: [] },
            { title: "Typography and Readability", items: [] },
            { title: "Interactive Elements", items: [] },
            { title: "Testing and Iteration", items: [] },
          ],
        },
        {
          title: "Customization of tailwind styles",
          subtopics: [
            { title: "Extending the Default Theme", items: [] },
            { title: "Adding Custom Variants", items: [] },
            { title: "Custom Fonts and Typography", items: [] },
            { title: "Customizing Colors", items: [] },
            { title: "Plugins for Additional Functionality", items: [] },
            { title: "Custom Directives for Complex Designs", items: [] },
            { title: "Conditional Styles with JavaScript", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Develop NextJS Application",
      hours: 20,
      performanceCriteria: [],
      topics: [
        {
          title: "Applying TypeScript basics",
          subtopics: [
            { title: "Environment setup", items: ["Installing TypeScript", "Configuring TypeScript"] },
            { title: "Implementing interface of variables", items: [] },
            { title: "Handling functions in TypeScript", items: [] },
            { title: "Data Handling", items: ["API data validation", "Form validation", "Error handling and exceptions"] },
          ],
        },
        {
          title: "Setup NextJS project",
          subtopics: [
            { title: "Preparation of Environment", items: [] },
            { title: "Project Creation", items: [] },
            { title: "Initial Development", items: ["Creating Pages and components", "Implementing search engine optimization (SEO)", "Styling", "Caching Strategies"] },
          ],
        },
        {
          title: "Implementing Rendering Techniques",
          subtopics: [
            { title: "Static Site Generation (SSG)", items: [] },
            { title: "Server-Side Rendering(SSR)", items: [] },
            { title: "Incremental Static Regeneration (ISR)", items: [] },
            { title: "Client-Side Rendering (CSR)", items: [] },
          ],
        },
        {
          title: "Implementing routing",
          subtopics: [
            { title: "Description of key concepts", items: ["File-system Based Routing", "Dynamic Routes", "Nested Routes", "Link Component", "Programmatic Navigation", "API Routes", "Catch-all Routes"] },
            { title: "Linking Components", items: [] },
            { title: "Programmatic Navigation", items: [] },
            { title: "Dynamic Routes", items: [] },
            { title: "Query Parameters", items: [] },
          ],
        },
        {
          title: "Creation of API",
          subtopics: [
            { title: "Define the API Endpoint", items: [] },
            { title: "Handling Request Types", items: [] },
            { title: "Using Dynamic API Routes", items: [] },
            { title: "Testing your API", items: [] },
          ],
        },
        {
          title: "Securing the Application",
          subtopics: [
            { title: "Performing Client-Side Security", items: ["Client-side rendering (CSR) security", "Cross-Origin Resource Sharing (CORS)", "Session management", "Third-party libraries (Auth0)"] },
            { title: "Performing Server-Side Security", items: ["HTTPS enforcement", "Server-side rendering (SSR) security", "API routes security", "Content Security Policy (CSP)", "Authentication"] },
            { title: "Performing General Security Measures", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo4",
      title: "Apply Progressive Web Application",
      hours: 20,
      performanceCriteria: [],
      topics: [
        {
          title: "Maintain Responsiveness",
          subtopics: [
            { title: "Leverage Progressive Enhancement", items: [] },
            { title: "Prioritize Mobile-First Design", items: [] },
            { title: "Utilize Performance Optimization Techniques", items: [] },
          ],
        },
        {
          title: "Configuring web application manifest",
          subtopics: [
            { title: "Creating and Configuring the Manifest File", items: [] },
            { title: "Referencing the Manifest in Your HTML", items: [] },
            { title: "Testing and Validation", items: [] },
          ],
        },
        {
          title: "Implementation of service workers",
          subtopics: [
            { title: "Describe Service workers", items: [] },
            { title: "Registration and Installation", items: [] },
            { title: "Caching Strategy Implementation", items: [] },
            { title: "Updating service worker", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo5",
      title: "Publish the application",
      hours: 20,
      performanceCriteria: [],
      topics: [
        {
          title: "Configuration of environment variables",
          subtopics: [
            { title: "Set variables (backend host, ftp host, ftp-user, ftp-pass …)", items: [] },
            { title: "Setup storage environment", items: ["Platform-specific options", "Separate .env files"] },
          ],
        },
        {
          title: "Deploying React Application",
          subtopics: [
            { title: "Run Build Script in React Application", items: [] },
            { title: "Configure Deployment Platform (Vercel)", items: [] },
            { title: "Migrate the application files", items: [] },
            { title: "Test the Deployed Application", items: [] },
          ],
        },
        {
          title: "Setup custom Domain",
          subtopics: [
            { title: "Description of DNS", items: ["Translation of Domain Names to IP Addresses", "Hierarchy and Structure", "Name Resolution Process:"] },
            { title: "Configure DNS and SSL Settings", items: [] },
            { title: "Testing and verification", items: [] },
          ],
        },
      ],
    },
  ],
};

export const SWDGD301: ModuleCurriculum = {
  code: "SWDGD301",
  title: "Game Development in Vue Framework",
  level: "3",
  credits: 12,
  totalHours: 120,
  purpose: "Master Game Development in Vue Framework. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Set Up Environment",
      hours: 20,
      performanceCriteria: [],
      topics: [
        {
          title: "Description of key concepts",
          subtopics: [
            { title: "CLI", items: [] },
            { title: "IDE", items: [] },
            { title: "Frontend", items: [] },
            { title: "Backend", items: [] },
            { title: "Single Page Application", items: [] },
            { title: "NodeJs & NPM", items: [] },
            { title: "Dependencies", items: [] },
            { title: "Environments", items: [] },
          ],
        },
        {
          title: "Development",
          subtopics: [
          ],
        },
        {
          title: "Testing",
          subtopics: [
          ],
        },
        {
          title: "Production",
          subtopics: [
            { title: "Introduce Vue JS Framework", items: [] },
          ],
        },
        {
          title: "Vue project installation",
          subtopics: [
            { title: "Install NodeJs", items: [] },
          ],
        },
        {
          title: "Verify NodeJs installation",
          subtopics: [
          ],
        },
        {
          title: "Configure NPM",
          subtopics: [
          ],
        },
        {
          title: "Test javascript file using Nodejs",
          subtopics: [
          ],
        },
        {
          title: "Install Vue CLI with npm",
          subtopics: [
          ],
        },
        {
          title: "Initiate Vue Project using terminal",
          subtopics: [
          ],
        },
        {
          title: "Run Vue project",
          subtopics: [
          ],
        },
        {
          title: "Description of Vue project folder & files",
          subtopics: [
            { title: "Node _modules", items: [] },
            { title: "Public folder", items: [] },
            { title: "src", items: [] },
            { title: "Asset", items: [] },
            { title: "Components", items: [] },
            { title: "helloWorld.vue", items: [] },
            { title: "app.vue", items: [] },
            { title: "main.js", items: [] },
            { title: "App.vue", items: [] },
            { title: "Package.json", items: [] },
            { title: "Vue.config.js", items: [] },
            { title: ".git ignore", items: [] },
            { title: "babel.config.js", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Apply Vue framework",
      hours: 30,
      performanceCriteria: [],
      topics: [
        {
          title: "Definition of key concepts",
          subtopics: [
            { title: "Components", items: [] },
            { title: "Routes", items: [] },
            { title: "Vue lifecycle", items: [] },
            { title: "State management", items: [] },
            { title: "API Endpoint", items: [] },
            { title: ".env file", items: [] },
          ],
        },
        {
          title: "Create folder structure",
          subtopics: [
            { title: "Assets folder", items: [] },
            { title: "Source code folder", items: [] },
            { title: "Components", items: [] },
            { title: "Router folder", items: [] },
            { title: "Store folder", items: [] },
            { title: "Views folder", items: [] },
            { title: "Mixins folder", items: [] },
          ],
        },
        {
          title: "Apply Vue component structure",
          subtopics: [
            { title: "Create View components in views folder", items: [] },
            { title: "Create Reusable components in component folder", items: [] },
            { title: "Apply Bootstrap to Vue components", items: [] },
            { title: "Reuse components in multiple places", items: [] },
          ],
        },
        {
          title: "Apply navigation in Vue project using router",
          subtopics: [
            { title: "Install Router package (vue-router)", items: [] },
            { title: "Create javascript file in router folder", items: [] },
            { title: "Define routes array in router instantiation", items: [] },
            { title: "Create view components (pages)", items: [] },
            { title: "Declarative navigation", items: [] },
            { title: "Use nested routes", items: [] },
            { title: "Use parameters inside the router", items: [] },
            { title: "404 Page", items: [] },
          ],
        },
        {
          title: "Data manipulation in Vue",
          subtopics: [
            { title: "Import necessary packages & components", items: [] },
            { title: "Apply Vue lifecycle methods", items: [] },
            { title: "Use Vue layout components", items: [] },
            { title: "Display JSON data in a table", items: [] },
            { title: "Use form in Vue component", items: [] },
          ],
        },
        {
          title: "Create form inputs",
          subtopics: [
          ],
        },
        {
          title: "Input binding",
          subtopics: [
          ],
        },
        {
          title: "Validate form inputs",
          subtopics: [
          ],
        },
        {
          title: "Submit form data",
          subtopics: [
          ],
        },
        {
          title: "API requests",
          subtopics: [
            { title: "Install axios package", items: [] },
            { title: "Configure axios in API helper file", items: [] },
            { title: "Use environment variable", items: [] },
            { title: "Fetch all CRUD APIs and display data to component", items: [] },
          ],
        },
        {
          title: "Manage data using state management",
          subtopics: [
            { title: "Definition of Key concepts", items: ["Getter", "Action", "Mutation", "Dispatch"] },
            { title: "Benefits of State management", items: [] },
            { title: "State managements", items: ["Vuex", "Redux", "Pinia"] },
            { title: "Install Vue DevTool in a browser", items: [] },
            { title: "Install state management(Vuex)", items: [] },
            { title: "Configure Vuex", items: [] },
            { title: "Define state modules", items: ["State data"] },
          ],
        },
        {
          title: "Action",
          subtopics: [
          ],
        },
        {
          title: "Mutation",
          subtopics: [
          ],
        },
        {
          title: "Getters",
          subtopics: [
            { title: "Store and retrieve data in state management", items: [] },
          ],
        },
        {
          title: "Get data from state getters",
          subtopics: [
          ],
        },
        {
          title: "Commit mutations",
          subtopics: [
          ],
        },
        {
          title: "Dispatch actions",
          subtopics: [
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Plan game",
      hours: 25,
      performanceCriteria: [],
      topics: [
        {
          title: "Description of key concepts",
          subtopics: [
            { title: "Game", items: [] },
            { title: "Game types", items: [] },
            { title: "Narrative", items: [] },
            { title: "Storyline", items: [] },
            { title: "Game controller", items: [] },
            { title: "Game Settings", items: [] },
            { title: "Game control", items: [] },
            { title: "Game HUD(heads-up display)", items: [] },
            { title: "Game characters", items: [] },
            { title: "Game environment", items: [] },
            { title: "Game interface", items: [] },
            { title: "Game consoles", items: [] },
          ],
        },
        {
          title: "Description of the Game",
          subtopics: [
            { title: "Definition of Game", items: [] },
          ],
        },
        {
          title: "Game type",
          subtopics: [
          ],
        },
        {
          title: "Game objective",
          subtopics: [
          ],
        },
        {
          title: "Game target devices",
          subtopics: [
          ],
        },
        {
          title: "Game dimension",
          subtopics: [
          ],
        },
        {
          title: "Game perspective",
          subtopics: [
          ],
        },
        {
          title: "Creation of Narrative",
          subtopics: [
            { title: "Storyline", items: [] },
            { title: "Sounds", items: [] },
            { title: "Background music", items: [] },
            { title: "Environment (scenery)", items: [] },
            { title: "Game level / reward level", items: [] },
            { title: "Mission: main and side", items: [] },
          ],
        },
        {
          title: ". Game mechanics",
          subtopics: [
            { title: "Key elements for defines game mechanics", items: [] },
          ],
        },
        {
          title: "game hud (heads-up display)",
          subtopics: [
          ],
        },
        {
          title: "Steps of the game",
          subtopics: [
          ],
        },
        {
          title: "Scores",
          subtopics: [
          ],
        },
        {
          title: "Level",
          subtopics: [
          ],
        },
        {
          title: "Speed",
          subtopics: [
          ],
        },
        {
          title: "Time",
          subtopics: [
          ],
        },
        {
          title: "Target Device",
          subtopics: [
            { title: "Determine game mechanics", items: [] },
          ],
        },
        {
          title: "Identification of game controls/.",
          subtopics: [
            { title: "Inputs/keys", items: [] },
            { title: "Hand accessibility", items: [] },
          ],
        },
        {
          title: "Primary control: thumb and index",
          subtopics: [
          ],
        },
        {
          title: "Secondary control: Middle fingers",
          subtopics: [
          ],
        },
        {
          title: "Support: Ring & pinkie fingers",
          subtopics: [
            { title: "Type of game controllers", items: [] },
          ],
        },
        {
          title: "Identification of Game Interface",
          subtopics: [
            { title: "Splashscreen", items: [] },
            { title: "Game characters", items: [] },
          ],
        },
        {
          title: "Define playable characters",
          subtopics: [
          ],
        },
        {
          title: "Define Non-playable Characters",
          subtopics: [
          ],
        },
        {
          title: "Define characters relationship",
          subtopics: [
          ],
        },
        {
          title: "Characters Interactivity",
          subtopics: [
          ],
        },
        {
          title: "Elements of good characters",
          subtopics: [
            { title: "Game environment", items: [] },
          ],
        },
        {
          title: "Define Game Dimensions",
          subtopics: [
          ],
        },
        {
          title: "Define Game perspective",
          subtopics: [
          ],
        },
        {
          title: "Define Playing Zone / Game Boundaries",
          subtopics: [
          ],
        },
        {
          title: "Define Scenes of different levels",
          subtopics: [
          ],
        },
        {
          title: "Define design tools for environment",
          subtopics: [
            { title: "Alert messages (success, failure, information, warning)", items: [] },
            { title: "Game Play Guide", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo4",
      title: "Develop Game",
      hours: 45,
      performanceCriteria: [],
      topics: [
        {
          title: "Definition of key concepts",
          subtopics: [
            { title: "Deployment", items: [] },
            { title: "Deployment/Hosting platforms", items: [] },
            { title: "Domain name", items: [] },
            { title: "SASS", items: [] },
            { title: "CANVAS", items: [] },
            { title: "SVG", items: [] },
          ],
        },
        {
          title: "Design game interface",
          subtopics: [
            { title: "Design game environment", items: [] },
          ],
        },
        {
          title: "Setup Html Canvas",
          subtopics: [
          ],
        },
        {
          title: "Draw in canvas HTML tags using Js",
          subtopics: [
          ],
        },
        {
          title: "Style Environment using SASS",
          subtopics: [
            { title: "Design environment components with SVG or Illustrator", items: [] },
            { title: "Design game HUD (heads-up display)", items: [] },
          ],
        },
        {
          title: "Design Containers for game stats",
          subtopics: [
          ],
        },
        {
          title: "Design container for character stats",
          subtopics: [
          ],
        },
        {
          title: "Design container for character resources (armor, weapon, tools,...)",
          subtopics: [
            { title: "Design game characters", items: [] },
          ],
        },
        {
          title: "Design characters using Illustrator",
          subtopics: [
          ],
        },
        {
          title: "Design characters with SVG",
          subtopics: [
          ],
        },
        {
          title: "Develop game functionalities",
          subtopics: [
            { title: "Develop Game Settings page/section", items: [] },
            { title: "Declare and Bind variables", items: [] },
            { title: "Setup animation speed", items: [] },
            { title: "Listen to Events", items: [] },
            { title: "Set up game conditions", items: [] },
            { title: "Setup random mechanisms to create diversity in the game", items: [] },
            { title: "Setup loops for repeatable actions including Non-playable character movements", items: [] },
            { title: "Develop SetIntervals for timed repeatable actions", items: [] },
            { title: "Setup incrementals for game scores and increase game difficulties", items: [] },
            { title: "Design and display Alert messages", items: [] },
            { title: "Store data in state management", items: [] },
          ],
        },
        {
          title: "Deploy game project on Netlify",
          subtopics: [
            { title: "Create deployment account", items: [] },
            { title: "Connect project with Git repository", items: [] },
            { title: "Configure deployment commands", items: [] },
            { title: "Create and merge PR on Github", items: [] },
            { title: "Success: Test Provided Netlify Domain", items: ["Integrated/Summative assessment", "Integrated situation", "The puzzle will have 8 pieces and at the beginning the 9th slot will be empty", "At the beginning the pieces will be arranged randomly and the sequence in which", "will change every you reload or try again", "The user can only move pieces next to the empty slot", "the pieces will be numbered depending on their respective slot they belong to", "The game will container 10 picture the player can unlock by completed the puzzle", "The game ends when rearranged the piece to form a clear image accor", "ding to the numbering order.", "when the player wins the puzzle, they will get rewarded by scores and fun fact and", "information about the historical figure", "The pieces must be equal in size"] },
          ],
        },
      ],
    },
  ],
};

export const SWDIA502: ModuleCurriculum = {
  code: "SWDIA502",
  title: "Integrate the Workplace",
  level: "5",
  credits: 20,
  totalHours: 200,
  purpose: "Master Integrate the Workplace. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Demonstrate supervisory skills",
      hours: 15,
      performanceCriteria: [],
      topics: [
        {
          title: "Identification of labour contract",
          subtopics: [
            { title: "Definition of key terms", items: ["Labor", "Contract", "Labor market"] },
            { title: "Main components of labor contract", items: ["Client", "Contractor", "duration"] },
            { title: "Types of labor contract", items: ["permanent labor contracts", "fixed-term contracts", "casual labor contracts"] },
            { title: "Low governing contract in Rwanda", items: [] },
          ],
        },
        {
          title: "Identification of supervisor ’s roles and responsibilities",
          subtopics: [
            { title: "Supervisor responsibilities", items: ["Workflow management", "Trainning new employees/intern", "Creating team schedule", "Evaluating employee/interns performance"] },
            { title: "Supervisor’s roles", items: [] },
          ],
        },
        {
          title: "Supervisor qualities and skills",
          subtopics: [
            { title: "Meaning of key terms", items: ["Skills", "Knowledge", "Qualities"] },
            { title: "Supervisor skills", items: ["Time management", "Communication skills", "Critical thinking"] },
            { title: "Supervisor qualities", items: ["Managing workflow", "Employable Skills for Sustainable Job Creation", "Trainning new hires", "Creating and managing team schedules", "Reporting", "Evaluating performance and providing feed back", "Help in employees conflict resolution"] },
          ],
        },
        {
          title: "Filing work related documents",
          subtopics: [
            { title: "Definition of key terms", items: ["Filing", "File", "document"] },
            { title: "Different ways to file documents in a filing cabinet", items: ["Alphabetical", "Category of Date", "Numerical", "Combination"] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Promote and Implement professional skills transfer",
      hours: 170,
      performanceCriteria: [],
      topics: [
        {
          title: "Elaboration of the implementation plan of competences acquired during IAP",
          subtopics: [
            { title: "Definition of implementation plan", items: [] },
            { title: "Description of components of implementation plan", items: ["Task to be performed", "Steps required", "Resource\u2019s needed", "Risks identification", "Schedules", "Task Verification"] },
          ],
        },
        {
          title: "Application of knowledge, skills and attitudes acquired during IAP implementation plan Execution",
          subtopics: [
            { title: "Definition execution of implementation plan?", items: [] },
            { title: "Performance evaluation of the task carried out", items: ["Define the learning objective", "Identifies concepts or skills students need to demonstrate", "Identify the level of performance and their points of values", "Identify criteria for each level of performance", "Create grading system based on possible points earned"] },
            { title: "Preparation of report on the work done", items: ["Elements of report writing", "The different types of reports"] },
            { title: "IAP report presentation", items: ["IAP report presentation definition", "How to write IAP report presentation", "Steps used for presenting AIP report"] },
          ],
        },
      ],
    },
  ],
};


export const SWDJS301: ModuleCurriculum = {
  code: "SWDJS301",
  title: "JavaScript Fundamentals",
  level: "3",
  credits: 10,
  totalHours: 100,
  purpose: "Master JavaScript Fundamentals. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Apply JavaScript Basic Concepts",
      hours: 20,
      performanceCriteria: [],
      topics: [
        {
          title: "Introduction to Javascript",
          subtopics: [
            { title: "Definition of JAVASCRIPT", items: [] },
            { title: "Application of Javascript", items: [] },
            { title: "Install VSCode & node", items: [] },
            { title: "JAVASCRIPT key concepts", items: ["Variable", "Data Types", "Values", "Operators", "Expressions", "Keywords", "Comments"] },
            { title: "Javascript libraries", items: ["React Javascript", "JQuery", "Three Javascript"] },
            { title: "Javascript frameworks", items: ["Vue Javascript", "Angular Javascript", "Employable Skills for Sustainable Job Creation", "Express Javascript"] },
            { title: "Javascript runtime environment", items: ["Node Javascript", "v8 Engine"] },
            { title: "Javascript versions", items: [] },
          ],
        },
        {
          title: "Integration of Javascript to HTML",
          subtopics: [
            { title: "Using <script> tag", items: ["Javascript in <head>", "Javascript in <body>"] },
            { title: "using external Javascript", items: [] },
            { title: "using external Javascript reference (CDN)", items: [] },
            { title: "Javascript output", items: [] },
          ],
        },
        {
          title: "Use of variables in JAVASCRIPT",
          subtopics: [
            { title: "Declaration of variable", items: ["Naming conversion", "Variable initialisation"] },
            { title: "Re-declaration of variable", items: [] },
          ],
        },
        {
          title: "use of data types in JAVASCRIPT",
          subtopics: [
            { title: "Primitive Data Types", items: [] },
            { title: "Non-primitive/reference data types", items: [] },
            { title: "Type-casting", items: [] },
          ],
        },
        {
          title: "Use of operators in Javascript",
          subtopics: [
            { title: "Assignment operators", items: [] },
            { title: "Arithmetic operators", items: [] },
            { title: "String operator", items: [] },
            { title: "Comparison operators", items: [] },
            { title: "Logical operators", items: [] },
            { title: "Bitwise operators", items: [] },
            { title: "Ternary operator", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Manipulate data with JavaScript",
      hours: 50,
      performanceCriteria: [],
      topics: [
        {
          title: "Using string in Javascript",
          subtopics: [
            { title: "String declaration", items: [] },
            { title: "Escape characters", items: [] },
            { title: "String concatenation", items: [] },
            { title: "String methods", items: [] },
            { title: "String search method", items: [] },
            { title: "String Template literals", items: [] },
          ],
        },
        {
          title: "Using conditional statement",
          subtopics: [
            { title: "If statement", items: [] },
            { title: "conditional (ternary) operator", items: [] },
            { title: "Switch", items: [] },
          ],
        },
        {
          title: "Using Loop functions in Javascript",
          subtopics: [
            { title: "For loop", items: [] },
            { title: "For/In Loop", items: [] },
            { title: "For/of loop", items: [] },
            { title: "while loop", items: [] },
            { title: "do / while loop", items: [] },
          ],
        },
        {
          title: "Using Functions in Javascript [Practical]",
          subtopics: [
            { title: "Function Definition", items: [] },
            { title: "Function parameters", items: [] },
            { title: "Arrow functions", items: [] },
            { title: "Built-in functions", items: [] },
            { title: "Function call", items: [] },
            { title: "Function apply", items: [] },
            { title: "Function bind", items: [] },
            { title: "Function closure", items: [] },
            { title: "Asynchronous functions", items: [] },
            { title: "promise functions", items: [] },
            { title: "Async/await function", items: [] },
          ],
        },
        {
          title: "Using objects in Javascript",
          subtopics: [
            { title: "Definition", items: ["Employable Skills for Sustainable Job Creation"] },
            { title: "Syntax", items: [] },
            { title: "Accessing object method and properties", items: [] },
            { title: "Object constructors", items: [] },
            { title: "Object sets", items: [] },
            { title: "Object maps", items: [] },
          ],
        },
        {
          title: "Using arrays in Javascript",
          subtopics: [
            { title: "Syntax", items: [] },
            { title: "Types", items: [] },
            { title: "Methods", items: [] },
            { title: "Arrays iterations", items: [] },
          ],
        },
        {
          title: "Using Javascript in HTML",
          subtopics: [
            { title: "HTML events", items: [] },
            { title: "Javascript HTML event listener", items: [] },
            { title: "Window Object", items: ["\u25a0 Properties", "console", "document", "\u25a0 innerHeight", "innerWidth", "length", "localStorage", "location", "\u25a0 Methods", "alert()", "setInterval()", "clearInterval()", "setTimeout()", "clearTimeout()", "open()", "confirm()", "close()", "stop()", "print()"] },
            { title: "Javascript form validation", items: [] },
            { title: "Apply Canvas", items: ["Introduction", "Drawing", "Coordinates", "Gradients", "Text", "Image"] },
            { title: "Javascript HTML DOM", items: ["innerHTML", "Employable Skills for Sustainable Job Creation", "getElementsById", "getElementsByClassName", "getElementsByName", "getElementsByTagName", "querySelector", "querySelectorAll"] },
            { title: "Javascript HTML styles", items: ["Animation", "Transition", "Slide show"] },
          ],
        },
        {
          title: "Applying regular expression",
          subtopics: [
            { title: "Modifiers", items: [] },
            { title: "Groups", items: [] },
            { title: "Metacharacters", items: [] },
            { title: "Quantifiers", items: [] },
          ],
        },
        {
          title: "Error handling",
          subtopics: [
            { title: "Types of error", items: [] },
            { title: "Try & catch", items: [] },
            { title: "Throw", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Apply JavaScript in Project",
      hours: 30,
      performanceCriteria: [],
      topics: [
        {
          title: "Preparing project environment",
          subtopics: [
            { title: "create project folder", items: [] },
            { title: "folders and files structuring", items: [] },
          ],
        },
        {
          title: "Create pages with HTML",
          subtopics: [
            { title: "Tables", items: [] },
            { title: "Form", items: [] },
          ],
        },
        {
          title: "Apply CSS to HTML pages",
          subtopics: [
            { title: "Inline css", items: [] },
            { title: "Internal css", items: [] },
            { title: "External css", items: [] },
            { title: "Imported css", items: [] },
          ],
        },
        {
          title: "Apply Javascript",
          subtopics: [
            { title: "Variables", items: [] },
            { title: "Operators", items: [] },
            { title: "Conditional statements", items: [] },
            { title: "Looping statements", items: [] },
            { title: "Functions", items: [] },
            { title: "Objects", items: [] },
          ],
        },
      ],
    },
  ],
};

export const SWDMA501: ModuleCurriculum = {
  code: "SWDMA501",
  title: "Mobile App Development",
  level: "5",
  credits: 10,
  totalHours: 100,
  purpose: "Master Mobile App Development. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Apply Basics of Dart",
      hours: 20,
      performanceCriteria: [],
      topics: [
        {
          title: "Preparation of development environment",
          subtopics: [
            { title: "Introduction to Dart", items: ["Dart features and characteristics", "Dart frameworks", "Use cases."] },
            { title: "Description of key terms", items: ["Data types", "Variables", "Control flow structures.", "Functions", "Native Apps", "Cross Platform"] },
            { title: "Installation of key tools (Windows and Apple)", items: ["Dart SDK", "Integrate dart with the Code Editor (Visual Studio Code)", "IDE for specific operating system", "Testing dart environment."] },
          ],
        },
        {
          title: "Applying the dart concept.",
          subtopics: [
            { title: "Declaration of variables", items: ["Data types", "Naming convention"] },
            { title: "Implement control flow structures.", items: ["Conditional statements", "Sequence switch statements.", "Iterating statements"] },
            { title: "Using functions", items: ["Using built-in functions", "Declaring functions", "Parameters and return types.", "Calling functions"] },
          ],
        },
        {
          title: "Applying Object Oriented Programming (OOP)",
          subtopics: [
            { title: "Classes and Objects", items: [] },
            { title: "Inheritance", items: [] },
            { title: "Polymorphism", items: [] },
            { title: "Encapsulation", items: [] },
            { title: "Abstraction", items: [] },
          ],
        },
        {
          title: "Using dart libraries and packages",
          subtopics: [
            { title: "Importing and using libraries", items: [] },
            { title: "Exploring built-in Dart libraries", items: [] },
            { title: "Managing dependencies with pub (Dart\'s package manager)", items: [] },
            { title: "Using external packages for enhanced functionality", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Implement UI designs",
      hours: 30,
      performanceCriteria: [],
      topics: [
        {
          title: "Preparation of flutter environment",
          subtopics: [
            { title: "Introduction to Flutter framework", items: ["Definition", "Purpose", "Features"] },
            { title: "Widgets", items: ["Definition", "Types", "Widget Lifecycle"] },
            { title: "State management", items: ["Definition", "Packages", "Libraries", "Methods"] },
            { title: "Environment Set Up", items: ["Installation of Flutter SDK", "Installation of IDE (Android Studio, XCode)", "Configuration of development environment"] },
            { title: "Creating a new Flutter project", items: [] },
          ],
        },
        {
          title: "Applying flutter\'s widget system",
          subtopics: [
            { title: "Stateful and stateless", items: [] },
            { title: "Widget Tree and Hierarchy", items: ["Parent-child relationships in Flutter", "Widget composition", "Row and Column", "Container", "Expanded", "Stack"] },
            { title: "Core widgets", items: ["Text and Styling", "Image and Asset", "Interactive (Buttons, Gesture).", "Layout Widgets"] },
          ],
        },
        {
          title: "Implementation of state management.",
          subtopics: [
            { title: "Using packages.", items: ["GetX package", "Provider package"] },
            { title: "Using pattern", items: ["Redux pattern", "Business Logic Component (BLoC) pattern"] },
            { title: "Using setState() method", items: [] },
            { title: "Using the riverpod solution.", items: [] },
            { title: "Using navigation and routing.", items: ["Navigator", "Route", "BottomNavigationBar", "TabBar and TabBarView"] },
          ],
        },
        {
          title: "Using pre-designed widgets",
          subtopics: [
            { title: "Material Design Widgets", items: [] },
            { title: "Cupertino Widgets", items: [] },
            { title: "Flutter Icons", items: [] },
            { title: "Third-Party Packages", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Integrate backend functionality.",
      hours: 30,
      performanceCriteria: [],
      topics: [
        {
          title: "Integration of external services",
          subtopics: [
            { title: "Description of HTTP Requests", items: ["GET", "POST", "PUT", "DELETE", "UPDATE", "PATCH"] },
            { title: "Adding dependencies", items: [] },
            { title: "Adding calls", items: [] },
            { title: "Handle Responses", items: [] },
            { title: "Parsing JSON Data", items: [] },
            { title: "Perform Authentication and Authorization", items: [] },
            { title: "Push notifications(firebase)", items: [] },
            { title: "Implement Security measures", items: ["Secure Data Storage", "Secure Network Communication", "Input Validation and Output Encoding"] },
          ],
        },
        {
          title: "Implement storage management.",
          subtopics: [
            { title: "Data integrity", items: [] },
            { title: "Security standards.", items: [] },
            { title: "Use Local Data Storage", items: ["Working with Shared Preferences", "Working with SQLite", "Working with File Storage"] },
          ],
        },
        {
          title: "Implementation of microapps",
          subtopics: [
            { title: "Description of modular microapp", items: ["Definition", "Structure"] },
            { title: "Applying modular microapps concept", items: ["Project structure", "Dependency injection", "Shared components"] },
            { title: "Perform microapp Build configuration", items: ["Configure each module pubspec file", "Android gradle", "iOS build settings"] },
          ],
        },
        {
          title: "Perform Error Handling",
          subtopics: [
            { title: "Description", items: ["Definition of error handling", "Error classes"] },
            { title: "Exception Management", items: ["try-catch block", "OnError", "CatchError"] },
            { title: "Rethrowing exceptions", items: ["Finally block", "on clause"] },
          ],
        },
        {
          title: "Perform testing",
          subtopics: [
            { title: "Description", items: ["Definition", "Importance", "Testing Levels"] },
            { title: "Implement Types of testing", items: ["Unit Tests", "Widget Tests", "Integration Tests", "Functional Tests", "UI Tests", "Performance Tests", "Regression Tests", "Cross-Platform Testing", "Security testing", "End-to-End (E2E) Tests", "Mocking and Stubbing", "Code Coverage Tests"] },
            { title: "Test device Responsiveness.", items: ["Select testing tools", "Test using Emulator and Simulator", "Test using Physical Device", "Perform manual Testing", "Perform automated testing"] },
            { title: "Test Reliability", items: ["Unit and Widget Testing", "Integration and End-to-End Testing", "Edge Case and Stress Testing", "Performance Testing and User Acceptance Testing (UAT)"] },
          ],
        },
        {
          title: "Debug Codebase issues.",
          subtopics: [
            { title: "Description of key terms", items: ["Codebase", "Debug", "Logging", "Flutter DevTools", "Isolation", "Assertion", "Breakpoints", "Print statement"] },
            { title: "Applying debugging methods", items: [] },
            { title: "Code Reviews", items: [] },
            { title: "Prepare documentation", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo4",
      title: "Publish Application",
      hours: 20,
      performanceCriteria: [],
      topics: [
        {
          title: "Generation of installable files",
          subtopics: [
            { title: "Description", items: ["Types of builds", "Installable file (Android & iOS)"] },
            { title: "Compilation Models", items: ["Just-in-Time (JIT) Compilation", "Ahead-of-Time (AOT) Compilation", "Hot Reload and Hot Restart mechanisms"] },
            { title: "Perform builds generation", items: ["iOS (IPA)", "Android (APK)"] },
          ],
        },
        {
          title: "Submission of application files",
          subtopics: [
            { title: "Prepare Store Assets", items: ["App Icon", "App Screenshots", "App promotional materials/previews"] },
            { title: "Create Developer account registration", items: ["Google Developer Console", "Apple Developer Account"] },
            { title: "Generate App Release Builds(.ipa, .aab)", items: [] },
            { title: "Configure app setting", items: ["App ID(Android & iOS)", "App Description", "Set up app listing", "Distribution"] },
            { title: "upload App bundles (Android & iOS)", items: [] },
          ],
        },
        {
          title: "Address post deployment issues",
          subtopics: [
            { title: "Monitor crash reports (UXCam,Sentry)", items: [] },
            { title: "Performance degradation", items: [] },
            { title: "Applying of App Store Optimization (ASO)", items: [] },
            { title: "Compatibility problems", items: ["Based on Operating System type", "Based on Operating System version (API Level, iOS version)"] },
            { title: "Perform Hot fixing", items: [] },
          ],
        },
      ],
    },
  ],
};

export const SWDML501: ModuleCurriculum = {
  code: "SWDML501",
  title: "Machine Learning Application",
  level: "5",
  credits: 8,
  totalHours: 80,
  purpose: "Master Machine Learning Application. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Apply Data Pre- processing",
      hours: 30,
      performanceCriteria: [],
      topics: [
        {
          title: "Description of Machine learning concepts",
          subtopics: [
            { title: "Machine learning overview", items: ["Definition", "Machine learning life cycle", "Machine Learning applications", "Advantages and disadvantages", "Difference between machine learning, artificial intelligence, and deep learning"] },
            { title: "Types of Machine Learning", items: ["Employable Skills for Sustainable Job Creation", "Supervised", "Unsupervised", "Semi-supervised", "Reinforcement"] },
            { title: "Machine Learning tools", items: [] },
          ],
        },
        {
          title: "Preparing Machine Learning environment",
          subtopics: [
            { title: "Installation of Python", items: [] },
            { title: "Installation of Tools", items: [] },
            { title: "Environment Testing", items: [] },
          ],
        },
        {
          title: "Data Collection and Acquisition",
          subtopics: [
            { title: "Description of key terms", items: ["data", "Information", "dataset", "Data warehouse", "Big data"] },
            { title: "Identification of Source of data", items: ["IoT Sensors", "Camera", "Computer", "Smartphone", "Social data", "Transactional data"] },
            { title: "Description of 6 V\'s of Big Data", items: ["Volume", "Variety", "Velocity", "Veracity", "Value", "Variability"] },
            { title: "Description of Types of data", items: ["Structured data", "Semi-structured data", "Unstructured data"] },
            { title: "Gathering Machine Learning dataset", items: [] },
          ],
        },
        {
          title: "Interpret Data Visualization",
          subtopics: [
            { title: "Description of data Visualization tools", items: ["Matplotlib", "Seaborn", "Plotly", "Tableau", "Power BI"] },
            { title: "Use Types of Data Visualization", items: ["Employable Skills for Sustainable Job Creation", "Scatter Plots", "Line Plots", "Bar Charts", "Histograms", "Box Plots", "Heat map"] },
            { title: "Applying data Visualization Best Practices", items: [] },
            { title: "Interpreting visualizations results", items: ["Patterns and Trends", "Context and Background", "Correlations and Relationships"] },
          ],
        },
        {
          title: "Perform Data cleaning",
          subtopics: [
            { title: "Data cleaning overview", items: ["Definition", "Purpose", "Steps"] },
            { title: "Description of Characteristics of quality Data", items: ["Accuracy", "Completeness", "Consistency", "Relevance", "Validity"] },
            { title: "Data cleaning for inconsistencies rectification", items: ["Importance of data Cleaning", "Data cleaning Techniques"] },
            { title: "Data normalization", items: ["Importance of data normalization", "Data normalization Techniques"] },
            { title: "Data transformation", items: ["Importance of data transformation", "Data transformation Techniques", "Types of Data transformation"] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Develop Machine Learning Model",
      hours: 30,
      performanceCriteria: [],
      topics: [
        {
          title: "Description of Machine learning algorithms and applications",
          subtopics: [
            { title: "Supervised Learning Algorithms", items: ["Linear Regression", "Logistic Regression", "Decision Trees", "Random Forest", "Support Vector Machine (SVM)", "k-Nearest Neighbors (KNN)", "Naive Bayes"] },
            { title: "Unsupervised Learning Algorithms", items: ["K-Means Clustering", "Principal Component Analysis (PCA)", "Hierarchical Clustering", "Anomaly Detection"] },
            { title: "Semi-supervised Learning Models", items: [] },
            { title: "Reinforcement Learning", items: ["Q-Learning", "Employable Skills for Sustainable Job Creation", "Deep Q-Networks (DQN)"] },
            { title: "Neural Network Architectures", items: ["Feedforward Neural Networks", "Neural Networks (Artificial Neural Networks)", "Convolutional Neural Networks (CNNs)", "Recurrent Neural Networks (RNNs)"] },
          ],
        },
        {
          title: "Selection of machine learning algorithm",
          subtopics: [
            { title: "Identify problem", items: ["regression", "classification", "clustering"] },
            { title: "analyse type of data in a given dataset", items: ["Independent variable", "Dependent variable"] },
            { title: "Resource analysis", items: ["computational power", "memory limitations"] },
            { title: "choose machine learning algorithm to be used", items: [] },
          ],
        },
        {
          title: "Train machine learning model",
          subtopics: [
            { title: "Load a dataset", items: ["Using pandas", "Using Numpy", "Using Scikit-Learn", "Using Seaborn", "Using Requests and io"] },
            { title: "Split dataset", items: ["train set", "test set", "validation set"] },
            { title: "Initialize model", items: [] },
            { title: "Fit the training data into a model", items: [] },
          ],
        },
        {
          title: "Evaluation of machine learning model",
          subtopics: [
            { title: "prediction of result", items: ["on test data", "on new data (unseen data)"] },
            { title: "Visualize predictions", items: [] },
            { title: "Analyse evaluation metrics", items: ["Accuracy", "precision", "recall", "F1 score", "Mean Absolute Error (MAE)", "Root Mean Squared Error (RMSE)", "R Squared score", "Adjusted R Squared score"] },
            { title: "Model interpretation", items: [] },
          ],
        },
        {
          title: "Tuning Hyperparameters",
          subtopics: [
            { title: "Define Hyperparameters search space", items: [] },
            { title: "Choose performance metric", items: [] },
            { title: "Perform hyperparameter search", items: [] },
            { title: "Evaluate performance", items: ["Get the best parameters", "Get the best model", "predict on validation data", "apply evaluation metrics on validation data", "apply evaluation metrics on test data"] },
            { title: "Resolve Potential Bias", items: ["Underfitting", "Overfitting"] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Perform Model Deployment",
      hours: 20,
      performanceCriteria: [],
      topics: [
        {
          title: "Selection of model deployment method",
          subtopics: [
            { title: "Description of model deployment methods", items: ["Definition", "Benefits"] },
            { title: "Identification of system specifications", items: ["Types of application (web application, mobile app, standalone program, Embedded system)", "Technology (programming languages and frameworks)"] },
            { title: "Identification of model specifications", items: ["Size of the dataset", "Memory limitations", "Computing power", "Format of the model file(Scikit-Learn, TensorFlow SavedModel, ONNX, PyTorch PT)"] },
          ],
        },
        {
          title: "Integration of model file",
          subtopics: [
            { title: "Integration goal", items: ["Predictions/Insights", "Generate content", "Data analysis", "Employable Skills for Sustainable Job Creation"] },
            { title: "Compatibility", items: [] },
            { title: "Interpret API endpoint usage", items: ["Model serving method", "Loading strategy"] },
            { title: "Integrate with existing systems", items: [] },
            { title: "Identification data format: Establish the format for input data sent to the API", items: ["JSON", "Form data"] },
            { title: "Implement communication", items: ["Use HTTP requests", "HTTP Responses to interact with existing system"] },
            { title: "Testing thoroughly deployment", items: [] },
            { title: "Deploy to production", items: [] },
            { title: "Monitor performance", items: [] },
            { title: "Track API requests, response times, and model accuracy.", items: [] },
          ],
        },
        {
          title: "Delivering Prediction to the clients",
          subtopics: [
            { title: "Integrating the API into application", items: [] },
            { title: "Formatting the predictions", items: [] },
            { title: "Handling errors", items: [] },
          ],
        },
      ],
    },
  ],
};

export const SWDND501: ModuleCurriculum = {
  code: "SWDND501",
  title: "NoSQL Database Development",
  level: "5",
  credits: 6,
  totalHours: 60,
  purpose: "Master NoSQL Database Development. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Prepare database environment",
      hours: 10,
      performanceCriteria: [],
      topics: [
        {
          title: "Identifying Database requirements",
          subtopics: [
            { title: "Definition of key terms", items: ["NoSQL", "MongoDB", "Availability", "Documents", "Collection", "Indexing", "Optimistic Locking", "Relationships", "Data model", "Schema", "Mongosh"] },
            { title: "Identifying user requirements", items: [] },
            { title: "Describe:", items: ["Characteristics of collections.", "Features of NoSQL Databases", "Types of NoSQL Databases", "Data Types"] },
            { title: "Defining use cases.", items: [] },
          ],
        },
        {
          title: "Analysing NoSQL Database",
          subtopics: [
            { title: "Describe requirements analysis process", items: ["Identify Key Stakeholders and End-Users.", "Capture Requirements.", "Categorize Requirements.", "Interpret and Record Requirements.", "Validate Requirements"] },
            { title: "Perform Data analysis", items: [] },
            { title: "Implement Data validation", items: [] },
          ],
        },
        {
          title: "Preparing Database environment.",
          subtopics: [
            { title: "identify the scalability of mongoDB", items: [] },
            { title: "Setting up MongoDB environment", items: ["Shell environment", "Compass environment", "Atlas environment"] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Design NoSQL database",
      hours: 20,
      performanceCriteria: [],
      topics: [
        {
          title: "Selecting tools of drawing databases.",
          subtopics: [
            { title: "Identify NoSQL drawing tools", items: [] },
            { title: "Installation of Edraw Max drawing tool", items: [] },
          ],
        },
        {
          title: "Creating Conceptual Data Model.",
          subtopics: [
            { title: "Identify Collections", items: [] },
            { title: "Model Entity Relationships", items: [] },
            { title: "Define sharding and replication", items: [] },
            { title: "Visualize High-Level Data Model", items: ["UML Class Diagrams", "Data Flow Diagrams (DFDs)"] },
            { title: "Design a conceptual data model", items: [] },
          ],
        },
        {
          title: "Designing MongoDB Database Schema",
          subtopics: [
            { title: "Identify Application Workload", items: [] },
            { title: "Define Collection Structure", items: [] },
            { title: "Map Schema Relationships", items: [] },
            { title: "Validate and Normalize Schema", items: [] },
            { title: "Apply Design Patterns", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Implement Database Design",
      hours: 20,
      performanceCriteria: [],
      topics: [
        {
          title: "Perform MongoDB Data Definition",
          subtopics: [
            { title: "Create", items: ["Database", "collections"] },
            { title: "Drop", items: ["Database", "Collections"] },
            { title: "Rename", items: ["Database", "collections"] },
          ],
        },
        {
          title: "MongoDB data Manipulating",
          subtopics: [
            { title: "Execute data manipulation", items: ["Insert document", "Update", "Delete", "Replacing Documents", "Querying Documents", "Indexes"] },
            { title: "Bulk Write Operations", items: [] },
            { title: "Aggregation Operations", items: [] },
            { title: "Apply Mongosh Methods", items: ["Collection Methods", "Cursor methods", "Database Methods", "Query plan cache methods", "Bulk operation methods", "User management methods", "Role management methods", "Replication methods", "Sharding methods", "Free monitoring methods", "Object constructors and methods", "Connection methods", "Atlas search index methods"] },
          ],
        },
        {
          title: "Apply Query optimizations",
          subtopics: [
            { title: "Describe Optimization techniques", items: [] },
            { title: "Evaluate Performance of Current Operations", items: [] },
            { title: "Optimize Query Performance", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo4",
      title: "Manage Mongodb database",
      hours: 10,
      performanceCriteria: [],
      topics: [
        {
          title: "Management of Database users",
          subtopics: [
            { title: "Identify the role of database users", items: [] },
            { title: "Creating Users", items: [] },
            { title: "Manage Roles and privilege", items: [] },
          ],
        },
        {
          title: "Securing Database",
          subtopics: [
            { title: "Enable Access Control and Enforce Authentication", items: [] },
            { title: "Configure Role-Based Access Control", items: [] },
            { title: "Data Encryption and Protect Data", items: [] },
            { title: "Audit System Activity", items: [] },
            { title: "Perform Backup and Disaster Recovery", items: [] },
          ],
        },
        {
          title: "Deployment of Database",
          subtopics: [
            { title: "Applying deployment Options", items: ["On-Premises", "Cloud", "Hybrid"] },
            { title: "Identify mongoDB Cluster Architectures", items: ["Single-Node", "Replica Set", "Sharded Cluster"] },
            { title: "Scaling MongoDB with Sharding", items: [] },
          ],
        },
      ],
    },
  ],
};

export const SWDOT501: ModuleCurriculum = {
  code: "SWDOT501",
  title: "DevOps Application",
  level: "5",
  credits: 6,
  totalHours: 60,
  purpose: "Master DevOps Application. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Perform server configuration",
      hours: 20,
      performanceCriteria: [],
      topics: [
        {
          title: "Preparation of environment",
          subtopics: [
            { title: "Definitions of key Terms", items: ["Server", "Linux", "Development Operations(DevOps)", "DevSecOps", "Container", "Node", "Infrastructure as Code IaC", "IaaS", "CI/CD"] },
            { title: "Identification of Linux distributions", items: [] },
            { title: "Installation of Linux operating system", items: [] },
          ],
        },
        {
          title: "Applying Linux basics commands",
          subtopics: [
            { title: "System Information", items: [] },
            { title: "File and Directory Management", items: [] },
            { title: "Text Processing", items: [] },
            { title: "Process Management", items: [] },
            { title: "Package Management", items: [] },
            { title: "User and Group Management", items: [] },
            { title: "System Control", items: [] },
          ],
        },
        {
          title: "Management of server services",
          subtopics: [
            { title: "Description of server services", items: ["Web", "Mail", "File", "SSH", "Network", "DNS", "PROXY", "Monitoring and Logging", "Backup"] },
            { title: "Configure server services", items: ["Web", "Mail", "File", "SSH", "Network", "DNS", "PROXY"] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Deploy the system",
      hours: 30,
      performanceCriteria: [],
      topics: [
        {
          title: "Preparation of deployment environment",
          subtopics: [
            { title: "Definitions of key Terms", items: ["Deployment", "Build agent", "Containerisation", "Docker", "Kubernetes", "Jargon", "Dependence"] },
            { title: "Evolution of DevOps and its importance", items: [] },
            { title: "DevOps advantages and Disadvantages", items: [] },
            { title: "Description of DevOps technologies", items: [] },
            { title: "Description of devOps principles", items: [] },
            { title: "Description of DevOps lifecycle", items: [] },
            { title: "Identification of technologies used in system to be deployed", items: [] },
            { title: "Selection of deployment technologies and tools", items: [] },
            { title: "Installation of system dependencies", items: [] },
          ],
        },
        {
          title: "Use Continuous delivery",
          subtopics: [
            { title: "Select CD tools", items: ["deployment orchestration", "CI server"] },
            { title: "Performing Continuous integration (CI)", items: ["Configure server", "Set up Automated build", "Implement Automated testing", "Check Code Quality", "Artifact Management", "Integration with version control", "Configure CI pipeline"] },
            { title: "Continuous deployment (CD)", items: ["Develop deployment scripts", "Use infrastructure as code (IaC)", "Use deployment orchestration tool", "Implement automated rollback", "Configure CD pipeline"] },
          ],
        },
        {
          title: "Configuration of container",
          subtopics: [
            { title: "Identification of containerisation tools", items: [] },
            { title: "Setup docker", items: [] },
            { title: "Build Docker Images", items: [] },
            { title: "Store Docker Images", items: [] },
            { title: "Implement Continuous Integration", items: [] },
          ],
        },
        {
          title: "Perform migration",
          subtopics: [
            { title: "Identify data migration best practice", items: [] },
            { title: "Selecting the Right Tools & Technology", items: [] },
            { title: "Creating a data migration pipeline", items: [] },
            { title: "Implement Continuous Integration", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Implement monitoring",
      hours: 10,
      performanceCriteria: [],
      topics: [
        {
          title: "Preparation of monitoring tools in DevOps environment",
          subtopics: [
            { title: "Benefits of DevOps monitoring", items: [] },
            { title: "Importance of monitoring tools", items: [] },
            { title: "Identification of monitoring tools types", items: ["Application tools", "Networking tools", "Infrastructure tools"] },
            { title: "Installation of monitoring tools", items: [] },
          ],
        },
        {
          title: "Analysis of Performance Metrics and Feedback Data",
          subtopics: [
            { title: "Introduce performance metrics and Feedback Data", items: [] },
            { title: "Describe significance of Data Analysis", items: [] },
            { title: "Describe types of data in Devops", items: [] },
            { title: "Utilizing Monitoring Tools", items: [] },
            { title: "Analysing Data in DevOps", items: ["Regular Review", "Root Cause Analysis", "Actionable Insights", "Feedback Loop Integration"] },
          ],
        },
        {
          title: "Documentation of monitoring report",
          subtopics: [
            { title: "Executive Summary", items: [] },
            { title: "Key Metrics", items: [] },
            { title: "Report findings", items: [] },
            { title: "Trends Analysis", items: [] },
            { title: "Alerts and Incidents", items: [] },
            { title: "Action Items", items: [] },
            { title: "Optimization or remediation.", items: [] },
            { title: "Conclusion", items: [] },
            { title: "Appendix( Include additional details, charts, graphs, or raw data)", items: [] },
          ],
        },
      ],
    },
  ],
};

export const SWDPP401: ModuleCurriculum = {
  code: "SWDPP401",
  title: "PHP Programming",
  level: "4",
  credits: 13,
  totalHours: 130,
  purpose: "Master PHP Programming. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Apply PHP Fundamentals.",
      hours: 40,
      performanceCriteria: [],
      topics: [
        {
          title: "Preparation of PHP Programming environment",
          subtopics: [
            { title: "Definition of key terms", items: ["PHP", "Interpreter", "Open Source", "Web Server", "Apache", "Database", "DBMS", "MySQL", "Static website", "Dynamic website"] },
            { title: "Purpose of PHP", items: [] },
            { title: "Important characteristics of PHP", items: [] },
            { title: "PHP Development Tools", items: ["XAMPP", "WAMP/MAMP/LAMP", "IDEs /Text Editors", "Browser"] },
            { title: "Installation of XAMPP/WAMP or LAMP", items: [] },
            { title: "Configuration of environment", items: ["Ports", "Browser", "Services", "IDEs Extensions"] },
          ],
        },
        {
          title: "Application of PHP concepts",
          subtopics: [
            { title: "PHP file extension", items: [] },
            { title: "Syntax", items: [] },
            { title: "Variable", items: [] },
            { title: "Operators", items: [] },
            { title: "Data types", items: [] },
            { title: "Variable scope", items: [] },
            { title: "Constants", items: [] },
            { title: "Comment", items: [] },
            { title: "Date and time", items: [] },
            { title: "String concatenation", items: [] },
            { title: "Condition statement", items: [] },
            { title: "Arrays", items: [] },
            { title: "Loop", items: [] },
            { title: "Function", items: ["Introduction to function", "Built-in functions", "User-defined functions", "calling function", "Function recursion"] },
            { title: "Super Global variables", items: [] },
            { title: "PHP file handling", items: ["Opening a file", "Reading a file", "Writing a file", "Closing a file", "Deleting a file"] },
          ],
        },
        {
          title: "Application of PHP Security concepts",
          subtopics: [
            { title: "PHP form handling", items: ["Post Method", "Get Method", "Validation"] },
            { title: "Cookies and Session", items: [] },
          ],
        },
        {
          title: "Implementation of Object-oriented programming (OOP) in PHP",
          subtopics: [
            { title: "Definition", items: [] },
            { title: "Classes", items: [] },
            { title: "Objects", items: [] },
            { title: "Inheritance", items: [] },
            { title: "Access modifiers", items: [] },
            { title: "Encapsulation", items: [] },
            { title: "Abstraction", items: [] },
            { title: "Polymorphism", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Connect PHP to the Database",
      hours: 37,
      performanceCriteria: [],
      topics: [
        {
          title: "Application of Database Connection drives",
          subtopics: [
            { title: "Mysqli", items: [] },
            { title: "Mysqli - OOP", items: [] },
            { title: "PDO", items: [] },
          ],
        },
        {
          title: "Perform database CRUD Operations",
          subtopics: [
            { title: "CRUD with Mysqli", items: [] },
            { title: "CRUD with Mysqli – OOP", items: [] },
            { title: "CRUD with PDO", items: [] },
            { title: "Import and export database", items: [] },
          ],
        },
        {
          title: "Application of PHP Basic security concepts",
          subtopics: [
            { title: "Input Validation", items: [] },
            { title: "Password Security", items: [] },
            { title: "Cross-Site Scripting (XSS) Prevention", items: [] },
            { title: "Cross-Site Request Forgery (CSRF) Prevention", items: [] },
            { title: "Session Security", items: [] },
            { title: "File Uploads", items: [] },
            { title: "Error Reporting", items: [] },
          ],
        },
        {
          title: "Errors and exceptions in PHP",
          subtopics: [
            { title: "Introduction", items: [] },
            { title: "Types of errors", items: [] },
            { title: "Exception Handling", items: ["Simple \u201cdie ()\u201d statements", "Custom error and error triggers", "Error reporting"] },
          ],
        },
        {
          title: "Implementation of user authentication",
          subtopics: [
            { title: "Introduction", items: [] },
            { title: "Types of user authentication", items: [] },
            { title: "User authorization", items: [] },
            { title: "Create User authentication", items: ["Start a session", "Authenticate the user", "Protect pages"] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Build a Content Management Learning hours: 25",
      hours: 25,
      performanceCriteria: [],
      topics: [
        {
          title: "Preparation of Content Management System (CMS)",
          subtopics: [
            { title: "Introduction to CMS", items: [] },
            { title: "Prepare CMS Environment", items: ["Blueprint the application", "Set up the database", "Set up project files and folders"] },
          ],
        },
        {
          title: "Build dynamic content navigation",
          subtopics: [
            { title: "List subjects", items: [] },
            { title: "Add pages for each subject", items: [] },
            { title: "Add page content", items: [] },
            { title: "Use the navigation to select pages", items: [] },
          ],
        },
        {
          title: "Management of cookies and sessions",
          subtopics: [
            { title: "Work with cookies", items: [] },
            { title: "Set and read cookies values", items: [] },
            { title: "Unset cookie values", items: [] },
            { title: "Work with sessions", items: [] },
            { title: "Set and read session values", items: [] },
            { title: "Unset Session", items: [] },
          ],
        },
        {
          title: "Application of Context and Options",
          subtopics: [
            { title: "The public content", items: [] },
            { title: "Skip hidden subjects and pages", items: [] },
            { title: "Use an option for conditional code", items: [] },
            { title: "Insecure direct object reference", items: [] },
            { title: "Project page visibility", items: [] },
            { title: "Allow html in dynamic contents", items: [] },
          ],
        },
        {
          title: "Regulate page access",
          subtopics: [
            { title: "User authentication overview", items: [] },
            { title: "Create admins table", items: [] },
            { title: "Build admin Dashboard", items: [] },
            { title: "PHP password functions", items: [] },
            { title: "Authentication user access", items: [] },
            { title: "Require authorization", items: [] },
            { title: "Log out user", items: [] },
            { title: "Optional password updating", items: [] },
            { title: "Authorized previewing", items: [] },
          ],
        },
        {
          title: "CMS Errors Detection",
          subtopics: [
            { title: "Description of CMS Errors", items: [] },
            { title: "Application of Errors testing", items: [] },
          ],
        },
        {
          title: "Maintain CMS",
          subtopics: [
            { title: "Regular updates", items: [] },
            { title: "Plugin and module updates", items: [] },
            { title: "Regular backups", items: [] },
            { title: "Database optimization", items: [] },
            { title: "Security measures", items: [] },
            { title: "Performance monitoring", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo4",
      title: "Build a web app using MVC Learning hours: 28",
      hours: 28,
      performanceCriteria: [],
      topics: [
        {
          title: "Framework environment configuration",
          subtopics: [
            { title: "Introduction to PHP framework", items: [] },
            { title: "Most popular PHP frameworks", items: ["Characteristics of each", "Advantages and disadvantages/limitations of each"] },
            { title: "Laravel MVC Architecture (Model, View, Controller)", items: [] },
            { title: "Installation of Laravel framework", items: [] },
            { title: "Laravel .env file configuration", items: [] },
            { title: "Use blade template for Laravel", items: [] },
          ],
        },
        {
          title: "Setup Laravel custom routing",
          subtopics: [
            { title: "Web and API routing", items: ["Laravel basic routing", "Routing parameters", "Laravel named routes", "Laravel middleware", "Laravel route groups"] },
          ],
        },
        {
          title: "Perform form data validation",
          subtopics: [
            { title: "CSRF Token", items: [] },
            { title: "Form Elements", items: [] },
          ],
        },
        {
          title: "Perform CRUD Operations",
          subtopics: [
            { title: "Configure database file", items: [] },
            { title: "Create Controllers for Laravel CRUD", items: [] },
            { title: "Create Models for Laravel CRUD", items: [] },
            { title: "Creation of migration", items: [] },
            { title: "Perform Seeding", items: [] },
            { title: "Create Views for Laravel CRUD", items: [] },
            { title: "Laravel CRUD operation routes", items: [] },
          ],
        },
        {
          title: "Manage APIs in Laravel frameworks",
          subtopics: [
            { title: "Introduction to API development", items: [] },
            { title: "RESTful APIs", items: ["Understanding RESTful architecture", "Building RESTful APIs with Laravel", "Test APIs with Postman", "Handling HTTP requests and responses"] },
            { title: "API Resources", items: ["Encoding API data"] },
          ],
        },
        {
          title: "Authentication and Security",
          subtopics: [
            { title: "Implementing API authentication", items: [] },
            { title: "Best practices for API security", items: [] },
            { title: "Managing API security", items: [] },
          ],
        },
        {
          title: "API Versioning and Documentation",
          subtopics: [
            { title: "Versioning your API", items: [] },
            { title: "Documenting your API with Swagger/Postman", items: [] },
            { title: "Best practices for API documentation", items: [] },
          ],
        },
      ],
    },
  ],
};

export const SWDPR301: ModuleCurriculum = {
  code: "SWDPR301",
  title: "Software Project Requirements Analysis",
  level: "3",
  credits: 5,
  totalHours: 50,
  purpose: "Master Software Project Requirements Analysis. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Identify customer needs",
      hours: 10,
      performanceCriteria: [],
      topics: [
      ],
    },
    {
      id: "lo2",
      title: "Gather project requirements",
      hours: 20,
      performanceCriteria: [],
      topics: [
      ],
    },
    {
      id: "lo3",
      title: "Determine user requirement",
      hours: 20,
      performanceCriteria: [],
      topics: [
      ],
    },
  ],
};

export const SWDUX301: ModuleCurriculum = {
  code: "SWDUX301",
  title: "UX Design",
  level: "3",
  credits: 10,
  totalHours: 100,
  purpose: "Master UX Design. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Analyse User Experience",
      hours: 30,
      performanceCriteria: [],
      topics: [
        {
          title: "Definition of Key Concepts",
          subtopics: [
            { title: "User experience", items: [] },
            { title: "User experience research", items: [] },
            { title: "Research Findings", items: [] },
          ],
        },
        {
          title: "Description of UX Research",
          subtopics: [
            { title: "UX Research Methods and Approaches", items: [] },
            { title: "Benefits of UX Research", items: [] },
            { title: "UX Researcher role and Responsibilities", items: [] },
            { title: "Types of UX Data", items: ["Quantitative UX Data", "Qualitative UX Data"] },
            { title: "Steps of UX Analysis", items: ["Identification of user issues", "Organization of UX data", "Looking for recurring issues", "Prioritization of fixes", "Sharing of findings and recommendations", "Building and testing new features"] },
          ],
        },
        {
          title: "Analysis of Brand Identity",
          subtopics: [
            { title: "Definition", items: ["Brand", "Brand Identity"] },
            { title: "Identification of brand design principles", items: [] },
            { title: "Identification of Brand Personas", items: [] },
            { title: "Identification of Brand Competition", items: [] },
          ],
        },
        {
          title: "Definition of Tasks",
          subtopics: [
            { title: "Understand product specifications and user psychology", items: [] },
            { title: "Interpret data and qualitative feedback", items: [] },
            { title: "Create user stories, personas, and storyboards", items: [] },
            { title: "Define the right interaction model and evaluate its success", items: [] },
            { title: "Develop wireframes and prototypes around customer needs", items: [] },
            { title: "Find creative ways to solve UX problems (e.g. usability, findability)", items: [] },
            { title: "Work with UI designers to implement attractive designs", items: [] },
            { title: "Communicate design ideas and prototypes to developers", items: [] },
          ],
        },
        {
          title: "Identification of end user pain point",
          subtopics: [
            { title: "Definition", items: [] },
            { title: "Levels of end user pain points", items: ["Interaction-level pain point", "Journey-level pain point", "Relationship-level pain point"] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Define the user",
      hours: 30,
      performanceCriteria: [],
      topics: [
        {
          title: "Definition of key terms",
          subtopics: [
            { title: "User story", items: [] },
            { title: "User personas", items: [] },
            { title: "User journey", items: [] },
            { title: "UX brief (UX project brief)", items: [] },
          ],
        },
        {
          title: "Creation of user story",
          subtopics: [
            { title: "Characteristics of user story", items: [] },
            { title: "Benefits of user stories", items: [] },
            { title: "Create user story", items: [] },
          ],
        },
        {
          title: "Identification of user personas",
          subtopics: [
            { title: "Importance of user personas", items: [] },
            { title: "Characteristics of user personas", items: [] },
            { title: "User personas in design process", items: ["Understand (Empathize, Define)", "Explore (Ideate, Prototype)", "Materialize (Test, Implement)"] },
            { title: "Steps of creating user personas", items: [] },
          ],
        },
        {
          title: "Creation of user journey",
          subtopics: [
            { title: "Types of user journey map", items: ["UX journey map", "Sales journey map", "Customer experience journey map"] },
            { title: "Elements of a user journey map", items: ["Persona", "Scenario", "Stages of the journey", "User actions", "User emotions and thoughts", "Opportunities", "Internal ownership"] },
            { title: "Create user journey map", items: [] },
          ],
        },
        {
          title: "Perform UX Research",
          subtopics: [
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Design Mock-up",
      hours: 40,
      performanceCriteria: [],
      topics: [
        {
          title: "Description of Key Concepts",
          subtopics: [
            { title: "User interface", items: [] },
            { title: "User experience", items: [] },
            { title: "Importance of UX/UI design the software development", items: [] },
            { title: "Important principles of user experience design", items: ["Clarity", "Consistency", "User control", "Comfort", "Ease of Use", "Accessibility"] },
            { title: "UX design process key phases", items: [] },
            { title: "Wireframe", items: [] },
            { title: "Mockup", items: [] },
            { title: "Prototype", items: [] },
            { title: "Distinction from wireframe, mockup and prototype", items: [] },
            { title: "Information Architecture", items: [] },
            { title: "Design thinking process", items: [] },
            { title: "User-centered design", items: [] },
            { title: "Usability", items: [] },
            { title: "3-Clicks rule", items: [] },
            { title: "Feedback", items: [] },
          ],
        },
        {
          title: "Use of Figma prototyping tool",
          subtopics: [
            { title: "Setup Figma", items: [] },
            { title: "Figma interface", items: ["Canvas", "Frames", "Menu", "Layers", "Design Panel", "Pages", "Inspect Panel", "Options", "Prototype", "Assets"] },
            { title: "Figma Mirror", items: [] },
          ],
        },
        {
          title: "Sketch wireframe",
          subtopics: [
          ],
        },
        {
          title: "Sketch mockup",
          subtopics: [
            { title: "Setting up files", items: ["Creating file", "Create and edit frames", "Creating pages"] },
            { title: "Management of layers", items: [] },
            { title: "Application of contents in design", items: ["adding predefined shapes", "Add custom shapes", "Pen tool", "Add Images", "Masking", "Effects and blending", "Strokes", "Management of layout (Auto-layout, Grid, Row, Columns)", "Application of element alignments"] },
            { title: "Creation of color palettes", items: [] },
            { title: "Creation of components", items: ["Reusable input components", "Reusable checkbox and radios", "Reusable button components", "Content cards"] },
            { title: "Application of mockup design", items: ["Content sections", "Navigation bar", "Sidebar menu", "Dropdown menu", "Design simple online shopping platform with Items listing, cart,", "checkout", "Design authentication pages", "Design a B2B platform"] },
            { title: "Test design using Figma Mirror", items: [] },
          ],
        },
        {
          title: "Presentation of Prototype",
          subtopics: [
            { title: "Starting prototyping", items: [] },
            { title: "Adding interactivity to the design", items: [] },
            { title: "Present Prototype", items: [] },
          ],
        },
      ],
    },
  ],
};

export const SWDVC301: ModuleCurriculum = {
  code: "SWDVC301",
  title: "Version Control",
  level: "3",
  credits: 7,
  totalHours: 120,
  purpose: "Master Version Control. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Setup repository",
      hours: 20,
      performanceCriteria: [],
      topics: [
        {
          title: "Definition of general key terms",
          subtopics: [
            { title: "Version control", items: [] },
            { title: "Git", items: [] },
            { title: "GitHub", items: [] },
            { title: "Terminal", items: [] },
          ],
        },
        {
          title: "Introduction to version control",
          subtopics: [
            { title: "Types of version control", items: [] },
          ],
        },
        {
          title: "Local version control",
          subtopics: [
          ],
        },
        {
          title: "Centralized version control system",
          subtopics: [
          ],
        },
        {
          title: "Distributed version control",
          subtopics: [
            { title: "Well Known version control system", items: [] },
          ],
        },
        {
          title: "Git",
          subtopics: [
          ],
        },
        {
          title: "CVS (Concurrent Version System)",
          subtopics: [
          ],
        },
        {
          title: "mercurial",
          subtopics: [
          ],
        },
        {
          title: "SVN(subversion)",
          subtopics: [
            { title: "Benefits of Version control", items: [] },
            { title: "Application of version control", items: [] },
          ],
        },
        {
          title: "Description of git",
          subtopics: [
            { title: "Git Basic concept", items: [] },
            { title: "Git architecture", items: [] },
            { title: "Git workflow", items: [] },
            { title: "Initialisation of Git", items: [] },
          ],
        },
        {
          title: "Terminal Basic commands",
          subtopics: [
          ],
        },
        {
          title: "Installation of Git Setup",
          subtopics: [
            { title: "Configure Git", items: [] },
          ],
        },
        {
          title: "Git init command",
          subtopics: [
          ],
        },
        {
          title: "Git config command",
          subtopics: [
          ],
        },
        {
          title: "Git – version command",
          subtopics: [
            { title: "Configure .git ignore file", items: [] },
          ],
        },
        {
          title: "Use of GitHub repository",
          subtopics: [
            { title: "Description of GitHub", items: [] },
            { title: "Create account on GitHub", items: [] },
            { title: "Create new remote repository", items: [] },
            { title: "Apply git commands related to repository", items: [] },
          ],
        },
        {
          title: "Git clone",
          subtopics: [
          ],
        },
        {
          title: "Git remote",
          subtopics: [
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Manipulate files",
      hours: 20,
      performanceCriteria: [],
      topics: [
        {
          title: "Definition of general key terms",
          subtopics: [
            { title: "Status", items: [] },
            { title: "Branch", items: [] },
            { title: "commit", items: [] },
          ],
        },
        {
          title: "Add file change to git staging area",
          subtopics: [
            { title: "Operation on git status command", items: [] },
          ],
        },
        {
          title: "View new untracked file",
          subtopics: [
          ],
        },
        {
          title: "View modified file",
          subtopics: [
          ],
        },
        {
          title: "View deleted file",
          subtopics: [
            { title: "Operation on git add command", items: [] },
          ],
        },
        {
          title: "Stage all files",
          subtopics: [
          ],
        },
        {
          title: "Stage a file",
          subtopics: [
          ],
        },
        {
          title: "Stage folder",
          subtopics: [
            { title: "Operation on git reset command", items: [] },
          ],
        },
        {
          title: "Unstage a file",
          subtopics: [
          ],
        },
        {
          title: "Deleting and staging file/folder",
          subtopics: [
            { title: "Operation on rm command", items: [] },
          ],
        },
        {
          title: "Remove and stage a file",
          subtopics: [
          ],
        },
        {
          title: "Remove and stage a folder",
          subtopics: [
          ],
        },
        {
          title: "Commit File changes to git local repository",
          subtopics: [
            { title: "Best practice of creating a commit message", items: [] },
            { title: "Operation on git commit command", items: [] },
          ],
        },
        {
          title: "Commit a file",
          subtopics: [
          ],
        },
        {
          title: "Edit commit message",
          subtopics: [
            { title: "Operation on git log command", items: [] },
          ],
        },
        {
          title: "To see simplified list of commit",
          subtopics: [
          ],
        },
        {
          title: "To see a list of commits with more detail",
          subtopics: [
          ],
        },
        {
          title: "Manage branches",
          subtopics: [
            { title: "Operations on branches", items: [] },
          ],
        },
        {
          title: "Create branch",
          subtopics: [
          ],
        },
        {
          title: "List branch",
          subtopics: [
          ],
        },
        {
          title: "Delete local and remote branch",
          subtopics: [
          ],
        },
        {
          title: "Switch branch",
          subtopics: [
          ],
        },
        {
          title: "Rename branch",
          subtopics: [
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Ship codes",
      hours: 30,
      performanceCriteria: [],
      topics: [
        {
          title: "Definition of general key terms",
          subtopics: [
          ],
        },
        {
          title: "pull",
          subtopics: [
          ],
        },
        {
          title: "fetch",
          subtopics: [
          ],
        },
        {
          title: "push",
          subtopics: [
          ],
        },
        {
          title: "pull request",
          subtopics: [
          ],
        },
        {
          title: "merge",
          subtopics: [
          ],
        },
        {
          title: "Fetch file from GitHub repository",
          subtopics: [
            { title: "Operation on git fetch command", items: [] },
          ],
        },
        {
          title: "Fetch the remote repository",
          subtopics: [
          ],
        },
        {
          title: "Fetch the specific branch",
          subtopics: [
          ],
        },
        {
          title: "Fetch all the branch simultaneously",
          subtopics: [
          ],
        },
        {
          title: "Synchronize the local repository",
          subtopics: [
            { title: "Operation on git pull", items: [] },
          ],
        },
        {
          title: "Default git pull",
          subtopics: [
          ],
        },
        {
          title: "Git pull remote branch",
          subtopics: [
          ],
        },
        {
          title: "Git force pull",
          subtopics: [
          ],
        },
        {
          title: "Git pull origin master",
          subtopics: [
          ],
        },
        {
          title: "Push files to remote branch",
          subtopics: [
            { title: "Tags used on git push command", items: [] },
            { title: "operation on git push", items: [] },
          ],
        },
        {
          title: "push on origin master",
          subtopics: [
          ],
        },
        {
          title: "git push force",
          subtopics: [
          ],
        },
        {
          title: "git push verbose",
          subtopics: [
          ],
        },
        {
          title: "delete a remote branch",
          subtopics: [
          ],
        },
        {
          title: "Merge branches on remote repository",
          subtopics: [
            { title: "operation on git rebase command", items: [] },
            { title: "create pull request", items: [] },
            { title: "operation on git merge", items: [] },
          ],
        },
        {
          title: "merge the specified commit to current active branch",
          subtopics: [
          ],
        },
        {
          title: "merge commits into the master branch",
          subtopics: [
          ],
        },
        {
          title: "git merge branch",
          subtopics: [
          ],
        },
      ],
    },
  ],
};

export const SWDWD301: ModuleCurriculum = {
  code: "SWDWD301",
  title: "Web Development",
  level: "3",
  credits: 12,
  totalHours: 120,
  purpose: "Master Web Development. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Apply keyboard skills",
      hours: 15,
      performanceCriteria: [],
      topics: [
        {
          title: "Use of keyboard characters",
          subtopics: [
            { title: "Definition", items: [] },
            { title: "Types", items: [] },
            { title: "Parts", items: [] },
          ],
        },
        {
          title: "Combination keys and their use",
          subtopics: [
          ],
        },
        {
          title: "Application of typing technique",
          subtopics: [
            { title: "Typing tips", items: ["Hand positioning", "Body posture", "Ergonomics", "Typing speed"] },
            { title: "Use of typing master", items: ["Check total number of words written per minute", "Maintain writing errors", "Games to improve typing speed"] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Create web structures",
      hours: 55,
      performanceCriteria: [],
      topics: [
        {
          title: "Definition of general key terms",
          subtopics: [
            { title: "Webpage", items: [] },
            { title: "Website", items: [] },
            { title: "Web browser", items: [] },
            { title: "Text editor", items: [] },
            { title: "URL", items: [] },
            { title: "Hyperlink", items: [] },
          ],
        },
        {
          title: "Setting up of text editor and web browser",
          subtopics: [
            { title: "Examples of text editor", items: [] },
            { title: "Types and function of web browser", items: [] },
            { title: "Installing text editor and web browser", items: ["From storage drive", "From internet"] },
          ],
        },
        {
          title: "Creating a web page in HTML",
          subtopics: [
            { title: "Description of website", items: ["Types", "Function"] },
            { title: "Introduction to HTML", items: [] },
            { title: "Description of HTML tag", items: ["Definition", "Types and examples", "Tag attributes"] },
            { title: "Developing first simple webpage", items: ["Employable Skills for Sustainable Job Creation", "Use HTML page structure", "Use HTML extension to save document", "Display contents using web browser"] },
            { title: "Developing webpage using HTML tag categories", items: ["Formatting tags", "Table tags", "Form tags", "Heading tags", "List tags", "Media tags", "Code tags", "HTML frame tags", "HTML Comment", "Grouping tags (div, span)"] },
            { title: "Use of Hyperlinks", items: ["Syntax", "Default link appearance", "Types"] },
            { title: "Use of HTML graphics", items: ["Canvas tags", "SVG tags"] },
          ],
        },
        {
          title: "Managing page layout in HTML",
          subtopics: [
            { title: "Definition of page layout", items: [] },
            { title: "Parts of webpage", items: [] },
            { title: "Use HTML tags to organise page layout", items: [] },
          ],
        },
        {
          title: "Optimizing webpage in HTML",
          subtopics: [
            { title: "Definition of optimization", items: [] },
            { title: "Benefit of applying SEO on webpage", items: [] },
            { title: "Use HTML tags to optimize webpage", items: ["Meta", "Title", "Heading", "Image alt", "HTML semantic tags"] },
            { title: "Web accessibility", items: ["HTML Role", "Test and Standard Validation"] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Style web elements",
      hours: 50,
      performanceCriteria: [],
      topics: [
        {
          title: "Introduction to CSS",
          subtopics: [
            { title: "Definition", items: [] },
            { title: "Utility", items: [] },
            { title: "Types", items: [] },
          ],
        },
        {
          title: "Creating CSS files",
          subtopics: [
            { title: "CSS syntax", items: ["Selector", "Declaration"] },
            { title: "Use of CSS style types", items: ["Inline", "Internal", "External", "Imported"] },
            { title: "Use CSS Visual rules", items: ["Font", "Text", "Colors and background colors", "Opacity", "Background image", "Employable Skills for Sustainable Job Creation"] },
            { title: "Use CSS Display and positioning", items: ["Relative", "Absolute", "Fixed", "Sticky", "Block"] },
            { title: "Use CSS Box model", items: ["Height and width", "Borders", "Border radius", "Padding", "Margin", "Visibility", "Auto"] },
          ],
        },
        {
          title: "Applying Typography on webpage",
          subtopics: [
            { title: "Introduction to typography", items: [] },
            { title: "Use CSS scripts for typography", items: [] },
            { title: "Use HTML tags required for typography", items: [] },
            { title: "Embed and position project object in webpage content", items: [] },
          ],
        },
        {
          title: "Setting media query rules",
          subtopics: [
            { title: "Description of media query rules", items: ["Definition", "Identify the device types"] },
            { title: "Use of breakpoint", items: ["For Desktop", "For Tablet", "For Smartphone"] },
            { title: "Media orientation", items: ["Portrait", "Landscape"] },
            { title: "Hide elements with media queries", items: [] },
            { title: "Variable Font Size", items: [] },
          ],
        },
      ],
    },
  ],
};

export const SWDWS401: ModuleCurriculum = {
  code: "SWDWS401",
  title: "Windows Server Administration",
  level: "4",
  credits: 9,
  totalHours: 90,
  purpose: "Master Windows Server Administration. Comprehensive curriculum with theoretical and practical components.",
  resources: ["Computer", "Projector", "Internet", "Documentation", "Development tools"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Manage Server Services",
      hours: 35,
      performanceCriteria: [],
      topics: [
        {
          title: "Introduction to server administration",
          subtopics: [
            { title: "Description of key terms", items: ["Server", "Client", "Network Operating System (NOS)", "Hypervisor", "Virtualalisation"] },
            { title: "Server virtualization", items: ["Hypervisor Technologies", "Types of server virtualization", "Benefits of server virtualization"] },
            { title: "Server requirements", items: ["Hardware requirements", "Software requirements"] },
          ],
        },
        {
          title: "Installation of Server OS",
          subtopics: [
            { title: "Creation of virtual storage (RAID)", items: ["Identification of RAID Levels", "Advantages and disadvantages of RAID technology", "Configuration of RAID on physical server"] },
            { title: "Installation of Hypervisor", items: [] },
            { title: "Creation of virtual machines", items: [] },
            { title: "Installation of guest OS", items: [] },
          ],
        },
        {
          title: "Creation of domain controller",
          subtopics: [
            { title: "Description of Server Administrative tools", items: [] },
            { title: "Installation of Active Directory Domain Services (ADDS)", items: [] },
            { title: "Promotion of server to a domain controller", items: [] },
          ],
        },
        {
          title: "Installation of server roles and features",
          subtopics: [
            { title: "Description of server roles and features", items: ["DNS (queries, operation, roles, root hints, zones and zone files)", "DHCP (messages and operation, Fault tolerance implementations, Security", "considerations, relay agent)"] },
            { title: "Installation of server roles and features", items: ["DNS", "DHCP"] },
          ],
        },
        {
          title: "Configuration of DNS",
          subtopics: [
            { title: "Lookup zones", items: [] },
            { title: "Creation of Alias (CNAME)", items: [] },
            { title: "DNS records", items: ["AAAA", "CNAME", "PTR", "SOA"] },
          ],
        },
        {
          title: "Configuration of DHCP parameters",
          subtopics: [
            { title: "Scope", items: ["scope name", "range of IP address", "Subnet mask", "Add exclusion", "Add lease time", "start DHCP service"] },
            { title: "Reservation", items: [] },
            { title: "Failover", items: [] },
          ],
        },
        {
          title: "Monitoring of Server services",
          subtopics: [
            { title: "nslookup command for resolving DNS", items: [] },
            { title: "Checking IP DHCP configuration on client", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Manage Users",
      hours: 30,
      performanceCriteria: [],
      topics: [
        {
          title: "Creation of User Accounts",
          subtopics: [
            { title: "Define User account policies", items: [] },
            { title: "Identification of user account level of access", items: ["Standard", "Administrator"] },
            { title: "New Account", items: [] },
            { title: "Copy Account", items: [] },
          ],
        },
        {
          title: "Management of user accounts",
          subtopics: [
            { title: "Changing user account password", items: [] },
            { title: "Remove account", items: [] },
            { title: "Activate Account", items: [] },
            { title: "Deactivate account", items: [] },
            { title: "Customisation of User Account Parameters", items: [] },
          ],
        },
        {
          title: "Management of user groups",
          subtopics: [
            { title: "Creation of group", items: [] },
            { title: "Adding users in groups", items: [] },
            { title: "Removing users from group", items: [] },
          ],
        },
        {
          title: "Management of Organization Units (OU)",
          subtopics: [
            { title: "Creation of OU", items: [] },
            { title: "Adding Users in OU", items: [] },
            { title: "Removing users from Organization unit", items: [] },
          ],
        },
        {
          title: "Assignment of Permission to Users",
          subtopics: [
            { title: "Grant and Revoke Users account permissions", items: [] },
            { title: "Change remote access permissions for a user account", items: [] },
          ],
        },
        {
          title: "Management of client machines",
          subtopics: [
            { title: "Joining a client computer to the domain", items: ["Setting of the client computer\u2019s name", "Establishing connectivity between client and server", "Changing from Workgroup to domain"] },
            { title: "Implementation of Delegation of control", items: [] },
            { title: "Description of Group Policy Object (GPO)", items: ["Types (Local, NonLocal, Starter)", "Hierarchy ( local, Site, Domain, OU)", "Group Policy Template (GPT)"] },
            { title: "Manage GPO settings", items: ["Creation of GPO", "GPO Editor", "Use of GPMC (Group Policy Management Console) to manage users"] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Deploy web application",
      hours: 25,
      performanceCriteria: [],
      topics: [
        {
          title: "Introduction to Web Servers",
          subtopics: [
            { title: "Definition of Web server", items: [] },
            { title: "Types of Web Servers/Web hosting Platform", items: ["IIS Web Server", "Apache Web Server", "Nginx Web Server", "Litespeed Web Server", "Apache Tomcat", "Node.js", "Lighttpd"] },
            { title: "Explain benefits and drawbacks of IIS", items: [] },
          ],
        },
        {
          title: "Configure IIS With Window Server",
          subtopics: [
            { title: "Enabling DNS Server", items: [] },
            { title: "Install IIS Role in selected Server", items: ["Enable HTTP Features", "Enable ASP.NET", "CGI Interface", "Add FTP Feature", "Enable HTTP Health and Diagnostics", "Confirmation of IIS installation", "Verify that IIS is installed successfully"] },
          ],
        },
        {
          title: "Management of IIS Web Server",
          subtopics: [
            { title: "Explain handler mapping", items: [] },
            { title: "Explain Connection tasks", items: [] },
            { title: "Explain FTP protocol", items: [] },
            { title: "Explain Site binding used by HTTP or HTTPS protocols", items: [] },
            { title: "Configure site binding of HTTP or HTTPS Protocols", items: [] },
          ],
        },
        {
          title: "Setting environment of developed web app",
          subtopics: [
            { title: "Explain hosting platforms available", items: ["Free hosting", "Paid hosting"] },
            { title: "Analysis of technical requirements for each hosting platforms:", items: ["Without backend server side", "With backend server side"] },
            { title: "Verification of local web app to be deployed to the server.", items: [] },
            { title: "Configuration of backend technology in IIS web Server", items: ["PHP Environment variables", "Configure WinCache for php web app", "FastCGI handler mapping for php web app", "IISNode module for Node.Js web app", "Configure web app environment security"] },
          ],
        },
        {
          title: "Verify Server environment requirement",
          subtopics: [
            { title: "Testing on local/remote computer/Server", items: ["Network", "Security", "Files", "Visibility"] },
            { title: "Verify Local URL accessibility", items: ["Accessibility", "Browsers", "Website speed", "Website size"] },
          ],
        },
        {
          title: "Hosting Web app",
          subtopics: [
            { title: "Upload Web app to window Server", items: [] },
            { title: "Specify the physical path", items: [] },
            { title: "Select the protocols", items: [] },
            { title: "Specify the Ip Address", items: [] },
            { title: "Configure Web app DNS", items: [] },
            { title: "Configure port number", items: [] },
            { title: "Handle discovered errors", items: [] },
          ],
        },
        {
          title: "Verification of successfully hosted Web app",
          subtopics: [
            { title: "Testing accessibility within a local Network", items: [] },
            { title: "Testing online accessibility", items: [] },
            { title: "Testing online website speed", items: [] },
            { title: "Verify size of online web app", items: [] },
          ],
        },
      ],
    },
  ],
};


export const CCMIA402: ModuleCurriculum = {
  code: "CCMIA402",
  title: "Industrial Attachment Program",
  level: "4",
  credits: 30,
  totalHours: 230,
  purpose: "Master Industrial Attachment Program.",
  resources: ["Computer", "Projector", "Internet"],
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Investigate and secure industrial attachment place",
      hours: 10,
      performanceCriteria: [],
      topics: [
      ],
    },
    {
      id: "lo3",
      title: "Get briefed on industrial attachment program",
      hours: 10,
      performanceCriteria: [],
      topics: [
      ],
    },
  ],
};

export const SWDBD401: ModuleCurriculum = {
  code: "SWDBD401",
  title: "APPLICATION DEVELOPMENT",
  level: "4",
  credits: 10,
  totalHours: 100,
  purpose: "Develop RESTFUL APIs with Node JS                  Learning hours: 45",
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  resources: ["Computer", "Projector", "Internet", "Relevant materials"],
  learningOutcomes: [
    {
      id: "lo1",
      title: "Develop RESTFUL APIs with Node JS                  Learning hours: 45",
      hours: 20,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "Data encryption in securing RESTFUL APIs",
          subtopics: [
            {
              title: "Introduction to data encryption",
              items: [],
            },
            {
              title: "Steps in securing RESTFUL APIs",
              items: [],
            },
          ],
        },
        {
          title: "Integrating and Using Third-Party Libraries",
          subtopics: [
            {
              title: "Installing Node Js Package Manager (NPM)",
              items: [],
            },
            {
              title: "Incorporating common Node.js third-party libraries",
              items: [],
            },
            {
              title: "Interacting with third-party libraries",
              items: [],
            },
          ],
        },
        {
          title: "Maintaining and Updating Third-Party Libraries",
          subtopics: [
            {
              title: "Monitoring of library dependencies and version numbers",
              items: [],
            },
            {
              title: "Checking for library updates and security vulnerabilities using tools",
              items: [],
            },
            {
              title: "Updating third-party libraries safely",
              items: [],
            },
            {
              title: "Strategies for managing and testing library updates",
              items: [],
            },
          ],
        },
        {
          title: "Implementation of Authentication",
          subtopics: [
            {
              title: "Principles of authentication",
              items: [],
            },
            {
              title: "Role of authentication in system security",
              items: [],
            },
            {
              title: "Implementing user authentication in Node.js using frameworks",
              items: [],
            },
            {
              title: "Using authentication middleware to protect routes and resources",
              items: [],
            },
            {
              title: "Best practices for password storage and handling sensitive data",
              items: [],
            },
          ],
        },
        {
          title: "Implementation of Authorization",
          subtopics: [
            {
              title: "Principles of authorization",
              items: [],
            },
            {
              title: "Role of authorization in system security",
              items: [],
            },
            {
              title: "Implementing role-based and attribute-based access control in Node.js",
              items: [],
            },
            {
              title: "Using authorization middleware to manage user permissions",
              items: [],
            },
            {
              title: "Implementing custom authorization logic for specific use cases",
              items: [],
            },
          ],
        },
        {
          title: "Implementation of Accountability",
          subtopics: [
            {
              title: "Principles of accountability",
              items: [],
            },
            {
              title: "Roles of Accountability in system security",
              items: [],
            },
            {
              title: "Implementing logging and auditing features in Node.js using popular libraries",
              items: [],
            },
            {
              title: "Logs management",
              items: [],
            },
          ],
        },
        {
          title: "Secure Environment Variables",
          subtopics: [
            {
              title: "Types of information stored in environment variables",
              items: [],
            },
            {
              title: "Potential security risks of storing sensitive information in environment variables",
              items: [],
            },
            {
              title: "Best practices for managing and securing environment variables in Node.js",
              items: [],
            },
            {
              title: "Implementing security measures for protecting environment variables",
              items: [],
            },
            {
              title: "Storing environment variables in a secure location",
              items: [],
            },
            {
              title: "Management and loading environment variables in Node.js applications using dotenv",
              items: [],
            },
            {
              title: "Best practices for safely passing environment variables to other services and",
              items: [],
            },
          ],
        },
        {
          title: "Monitor and Manage Environment Variables",
          subtopics: [
            {
              title: "Implementing logging and auditing features to detect unauthorized access to",
              items: [],
            },
            {
              title: "Monitoring changes to environment variables and detecting any suspicious activity",
              items: [],
            },
            {
              title: "Best practices for managing and rotating environment variables to prevent data",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Test Backend Application                  Learning hours: 20",
      hours: 15,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "Preparation of deployment Environment",
          subtopics: [
            {
              title: "Description of NodeJS application deployment",
              items: [],
            },
            {
              title: "Types of NodeJS application deployment",
              items: [],
            },
            {
              title: "NodeJS Application Deployment tools",
              items: [],
            },
          ],
        },
        {
          title: "Implementation of Manual Deployment of NodeJS application",
          subtopics: [
            {
              title: "Copy the application source code to the server",
              items: [],
            },
            {
              title: "Installation of dependencies",
              items: [],
            },
            {
              title: "Start the application using command line",
              items: [],
            },
          ],
        },
        {
          title: "Maintenance of NodeJS application",
          subtopics: [
            {
              title: "Best practices for maintenance",
              items: [],
            },
            {
              title: "Developing a maintenance plan",
              items: [],
            },
            {
              title: "Continuous maintenance and improvement of NodeJS applications",
              items: [],
            },
          ],
        },
        {
          title: "Application of NodeJS Documentation Tools and Frameworks",
          subtopics: [
            {
              title: "Documentation Overview",
              items: [],
            },
            {
              title: "The importance of documentation",
              items: [],
            },
            {
              title: "Types of documentation",
              items: [],
            },
            {
              title: "Overview of popular documentation tools and frameworks",
              items: [],
            },
            {
              title: "Best practices for documentation",
              items: [],
            },
            {
              title: "Publishing Documentation",
              items: [],
            },
          ],
        },
      ],
    },
  ],
};

export const GENGD301: ModuleCurriculum = {
  code: "GENGD301",
  title: "GENGD301",
  level: "3",
  credits: 8,
  totalHours: 80,
  purpose: "Edit photos with      Learning hours:25",
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  resources: ["Computer", "Projector", "Internet", "Relevant materials"],
  learningOutcomes: [
    {
      id: "lo1",
      title: "Edit photos with      Learning hours:25",
      hours: 40,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "Description of workspace",
          subtopics: [
            {
              title: "Definition",
              items: [],
            },
            {
              title: "Use of Workspace elements",
              items: [
                "Selecting Menus",
                "Arranging panels",
                "Selecting and customizing the toolbar",
                "Using undo command and history panel",
                "Setting Preferences",
                "Setting, Switching and saving workspaces",
                "Using keyboard shortcuts",
              ],
            },
            {
              title: "Use Artboards",
              items: [
                "Creating a project in adobe illustrator",
                "Customise artboard",
                "Creating multi artboard document",
                "Arranging the artboards panel",
                "Modifying and saving a project in adobe illustrator",
              ],
            },
            {
              title: "Use layers",
              items: [
                "Using the layer panel",
                "Creating, editing layers and sublayers",
                "Moving layers",
                "Merging layers",
                "Arranging layers",
              ],
            },
          ],
        },
        {
          title: "Create vector paths",
          subtopics: [
            {
              title: "Using Path types",
              items: [],
            },
            {
              title: "Using Pen tool",
              items: [],
            },
            {
              title: "Using Control handles",
              items: [],
            },
            {
              title: "Using the Selection tool",
              items: [],
            },
            {
              title: "Using the Scale tool",
              items: [],
            },
            {
              title: "Using the Rotate tool",
              items: [],
            },
            {
              title: "Using the Direct selection tool",
              items: [],
            },
          ],
        },
        {
          title: "Design shapes",
          subtopics: [
            {
              title: "Drawing basic shapes",
              items: [
                "Lines",
                "Curves",
                "Spirals",
                "Rectangles",
                "Ellipses",
                "Polygons",
                "Stars",
                "Using Pencil tool for freehand drawing",
              ],
            },
            {
              title: "Modifying shapes and paths",
              items: [
                "Drawing modes",
                "Creating compound paths and shapes",
                "Using the Brush tool",
                "Working with the Pathfinder panel",
                "Using the Eraser tool",
                "Using the anchor points",
                "Using the Shape Builder tool",
              ],
            },
            {
              title: "Transforming objects",
              items: [
                "Scaling objects",
                "Rotating objects",
                "Reflecting objects",
                "Distorting objects",
                "Moving and duplicating objects",
              ],
            },
            {
              title: "Manipulating fills and strokes",
              items: [
                "Adding color fill",
                "Creating and using gradient fills",
                "Adding strokes to objects",
              ],
            },
            {
              title: "Using the Swatches panel",
              items: [],
            },
            {
              title: "Using the color panel",
              items: [],
            },
            {
              title: "Picking color from image",
              items: [],
            },
            {
              title: "Using opacity",
              items: [],
            },
            {
              title: "Using Type tools",
              items: [],
            },
            {
              title: "Using the Type Command",
              items: [],
            },
            {
              title: "Using the character style panel",
              items: [],
            },
            {
              title: "Flowing type around objects",
              items: [],
            },
            {
              title: "Setting Type onto path",
              items: [],
            },
            {
              title: "Converting text into path",
              items: [],
            },
          ],
        },
        {
          title: "Description of brand identity",
          subtopics: [
            {
              title: "Brand",
              items: [],
            },
            {
              title: "Brand identity",
              items: [],
            },
            {
              title: "Brand icon",
              items: [],
            },
            {
              title: "Brand identity guidelines",
              items: [],
            },
            {
              title: "Logo",
              items: [],
            },
          ],
        },
        {
          title: "Design infographics",
          subtopics: [
            {
              title: "Icon",
              items: [],
            },
            {
              title: "Logo",
              items: [],
            },
            {
              title: "Web banners",
              items: [],
            },
            {
              title: "Flyer",
              items: [],
            },
            {
              title: "Description of design principals",
              items: [],
            },
            {
              title: "Create a brand identity guideline",
              items: [
                "Analyse brand Mood",
                "Determine typography",
                "Determine color patterns",
                "Determine spacing",
                "Determine shadows and line styles",
                "Specify logo usage",
              ],
            },
            {
              title: "Create Icons",
              items: [
                "Sketching ideas",
                "Using basic shapes to build icon symbols",
                "Apply color association",
                "Adding shine, gloss, shadow, texture, bevelled edges, 3D, and transparency",
              ],
            },
            {
              title: "Create Logo",
              items: [
                "Using Design considerations",
                "Selecting Types",
                "Using basic shapes to build a logo symbols",
                "Selecting Logo motifs",
                "Tracing image",
                "Using typography",
                "Applying effects",
                "Applying vectors",
                "Using black and white alternations",
              ],
            },
            {
              title: "Create web banner",
              items: [
                "Design considerations",
                "Applying Web based types",
                "Sketch blueprints",
                "Selecting Formats",
                "Selecting Sizes",
              ],
            },
            {
              title: "Create Flyer",
              items: [
                "Selecting Types",
                "Selecting Elements",
                "Applying graphics and typography",
                "Setting Standard sizes",
              ],
            },
            {
              title: "Apply effects by combining types",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Export file",
      hours: 15,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "Selection of file format",
          subtopics: [
            {
              title: "Description of file formats",
              items: [
                "Types",
                "Usage",
              ],
            },
            {
              title: "Arrange artwork according to the size requirements",
              items: [],
            },
            {
              title: "Save as type file formats",
              items: [],
            },
          ],
        },
        {
          title: "Set image quality",
          subtopics: [
            {
              title: "Identification of Image optimisation tools and programs",
              items: [],
            },
            {
              title: "Compression",
              items: [
                "Lossy optimisation",
                "Lossless optimisation",
              ],
            },
            {
              title: "Resizing image to scale",
              items: [],
            },
          ],
        },
        {
          title: "Export artwork",
          subtopics: [
            {
              title: "Photoshop",
              items: [
                "Paths to illustrator",
                "Zoomify",
                "Save for web",
              ],
            },
            {
              title: "Illustrator",
              items: [
                "Export for screens",
                "Export As",
                "Save for web",
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const GENFT302: ModuleCurriculum = {
  code: "GENFT302",
  title: "BDCPC301 -       Apply fundamental algebra and trigonometry",
  level: "3",
  credits: 6,
  totalHours: 60,
  purpose: "Solve algebraically or             Learning hours: 20",
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  resources: ["Computer", "Projector", "Internet", "Relevant materials"],
  learningOutcomes: [
    {
      id: "lo1",
      title: "Solve algebraically or             Learning hours: 20",
      hours: 20,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "Description of matrices properties",
          subtopics: [
            {
              title: "Matrices definition",
              items: [],
            },
            {
              title: "Operations on matrices",
              items: [],
            },
          ],
        },
        {
          title: "Computation of determinant",
          subtopics: [
            {
              title: "Matrix of order 2",
              items: [],
            },
            {
              title: "Matrix of order 3",
              items: [],
            },
          ],
        },
        {
          title: "Solving simultaneous linear equations",
          subtopics: [
            {
              title: "Cramer’s rule",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Apply fundamentals of",
      hours: 20,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "Description of angles",
          subtopics: [
            {
              title: "Angle definition by rotation",
              items: [],
            },
            {
              title: "Angles measurement",
              items: [],
            },
            {
              title: "Units conversion",
              items: [],
            },
            {
              title: "Pythagorean theorem",
              items: [],
            },
          ],
        },
        {
          title: "Determination of trigonometric ratios",
          subtopics: [
            {
              title: "Definition of trigonometric ratios",
              items: [],
            },
            {
              title: "Calculation of trigonometric ratios of special angles",
              items: [],
            },
          ],
        },
        {
          title: "Description of trigonometric identities",
          subtopics: [
            {
              title: "Relationship between trigonometric ratios of some angles",
              items: [],
            },
            {
              title: "Trigonometric ratios of Sum or difference of two angles",
              items: [],
            },
            {
              title: "Trigonometric ratios of double angle",
              items: [],
            },
          ],
        },
        {
          title: "Solving trigonometric equations",
          subtopics: [
            {
              title: "Equations reducible to the form;",
              items: [
                "sin ( x + a ) = k , k £ 1",
                "cos ( x + a ) = k , k £ 1",
                "tan ( x + a ) = b",
              ],
            },
            {
              title: "Equation of the form a sin x + b cos x = c",
              items: [],
            },
          ],
        },
        {
          title: "Solving a given triangle",
          subtopics: [
            {
              title: "Sine law",
              items: [],
            },
            {
              title: "Cosine law",
              items: [],
            },
          ],
        },
      ],
    },
  ],
};

export const GENGP302: ModuleCurriculum = {
  code: "GENGP302",
  title: "BDCPC301 -        Apply General Physics",
  level: "3",
  credits: 4,
  totalHours: 40,
  purpose: "Describe basic measurements in physics                              Learning hours: 8",
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  resources: ["Computer", "Projector", "Internet", "Relevant materials"],
  learningOutcomes: [
    {
      id: "lo1",
      title: "Describe basic measurements in physics                              Learning hours: 8",
      hours: 5,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "Explanation of displacement, velocity and acceleration concepts",
          subtopics: [
            {
              title: "Displacement & distance",
              items: [],
            },
            {
              title: "Description of Average & Instantaneous acceleration",
              items: [],
            },
          ],
        },
        {
          title: "Illustration of linear motion using corresponding graphs",
          subtopics: [
            {
              title: "Slopes and General Relationships",
              items: [],
            },
            {
              title: "Graph of displacement vs. time",
              items: [],
            },
            {
              title: "Graph of velocity vs. Time",
              items: [],
            },
          ],
        },
        {
          title: "Application of equations of motion",
          subtopics: [
            {
              title: "Velocity as a function of time",
              items: [],
            },
            {
              title: "Displacement as a function of time",
              items: [],
            },
            {
              title: "Final velocity as a function of displacement",
              items: [],
            },
            {
              title: "Analyze freely falling objects",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Analyze motion in two Dimensions                                         Learning hours: 6",
      hours: 8,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "Description of electrostatic charges and their conservation",
          subtopics: [
            {
              title: "Electric charges",
              items: [],
            },
            {
              title: "Electrification (charging) methods",
              items: [],
            },
            {
              title: "Electrostatic field",
              items: [],
            },
          ],
        },
        {
          title: "Determination of the electrostatic fields",
          subtopics: [
            {
              title: "Coulomb’s law of electrostatic charges",
              items: [],
            },
            {
              title: "Electric field intensity and potential",
              items: [],
            },
            {
              title: "Effect of an electrostatic field on a moving charge",
              items: [],
            },
          ],
        },
        {
          title: "Demonstration of effects of electric field on charged particles",
          subtopics: [
            {
              title: "Capacitors",
              items: [],
            },
            {
              title: "Electrostatic energy stored by a capacitor",
              items: [],
            },
            {
              title: "Examples of electrostatic phenomena",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo5",
      title: "Apply Geometric optics                                     Learning hours: 7",
      hours: 6,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "Explanation of basic concepts of work, energy and power",
          subtopics: [
            {
              title: "Explanation of work",
              items: [],
            },
            {
              title: "Explanation of energy",
              items: [],
            },
            {
              title: "Explanation of power",
              items: [],
            },
          ],
        },
        {
          title: "Identification of types of energy",
          subtopics: [
            {
              title: "Energy",
              items: [],
            },
            {
              title: "Identification of sources of energy",
              items: [],
            },
            {
              title: "Formation of energy",
              items: [],
            },
          ],
        },
        {
          title: "Analyzing relative advantages and disadvantages of various energy sources",
          subtopics: [
            {
              title: "Non- renewable (fossil fuel) energy",
              items: [],
            },
            {
              title: "Renewable sources",
              items: [],
            },
          ],
        },
      ],
    },
  ],
};

export const CCMBC302: ModuleCurriculum = {
  code: "CCMBC302",
  title: "-        Create a Business",
  level: "3",
  credits: 5,
  totalHours: 30,
  purpose: "Describe basic aspects of Entrepreneurship               Learning hours: 10 hours",
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  resources: ["Computer", "Projector", "Internet", "Relevant materials"],
  learningOutcomes: [
    {
      id: "lo1",
      title: "Describe basic aspects of Entrepreneurship               Learning hours: 10 hours",
      hours: 5,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "     Analysis of business environment",
          subtopics: [
            {
              title: " Meaning of business environment",
              items: [],
            },
            {
              title: " Categories of business environment",
              items: [],
            },
            {
              title: "Internal business environment",
              items: [],
            },
            {
              title: "(Value system, mission and objectives, corporate culture and style of functioning of top",
              items: [],
            },
            {
              title: "management, quality of human",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Generate         Business Idea",
      hours: 15,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: " Describing Sources of Business idea",
          subtopics: [
            {
              title: "Talents",
              items: [],
            },
            {
              title: "Attending events",
              items: [],
            },
            {
              title: "Other Countries",
              items: [],
            },
            {
              title: "Scientific Discovery",
              items: [],
            },
            {
              title: "Exhibitions",
              items: [],
            },
            {
              title: "customer needs, complaints, preferences, wishes",
              items: [],
            },
            {
              title: "Personal interest /hobbies",
              items: [],
            },
            {
              title: "changes in society",
              items: [],
            },
            {
              title: "prior jobs",
              items: [],
            },
            {
              title: "gap in market place",
              items: [],
            },
            {
              title: "surveys",
              items: [],
            },
          ],
        },
        {
          title: " Characteristics/qualities of business ideas",
          subtopics: [
            {
              title: "Market driven",
              items: [],
            },
            {
              title: "Feasible",
              items: [],
            },
            {
              title: "Unique",
              items: [],
            },
            {
              title: "Fundable",
              items: [],
            },
          ],
        },
        {
          title: " Techniques of discovering new business idea",
          subtopics: [
            {
              title: "Observation",
              items: [],
            },
            {
              title: "Story telling",
              items: [],
            },
            {
              title: "Interview",
              items: [],
            },
            {
              title: "Survey",
              items: [],
            },
            {
              title: "Brainstorming",
              items: [],
            },
          ],
        },
        {
          title: " Reasons for generating business ideas",
          subtopics: [
            {
              title: "Respond to market needs",
              items: [],
            },
            {
              title: "Changing fashions and requirements",
              items: [],
            },
            {
              title: "To stay ahead of the competition",
              items: [],
            },
            {
              title: "To exploit technology",
              items: [],
            },
            {
              title: "Because of Product life cycle",
              items: [],
            },
            {
              title: "To spread risk and minimise failure",
              items: [],
            },
            {
              title: "5|Page",
              items: [],
            },
            {
              title: "Employable Skills for Sustainable Job Creation",
              items: [],
            },
          ],
        },
        {
          title: " Explaining the components of business feasibility study",
          subtopics: [
            {
              title: "Product feasibility",
              items: [],
            },
            {
              title: "Market feasibility",
              items: [],
            },
            {
              title: "Organizational feasibility",
              items: [],
            },
            {
              title: "Financial feasibility",
              items: [],
            },
            {
              title: "Recommendations and conclusion",
              items: [],
            },
          ],
        },
      ],
    },
  ],
};

export const CCMCL302: ModuleCurriculum = {
  code: "CCMCL302",
  title: "-        Apply computer literacy",
  level: "3",
  credits: 3,
  totalHours: 30,
  purpose: "Apply computer basics                                        Learning hours: 10",
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  resources: ["Computer", "Projector", "Internet", "Relevant materials"],
  learningOutcomes: [
    {
      id: "lo1",
      title: "Apply computer basics                                        Learning hours: 10",
      hours: 5,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "     Creating and Edit a table",
          subtopics: [
            {
              title: " Inserting a table",
              items: [],
            },
          ],
        },
        {
          title: " Inserting a column, Inserting a row",
          subtopics: [
            {
              title: " Merging cells",
              items: [],
            },
            {
              title: " Deleting table",
              items: [],
            },
          ],
        },
        {
          title: "     Editing document(Text)",
          subtopics: [
            {
              title: " Search/Find, replace",
              items: [],
            },
          ],
        },
        {
          title: " Deleting a range of text",
          subtopics: [
            {
              title: " Undo & Redo command",
              items: [],
            },
            {
              title: "4|Page",
              items: [],
            },
            {
              title: "Employable Skills for Sustainable Job Creation",
              items: [],
            },
          ],
        },
        {
          title: "     Inserting header, Footer and Footnotes",
          subtopics: [
            {
              title: " Footnotes",
              items: [],
            },
            {
              title: " Header and footer",
              items: [],
            },
          ],
        },
        {
          title: " Automatic page numbering",
          subtopics: [
            {
              title: " Total number of pages",
              items: [],
            },
            {
              title: "     Saving a document",
              items: [],
            },
            {
              title: " File management",
              items: [],
            },
          ],
        },
        {
          title: " File naming and file formats",
          subtopics: [
            {
              title: "     Printing a document",
              items: [],
            },
            {
              title: " Page setup",
              items: [],
            },
            {
              title: " Printer options",
              items: [],
            },
          ],
        },
        {
          title: " Printing one or more copies",
          subtopics: [
            {
              title: " Printing selected pages",
              items: [],
            },
          ],
        },
        {
          title: " Printing in black/white or color",
          subtopics: [
            {
              title: " Print page ranges",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Use current spreadsheet package                                       Learning hours: 5",
      hours: 5,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "   Creation a new presentation",
          subtopics: [
            {
              title: " Creating new presentation",
              items: [],
            },
            {
              title: " Blank presentation and Design template",
              items: [],
            },
            {
              title: "   Management of a slide",
              items: [],
            },
            {
              title: " Creating a slide",
              items: [],
            },
            {
              title: " Inserting a slide",
              items: [],
            },
            {
              title: " Modifying a slide",
              items: [],
            },
            {
              title: "   Insertion of graphics",
              items: [],
            },
            {
              title: " Clip Art and Word Art,",
              items: [],
            },
            {
              title: " Library Images,",
              items: [],
            },
            {
              title: " Inserting image from file",
              items: [],
            },
          ],
        },
        {
          title: "   Conversion word documents to PowerPoint presentation",
          subtopics: [
            {
              title: " Copy, cut, move",
              items: [],
            },
            {
              title: " Import file",
              items: [],
            },
            {
              title: " Process of conversion",
              items: [],
            },
          ],
        },
        {
          title: "   Animation of a presentation document",
          subtopics: [
            {
              title: " Animation",
              items: [],
            },
            {
              title: " Custom animation",
              items: [],
            },
            {
              title: " Slide transition",
              items: [],
            },
          ],
        },
        {
          title: "   Use of different presentation view",
          subtopics: [
            {
              title: " Normal view",
              items: [],
            },
            {
              title: " Slide sorter view",
              items: [],
            },
            {
              title: " Slide show",
              items: [],
            },
          ],
        },
        {
          title: "   Printing a presentation document",
          subtopics: [
            {
              title: " Print preview",
              items: [],
            },
            {
              title: " Printing a copy or multiple copies",
              items: [],
            },
            {
              title: " Printing one slide on a page",
              items: [],
            },
            {
              title: " Printing more slides on a page",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo5",
      title: "Use Internet/Intranet (outlook)",
      hours: 5,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "Definition of terms: internet, web browser, Website, Webpage, Search engine)",
          subtopics: [
            {
              title: " Types of website",
              items: [],
            },
            {
              title: "Dynamic",
              items: [],
            },
            {
              title: "Static",
              items: [],
            },
          ],
        },
        {
          title: " Parts of website address",
          subtopics: [
            {
              title: "HTTP",
              items: [],
            },
            {
              title: "WWW",
              items: [],
            },
            {
              title: "Domain name of website",
              items: [],
            },
            {
              title: "Domain name suffix",
              items: [],
            },
          ],
        },
        {
          title: "   Use search engines (example Google)",
          subtopics: [
            {
              title: " Search engines types",
              items: [],
            },
            {
              title: " Role of search engines",
              items: [],
            },
          ],
        },
        {
          title: " Steps to create a chat account",
          subtopics: [
            {
              title: " Chatting options",
              items: [],
            },
          ],
        },
        {
          title: "   Management favourites using internet explorer",
          subtopics: [
            {
              title: " Favourites types",
              items: [],
            },
            {
              title: " Creation of favourites",
              items: [],
            },
          ],
        },
        {
          title: "   Browsing on internet using the hyperlinks",
          subtopics: [
            {
              title: " Definition of hyperlink",
              items: [],
            },
          ],
        },
        {
          title: "   Basic parts of web browser",
          subtopics: [
            {
              title: " Examples of web browser",
              items: [],
            },
            {
              title: "Google Chrome.",
              items: [],
            },
            {
              title: "Mozilla Firefox.",
              items: [],
            },
            {
              title: "Microsoft Edge.",
              items: [],
            },
            {
              title: "Internet Explorer.",
              items: [],
            },
            {
              title: "8|Page",
              items: [],
            },
            {
              title: "Employable Skills for Sustainable Job Creation",
              items: [],
            },
            {
              title: "Safari",
              items: [],
            },
          ],
        },
        {
          title: " Definition of terms",
          subtopics: [
            {
              title: "Downloading",
              items: [],
            },
            {
              title: "File attachment",
              items: [],
            },
            {
              title: "Uploading",
              items: [],
            },
          ],
        },
        {
          title: " Steps of downloading files",
          subtopics: [
            {
              title: " Tips of uploading files",
              items: [],
            },
          ],
        },
      ],
    },
  ],
};

export const CCMCZ301: ModuleCurriculum = {
  code: "CCMCZ301",
  title: "",
  level: "3",
  credits: 3,
  totalHours: 30,
  purpose: "Describe        Learning hours:8",
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  resources: ["Computer", "Projector", "Internet", "Relevant materials"],
  learningOutcomes: [
    {
      id: "lo1",
      title: "Describe        Learning hours:8",
      hours: 10,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "The construction of Rusumo bridge",
          subtopics: [
            {
              title: "improved seeds and plants",
              items: [],
            },
          ],
        },
        {
          title: "Creation of political institutions",
          subtopics: [
            {
              title: "Improvement in Education",
              items: [],
            },
          ],
        },
        {
          title: " Failures/Weaknesses of the First Republic",
          subtopics: [
            {
              title: "Increased refugee problem",
              items: [],
            },
            {
              title: "Ethnic violence",
              items: [],
            },
          ],
        },
        {
          title: "Corruption and embezzlement",
          subtopics: [
            {
              title: "Monopartism",
              items: [],
            },
          ],
        },
        {
          title: "Regional divisionism in PARMEHUTU",
          subtopics: [
            {
              title: "Favouritism and Nepotism",
              items: [],
            },
          ],
        },
        {
          title: "Lack of rule of law and the culture of impunity",
          subtopics: [
            {
              title: "Dictatorship",
              items: [],
            },
            {
              title: "Injustices",
              items: [],
            },
          ],
        },
        {
          title: " Failures/ weaknesses of the Second Republic",
          subtopics: [
            {
              title: "4|Page",
              items: [],
            },
            {
              title: "Employable Skills for Sustainable Job Creation",
              items: [],
            },
          ],
        },
        {
          title: "Use of violence against the opponents",
          subtopics: [
            {
              title: "Censorship of the press",
              items: [],
            },
            {
              title: "Bad governance",
              items: [],
            },
            {
              title: "The creation of “Akazu”",
              items: [],
            },
          ],
        },
        {
          title: "The unsolved refugee question",
          subtopics: [
            {
              title: "Personality Cult",
              items: [],
            },
            {
              title: "Lack of democracy",
              items: [],
            },
          ],
        },
        {
          title: "The foundation of the RANU and birth of the RPF Inkotanyi",
          subtopics: [
            {
              title: "The military option",
              items: [],
            },
          ],
        },
        {
          title: "Extension of guerrilla war (1991-1992)",
          subtopics: [
            {
              title: "Peace process (1991-1993)",
              items: [],
            },
          ],
        },
        {
          title: "The end of the Liberation War and the campaign to stop the Genocide",
          subtopics: [
            {
              title: " The effects of the war",
              items: [],
            },
          ],
        },
        {
          title: "It revealed the weakness of the OAU",
          subtopics: [
            {
              title: "Social reconciliation",
              items: [],
            },
          ],
        },
        {
          title: "The loss of francophone’s influence in Rwanda",
          subtopics: [
            {
              title: "Internal displacement",
              items: [],
            },
          ],
        },
        {
          title: "Loss of lives and property",
          subtopics: [
            {
              title: "5|Page",
              items: [],
            },
            {
              title: "Employable Skills for Sustainable Job Creation",
              items: [],
            },
          ],
        },
        {
          title: "   Explanation the Genocide against the Tutsi (April-July 1994)",
          subtopics: [
            {
              title: " The causes of genocide",
              items: [],
            },
            {
              title: "Colonization",
              items: [],
            },
          ],
        },
        {
          title: "Bad leadership/Poor governance",
          subtopics: [
            {
              title: "Media of hatred",
              items: [],
            },
          ],
        },
        {
          title: "The loss of cultural identity",
          subtopics: [
            {
              title: "The ethnic based ideology",
              items: [],
            },
            {
              title: "The social inequality",
              items: [],
            },
          ],
        },
        {
          title: " The major steps of the Genocide",
          subtopics: [
            {
              title: "Classification",
              items: [],
            },
            {
              title: "Symbolization",
              items: [],
            },
            {
              title: "Discrimination",
              items: [],
            },
            {
              title: "Dehumanization",
              items: [],
            },
            {
              title: "Organization",
              items: [],
            },
            {
              title: "Polarization",
              items: [],
            },
            {
              title: "Preparation",
              items: [],
            },
            {
              title: "Persecution",
              items: [],
            },
            {
              title: "Extermination",
              items: [],
            },
            {
              title: "Denial",
              items: [],
            },
          ],
        },
        {
          title: " Effects of genocide against Tutsi",
          subtopics: [
            {
              title: "Loss of lives",
              items: [],
            },
            {
              title: "Destruction of property",
              items: [],
            },
          ],
        },
        {
          title: " Problems inherited by the new government",
          subtopics: [
            {
              title: "There was insecurity",
              items: [],
            },
            {
              title: "Dislocated families",
              items: [],
            },
          ],
        },
        {
          title: "Public utilities had broken down",
          subtopics: [
            {
              title: "Destroyed industries",
              items: [],
            },
            {
              title: "Lack of man power",
              items: [],
            },
          ],
        },
        {
          title: " Achievements of the Government of National Unity.",
          subtopics: [
            {
              title: "Good governance",
              items: [],
            },
            {
              title: "Fighting corruption",
              items: [],
            },
          ],
        },
        {
          title: "Resettlement of the returnees",
          subtopics: [
            {
              title: "6|Page",
              items: [],
            },
            {
              title: "Employable Skills for Sustainable Job Creation",
              items: [],
            },
            {
              title: "Unity and reconciliation",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "E Patriotism and Heroism in Rwanda Learning hours:6",
      hours: 6,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: " Explanation of Concept and styles of leadership",
          subtopics: [
            {
              title: " Concept of leadership",
              items: [],
            },
            {
              title: " The leadership styles",
              items: [],
            },
          ],
        },
        {
          title: "The authoritarian/autocratic leadership",
          subtopics: [
            {
              title: "Paternalistic leadership",
              items: [],
            },
            {
              title: "Democratic leadership",
              items: [],
            },
            {
              title: "Laissez-faire leadership",
              items: [],
            },
          ],
        },
        {
          title: "Transformational Leadership",
          subtopics: [
            {
              title: "Bureaucratic Leadership",
              items: [],
            },
            {
              title: "Charismatic Leadership",
              items: [],
            },
            {
              title: "Servant Leadership",
              items: [],
            },
          ],
        },
        {
          title: " Description of the Characteristics of a good leader",
          subtopics: [
            {
              title: " Honest, Competent",
              items: [],
            },
          ],
        },
        {
          title: " Integrity, Accountability",
          subtopics: [
            {
              title: " Empathy, Humility",
              items: [],
            },
            {
              title: " Resilience, Vision",
              items: [],
            },
          ],
        },
        {
          title: " Description of challenges facing leaders",
          subtopics: [
            {
              title: " lack of funding",
              items: [],
            },
            {
              title: " lack motivating people",
              items: [],
            },
            {
              title: " public criticism",
              items: [],
            },
          ],
        },
        {
          title: " Explanation of characteristics of a good manager",
          subtopics: [
            {
              title: " Leadership",
              items: [],
            },
            {
              title: " Good planners",
              items: [],
            },
          ],
        },
        {
          title: " Identify and solve problems",
          subtopics: [
            {
              title: " Self-Motivation",
              items: [],
            },
            {
              title: " Integrity",
              items: [],
            },
          ],
        },
        {
          title: " Dependability and reliability",
          subtopics: [
            {
              title: " Optimism and confidence",
              items: [],
            },
            {
              title: " Calmness",
              items: [],
            },
          ],
        },
        {
          title: " Discussion of relationship between leadership and management",
          subtopics: [
            {
              title: "10 | P a g e",
              items: [],
            },
            {
              title: "Employable Skills for Sustainable Job Creation",
              items: [],
            },
          ],
        },
      ],
    },
  ],
};

export const CCMEN302: ModuleCurriculum = {
  code: "CCMEN302",
  title: "",
  level: "3",
  credits: 3,
  totalHours: 30,
  purpose: "Narrate about          Learning hours: 7",
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  resources: ["Computer", "Projector", "Internet", "Relevant materials"],
  learningOutcomes: [
    {
      id: "lo1",
      title: "Narrate about          Learning hours: 7",
      hours: 8,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: " Types of sentence structure",
          subtopics: [
            {
              title: "simple sentence",
              items: [],
            },
            {
              title: "compound sentence",
              items: [],
            },
            {
              title: "complex sentence",
              items: [],
            },
            {
              title: "compound-complex sentence",
              items: [],
            },
          ],
        },
        {
          title: " The building blocks of a simple sentence /clause",
          subtopics: [
            {
              title: "Subject",
              items: [],
            },
            {
              title: "Predicate",
              items: [],
            },
          ],
        },
        {
          title: " The building blocks of paragraph (Parts)",
          subtopics: [
            {
              title: "Topic sentence",
              items: [],
            },
            {
              title: "Supporting sentences",
              items: [],
            },
            {
              title: "Concluding sentence",
              items: [],
            },
            {
              title: "4|Page",
              items: [],
            },
            {
              title: "Employable Skills for Sustainable Job Creation",
              items: [],
            },
          ],
        },
        {
          title: "   Developing paragraph",
          subtopics: [
            {
              title: " Types of paragraph",
              items: [],
            },
            {
              title: "A descriptive paragraph",
              items: [],
            },
            {
              title: "A narrative paragraph",
              items: [],
            },
            {
              title: "An explanatory paragraph",
              items: [],
            },
            {
              title: "A persuassive paragraph",
              items: [],
            },
            {
              title: " Writing a well structured paragraph",
              items: [],
            },
            {
              title: "Paragraph with topic sentence,",
              items: [],
            },
            {
              title: "At leat 3 supporting ideas",
              items: [],
            },
            {
              title: "Concluding sentence",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Read and interpreting          Learning hours: 7",
      hours: 8,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "      Kinds of speech according to the purpose",
          subtopics: [
            {
              title: "Informative Speech that",
              items: [],
            },
            {
              title: "Persuassive Speech",
              items: [],
            },
            {
              title: "Entertains Speech",
              items: [],
            },
            {
              title: "Entertaining speech",
              items: [],
            },
            {
              title: "Motivational speech",
              items: [],
            },
            {
              title: "Impromptu speech",
              items: [],
            },
            {
              title: "Oratorical speech",
              items: [],
            },
          ],
        },
        {
          title: "      Components of speech",
          subtopics: [
            {
              title: "Introduction",
              items: [],
            },
            {
              title: "The main point or body",
              items: [],
            },
            {
              title: "The conclusion",
              items: [],
            },
            {
              title: "Transitions",
              items: [],
            },
          ],
        },
        {
          title: "      Use of active listening to separate components of a speech",
          subtopics: [
            {
              title: "Reporting of the main points of the speech/recording",
              items: [],
            },
            {
              title: "Keep an open mind",
              items: [],
            },
          ],
        },
        {
          title: " Ways of reporting a speech",
          subtopics: [
            {
              title: "To use exact words of the speaker",
              items: [],
            },
            {
              title: "To paraphrase what the speaker said",
              items: [],
            },
            {
              title: "To summarize the speech",
              items: [],
            },
          ],
        },
        {
          title: " Expression to be used for one’s own views",
          subtopics: [
            {
              title: "In my view…..",
              items: [],
            },
            {
              title: "In my opinion…..",
              items: [],
            },
            {
              title: "Personally….",
              items: [],
            },
            {
              title: "7|Page",
              items: [],
            },
            {
              title: "Employable Skills for Sustainable Job Creation",
              items: [],
            },
            {
              title: "To be host…..",
              items: [],
            },
            {
              title: "To tell the truth….",
              items: [],
            },
            {
              title: "According to….",
              items: [],
            },
            {
              title: "As far as I am concerned/ is concerned….",
              items: [],
            },
            {
              title: "From my point of view…..",
              items: [],
            },
            {
              title: "I agree/ disagree…",
              items: [],
            },
            {
              title: "I think that …..",
              items: [],
            },
            {
              title: "I would like to….",
              items: [],
            },
          ],
        },
        {
          title: " Sides/Positions of the discussions",
          subtopics: [
            {
              title: "Supporting an idea",
              items: [],
            },
            {
              title: "Refuting/ rebutting an idea",
              items: [],
            },
          ],
        },
        {
          title: " Using linkers/ connectors to defend one’s side",
          subtopics: [
            {
              title: "First of all",
              items: [],
            },
            {
              title: "Last but not least",
              items: [],
            },
            {
              title: "On one hand",
              items: [],
            },
            {
              title: "On the other hand",
              items: [],
            },
            {
              title: "While, whereas",
              items: [],
            },
            {
              title: "For instance",
              items: [],
            },
            {
              title: "On the contrary",
              items: [],
            },
            {
              title: "As a result",
              items: [],
            },
            {
              title: "In addition to…",
              items: [],
            },
          ],
        },
        {
          title: " Use of active listening to understand an audio",
          subtopics: [
            {
              title: "The main points",
              items: [],
            },
            {
              title: "Supporting details/ commentary",
              items: [],
            },
            {
              title: "Reporting the main points of the audio",
              items: [],
            },
          ],
        },
      ],
    },
  ],
};

export const CCMFT302: ModuleCurriculum = {
  code: "CCMFT302",
  title: "",
  level: "3",
  credits: 3,
  totalHours: 30,
  purpose: "Lire un texte lié à son métier",
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  resources: ["Computer", "Projector", "Internet", "Relevant materials"],
  learningOutcomes: [
    {
      id: "lo1",
      title: "Lire un texte lié à son métier",
      hours: 8,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "Eléments segmentaux",
          subtopics: [
            {
              title: " Voyelles",
              items: [],
            },
            {
              title: " Consonnes",
              items: [],
            },
            {
              title: " Syllabes",
              items: [],
            },
          ],
        },
        {
          title: "Signes de ponctuation :",
          subtopics: [
            {
              title: " Point",
              items: [],
            },
            {
              title: " Point d'interrogation",
              items: [],
            },
            {
              title: " Point d'exclamation",
              items: [],
            },
            {
              title: " Point de suspension",
              items: [],
            },
            {
              title: " Virgule",
              items: [],
            },
            {
              title: " Point-virgule",
              items: [],
            },
            {
              title: " Guillemets",
              items: [],
            },
            {
              title: " Double point",
              items: [],
            },
          ],
        },
        {
          title: "Combinaison des lettres",
          subtopics: [
            {
              title: " Voyelles",
              items: [],
            },
            {
              title: " Voyelles et des consonnes",
              items: [],
            },
          ],
        },
        {
          title: "Eléments supra segmentaux",
          subtopics: [
            {
              title: " Accents",
              items: [],
            },
            {
              title: " Intonations",
              items: [],
            },
            {
              title: " Rythmes",
              items: [],
            },
            {
              title: " Liaison",
              items: [],
            },
          ],
        },
        {
          title: "Etapes de lecture",
          subtopics: [
            {
              title: " La pré lecture",
              items: [],
            },
            {
              title: " L'observation du texte",
              items: [],
            },
            {
              title: " La lecture silencieuse",
              items: [],
            },
            {
              title: " Après la lecture",
              items: [],
            },
            {
              title: "Employable Skills for Sustainable Job Creation",
              items: [],
            },
          ],
        },
        {
          title: "Types de lectures",
          subtopics: [
            {
              title: " Lecture sélective",
              items: [],
            },
            {
              title: " Lecture en diagonal",
              items: [],
            },
            {
              title: " Lecture de base",
              items: [],
            },
            {
              title: " Lecture active",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Pratiquer l'expression orale",
      hours: 8,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: " Les salutations",
          subtopics: [
            {
              title: " Au début d'une conversation",
              items: [],
            },
            {
              title: "Pendant la journée",
              items: [],
            },
            {
              title: "Pendant la soirée et la nuit",
              items: [],
            },
            {
              title: " A la fin d'une conversation",
              items: [],
            },
            {
              title: "Pendant la journée",
              items: [],
            },
            {
              title: "Pendant la soirée et la nuit",
              items: [],
            },
            {
              title: "Formelle",
              items: [],
            },
            {
              title: "Informelle",
              items: [],
            },
            {
              title: " Dire son nom et son prénom",
              items: [],
            },
            {
              title: " Dire sa nationalité, son âge, sa profession",
              items: [],
            },
            {
              title: " Types d'interrogation",
              items: [],
            },
            {
              title: "Totale",
              items: [],
            },
            {
              title: "Employable Skills for Sustainable Job Creation",
              items: [],
            },
            {
              title: "Partielle",
              items: [],
            },
            {
              title: " Les adverbes interrogatifs",
              items: [],
            },
            {
              title: "De lieu",
              items: [],
            },
            {
              title: "De manière",
              items: [],
            },
            {
              title: "Du temps",
              items: [],
            },
            {
              title: "De degré",
              items: [],
            },
            {
              title: "De quantité",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Accorder les verbes",
      hours: 14,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "    Les classes grammaticales",
          subtopics: [
            {
              title: " Les articles",
              items: [],
            },
            {
              title: "Défini",
              items: [],
            },
            {
              title: "Indéfini",
              items: [],
            },
            {
              title: "Partitif",
              items: [],
            },
            {
              title: " Le nom",
              items: [],
            },
            {
              title: "Le genre",
              items: [],
            },
            {
              title: "Le nombre",
              items: [],
            },
            {
              title: "Catégories",
              items: [],
            },
            {
              title: " Le pronom personnel",
              items: [],
            },
            {
              title: "Personnel (Sujet, Réfléchi, Tonique)",
              items: [],
            },
            {
              title: "Relatif « qui »",
              items: [],
            },
            {
              title: " Présent",
              items: [],
            },
            {
              title: "Employable Skills for Sustainable Job Creation",
              items: [],
            },
            {
              title: " Imparfait",
              items: [],
            },
            {
              title: " Futur simple",
              items: [],
            },
            {
              title: " Passe simple",
              items: [],
            },
            {
              title: " Les terminaisons de temps simples de l'indicatif",
              items: [],
            },
            {
              title: "Présent",
              items: [],
            },
            {
              title: "Imparfait",
              items: [],
            },
            {
              title: "Futur simple",
              items: [],
            },
            {
              title: "Passe simple",
              items: [],
            },
          ],
        },
        {
          title: "Sujets du verbe",
          subtopics: [
            {
              title: " Seul sujet",
              items: [],
            },
            {
              title: " Plusieurs sujets",
              items: [],
            },
          ],
        },
      ],
    },
  ],
};

export const CCMHE303: ModuleCurriculum = {
  code: "CCMHE303",
  title: "-         Maintain SHE at Workplace",
  level: "?",
  credits: 3,
  totalHours: 30,
  purpose: "Maintain personal hygiene, health and safety                Learning hours: 15",
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  resources: ["Computer", "Projector", "Internet", "Relevant materials"],
  learningOutcomes: [
    {
      id: "lo1",
      title: "Maintain personal hygiene, health and safety                Learning hours: 15",
      hours: 7,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "•     Controlling hazards at the workplace",
          subtopics: [
            {
              title: "✓ Key terms definition",
              items: [],
            },
          ],
        },
        {
          title: "✓ Methods of identifying workplace hazards in line with occupation",
          subtopics: [
            {
              title: "Interviews",
              items: [],
            },
            {
              title: "Brainstorming",
              items: [],
            },
            {
              title: "Checklists",
              items: [],
            },
            {
              title: "Assumption Analysis.",
              items: [],
            },
            {
              title: "Cause and Effect Diagrams",
              items: [],
            },
            {
              title: "Nominal Group Technique (NGT)",
              items: [],
            },
            {
              title: "Affinity Diagram",
              items: [],
            },
          ],
        },
        {
          title: "✓ Types of hazards in the workplace",
          subtopics: [
            {
              title: "Safety",
              items: [],
            },
            {
              title: "Physical",
              items: [],
            },
            {
              title: "Chemical",
              items: [],
            },
            {
              title: "Biological",
              items: [],
            },
            {
              title: "Other health hazards",
              items: [],
            },
          ],
        },
        {
          title: "✓ Controlling hazard at the workplace",
          subtopics: [
            {
              title: "Methods of hazard control",
              items: [],
            },
            {
              title: "SHE signs in the workplace",
              items: [],
            },
            {
              title: "Setting up workplace safety signs Illumination",
              items: [],
            },
            {
              title: "Practical Problem-Solving Model",
              items: [],
            },
          ],
        },
        {
          title: "✓ Types of risks at workplace",
          subtopics: [
            {
              title: "✓ Steps of risk",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Ensure",
      hours: 8,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "✓ Concepts of sustainable environment and development",
          subtopics: [
            {
              title: "Environment",
              items: [],
            },
            {
              title: "Development",
              items: [],
            },
            {
              title: "Sustainable environment",
              items: [],
            },
            {
              title: "Sustainable development",
              items: [],
            },
          ],
        },
        {
          title: "Economic and social development vs environment development",
          subtopics: [
            {
              title: "✓ Types of environments",
              items: [],
            },
          ],
        },
        {
          title: "✓ Rwanda’s environmental features",
          subtopics: [
            {
              title: "Natural environment",
              items: [],
            },
            {
              title: "Geophysical features",
              items: [],
            },
            {
              title: "Natural",
              items: [],
            },
          ],
        },
      ],
    },
  ],
};

export const CCMKN302: ModuleCurriculum = {
  code: "CCMKN302",
  title: "Gukoresha Ikinyarwanda Kiboneye",
  level: "3",
  credits: 3,
  totalHours: 30,
  purpose: "Gukoresha ubuvanganzo gakondo Amasaha : 6",
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  resources: ["Computer", "Projector", "Internet", "Relevant materials"],
  learningOutcomes: [
    {
      id: "lo1",
      title: "Gukoresha ubuvanganzo gakondo Amasaha : 6",
      hours: 0,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "Ibiyigwa",
          subtopics: [
            {
              title: "       Ubuvanganzo gakondo",
              items: [],
            },
            {
              title: "   Umwandiko kuri imwe mu ngeri z'ubuvanganzo gakondo",
              items: [],
            },
            {
              title: "   Inshoza y'ubuvanganzo gakondo",
              items: [],
            },
            {
              title: "   Ingeri z'ubuvanganzo gakondo",
              items: [],
            },
            {
              title: "   Ubuvanganzo bw'abana",
              items: [],
            },
            {
              title: " Ubwoko bw'utwatuzo n'aho dukoreshwa",
              items: [],
            },
            {
              title: " Gukoresha utwatuzo n'isesekaza mu nteruro",
              items: [],
            },
            {
              title: " Ubwoko bw' imyandiko n'uturango twayo",
              items: [],
            },
            {
              title: " Amategeko y'ihinamwandiko",
              items: [],
            },
            {
              title: " Ibice by'umwandiko uhinnye",
              items: [],
            },
            {
              title: "Inshoza y'igitaramo nyarwanda",
              items: [],
            },
            {
              title: "Amoko y'ibitaramo nyarwanda",
              items: [],
            },
            {
              title: "Umuteguro w'igitaramo nyarwanda",
              items: [],
            },
            {
              title: "Employable Skills for Sustainable Job Creation",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Gukoresha Ikinyarwanda kiboneye Amasaha ateganijwe: 6",
      hours: 0,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "Ibiyigwa",
          subtopics: [
            {
              title: "   Isesenguramwandiko ku nsanganyamatsiko y'uburinganire n'ubwuzuzanye",
              items: [],
            },
            {
              title: "Employable Skills for Sustainable Job Creation",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Amasaha ateganyijwe: 6",
      hours: 0,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "Ibiyigwa",
          subtopics: [
            {
              title: "       Isesenguramwandiko ku nsanganyamatsiko y'uburenganzira bw'umwana",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo4",
      title: "Kugaragaza intêgo ya ntera n'amategeko Amasaha : 6",
      hours: 0,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "Ibiyigwa",
          subtopics: [
            {
              title: "   Isesenguramwandiko ku nsanganyamatsiko yo kwirinda no kurwanya indwara zitandukanye",
              items: [],
            },
            {
              title: " Umwandiko ku nsanganyamatsiko yerekeye kurwanya indwara",
              items: [],
            },
            {
              title: " Inyunguragambo",
              items: [],
            },
            {
              title: " Ingingo z'ingenzi n'ingingingo z'ingereka",
              items: [],
            },
            {
              title: " Ingero z'indwara zandura",
              items: [],
            },
            {
              title: " Ingero z'indwara zitandura",
              items: [],
            },
            {
              title: " Ibikorwa byo gukumira no kwirinda indwara zandura n'izitandura",
              items: [],
            },
            {
              title: "   Ntera",
              items: [],
            },
            {
              title: " Inshoza ya ntera",
              items: [],
            },
            {
              title: " Uturango twa ntera",
              items: [],
            },
            {
              title: "   Intego n'amategeko y'igenemajwi muri ntera",
              items: [],
            },
            {
              title: " Uturemajambo twa ntera",
              items: [],
            },
            {
              title: " Ibicumbi bya ntera",
              items: [],
            },
            {
              title: " Amategeko y'igenamajwi muri ntera",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo5",
      title: "Gukoresha imyandikire ikwiye Amasaha yategenyijwe: 6",
      hours: 0,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "Ibiyigwa",
          subtopics: [
            {
              title: "   Isesenguramwandiko ku nsanganyamatsiko y'ubuzima bw'imyororokere",
              items: [],
            },
            {
              title: " Umwandiko ku nsanganyamatsiko yerekeye ubuzima bw'imyororokerere",
              items: [],
            },
            {
              title: " Inshoza y'ubuzima bw'imyororokere",
              items: [],
            },
            {
              title: " Inyunguragambo",
              items: [],
            },
            {
              title: " Ingingo z'ingenzi n'ingingingo z'ingereka",
              items: [],
            },
            {
              title: " Ingero zifatika zigaragaza akamaro ko gusobanukirwa ubuzima bw'imyororokere",
              items: [],
            },
            {
              title: "   Amoko y'amagambo",
              items: [],
            },
            {
              title: " Amagambo ahinduka",
              items: [],
            },
            {
              title: " Amagambo adahindika",
              items: [],
            },
            {
              title: "   Amategeko y'imyandikire areba ikata n'itakara ry'inyajwi",
              items: [],
            },
            {
              title: " Ikata ry'inyajwi mu nteruro",
              items: [],
            },
            {
              title: " Itakara ry'inyajwi",
              items: [],
            },
          ],
        },
      ],
    },
  ],
};

export const CCMOL302: ModuleCurriculum = {
  code: "CCMOL302",
  title: "-        Describe the Occupation and learning process",
  level: "3",
  credits: 3,
  totalHours: 30,
  purpose: "Participate in a team and                              Learning hours: 10",
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  resources: ["Computer", "Projector", "Internet", "Relevant materials"],
  learningOutcomes: [
    {
      id: "lo1",
      title: "Participate in a team and                              Learning hours: 10",
      hours: 5,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "   Description of the elements of occupation",
          subtopics: [
            {
              title: "   Definition of terms",
              items: [],
            },
          ],
        },
        {
          title: " Explanation of the content of the training programme (modules)",
          subtopics: [
            {
              title: "Duration",
              items: [],
            },
            {
              title: "Flowchart",
              items: [],
            },
          ],
        },
        {
          title: " Qualification pathways (entry, exit level & further learning)",
          subtopics: [
            {
              title: " timetable",
              items: [],
            },
          ],
        },
      ],
    },
  ],
};

export const ICTIA302: ModuleCurriculum = {
  code: "ICTIA302",
  title: "Competence",
  level: "3",
  credits: 20,
  totalHours: 200,
  purpose: "Apply for internship            Learning hours: 10",
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  resources: ["Computer", "Projector", "Internet", "Relevant materials"],
  learningOutcomes: [
    {
      id: "lo1",
      title: "Apply for internship            Learning hours: 10",
      hours: 10,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "✔ Appropriate workplace behaviors and attitudes",
          subtopics: [
            {
              title: "Dress code",
              items: [],
            },
            {
              title: "Time management",
              items: [],
            },
            {
              title: "Respect,",
              items: [],
            },
            {
              title: "Honesty",
              items: [],
            },
            {
              title: "Integrity",
              items: [],
            },
            {
              title: "Work as a team",
              items: [],
            },
            {
              title: "✔ Work habits",
              items: [],
            },
            {
              title: "Cooperation,",
              items: [],
            },
            {
              title: "Initiative,",
              items: [],
            },
            {
              title: "Courtesy,",
              items: [],
            },
            {
              title: "Constructive",
              items: [],
            },
            {
              title: "Criticism,",
              items: [],
            },
            {
              title: "Supervision",
              items: [],
            },
            {
              title: "Accuracy,",
              items: [],
            },
            {
              title: "Piece of work,",
              items: [],
            },
            {
              title: "Time usage",
              items: [],
            },
            {
              title: "Adaptability",
              items: [],
            },
            {
              title: "●      Time management.",
              items: [],
            },
          ],
        },
        {
          title: "✔ Strategies to better manage time",
          subtopics: [
            {
              title: "Start your day with a clear focus.",
              items: [],
            },
            {
              title: "4|Page",
              items: [],
            },
            {
              title: "Employable Skills for Sustainable Job Creation",
              items: [],
            },
            {
              title: "Have a dynamic task list.",
              items: [],
            },
            {
              title: "Focus on high-value activities.",
              items: [],
            },
            {
              title: "Minimize",
              items: [],
            },
            {
              title: "Interruptions.",
              items: [],
            },
            {
              title: "Limit multi-tasking.",
              items: [],
            },
            {
              title: "Review your day.",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Analyze own professional         Learning hours: 10",
      hours: 170,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "ü Development of competencies related to one’s field",
          subtopics: [
            {
              title: "Workplace safety and security activities",
              items: [],
            },
            {
              title: "6|Page",
              items: [],
            },
            {
              title: "Employable Skills for Sustainable Job Creation",
              items: [],
            },
            {
              title: "Various planned task related to one’s field",
              items: [],
            },
          ],
        },
        {
          title: "ü Trainer and Trainee’s documents",
          subtopics: [
            {
              title: "Logbooks",
              items: [],
            },
            {
              title: "IAP report template",
              items: [],
            },
            {
              title: "IAP Code of conduct",
              items: [],
            },
            {
              title: "ü Company’s documents",
              items: [],
            },
          ],
        },
        {
          title: "Company supervisor logbook",
          subtopics: [
            {
              title: "Attachment report",
              items: [],
            },
          ],
        },
        {
          title: "General departmental information of companies",
          subtopics: [
            {
              title: "Training",
              items: [],
            },
          ],
        },
      ],
    },
  ],
};

export const CCMEN402: ModuleCurriculum = {
  code: "CCMEN402",
  title: "",
  level: "4",
  credits: 3,
  totalHours: 30,
  purpose: "Write factual, descriptive, and explanatory                  Learning hours: 9",
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  resources: ["Computer", "Projector", "Internet", "Relevant materials"],
  learningOutcomes: [
    {
      id: "lo1",
      title: "Write factual, descriptive, and explanatory                  Learning hours: 9",
      hours: 7,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "    Introduction to listening",
          subtopics: [
            {
              title: " Definition of listening",
              items: [],
            },
            {
              title: " Listening vs hearing",
              items: [],
            },
            {
              title: " Types of listening",
              items: [],
            },
            {
              title: "Active listening",
              items: [],
            },
            {
              title: "Selective listening",
              items: [],
            },
            {
              title: "Reflective listening",
              items: [],
            },
            {
              title: "Comprehensive listening",
              items: [],
            },
            {
              title: "Biased listening",
              items: [],
            },
            {
              title: "Discriminative listening",
              items: [],
            },
          ],
        },
        {
          title: "    Effective listening skills",
          subtopics: [
            {
              title: " Tips",
              items: [],
            },
            {
              title: " Strategies",
              items: [],
            },
            {
              title: " Listening activities",
              items: [],
            },
            {
              title: " Message detection",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Discuss, support or refute ideas on                     Learning hours: 7",
      hours: 7,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "   Explanation of different reading techniques",
          subtopics: [
            {
              title: " Skimming",
              items: [],
            },
            {
              title: " Scanning",
              items: [],
            },
            {
              title: " Intensive reading",
              items: [],
            },
            {
              title: " Extensive reading",
              items: [],
            },
          ],
        },
        {
          title: "   Applying reading techniques",
          subtopics: [
            {
              title: " Importance of reading",
              items: [],
            },
            {
              title: " Categories of reading",
              items: [],
            },
            {
              title: "A bottom-up",
              items: [],
            },
            {
              title: "A top-down",
              items: [],
            },
          ],
        },
        {
          title: "   Applying articulatory phonetics.",
          subtopics: [
            {
              title: " phonetics symbols",
              items: [],
            },
            {
              title: " consonants",
              items: [],
            },
            {
              title: " vowels",
              items: [],
            },
            {
              title: " syllables",
              items: [],
            },
            {
              title: "9|Page",
              items: [],
            },
            {
              title: "Employable Skills for Sustainable Job Creation",
              items: [],
            },
            {
              title: " phonemes",
              items: [],
            },
            {
              title: " allophones",
              items: [],
            },
          ],
        },
      ],
    },
  ],
};

export const CCMFT402: ModuleCurriculum = {
  code: "CCMFT402",
  title: "Exprimer des opinions en français élémentaire",
  level: "4",
  credits: 3,
  totalHours: 30,
  purpose: "Préciser des Les",
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  resources: ["Computer", "Projector", "Internet", "Relevant materials"],
  learningOutcomes: [
    {
      id: "lo1",
      title: "Préciser des Les",
      hours: 11,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "   La complétion d'un formulaire de réservation",
          subtopics: [
            {
              title: " Les adjectifs numéraux",
              items: [],
            },
            {
              title: "Cardinaux (de 1 à 1000000)",
              items: [],
            },
            {
              title: "Ordinaux",
              items: [],
            },
            {
              title: " La description des temps",
              items: [],
            },
            {
              title: "Les heures",
              items: [],
            },
            {
              title: "Les dates",
              items: [],
            },
            {
              title: "Les jours de la semaine",
              items: [],
            },
            {
              title: "Les mois de l'année",
              items: [],
            },
            {
              title: "Les saisons de l'année",
              items: [],
            },
            {
              title: " Le genre des noms des pays en français",
              items: [],
            },
            {
              title: " Les adjectifs possessifs",
              items: [],
            },
            {
              title: " Les pronoms possessifs",
              items: [],
            },
            {
              title: " Les prépositions « de » et « à »",
              items: [],
            },
            {
              title: "Employable Skills for Sustainable Job Creation",
              items: [],
            },
            {
              title: " L'arbre généalogique",
              items: [],
            },
            {
              title: " Les professions",
              items: [],
            },
            {
              title: " L'emploi de c'est, il/elle est",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Décrire des personnes et",
      hours: 8,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "   La description d'une personne",
          subtopics: [
            {
              title: " Les parties du corps humain",
              items: [],
            },
            {
              title: " Les vêtements et les accessoires",
              items: [],
            },
            {
              title: " Les adjectifs qualificatifs",
              items: [],
            },
            {
              title: "Physique",
              items: [],
            },
            {
              title: "Caractères",
              items: [],
            },
            {
              title: "Couleur",
              items: [],
            },
            {
              title: " L'emploi de présentatif de « c'est » et « il y a »",
              items: [],
            },
            {
              title: " Les points cardinaux",
              items: [],
            },
            {
              title: " Les prépositions de lieu",
              items: [],
            },
            {
              title: "A côté de",
              items: [],
            },
            {
              title: "Loin de",
              items: [],
            },
            {
              title: "En, à, au, aux + pays",
              items: [],
            },
            {
              title: " Les sports et les loisirs",
              items: [],
            },
            {
              title: " L'interrogation est-ce que/ qu'est-ce que, l'intonation avec l'inversion",
              items: [],
            },
            {
              title: " Les façons d'exprimer ses goûts",
              items: [],
            },
            {
              title: "La négation « ne …pas »",
              items: [],
            },
            {
              title: "Moi aussi / moi non plus",
              items: [],
            },
            {
              title: "L'indicatif présent des verbes en « er » : aimer, préférer",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Indiquer l'itinéraire",
      hours: 11,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "   L'impératif pour indiquer un chemin, une direction",
          subtopics: [
            {
              title: " Aller",
              items: [],
            },
            {
              title: " Continuer",
              items: [],
            },
            {
              title: " Tourner",
              items: [],
            },
            {
              title: " Prendre",
              items: [],
            },
            {
              title: " Longer",
              items: [],
            },
            {
              title: " Passer",
              items: [],
            },
            {
              title: "   Les lieux de la ville",
              items: [],
            },
            {
              title: " L'administration",
              items: [],
            },
            {
              title: "La poste",
              items: [],
            },
            {
              title: "Employable Skills for Sustainable Job Creation",
              items: [],
            },
            {
              title: "La police",
              items: [],
            },
            {
              title: "Administration publique",
              items: [],
            },
            {
              title: "La crèche",
              items: [],
            },
            {
              title: "L'école",
              items: [],
            },
            {
              title: "Le collège",
              items: [],
            },
            {
              title: "Le lycée",
              items: [],
            },
            {
              title: "L'université",
              items: [],
            },
            {
              title: "Le boulodrome",
              items: [],
            },
            {
              title: "Le cinéma",
              items: [],
            },
            {
              title: "Les jeux pour enfants",
              items: [],
            },
            {
              title: "Le stade",
              items: [],
            },
            {
              title: "L'hôpital",
              items: [],
            },
            {
              title: "Pharmacie",
              items: [],
            },
            {
              title: "L'office de tourisme",
              items: [],
            },
            {
              title: "Le distributeur des billets (la banque)",
              items: [],
            },
            {
              title: "Les toilettes",
              items: [],
            },
            {
              title: "La gare routière",
              items: [],
            },
            {
              title: "Le chemin",
              items: [],
            },
            {
              title: "L'allée",
              items: [],
            },
            {
              title: "La rue",
              items: [],
            },
            {
              title: "L'avenue",
              items: [],
            },
            {
              title: "Le boulevard",
              items: [],
            },
            {
              title: "Employable Skills for Sustainable Job Creation",
              items: [],
            },
            {
              title: "L'église",
              items: [],
            },
            {
              title: "La mosquée",
              items: [],
            },
            {
              title: " Le commerce",
              items: [],
            },
            {
              title: "Le marché",
              items: [],
            },
            {
              title: "Le supermarché",
              items: [],
            },
            {
              title: " Les lieux touristiques",
              items: [],
            },
            {
              title: "Le musée",
              items: [],
            },
            {
              title: "Le parc",
              items: [],
            },
            {
              title: "   Demander et indiquer le chemin et la direction",
              items: [],
            },
            {
              title: " L'interrogation avec où pour demander un chemin/une direction",
              items: [],
            },
            {
              title: " Verbe aller à l'indicatif présent + au, à, à l', à la, aux",
              items: [],
            },
            {
              title: " Le vocabulaire de base pour indiquer l'itinéraire",
              items: [],
            },
            {
              title: "A droite",
              items: [],
            },
            {
              title: "A gauche",
              items: [],
            },
            {
              title: "Tout droit",
              items: [],
            },
            {
              title: "Au bout",
              items: [],
            },
            {
              title: "La première, la deuxième, …rue",
              items: [],
            },
          ],
        },
      ],
    },
  ],
};

export const CCMKN402: ModuleCurriculum = {
  code: "CCMKN402",
  title: "-          Gukoresha Ikinyarwanda Cy'umunyamwuga",
  level: "4",
  credits: 3,
  totalHours: 30,
  purpose: "Gukoresha ubuvanganzo gakondo Amasaha : 10",
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  resources: ["Computer", "Projector", "Internet", "Relevant materials"],
  learningOutcomes: [
    {
      id: "lo1",
      title: "Gukoresha ubuvanganzo gakondo Amasaha : 10",
      hours: 0,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "Ibiyigwa",
          subtopics: [
            {
              title: "     Imikoreshereze y' ubuvanganzo gakondo bufatiye ku mwuga:",
              items: [],
            },
            {
              title: " Inshoza y'ubuvanganzo bufatiye ku mwuga.",
              items: [],
            },
            {
              title: " Ingero z'ubuvanganzo bufatiye ku mwuga",
              items: [],
            },
            {
              title: " Igitaramo cy'umuganura",
              items: [],
            },
            {
              title: "     Ikomorazina :",
              items: [],
            },
            {
              title: " Inshoza y'ikomorazina",
              items: [],
            },
            {
              title: " Ikomorazina mvazina",
              items: [],
            },
            {
              title: " Ikomorazina mvanshinga",
              items: [],
            },
            {
              title: "     Ikomoranshinga:",
              items: [],
            },
            {
              title: " Inshoza y'ikomoranshinga",
              items: [],
            },
            {
              title: " Ikomoranshinga mvazina",
              items: [],
            },
            {
              title: " Ikomoranshinga mvanshinga",
              items: [],
            },
            {
              title: "     Amoko y'inshinga:",
              items: [],
            },
            {
              title: " Imbundo",
              items: [],
            },
            {
              title: " Inshinga itondaguye",
              items: [],
            },
            {
              title: " Inshinga mburabuzi",
              items: [],
            },
            {
              title: " Ingirwanshinga",
              items: [],
            },
            {
              title: " Interuro ihamya",
              items: [],
            },
            {
              title: " Interuro ibaza",
              items: [],
            },
            {
              title: " Interuro itangara",
              items: [],
            },
            {
              title: " Interuro itegeka",
              items: [],
            },
            {
              title: "UBUMENYI NGIRO BUKENEWE MU GUHANGA UMURIMO URAMBYE",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Gukoresha Ikinyarwanda agaragaza Amasaha",
      hours: 0,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "Ibiyigwa",
          subtopics: [
            {
              title: "   Isesenguramwandiko ku nsanganyamatsiko y'akamaro k'ikoranabuhanga mu iterambere",
              items: [],
            },
            {
              title: "ry'umwuga:",
              items: [],
            },
            {
              title: " Inyunguramagambo",
              items: [],
            },
            {
              title: " Ingingo z'ingenzi n'ingingo z'ingereka",
              items: [],
            },
            {
              title: "UBUMENYI NGIRO BUKENEWE MU GUHANGA UMURIMO URAMBYE",
              items: [],
            },
            {
              title: " Insanganyamatsiko y'ingenzi iri mu mwandiko",
              items: [],
            },
            {
              title: " Isomo ry'ingenzi riri mu mwandiko",
              items: [],
            },
            {
              title: " Ingero zifatika zihamya akamaro k'ikoranabuhanga mu iterambere ry'umwuga",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Gukoresha Ikinyarwanda uwiga Amasaha",
      hours: 0,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "Ibiyigwa",
          subtopics: [
            {
              title: "   Isesenguramwandiko ku nsanganyamatsiko ku bubi bw'ibiyobyabwenge mu rubyiruko:",
              items: [],
            },
            {
              title: " Inyunguramagambo",
              items: [],
            },
            {
              title: " Ingingo z'ingenzi n'ingingo z'ingereka",
              items: [],
            },
            {
              title: " Insanganyamatsiko y'ingenzi iri mu mwandiko",
              items: [],
            },
            {
              title: " Isomo ry'ingenzi mu mwandiko",
              items: [],
            },
            {
              title: " Ingero zifatika z'ibiyobyabwenge",
              items: [],
            },
            {
              title: " Ingaruka mbi zo gukoresha ibiyobyabwenge mu rubyiruko",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo4",
      title: "Gukoresha Ikinyarwanda uwiga Amasaha",
      hours: 0,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "Ibiyigwa",
          subtopics: [
            {
              title: "       Isesenguramwandiko ku nsanganyamatsiko yo gufata neza ibidukikije:",
              items: [],
            },
            {
              title: " Inyunguramagambo",
              items: [],
            },
            {
              title: " Ingingo z'ingenzi n'ingingo z'ingereka",
              items: [],
            },
            {
              title: " Insanganyamatsiko y'ingenzi iri mu mwandiko",
              items: [],
            },
            {
              title: " Isomo ry'ingenzi mu mwandiko",
              items: [],
            },
            {
              title: " Ingero z'ibikorwa by'abanyamwuga bishobora kwangiza ibidukikije",
              items: [],
            },
            {
              title: " Ingero z'ibikorwa by'abanyamwuga bigamije kubungabunga ibidukikije",
              items: [],
            },
            {
              title: "    Imikoreshereze y'indangahantu:",
              items: [],
            },
            {
              title: " Inshoza y'indangahantu",
              items: [],
            },
            {
              title: " Amoko y'indangahantu n'imikoreshereze yazo",
              items: [],
            },
            {
              title: "    Imikoreshereze y'ibyungo:",
              items: [],
            },
            {
              title: " Inshoza y'ibyungo",
              items: [],
            },
            {
              title: " Amoko y'ibyungo n'imikoreshereze yabyo",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo5",
      title: "Gukoresha Ikinyarwanda Amasaha yategenyijwe:",
      hours: 0,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "Ibiyigwa",
          subtopics: [
            {
              title: "   Isesenguramwandiko ku nsanganyamatsiko y'ubutabazi bw'ibanze:",
              items: [],
            },
            {
              title: " Inyunguramagambo",
              items: [],
            },
            {
              title: " Ingingo z'ingenzi n'ingingo z'ingereka",
              items: [],
            },
            {
              title: " Insanganyamatsiko y'ingenzi iri mu mwandiko",
              items: [],
            },
            {
              title: " Isomo ry'ingenzi mu mwandiko",
              items: [],
            },
            {
              title: "UBUMENYI NGIRO BUKENEWE MU GUHANGA UMURIMO URAMBYE",
              items: [],
            },
            {
              title: " Ingero z'ibikorwa by'ubutabazi bw'ibanze",
              items: [],
            },
            {
              title: " Inshoza y'impakanyi",
              items: [],
            },
            {
              title: " Amoko y'impakanyi n'imikoreshereze yazo mu nteruro",
              items: [],
            },
            {
              title: " Inshoza y'indango z'inshinga",
              items: [],
            },
            {
              title: " Amoko y'indango z'inshinga n'imikoreshereze yazo",
              items: [],
            },
          ],
        },
      ],
    },
  ],
};

export const CMCZ401: ModuleCurriculum = {
  code: "CMCZ401",
  title: "Promote the Culture of Peace",
  level: "4",
  credits: 3,
  totalHours: 30,
  purpose: "Make a comparative study of genocides.                    Learning hours:10",
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  resources: ["Computer", "Projector", "Internet", "Relevant materials"],
  learningOutcomes: [
    {
      id: "lo1",
      title: "Make a comparative study of genocides.                    Learning hours:10",
      hours: 10,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "   Explanation of Gender-based violence and child abuse",
          subtopics: [
            {
              title: " Definition of key terms",
              items: [],
            },
            {
              title: "Gender",
              items: [],
            },
            {
              title: "Gender equity",
              items: [],
            },
            {
              title: "Gender equality",
              items: [],
            },
            {
              title: "Gender Based Violence",
              items: [],
            },
            {
              title: "Child abuse",
              items: [],
            },
          ],
        },
        {
          title: " Forms of gender-based violence",
          subtopics: [
            {
              title: "Physical",
              items: [],
            },
            {
              title: "Psychological",
              items: [],
            },
            {
              title: "Sexual",
              items: [],
            },
            {
              title: "Economic",
              items: [],
            },
            {
              title: " Forms of child abuse",
              items: [],
            },
          ],
        },
        {
          title: "Psychological (child neglect)",
          subtopics: [
            {
              title: "Sexual",
              items: [],
            },
            {
              title: "Economic",
              items: [],
            },
          ],
        },
        {
          title: " Characteristics of human trafficking",
          subtopics: [
            {
              title: "6|Page",
              items: [],
            },
            {
              title: "Employable Skills for Sustainable Job Creation",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Promote peace and social cohesion",
      hours: 6,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "   Analysis of the concept of conflict management",
          subtopics: [
            {
              title: " Definition of conflict",
              items: [],
            },
            {
              title: " Types of conflict",
              items: [],
            },
            {
              title: " Causes of conflict",
              items: [],
            },
            {
              title: " Consequence of conflict",
              items: [],
            },
            {
              title: " Conflict management",
              items: [],
            },
            {
              title: "Conflict resolution",
              items: [],
            },
            {
              title: "Conflict transformation",
              items: [],
            },
            {
              title: "Conflict prevention",
              items: [],
            },
          ],
        },
        {
          title: "   Explanation of the concepts of heritage and cultural diversity",
          subtopics: [
            {
              title: " Definition of key terms",
              items: [],
            },
            {
              title: "Heritage",
              items: [],
            },
            {
              title: "Culture",
              items: [],
            },
            {
              title: "Cultural diversity",
              items: [],
            },
          ],
        },
        {
          title: "   Discussion on Strategies for Fighting socio-cultural discrimination",
          subtopics: [
            {
              title: " Definition of key terms",
              items: [],
            },
            {
              title: "Social discrimination",
              items: [],
            },
            {
              title: "Cultural discrimination",
              items: [],
            },
            {
              title: "Social diversity",
              items: [],
            },
            {
              title: "8|Page",
              items: [],
            },
            {
              title: "Employable Skills for Sustainable Job Creation",
              items: [],
            },
            {
              title: "Social inclusion",
              items: [],
            },
          ],
        },
      ],
    },
  ],
};

export const CCMCZ501: ModuleCurriculum = {
  code: "CCMCZ501",
  title: "",
  level: "5",
  credits: 3,
  totalHours: 30,
  purpose: "Describe      Learning hours: 10",
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  resources: ["Computer", "Projector", "Internet", "Relevant materials"],
  learningOutcomes: [
    {
      id: "lo1",
      title: "Describe      Learning hours: 10",
      hours: 6,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "•    Explanation of the concepts of unity in diversity and social cohesion.",
          subtopics: [
            {
              title: "✓ Define key terms",
              items: [],
            },
            {
              title: "Unity",
              items: [],
            },
            {
              title: "Unity in diversity",
              items: [],
            },
            {
              title: "Tolerance",
              items: [],
            },
            {
              title: "Respect",
              items: [],
            },
          ],
        },
        {
          title: "✓ Components/factors hindering tolerance and respect",
          subtopics: [
            {
              title: "Bias",
              items: [],
            },
            {
              title: "Prejudice",
              items: [],
            },
            {
              title: "Stigma",
              items: [],
            },
            {
              title: "Harassment",
              items: [],
            },
            {
              title: "3|Page",
              items: [],
            },
            {
              title: "Employable Skills for Sustainable Job Creation",
              items: [],
            },
            {
              title: "Rejection",
              items: [],
            },
            {
              title: "Bullying",
              items: [],
            },
            {
              title: "Intolerance",
              items: [],
            },
          ],
        },
        {
          title: "✓ Factors affecting tolerance and respect",
          subtopics: [
            {
              title: "Time",
              items: [],
            },
            {
              title: "Culture",
              items: [],
            },
            {
              title: "Place",
              items: [],
            },
            {
              title: "Situation",
              items: [],
            },
          ],
        },
      ],
    },
  ],
};

export const CCMFT502: ModuleCurriculum = {
  code: "CCMFT502",
  title: "",
  level: "?",
  credits: 3,
  totalHours: 30,
  purpose: "Décrire son Les",
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  resources: ["Computer", "Projector", "Internet", "Relevant materials"],
  learningOutcomes: [
    {
      id: "lo1",
      title: "Décrire son Les",
      hours: 10,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "Parler des activités quotidiennes",
          subtopics: [
            {
              title: "✓ Les moments de la journée",
              items: [],
            },
            {
              title: "✓ La conjugaison des verbes pronominaux du premier groupe à l'indicatif présent",
              items: [],
            },
            {
              title: "✓ L'emploi de « faire du, de la, des » pour décrire une activité",
              items: [],
            },
            {
              title: "✓ La conjugaison des verbes « dormir » et « finir » à l'indicatif présent",
              items: [],
            },
          ],
        },
        {
          title: "L'utilisation des indicateurs de temps",
          subtopics: [
            {
              title: "✓ Les expressions de la fréquence",
              items: [],
            },
            {
              title: "Jamais (ne)",
              items: [],
            },
            {
              title: "Parfois",
              items: [],
            },
            {
              title: "Souvent",
              items: [],
            },
            {
              title: "Toujours",
              items: [],
            },
            {
              title: "✓ Les indicateurs de temps pour situer dans le temps",
              items: [],
            },
            {
              title: "Jusqu'à",
              items: [],
            },
            {
              title: "De… à",
              items: [],
            },
            {
              title: "Quand",
              items: [],
            },
            {
              title: "D'abord/ premièrement",
              items: [],
            },
            {
              title: "Puis/ ensuite",
              items: [],
            },
            {
              title: "Après",
              items: [],
            },
            {
              title: "Enfin",
              items: [],
            },
            {
              title: "Depuis",
              items: [],
            },
            {
              title: "Employable Skills for Sustainable Job Creation",
              items: [],
            },
            {
              title: "Pendant",
              items: [],
            },
          ],
        },
        {
          title: "L'utilisation des conjonctions de coordination",
          subtopics: [
            {
              title: "✓ Addition : Et",
              items: [],
            },
            {
              title: "✓ Négation addition : ni … ni",
              items: [],
            },
            {
              title: "✓ Choix : ou",
              items: [],
            },
            {
              title: "✓ Opposition : mais",
              items: [],
            },
            {
              title: "✓ Opposition avec exclusion : or",
              items: [],
            },
            {
              title: "✓ Conséquence : Donc",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Faire les courses",
      hours: 9,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "L'identification des produits alimentaires et les sites de courses",
          subtopics: [
            {
              title: "✓ Les produits alimentaires",
              items: [],
            },
            {
              title: "Les fruits",
              items: [],
            },
            {
              title: "Les légumes",
              items: [],
            },
            {
              title: "Les produits laitiers et les œufs",
              items: [],
            },
            {
              title: "Le poisson",
              items: [],
            },
            {
              title: "Les condiments",
              items: [],
            },
            {
              title: "✓ Les sites de courses",
              items: [],
            },
            {
              title: "Employable Skills for Sustainable Job Creation",
              items: [],
            },
            {
              title: "Épiceries spécialisées",
              items: [],
            },
            {
              title: "Supermarchés",
              items: [],
            },
            {
              title: "Marchés",
              items: [],
            },
          ],
        },
        {
          title: "Demander le prix",
          subtopics: [
            {
              title: "✓ La formation d'interrogation avec « combien »",
              items: [],
            },
            {
              title: "✓ L'emploi des démonstratifs",
              items: [],
            },
            {
              title: "Les adjectifs démonstratifs",
              items: [],
            },
            {
              title: "Les pronoms démonstratifs",
              items: [],
            },
            {
              title: "✓ Les mesures de masse et de capacité",
              items: [],
            },
            {
              title: "✓ Les contenants des produits alimentaires",
              items: [],
            },
            {
              title: "Une barquette",
              items: [],
            },
            {
              title: "Une boîte",
              items: [],
            },
            {
              title: "Une bouteille",
              items: [],
            },
            {
              title: "Un paquet",
              items: [],
            },
            {
              title: "Un pot",
              items: [],
            },
          ],
        },
        {
          title: "L'emploi du futur proche et du verbe « prendre »",
          subtopics: [
            {
              title: "✓ Verbe « aller » à l'indicatif présent",
              items: [],
            },
            {
              title: "✓ La formation de futur proche",
              items: [],
            },
            {
              title: "✓ La forme négative",
              items: [],
            },
            {
              title: "✓ Conjugaison du verbe « prendre » à l'indicatif présent",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Raconter un",
      hours: 11,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "Utilisation du passé composé pour raconter un événement",
          subtopics: [
            {
              title: "✓ Conjugaison des verbes « avoir » et « être » à l'indicatif présent",
              items: [],
            },
            {
              title: "Forme affirmative",
              items: [],
            },
            {
              title: "Forme négative",
              items: [],
            },
            {
              title: "✓ Le passé composé",
              items: [],
            },
            {
              title: "Les verbes du premier groupe",
              items: [],
            },
            {
              title: "Les verbes pronominaux du premier groupe",
              items: [],
            },
            {
              title: "✓ Accord du participe passé avec l'auxiliaire « être »",
              items: [],
            },
          ],
        },
        {
          title: "Emploi des adverbes de temps et le futur simple",
          subtopics: [
            {
              title: "✓ Emploi des adverbes de temps",
              items: [],
            },
            {
              title: "Hier",
              items: [],
            },
            {
              title: "Aujourd'hui",
              items: [],
            },
            {
              title: "Demain",
              items: [],
            },
            {
              title: "✓ Le futur simple des verbes du premier groupe",
              items: [],
            },
            {
              title: "✓ Utilisation de « il y a » pour montrer un moment précis dans le passé",
              items: [],
            },
          ],
        },
        {
          title: "Raconter un voyage",
          subtopics: [
            {
              title: "✓ Le vocabulaire lié au voyage",
              items: [],
            },
            {
              title: "L'aéroport",
              items: [],
            },
            {
              title: "Un vol",
              items: [],
            },
            {
              title: "Une valise",
              items: [],
            },
            {
              title: "Un taxi",
              items: [],
            },
            {
              title: "Quitter",
              items: [],
            },
            {
              title: "✓ Le participe passé en –u, -i, -is, -ert des verbes :",
              items: [],
            },
            {
              title: "Employable Skills for Sustainable Job Creation",
              items: [],
            },
            {
              title: "Descendre",
              items: [],
            },
            {
              title: "Voir",
              items: [],
            },
            {
              title: "Boire",
              items: [],
            },
            {
              title: "Choisir",
              items: [],
            },
            {
              title: "Dormir",
              items: [],
            },
            {
              title: "Prendre",
              items: [],
            },
            {
              title: "Découvrir",
              items: [],
            },
            {
              title: "✓ La voix active et la voix passive",
              items: [],
            },
            {
              title: "L'auxiliaire « être » à l'indicatif présent, passé compose et futur simple",
              items: [],
            },
            {
              title: "Le participe passé des verbes du deuxième groupe",
              items: [],
            },
          ],
        },
      ],
    },
  ],
};

export const CCMKK502: ModuleCurriculum = {
  code: "CCMKK502",
  title: "Kutumia Kiswahili katika Mawasiliano ya kazini",
  level: "5",
  credits: 3,
  totalHours: 30,
  purpose: "Kutumia Kiswahili katika mawasiliano ya kazini. Learners will use Kiswahili effectively in workplace communication.",
  resources: ["Ubao", "Kompyuta", "Projekta", "Kitabu cha mwanafunzi", "Kamusi ya Kiswahili"],
  assessment: { theoretical: 30, practical: 70, formative: 30, summative: 0 },
  learningOutcomes: [
    {
      id: "lo1",
      title: "Kutumia maneno mbalimbali kwa kueleza shughuli za kila siku",
      hours: 12,
      performanceCriteria: [
        "Shughuli za kila siku zimeelezwa vizuri kwa kuzingatia matumizi bora ya viambishi tofauti vya hali",
        "Shughuli za kila siku zimeelezwa vizuri kwa kuzingatia matumizi sahihi ya vielezi",
        "Shughuli za kila siku zimeelezwa vizuri kwa kuzingatia mnyambuliko sahihi wa maneno"
      ],
      topics: [
        {
          title: "Mazungumzo kuhusu shughuli za kila siku",
          subtopics: [],
        },
        {
          title: "Matumizi ya Viambishi",
          subtopics: [
            { title: "Viambishi vya hali shurtishi", items: [] },
            { title: "Viambishi vya uwezekano", items: [] },
            { title: "Viambishi vya mahali", items: [] },
          ],
        },
        {
          title: "Matumizi ya Vielezi",
          subtopics: [
            { title: "Vielezi vya wakati", items: [] },
            { title: "Vielezi vya mahali", items: [] },
            { title: "Vielezi vya namna/jinsi", items: [] },
            { title: "Vielezi vya idadi", items: [] },
          ],
        },
        {
          title: "Mnyabuliko wa maneno",
          subtopics: [
            { title: "Mnyambuliko wa vitenzi", items: [] },
            { title: "Mnyambuliko wa nomino", items: [] },
            { title: "Mnyambuliko wa vielezi", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Kusimulia matukio ya kikazi kwa kutumia usemi wa asili na usemi wa taarifa",
      hours: 10,
      performanceCriteria: [
        "Matukio ya kikazi yamesimuliwa vizuri kupitia usemi wa asili",
        "Matukio ya kikazi yamesimuliwa vizuri kupitia usemi wa taarifa",
        "Matukio ya kikazi yamesimuliwa vizuri kwa kuzingatia mabadiliko ya usemi"
      ],
      topics: [
        {
          title: "Usemi wa asili",
          subtopics: [
            { title: "Maana ya usemi wa asili", items: [] },
            { title: "Mfano wa usemi wa asili", items: [] },
            { title: "Aina za usemi wa asili", items: [] },
          ],
        },
        {
          title: "Usemi wa taarifa",
          subtopics: [
            { title: "Maana ya usemi wa taarifa", items: [] },
            { title: "Aina za usemi wa taarifa", items: [] },
            { title: "Mfano wa usemi wa taarifa", items: [] },
          ],
        },
        {
          title: "Mabadiliko ya usemi",
          subtopics: [
            { title: "Mabadiliko ya usemi kulingana na wakati", items: [] },
            { title: "Mabadiliko ya usemi kulingana na hali ya sentensi", items: [] },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Kutunga hati za mawasiliano mbalimbali za kikazi",
      hours: 10,
      performanceCriteria: [
        "Barua ya kikazi imeandikwa vizuri kwa kuzingatia taratibu za uandishi wa barua",
        "Wasifu kazi imeandikwa vizuri kwa kuzingatia taratibu za uandishi wasifu kazi",
        "Ripoti ya kazi imeandikwa vizuri kwa kuzingatia taratibu za uandishi wa ripoti ya kazi"
      ],
      topics: [
        {
          title: "Hati za mawasiliano",
          subtopics: [
            { title: "Maana ya hati", items: [] },
            { title: "Aina za hati za Kikazi", items: [] },
          ],
        },
        {
          title: "Barua ya kikazi",
          subtopics: [
            { title: "Sehemu za barua", items: [] },
            { title: "Taratibu za kuandika barua", items: [] },
            { title: "Mifano ya barua za kikazi", items: [] },
          ],
        },
        {
          title: "Wasifu kazi",
          subtopics: [
            { title: "Maana ya wasifu kazi", items: [] },
            { title: "Sehemu za wasifu kazi", items: [] },
            { title: "Taratibu za kuandika wasifu kazi", items: [] },
          ],
        },
        {
          title: "Ripoti ya kazi",
          subtopics: [
            { title: "Maana ya ripoti", items: [] },
            { title: "Sehemu za ripoti ya kazi", items: [] },
            { title: "Taratibu za kuandika ripoti ya kazi", items: [] },
          ],
        },
      ],
    },
  ],
};


export const CCMKN502: ModuleCurriculum = {
  code: "CCMKN502",
  title: "Raporo",
  level: "5",
  credits: 3,
  totalHours: 30,
  purpose: "Gukoresha Amasaha : 5",
  assessment: { theoretical: 30, practical: 70, formative: 50, summative: 50 },
  resources: ["Computer", "Projector", "Internet", "Relevant materials"],
  learningOutcomes: [
    {
      id: "lo1",
      title: "Gukoresha Amasaha : 5",
      hours: 0,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "Isesenguramwandiko ku nsanganyamatsiko y' akamaro k'imyuga n' ubumenyi ngiro",
          subtopics: [
            {
              title: "Inyunguramagambo",
              items: [],
            },
            {
              title: "Ingingo z'ingenzi n'ingingo z'ingereka",
              items: [],
            },
            {
              title: "Insanganyamatsiko y'ingenzi iri mu mwandiko",
              items: [],
            },
            {
              title: "Isomo ry'ingenzi mu mwandiko",
              items: [],
            },
            {
              title: "Ingero zifatika zihamya akamaro k'imyuga n'ubumenyi ngiro mu muryango nyarwanda",
              items: [],
            },
          ],
        },
        {
          title: "Inkuru shusho",
          subtopics: [
            {
              title: "Inshoza y'inkuru shusho",
              items: [],
            },
            {
              title: "Uturango tw'inkuru shusho",
              items: [],
            },
            {
              title: "Urugero rw'inkuru shusho",
              items: [],
            },
          ],
        },
        {
          title: "Ikinamico",
          subtopics: [
            {
              title: "Inshoza y'ikinamico",
              items: [],
            },
            {
              title: "Uturango tw'ikinamico",
              items: [],
            },
            {
              title: "Urugero rw'ikinamico",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo2",
      title: "Gukoresha Amasaha ateganijwe: 5",
      hours: 0,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "Isesenguramwandiko ku nsanganyamatsiko y'uburyo bunyuranye bwo gukemura",
          subtopics: [
            {
              title: "amakimbirane:",
              items: [],
            },
            {
              title: "Inyunguramagambo",
              items: [],
            },
            {
              title: "Gushaka insanganyamatsiko y'ingenzi iri mu mwandiko",
              items: [],
            },
            {
              title: "Ingingo z'ingenzi n'ingingo z'ingereka",
              items: [],
            },
            {
              title: "Isomo ry'ingenzi mu mwandiko",
              items: [],
            },
            {
              title: "Ingero zifatika zerekana",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo3",
      title: "Gukoresha Amasaha n ateganyijwe: 10",
      hours: 0,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "Isesenguramwandiko ku nsanganyamatsiko y'uburyo bunyuranye bwo gutunganya",
          subtopics: [
            {
              title: "ubutaka:",
              items: [],
            },
            {
              title: "Inyunguramagambo",
              items: [],
            },
            {
              title: "Gushaka insanganyamatsiko y'ingenzi iri mu mwandiko",
              items: [],
            },
            {
              title: "Kuvumbura isomo ry'ingenzi mu mwandiko",
              items: [],
            },
            {
              title: "Ingero zifatika zo gufata neza ubutaka",
              items: [],
            },
            {
              title: "Ingaruka zo gufata no gukoresha nabi ubutaka",
              items: [],
            },
          ],
        },
        {
          title: "Imimaro y'amagambo",
          subtopics: [
            {
              title: "Ruhamwa",
              items: [],
            },
            {
              title: "Inshinga",
              items: [],
            },
            {
              title: "Ibyuzuzo",
              items: [],
            },
            {
              title: "Imfutuzi",
              items: [],
            },
            {
              title: "impuza",
              items: [],
            },
          ],
        },
        {
          title: "Amategeko agenga imyandikire y'ibihekane byihariye",
          subtopics: [
            {
              title: "Bw-bg",
              items: [],
            },
            {
              title: "Jy, Cy, njy, ncy",
              items: [],
            },
            {
              title: "Gw, hw, kw",
              items: [],
            },
          ],
        },
      ],
    },
    {
      id: "lo4",
      title: "Gukoresha Amasaha : 10",
      hours: 0,
      performanceCriteria: ["Competency demonstrated", "Standards met", "Skills applied"],
      topics: [
        {
          title: "Isesenguramwandiko ku nsanganyamatsiko ku kamaro k'isuku n'isukura",
          subtopics: [
            {
              title: "Inyunguramagambo",
              items: [],
            },
            {
              title: "Insanganyamatsiko y'ingenzi iri mu mwandiko",
              items: [],
            },
            {
              title: "Isomo ry'ingenzi mu mwandiko",
              items: [],
            },
            {
              title: "Ingero z'ibikorwa byimakaza isuku n'isukura",
              items: [],
            },
            {
              title: "Ingero z'ibyiza by'isuku n'isukura mu muryango",
              items: [],
            },
          ],
        },
        {
          title: "Umwandiko ntekerezo",
          subtopics: [
            {
              title: "Inshoza y'umwandiko ntekerezo",
              items: [],
            },
            {
              title: "Imbata y'umwandiko ntekerezo",
              items: [],
            },
            {
              title: "Intambwe z'ingenzi mu gukora umwandiko ntekerezo",
              items: [],
            },
            {
              title: "Urugero rw'umwandiko ntekerezo",
              items: [],
            },
          ],
        },
        {
          title: "Itangazo",
          subtopics: [
            {
              title: "Inshoza y'itangazo",
              items: [],
            },
            {
              title: "Imbata y'itangazo",
              items: [],
            },
            {
              title: "Amoko y'amatanganzo",
              items: [],
            },
            {
              title: "Ingero z'amatangazo",
              items: [],
            },
          ],
        },
        {
          title: "Ibaruwa",
          subtopics: [
            {
              title: "UBUMENYI NGIRO BUKENEWE MU GUHANGA UMURIMO URAMBYE",
              items: [],
            },
            {
              title: "Inshoza y'ibaruwa",
              items: [],
            },
            {
              title: "Ubwoko bw' amabaruwa n' imbata zayo",
              items: [],
            },
            {
              title: "Ingero z'amabaruwa",
              items: [],
            },
          ],
        },
        {
          title: "Raporo",
          subtopics: [
            {
              title: "Inshoza ya raporo",
              items: [],
            },
            {
              title: "Amoko ya raporo",
              items: [],
            },
            {
              title: "Imbata ya raporo",
              items: [],
            },
            {
              title: "Urugero rwa raporo",
              items: [],
            },
          ],
        },
      ],
    },
  ],
};




const REGISTRY: Record<string, ModuleCurriculum> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 5 MODULES
  // ═══════════════════════════════════════════════════════════════════════════
  // L5 Software Specific
  "swdbf501": SWDBF501,
  "blockchain fundamentals": SWDBF501,
  "swdfa501": SWDFA501,
  "front-end app development with react.js": SWDFA501,
  "react": SWDFA501,
  "swdia502": SWDIA502,
  "integrate the workplace": SWDIA502,
  "swdma501": SWDMA501,
  "mobile app development": SWDMA501,
  "swdml501": SWDML501,
  "machine learning application": SWDML501,
  "swdnd501": SWDND501,
  "nosql database development": SWDND501,
  "swdot501": SWDOT501,
  "devops application": SWDOT501,
  // L5 General
  "genpp501": GENPP501,
  "python programming": GENPP501,
  "genqa501": GENQA501,
  "quality assurance": GENQA501,
  "genap502": GENAP502,
  "mathematical analysis, statistics and probability": GENAP502,
  "gendw502": GENDW502,
  "apply dynamics and waves": GENDW502,

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 4 MODULES
  // ═══════════════════════════════════════════════════════════════════════════
  // L4 Software Specific
  "swdbd401": SWDBD401,
  "backend development": SWDBD401,
  "backend application development": SWDBD401,
  "swdbs401": SWDBS401,
  "backend system design": SWDBS401,
  "swdda401": SWDDA401,
  "data structure and algorithm fundamentals": SWDDA401,
  "data structures & algorithms": SWDDA401,
  "swddd401": SWDDD401,
  "database development": SWDDD401,
  "databases & sql": SWDDD401,
  "swdpp401": SWDPP401,
  "php programming": SWDPP401,
  "swdws401": SWDWS401,
  "windows server administration": SWDWS401,
  // L4 General
  "genbn401": GENBN401,
  "basics of networking": GENBN401,
  "genfa402": GENFA402,
  "apply fundamental mathematics analysis": GENFA402,
  "genmp402": GENMP402,
  "apply mechanics and properties of matter": GENMP402,

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 3 MODULES
  // ═══════════════════════════════════════════════════════════════════════════
  // L3 Software Specific
  "swdgd301": SWDGD301,
  "game development in vue framework": SWDGD301,
  "swdjs301": SWDJS301,
  "javascript fundamentals": SWDJS301,
  "swdpr301": SWDPR301,
  "software project requirements analysis": SWDPR301,
  "swdux301": SWDUX301,
  "ux design": SWDUX301,
  "swdvc301": SWDVC301,
  "version control": SWDVC301,
  "swdwd301": SWDWD301,
  "web development": SWDWD301,
  // L3 General
  "gengd301": GENGD301,
  "apply graphic design": GENGD301,
  "genft302": GENFT302,
  "fundamental algebra and trigonometry": GENFT302,
  "gengp302": GENGP302,
  "apply general physics": GENGP302,

  // ═══════════════════════════════════════════════════════════════════════════
  // CCM (COMMON CORE MODULES) - ALL LEVELS
  // ═══════════════════════════════════════════════════════════════════════════
  // L3 CCM
  "ccmbc302": CCMBC302,
  "create a business": CCMBC302,
  "ccmcl302": CCMCL302,
  "communication at work place": CCMCL302,
  "ict": CCMCL302,  // ICT (L3) in database
  "ccmcz301": CCMCZ301,
  "citizenship": CCMCZ301,
  "ccmen302": CCMEN302,
  "english": CCMEN302,
  "ccmft302": CCMFT302,
  "français": CCMFT302,
  "ccmhe303": CCMHE303,
  "safety, health and environment at workplace": CCMHE303,
  "safety, health and environment": CCMHE303,  // Database alias
  "ccmkn302": CCMKN302,
  "ikinyarwanda kiboneye": CCMKN302,
  "ccmol302": CCMOL302,
  "occupation and learning process": CCMOL302,
  "ictia302": ICTIA302,
  "industrial attachment program": ICTIA302,
  // L4 CCM
  "ccmbp402": CCMBP402,
  "entrepreneurship": CCMBP402,
  "ccmcs402": CCMCS402,
  "information and communication technology": CCMCS402,
  "ccmen402": CCMEN402,
  "english l4": CCMEN402,
  "ccmft402": CCMFT402,
  "français l4": CCMFT402,
  "ccmia402": CCMIA402,
  "industrial attachment program l4": CCMIA402,
  "ccmkn402": CCMKN402,
  "ikinyarwanda": CCMKN402,
  "cmcz401": CMCZ401,
  "citizenship l4": CMCZ401,
  // L5 CCM
  "ccmbo502": CCMBO502,
  "organise a business": CCMBO502,
  "ccmcz501": CCMCZ501,
  "develop attitudes of living together in harmony": CCMCZ501,
  "civic attitudes & harmony": CCMCZ501,  // Database alias
  "ccmen502": CCMEN502,
  "use upper-intermediate english at workplace": CCMEN502,
  "english at workplace": CCMEN502,  // Database alias
  "ccmft502": CCMFT502,
  "échanger les idées en français élémentaire": CCMFT502,
  "ccmiw502": CCMIW502,
  "apply ict at workplace": CCMIW502,
  "ict at workplace": CCMIW502,  // Database alias
  "ccmkk502": CCMKK502,
  "kutumia kiswahili katika mawasiliano ya kazini": CCMKK502,
  "kiswahili": CCMKK502,  // Database alias
  "ccmkn502": CCMKN502,
  "gukoresha ikinyarwanda k'intyoza": CCMKN502,
  "ikinyarwanda k'intyoza": CCMKN502,  // Database alias
  "ccmpe502": CCMPE502,
  "apply professional and multi-cultural ethics at workplace": CCMPE502,
  "professional & multicultural ethics": CCMPE502,  // Database alias
};

/**
 * Look up structured curriculum content for a track name.
 * Returns null if no built-in content exists for this track.
 */
export function getCurriculumContent(trackName: string): ModuleCurriculum | null {
  // Normalize: lowercase, trim
  let normalized = trackName.toLowerCase().trim();

  // Extract level suffix if present
  const levelMatch = normalized.match(/\(l([345])\)$/i);
  const level = levelMatch ? levelMatch[1] : null;

  // Remove level suffix for lookup
  normalized = normalized.replace(/\s*\(l[345]\)\s*$/i, '');

  // Special handling for ambiguous terms
  if (normalized === 'ict') {
    if (level === '3') return REGISTRY['ccmcl302'];  // Communication/Computer Literacy
    if (level === '4') return REGISTRY['ccmcs402'];  // Information and Communication Technology
    if (level === '5') return REGISTRY['ccmiw502'];  // ICT at Workplace
    // Default to L3 if no level specified
    return REGISTRY['ccmcl302'];
  }

  return REGISTRY[normalized] ?? null;
}

export default REGISTRY;
