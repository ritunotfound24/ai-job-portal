import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { rankJobs } from "../src/lib/matcher";
import { analyzeResume } from "../src/lib/resume-analyzer";

const db = new PrismaClient();

const DEMO_PASSWORD = "password123";

const RECRUITERS = [
  { name: "Ananya Rao", email: "ananya@nimbuslabs.dev", company: "Nimbus Labs" },
  { name: "Karan Mehta", email: "karan@quillai.dev", company: "Quill AI" },
];

const JOBS = [
  {
    recruiter: 0,
    title: "Frontend Developer Intern",
    location: "Bengaluru",
    remote: true,
    type: "INTERNSHIP",
    minYears: 0,
    salaryRange: "₹30k/month",
    skills: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
    description:
      "Join our product team to build fast, accessible interfaces for our analytics dashboard.\n\n" +
      "You'll work with React, TypeScript and Next.js App Router, write reusable components with Tailwind CSS, " +
      "and collaborate with designers in Figma. Bonus if you've shipped a side project.",
  },
  {
    recruiter: 0,
    title: "Backend Engineer",
    location: "Pune",
    remote: false,
    type: "FULL_TIME",
    minYears: 1,
    salaryRange: "₹10–14 LPA",
    skills: ["Node.js", "PostgreSQL", "Docker", "REST APIs", "Redis"],
    description:
      "Design and own REST APIs in Node.js that serve millions of requests a day. " +
      "You'll model data in PostgreSQL, add caching with Redis, and ship containerized services with Docker and CI/CD.",
  },
  {
    recruiter: 0,
    title: "Full Stack Developer",
    location: "Remote",
    remote: true,
    type: "FULL_TIME",
    minYears: 2,
    salaryRange: "₹12–18 LPA",
    skills: ["React", "Node.js", "MongoDB", "TypeScript", "AWS"],
    description:
      "Build features end to end: React frontends, Node.js services and MongoDB data models. " +
      "Deploy to AWS, monitor production, and mentor interns.",
  },
  {
    recruiter: 1,
    title: "Machine Learning Engineer",
    location: "Hyderabad",
    remote: false,
    type: "FULL_TIME",
    minYears: 2,
    salaryRange: "₹16–24 LPA",
    skills: ["Python", "PyTorch", "Machine Learning", "AWS", "Docker"],
    description:
      "Train and deploy deep learning models for document understanding. You'll own experiments in PyTorch, " +
      "build data pipelines with Pandas, and serve models on AWS behind FastAPI.",
  },
  {
    recruiter: 1,
    title: "AI/NLP Intern",
    location: "Remote",
    remote: true,
    type: "INTERNSHIP",
    minYears: 0,
    salaryRange: "₹25k/month",
    skills: ["Python", "NLP", "LLMs", "scikit-learn"],
    description:
      "Help us build retrieval-augmented generation (RAG) pipelines with large language models. " +
      "You'll evaluate prompts, fine-tune small NLP models with scikit-learn and PyTorch, and write clean Python.",
  },
  {
    recruiter: 1,
    title: "Data Analyst",
    location: "Gurugram",
    remote: false,
    type: "FULL_TIME",
    minYears: 1,
    salaryRange: "₹8–11 LPA",
    skills: ["SQL", "Python", "Pandas", "Communication"],
    description:
      "Turn product data into decisions. Write SQL against our warehouse, analyze trends with Python and Pandas, " +
      "and present findings to leadership with clear communication.",
  },
  {
    recruiter: 1,
    title: "DevOps Engineer (Contract)",
    location: "Remote",
    remote: true,
    type: "CONTRACT",
    minYears: 3,
    salaryRange: "₹1.5L/month",
    skills: ["Kubernetes", "Docker", "AWS", "CI/CD", "Linux"],
    description:
      "Migrate our services to Kubernetes on AWS. Set up GitHub Actions CI/CD, harden Linux hosts and write runbooks.",
  },
];

const DEMO_RESUME = `Priya Sharma
priya.demo@example.com | +91 90000 00000 | linkedin.com/in/priya-demo | github.com/priya-demo

SUMMARY
Final-year CS student who loves building full-stack web apps.

EDUCATION
B.Tech Computer Science, 2022 - 2026

EXPERIENCE
Web Development Intern, Pixel Studio — Jan 2025 - Jun 2025
- Built a React and TypeScript admin panel used by 300+ staff
- Developed REST APIs in Node.js with PostgreSQL, cutting page load time by 35%
- Deployed services with Docker and GitHub Actions

PROJECTS
Campus Marketplace — Next.js, Tailwind CSS, Prisma
Expense Tracker — React, Express.js, MongoDB

SKILLS
JavaScript, TypeScript, React, Next.js, Node.js, PostgreSQL, MongoDB, Docker, Git, Python
`;

async function main() {
  console.log("Clearing old data…");
  await db.application.deleteMany();
  await db.job.deleteMany();
  await db.resume.deleteMany();
  await db.user.deleteMany();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const recruiters = [];
  for (const r of RECRUITERS) {
    recruiters.push(await db.user.create({ data: { ...r, role: "RECRUITER", passwordHash } }));
  }

  const jobs = [];
  for (const [i, j] of JOBS.entries()) {
    const { recruiter, skills, ...rest } = j;
    jobs.push(
      await db.job.create({
        data: {
          ...rest,
          company: recruiters[recruiter].company!,
          recruiterId: recruiters[recruiter].id,
          skills: JSON.stringify(skills),
          // Stagger creation dates so "newest" sorting is visible.
          createdAt: new Date(Date.now() - i * 36 * 3600 * 1000),
        },
      }),
    );
  }

  const candidate = await db.user.create({
    data: { name: "Priya Sharma", email: "priya@demo.dev", role: "CANDIDATE", passwordHash },
  });
  const analysis = analyzeResume(DEMO_RESUME);
  await db.resume.create({
    data: {
      userId: candidate.id,
      fileName: "priya-sharma-resume.txt",
      text: DEMO_RESUME,
      skills: JSON.stringify(analysis.skills),
      experienceYears: analysis.experienceYears,
      score: analysis.score,
      feedback: JSON.stringify(analysis.feedback),
    },
  });
  // Score the demo applications with the same matcher the app uses.
  const ranked = rankJobs(
    { skills: analysis.skills, experienceYears: analysis.experienceYears, text: DEMO_RESUME },
    jobs.map((j, i) => ({ id: j.id, title: j.title, description: j.description, skills: JOBS[i].skills, minYears: j.minYears })),
  );
  const scoreOf = (id: string) => ranked.find((r) => r.jobId === id)?.score ?? 0;
  await db.application.create({
    data: { jobId: jobs[0].id, candidateId: candidate.id, status: "INTERVIEW", matchScore: scoreOf(jobs[0].id) },
  });
  await db.application.create({
    data: { jobId: jobs[1].id, candidateId: candidate.id, status: "APPLIED", matchScore: scoreOf(jobs[1].id) },
  });

  console.log(`Seeded ${recruiters.length} recruiters, ${jobs.length} jobs and 1 candidate.`);
  console.log(`Log in as priya@demo.dev or ananya@nimbuslabs.dev — password: ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
