/**
 * Skill taxonomy used for resume parsing and job matching.
 * Each canonical skill lists the aliases it can appear as in free text,
 * plus a category so we can give grouped feedback.
 */

export type SkillCategory =
  | "language"
  | "frontend"
  | "backend"
  | "database"
  | "cloud"
  | "ml"
  | "tooling"
  | "soft";

export interface SkillDef {
  name: string;
  category: SkillCategory;
  aliases: string[];
}

export const SKILLS: SkillDef[] = [
  // Languages
  { name: "JavaScript", category: "language", aliases: ["javascript", "js", "es6", "ecmascript"] },
  { name: "TypeScript", category: "language", aliases: ["typescript"] },
  { name: "Python", category: "language", aliases: ["python", "python3"] },
  { name: "Java", category: "language", aliases: ["java"] },
  { name: "C++", category: "language", aliases: ["c++", "cpp"] },
  { name: "C", category: "language", aliases: ["c programming", "ansi c"] },
  { name: "Go", category: "language", aliases: ["golang", "go lang"] },
  { name: "Rust", category: "language", aliases: ["rust"] },
  { name: "Kotlin", category: "language", aliases: ["kotlin"] },
  { name: "SQL", category: "language", aliases: ["sql"] },

  // Frontend
  { name: "React", category: "frontend", aliases: ["react", "reactjs", "react.js"] },
  { name: "Next.js", category: "frontend", aliases: ["next.js", "nextjs", "next js"] },
  { name: "Vue", category: "frontend", aliases: ["vue", "vuejs", "vue.js"] },
  { name: "Angular", category: "frontend", aliases: ["angular"] },
  { name: "HTML", category: "frontend", aliases: ["html", "html5"] },
  { name: "CSS", category: "frontend", aliases: ["css", "css3", "scss", "sass"] },
  { name: "Tailwind CSS", category: "frontend", aliases: ["tailwind", "tailwindcss", "tailwind css"] },
  { name: "Redux", category: "frontend", aliases: ["redux", "redux toolkit"] },

  // Backend
  { name: "Node.js", category: "backend", aliases: ["node", "node.js", "nodejs"] },
  { name: "Express", category: "backend", aliases: ["express.js", "expressjs", "express js"] },
  { name: "Django", category: "backend", aliases: ["django"] },
  { name: "Flask", category: "backend", aliases: ["flask"] },
  { name: "FastAPI", category: "backend", aliases: ["fastapi"] },
  { name: "Spring Boot", category: "backend", aliases: ["spring boot", "springboot", "spring framework"] },
  { name: "REST APIs", category: "backend", aliases: ["rest api", "restful", "rest apis"] },
  { name: "GraphQL", category: "backend", aliases: ["graphql"] },
  { name: "Microservices", category: "backend", aliases: ["microservices", "microservice"] },

  // Databases
  { name: "PostgreSQL", category: "database", aliases: ["postgres", "postgresql"] },
  { name: "MySQL", category: "database", aliases: ["mysql"] },
  { name: "MongoDB", category: "database", aliases: ["mongodb", "mongo", "mongoose"] },
  { name: "Redis", category: "database", aliases: ["redis"] },
  { name: "Prisma", category: "database", aliases: ["prisma"] },

  // Cloud / DevOps
  { name: "AWS", category: "cloud", aliases: ["aws", "amazon web services", "ec2", "s3", "lambda"] },
  { name: "GCP", category: "cloud", aliases: ["gcp", "google cloud"] },
  { name: "Azure", category: "cloud", aliases: ["azure"] },
  { name: "Docker", category: "cloud", aliases: ["docker", "dockerfile"] },
  { name: "Kubernetes", category: "cloud", aliases: ["kubernetes", "k8s"] },
  { name: "CI/CD", category: "cloud", aliases: ["ci/cd", "github actions", "jenkins", "continuous integration"] },
  { name: "Linux", category: "cloud", aliases: ["linux", "bash", "shell scripting"] },

  // ML / Data
  { name: "Machine Learning", category: "ml", aliases: ["machine learning", "ml"] },
  { name: "Deep Learning", category: "ml", aliases: ["deep learning", "neural networks", "cnn", "rnn"] },
  { name: "PyTorch", category: "ml", aliases: ["pytorch", "torch"] },
  { name: "TensorFlow", category: "ml", aliases: ["tensorflow", "keras"] },
  { name: "scikit-learn", category: "ml", aliases: ["scikit-learn", "sklearn", "scikit learn"] },
  { name: "Pandas", category: "ml", aliases: ["pandas"] },
  { name: "NumPy", category: "ml", aliases: ["numpy"] },
  { name: "NLP", category: "ml", aliases: ["nlp", "natural language processing"] },
  { name: "LLMs", category: "ml", aliases: ["llm", "llms", "large language models", "langchain", "rag"] },
  { name: "Computer Vision", category: "ml", aliases: ["computer vision", "opencv"] },

  // Tooling
  { name: "Git", category: "tooling", aliases: ["git", "github", "gitlab"] },
  { name: "Testing", category: "tooling", aliases: ["jest", "pytest", "unit testing", "vitest", "cypress", "playwright"] },
  { name: "Figma", category: "tooling", aliases: ["figma"] },

  // Soft skills
  { name: "Communication", category: "soft", aliases: ["communication", "presentation skills"] },
  { name: "Leadership", category: "soft", aliases: ["leadership", "led a team", "team lead", "mentored"] },
  { name: "Teamwork", category: "soft", aliases: ["teamwork", "collaboration", "collaborated"] },
];

const SKILL_BY_NAME = new Map(SKILLS.map((s) => [s.name.toLowerCase(), s]));

export function getSkill(name: string): SkillDef | undefined {
  return SKILL_BY_NAME.get(name.toLowerCase());
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Precompile one matcher per alias. Word boundaries are emulated with
// lookarounds so aliases containing symbols ("c++", "ci/cd", "node.js") work.
const MATCHERS: { skill: string; re: RegExp }[] = SKILLS.flatMap((s) =>
  s.aliases.map((alias) => ({
    skill: s.name,
    re: new RegExp(`(?<![a-z0-9+#])${escapeRegExp(alias)}(?![a-z0-9+#])`, "i"),
  })),
);

/** Find canonical skills mentioned in free text. Returns unique names in taxonomy order. */
export function extractSkills(text: string): string[] {
  const found = new Set<string>();
  for (const { skill, re } of MATCHERS) {
    if (!found.has(skill) && re.test(text)) found.add(skill);
  }
  return SKILLS.map((s) => s.name).filter((n) => found.has(n));
}

/** Normalize user-typed skills ("reactjs, Postgres") to canonical names, keeping unknown ones as typed. */
export function normalizeSkillList(input: string): string[] {
  const out: string[] = [];
  for (const raw of input.split(/[,\n]/)) {
    const term = raw.trim();
    if (!term) continue;
    const matched = extractSkills(term);
    const name = matched[0] ?? term;
    if (!out.some((s) => s.toLowerCase() === name.toLowerCase())) out.push(name);
  }
  return out;
}
