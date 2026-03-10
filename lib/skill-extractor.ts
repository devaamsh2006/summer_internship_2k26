// ─── Deterministic Skill Extraction Engine ──────────────────────────────────
// Rule-based skill extraction using a comprehensive taxonomy.
// No LLM involvement — all extraction is deterministic.

export const SKILL_TAXONOMY: Record<string, string[]> = {
  // Programming Languages
  JavaScript: ["javascript", "js", "es6", "es2015", "ecmascript"],
  TypeScript: ["typescript", "ts"],
  Python: ["python", "python3", "py"],
  Java: ["java"],
  "C++": ["c++", "cpp", "c plus plus"],
  "C#": ["c#", "csharp", "c sharp"],
  C: ["\\bc\\b"],
  Go: ["golang", "\\bgo\\b"],
  Rust: ["rust"],
  Ruby: ["ruby"],
  PHP: ["php"],
  Swift: ["swift"],
  Kotlin: ["kotlin"],
  Scala: ["scala"],
  R: ["\\br\\b", "r programming", "r language"],
  MATLAB: ["matlab"],
  Perl: ["perl"],
  Haskell: ["haskell"],
  Elixir: ["elixir"],
  Dart: ["dart"],
  Lua: ["lua"],
  Shell: ["shell", "bash", "sh", "zsh", "shell scripting"],
  SQL: ["sql", "structured query language"],
  HTML: ["html", "html5"],
  CSS: ["css", "css3"],

  // Frontend Frameworks
  React: ["react", "reactjs", "react.js"],
  Angular: ["angular", "angularjs", "angular.js"],
  "Vue.js": ["vue", "vuejs", "vue.js"],
  "Next.js": ["next.js", "nextjs"],
  "Nuxt.js": ["nuxt", "nuxtjs", "nuxt.js"],
  Svelte: ["svelte", "sveltekit"],
  Remix: ["remix"],
  Gatsby: ["gatsby", "gatsbyjs"],

  // CSS Frameworks
  "Tailwind CSS": ["tailwind", "tailwindcss", "tailwind css"],
  Bootstrap: ["bootstrap"],
  "Material UI": ["material ui", "mui", "material-ui"],
  "Styled Components": ["styled-components", "styled components"],
  Sass: ["sass", "scss"],
  Less: ["less"],

  // Backend Frameworks
  "Node.js": ["node.js", "nodejs"],
  Express: ["express", "expressjs", "express.js"],
  Django: ["django"],
  Flask: ["flask"],
  FastAPI: ["fastapi", "fast api"],
  "Spring Boot": ["spring boot", "springboot", "spring"],
  Rails: ["rails", "ruby on rails"],
  Laravel: ["laravel"],
  "ASP.NET": ["asp.net", "aspnet", ".net core"],
  NestJS: ["nestjs", "nest.js"],
  Koa: ["koa"],
  Fastify: ["fastify"],
  ".NET": [".net", "dotnet"],

  // Databases
  PostgreSQL: ["postgresql", "postgres"],
  MySQL: ["mysql"],
  MongoDB: ["mongodb", "mongo"],
  Redis: ["redis"],
  SQLite: ["sqlite"],
  Elasticsearch: ["elasticsearch", "elastic search"],
  DynamoDB: ["dynamodb"],
  Cassandra: ["cassandra"],
  "Oracle DB": ["oracle db", "oracle database"],
  "SQL Server": ["sql server", "mssql", "microsoft sql"],
  Firebase: ["firebase", "firestore"],
  Neo4j: ["neo4j"],
  CouchDB: ["couchdb"],
  MariaDB: ["mariadb"],
  Supabase: ["supabase"],

  // Cloud Platforms
  AWS: ["aws", "amazon web services"],
  Azure: ["azure", "microsoft azure"],
  "Google Cloud": ["gcp", "google cloud", "google cloud platform"],
  Heroku: ["heroku"],
  Vercel: ["vercel"],
  Netlify: ["netlify"],
  DigitalOcean: ["digitalocean", "digital ocean"],
  Cloudflare: ["cloudflare"],

  // AWS Services
  "AWS Lambda": ["aws lambda", "lambda function"],
  "AWS S3": ["aws s3", "\\bs3\\b"],
  "AWS EC2": ["aws ec2", "\\bec2\\b"],
  "AWS ECS": ["aws ecs", "\\becs\\b"],
  "AWS EKS": ["aws eks", "\\beks\\b"],
  "AWS RDS": ["aws rds", "\\brds\\b"],
  "AWS SQS": ["aws sqs", "\\bsqs\\b"],
  "AWS SNS": ["aws sns", "\\bsns\\b"],
  CloudFormation: ["cloudformation"],
  "AWS CDK": ["aws cdk", "\\bcdk\\b"],

  // DevOps Tools
  Docker: ["docker", "dockerfile", "docker-compose"],
  Kubernetes: ["kubernetes", "k8s"],
  Jenkins: ["jenkins"],
  "GitHub Actions": ["github actions"],
  "GitLab CI": ["gitlab ci", "gitlab ci/cd"],
  CircleCI: ["circleci", "circle ci"],
  Terraform: ["terraform"],
  Ansible: ["ansible"],
  Puppet: ["puppet"],
  Chef: ["chef"],
  Nginx: ["nginx"],
  Apache: ["apache"],
  Helm: ["helm"],
  ArgoCD: ["argocd", "argo cd"],

  // Data Science & ML
  TensorFlow: ["tensorflow"],
  PyTorch: ["pytorch"],
  "Scikit-learn": ["scikit-learn", "sklearn", "scikit learn"],
  Pandas: ["pandas"],
  NumPy: ["numpy"],
  Keras: ["keras"],
  Jupyter: ["jupyter", "jupyter notebook"],
  "Apache Spark": ["spark", "apache spark", "pyspark"],
  Hadoop: ["hadoop"],
  Tableau: ["tableau"],
  "Power BI": ["power bi", "powerbi"],
  "Machine Learning": ["machine learning", "ml"],
  "Deep Learning": ["deep learning", "dl"],
  NLP: ["nlp", "natural language processing"],
  "Computer Vision": ["computer vision", "cv"],
  OpenCV: ["opencv"],
  LangChain: ["langchain"],
  "Hugging Face": ["hugging face", "huggingface"],

  // Mobile
  "React Native": ["react native"],
  Flutter: ["flutter"],
  iOS: ["ios development", "\\bios\\b"],
  Android: ["android development", "\\bandroid\\b"],
  "Swift UI": ["swiftui", "swift ui"],
  Xamarin: ["xamarin"],

  // Testing
  Jest: ["jest"],
  Mocha: ["mocha"],
  Cypress: ["cypress"],
  Selenium: ["selenium"],
  Playwright: ["playwright"],
  PyTest: ["pytest"],
  JUnit: ["junit"],
  "Testing Library": ["testing library", "react testing library"],
  Vitest: ["vitest"],
  Storybook: ["storybook"],

  // Version Control
  Git: ["\\bgit\\b"],
  GitHub: ["github"],
  GitLab: ["gitlab"],
  Bitbucket: ["bitbucket"],

  // API & Communication
  "REST API": ["rest api", "restful", "rest"],
  GraphQL: ["graphql"],
  gRPC: ["grpc"],
  WebSocket: ["websocket", "websockets"],
  OAuth: ["oauth", "oauth2", "oauth 2.0"],
  JWT: ["jwt", "json web token"],
  OpenAPI: ["openapi", "swagger"],
  tRPC: ["trpc"],

  // Build Tools
  Webpack: ["webpack"],
  Vite: ["vite"],
  Babel: ["babel"],
  ESBuild: ["esbuild"],
  Rollup: ["rollup"],
  Turbopack: ["turbopack"],

  // Message Queues
  RabbitMQ: ["rabbitmq", "rabbit mq"],
  Kafka: ["kafka", "apache kafka"],
  "Amazon SQS": ["amazon sqs"],

  // Monitoring & Observability
  Prometheus: ["prometheus"],
  Grafana: ["grafana"],
  Datadog: ["datadog"],
  "New Relic": ["new relic"],
  Sentry: ["sentry"],
  ELK: ["elk stack", "elk"],
  Splunk: ["splunk"],

  // Methodologies
  Agile: ["agile"],
  Scrum: ["scrum"],
  Kanban: ["kanban"],
  "CI/CD": ["ci/cd", "cicd", "continuous integration", "continuous deployment", "continuous delivery"],
  TDD: ["tdd", "test driven development", "test-driven development"],
  DevOps: ["devops"],
  Microservices: ["microservices", "micro services"],
  "System Design": ["system design"],
  "Design Patterns": ["design patterns"],

  // Design Tools
  Figma: ["figma"],
  Sketch: ["sketch"],
  "Adobe XD": ["adobe xd"],
  Photoshop: ["photoshop"],
  Illustrator: ["illustrator"],
  InVision: ["invision"],

  // CMS
  WordPress: ["wordpress"],
  Contentful: ["contentful"],
  Strapi: ["strapi"],
  Sanity: ["sanity"],

  // ORM
  Prisma: ["prisma"],
  Sequelize: ["sequelize"],
  TypeORM: ["typeorm"],
  Mongoose: ["mongoose"],
  Hibernate: ["hibernate"],
  SQLAlchemy: ["sqlalchemy"],
  Drizzle: ["drizzle"],

  // State Management
  Redux: ["redux"],
  MobX: ["mobx"],
  Zustand: ["zustand"],
  Recoil: ["recoil"],
  Jotai: ["jotai"],
  "Context API": ["context api"],

  // Security
  OWASP: ["owasp"],
  "SSL/TLS": ["ssl", "tls", "ssl/tls"],
  Encryption: ["encryption"],
  Authentication: ["authentication"],
  Authorization: ["authorization"],
  RBAC: ["rbac", "role based access"],

  // Caching
  Memcached: ["memcached"],
  Varnish: ["varnish"],
  CDN: ["cdn", "content delivery network"],

  // Package Managers
  npm: ["\\bnpm\\b"],
  Yarn: ["\\byarn\\b"],
  pnpm: ["pnpm"],
  pip: ["\\bpip\\b"],
  Maven: ["maven"],
  Gradle: ["gradle"],
};

/**
 * Normalize a skill name to its canonical form.
 */
export function normalizeSkill(skill: string): string {
  const lower = skill.toLowerCase().trim();

  for (const [canonical, aliases] of Object.entries(SKILL_TAXONOMY)) {
    if (canonical.toLowerCase() === lower) return canonical;
    for (const alias of aliases) {
      if (alias.startsWith("\\b")) {
        const pattern = new RegExp(alias, "i");
        if (pattern.test(skill.trim())) return canonical;
      } else if (alias === lower) {
        return canonical;
      }
    }
  }
  // Return title-cased version if not in taxonomy
  return skill
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Extract skills from text using the deterministic taxonomy.
 */
export function extractSkills(text: string): string[] {
  if (!text || text.trim().length === 0) return [];

  const found = new Set<string>();
  const lowerText = ` ${text.toLowerCase()} `;

  for (const [canonical, aliases] of Object.entries(SKILL_TAXONOMY)) {
    for (const alias of aliases) {
      try {
        let pattern: RegExp;
        if (alias.includes("\\b")) {
          pattern = new RegExp(alias, "i");
        } else {
          // Word boundary matching for non-regex aliases
          const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          pattern = new RegExp(`(?:^|[\\s,;|/()\\[\\]{}])${escaped}(?:$|[\\s,;|/()\\[\\]{}])`, "i");
        }
        if (pattern.test(lowerText)) {
          found.add(canonical);
          break; // One match per canonical name is enough
        }
      } catch {
        // Skip invalid regex patterns
        continue;
      }
    }
  }

  return Array.from(found).sort();
}

/**
 * Extract skills mentioned in a specific section of text.
 */
export function extractSkillsFromSection(sectionText: string): string[] {
  return extractSkills(sectionText);
}

/**
 * Compare two skill lists deterministically.
 * Returns skills present in required but not in candidate.
 */
export function findMissingSkills(
  requiredSkills: string[],
  candidateSkills: string[]
): string[] {
  const normalizedCandidate = new Set(
    candidateSkills.map((s) => normalizeSkill(s).toLowerCase())
  );
  return requiredSkills.filter(
    (skill) => !normalizedCandidate.has(normalizeSkill(skill).toLowerCase())
  );
}

/**
 * Compute the frequency of each skill in the text.
 */
export function computeSkillFrequency(
  text: string,
  skills: string[]
): Map<string, number> {
  const freq = new Map<string, number>();
  const lowerText = text.toLowerCase();

  for (const skill of skills) {
    const aliases = SKILL_TAXONOMY[skill] || [skill.toLowerCase()];
    let count = 0;
    for (const alias of aliases) {
      try {
        let pattern: RegExp;
        if (alias.includes("\\b")) {
          pattern = new RegExp(alias, "gi");
        } else {
          const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          pattern = new RegExp(`(?:^|[\\s,;|/()\\[\\]{}])${escaped}(?:$|[\\s,;|/()\\[\\]{}])`, "gi");
        }
        const matches = lowerText.match(pattern);
        if (matches) count += matches.length;
      } catch {
        continue;
      }
    }
    freq.set(skill, count);
  }
  return freq;
}

/**
 * Classify skills based on job description prominence.
 */
export function classifySkillImportance(
  skill: string,
  frequency: number,
  totalSkills: number
): "critical" | "important" | "nice-to-have" {
  if (totalSkills === 0) return "nice-to-have";
  const relativeFreq = frequency / Math.max(totalSkills, 1);
  if (frequency >= 3 || relativeFreq > 0.15) return "critical";
  if (frequency >= 2 || relativeFreq > 0.08) return "important";
  return "nice-to-have";
}
