import { extractSkills, getSkill, type SkillCategory } from "./skills";

export interface ResumeAnalysis {
  skills: string[];
  experienceYears: number;
  score: number; // 0-100
  feedback: string[];
  sections: Record<SectionName, boolean>;
  contact: { email: boolean; phone: boolean; linkedin: boolean; github: boolean };
  wordCount: number;
}

type SectionName = "summary" | "education" | "experience" | "projects" | "skills" | "certifications";

const SECTION_PATTERNS: Record<SectionName, RegExp> = {
  summary: /^\s*(summary|profile|objective|about me)\b/im,
  education: /^\s*(education|academics|academic background)\b/im,
  experience: /^\s*(experience|work experience|employment|internships?|professional experience)\b/im,
  projects: /^\s*(projects|personal projects|academic projects)\b/im,
  skills: /^\s*(skills|technical skills|tech stack|technologies)\b/im,
  certifications: /^\s*(certifications?|courses|achievements|awards)\b/im,
};

const ACTION_VERBS = [
  "built", "designed", "developed", "implemented", "led", "launched", "optimized", "reduced",
  "improved", "increased", "automated", "deployed", "created", "architected", "migrated",
  "integrated", "shipped", "scaled", "trained", "analyzed",
];

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
};

/**
 * Estimate total years of experience.
 * 1) An explicit statement like "3+ years of experience" wins.
 * 2) Otherwise sum date ranges ("Jan 2022 - Present", "2021 – 2023") found in the
 *    experience section, merging overlaps so concurrent roles aren't double counted.
 */
export function estimateExperienceYears(text: string, now: Date = new Date()): number {
  const explicit = text.match(/(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:professional\s+|industry\s+|work\s+)?experience/i);
  if (explicit) return Math.min(parseFloat(explicit[1]), 40);

  const expSection = sliceSection(text, "experience") ?? "";
  if (!expSection) return 0;

  const monthName = "(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*\\.?";
  const point = `(?:${monthName}\\s+)?((?:19|20)\\d{2})`;
  const rangeRe = new RegExp(`${point}\\s*(?:-|–|—|to)\\s*(?:${point}|(present|current|now))`, "gi");

  const intervals: [number, number][] = [];
  for (const m of expSection.matchAll(rangeRe)) {
    const startMonth = m[1] ? MONTHS[m[1].slice(0, 3).toLowerCase()] : 0;
    const start = new Date(parseInt(m[2], 10), startMonth ?? 0, 1).getTime();
    let end: number;
    if (m[5]) {
      end = now.getTime();
    } else {
      const endMonth = m[3] ? MONTHS[m[3].slice(0, 3).toLowerCase()] : 11;
      end = new Date(parseInt(m[4], 10), endMonth ?? 11, 28).getTime();
    }
    if (end > start) intervals.push([start, end]);
  }
  if (intervals.length === 0) return 0;

  intervals.sort((a, b) => a[0] - b[0]);
  let total = 0;
  let [curStart, curEnd] = intervals[0];
  for (const [s, e] of intervals.slice(1)) {
    if (s <= curEnd) {
      curEnd = Math.max(curEnd, e);
    } else {
      total += curEnd - curStart;
      [curStart, curEnd] = [s, e];
    }
  }
  total += curEnd - curStart;
  const years = total / (365.25 * 24 * 3600 * 1000);
  return Math.round(years * 10) / 10;
}

/** Return the text of one section: from its heading to the next known heading. */
function sliceSection(text: string, name: SectionName): string | null {
  const start = text.search(SECTION_PATTERNS[name]);
  if (start === -1) return null;
  const rest = text.slice(start + 1);
  let end = rest.length;
  for (const [other, re] of Object.entries(SECTION_PATTERNS)) {
    if (other === name) continue;
    const idx = rest.search(re);
    if (idx !== -1 && idx < end) end = idx;
  }
  return text.slice(start, start + 1 + end);
}

export function analyzeResume(text: string, now: Date = new Date()): ResumeAnalysis {
  const clean = text.replace(/\r/g, "");
  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const skills = extractSkills(clean);
  const experienceYears = estimateExperienceYears(clean, now);

  const sections = Object.fromEntries(
    (Object.keys(SECTION_PATTERNS) as SectionName[]).map((k) => [k, SECTION_PATTERNS[k].test(clean)]),
  ) as Record<SectionName, boolean>;

  const contact = {
    email: /[\w.+-]+@[\w-]+\.[\w.]+/.test(clean),
    phone: /(\+?\d[\d\s-]{8,}\d)/.test(clean),
    linkedin: /linkedin\.com\/in\//i.test(clean),
    github: /github\.com\/[\w-]+/i.test(clean),
  };

  const lower = clean.toLowerCase();
  const verbsUsed = ACTION_VERBS.filter((v) => new RegExp(`\\b${v}\\b`).test(lower));
  const quantified = (clean.match(/\b\d+(?:\.\d+)?\s*(?:%|x\b|k\b|\+|ms\b|users|requests|hours)/gi) ?? []).length;

  const categories = new Set<SkillCategory>(
    skills.map((s) => getSkill(s)?.category).filter((c): c is SkillCategory => Boolean(c)),
  );

  // ---- Scoring (100 points total) ----
  let score = 0;
  const feedback: string[] = [];

  // Contact info: 10
  score += (contact.email ? 4 : 0) + (contact.phone ? 2 : 0) + (contact.linkedin ? 2 : 0) + (contact.github ? 2 : 0);
  if (!contact.email) feedback.push("Add an email address so recruiters can reach you.");
  if (!contact.github) feedback.push("Link your GitHub profile — it's the first thing tech recruiters check.");
  if (!contact.linkedin) feedback.push("Add your LinkedIn URL.");

  // Sections: 25
  const core: SectionName[] = ["education", "experience", "projects", "skills"];
  for (const s of core) {
    if (sections[s]) score += 5;
    else feedback.push(`Add a clear "${s[0].toUpperCase() + s.slice(1)}" section heading.`);
  }
  if (sections.summary) score += 3;
  if (sections.certifications) score += 2;

  // Skills breadth: 25
  score += Math.min(skills.length, 12) * 1.5; // up to 18
  score += Math.min(categories.size, 4) * 1.75; // up to 7
  if (skills.length < 6) feedback.push("List more concrete technical skills (languages, frameworks, databases, tools).");
  if (!categories.has("database")) feedback.push("Mention a database you've used (e.g. PostgreSQL, MongoDB).");
  if (!categories.has("cloud") && !skills.includes("Docker")) feedback.push("Add deployment or DevOps experience (Docker, AWS, CI/CD).");

  // Impact language: 25
  score += Math.min(verbsUsed.length, 8) * 1.5; // up to 12
  score += Math.min(quantified, 5) * 2.6; // up to 13
  if (verbsUsed.length < 4) feedback.push("Start bullet points with strong action verbs (built, optimized, deployed...).");
  if (quantified < 2) feedback.push("Quantify your impact with numbers: users served, % speed-up, time saved.");

  // Length: 15
  if (wordCount >= 250 && wordCount <= 900) score += 15;
  else if (wordCount >= 150 && wordCount <= 1200) score += 8;
  else feedback.push(wordCount < 150 ? "Your resume looks too short — expand on projects and experience." : "Trim your resume to 1–2 pages; recruiters skim.");

  if (feedback.length === 0) feedback.push("Strong resume. Tailor the summary to each role you apply for.");

  return {
    skills,
    experienceYears,
    score: Math.max(0, Math.min(100, Math.round(score))),
    feedback,
    sections,
    contact,
    wordCount,
  };
}
