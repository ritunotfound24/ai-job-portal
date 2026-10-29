# HireMatch — AI-Powered Job Portal

A full-stack job portal where candidates upload a resume once and every open role is ranked by how well they match it. Recruiters post jobs and see applicants sorted by match score, then move them through a hiring pipeline.

Built with **Next.js 14 (App Router, Server Actions)**, **TypeScript**, **Prisma**, **SQLite/PostgreSQL**, and **Tailwind CSS**.

## Features

**For candidates**
- Upload a resume as PDF or plain text, or paste it in
- Instant resume analysis: detected skills grouped by category, estimated years of experience, a 0–100 resume score, and specific improvement tips
- Optional LLM-written summary (any OpenAI-compatible API) on top of the built-in analyzer
- Every job shows a personal **match score** with matched vs missing skills highlighted
- Jobs list can be sorted by best match, filtered by type and remote, and searched
- Kanban-style **application tracker** (Applied → Screening → Interview → Offer / Rejected)
- Recommended jobs you haven't applied to yet

**For recruiters**
- Post jobs; required skills are normalized ("reactjs" → React) or auto-detected from the description
- Applicants for each job are **ranked by match score**, with the required skills each one has
- Update an applicant's status in one click; open and close jobs

**Engineering**
- Stateless JWT sessions in an httpOnly cookie (`jose`), passwords hashed with `bcryptjs`
- Route protection in Edge middleware plus role checks in every server action
- Input validation with `zod` on every form
- Zero-dependency NLP core (skill extraction, TF-IDF, experience parsing) with unit tests

## How the matching works

The matcher lives in [`src/lib/matcher.ts`](src/lib/matcher.ts) and combines three signals:

| Signal | Weight | How it's computed |
|---|---|---|
| Skill coverage | 55% | Share of the job's required skills found in the resume |
| Content similarity | 25% | TF-IDF cosine similarity between resume text and the job title + description (rescaled, since raw resume/job cosines rarely exceed ~0.4) |
| Experience fit | 20% | 1.0 if the candidate meets the minimum years, otherwise linear partial credit |

Skill extraction ([`src/lib/skills.ts`](src/lib/skills.ts)) uses a taxonomy of ~55 canonical skills with aliases (`k8s` → Kubernetes, `node.js` → Node.js). Matching uses symbol-aware word boundaries, so `C++` and `CI/CD` work while "reacted" doesn't count as React.

Experience estimation ([`src/lib/resume-analyzer.ts`](src/lib/resume-analyzer.ts)) first looks for an explicit "3+ years of experience". Otherwise it parses date ranges like `Jan 2024 – Present` inside the Experience section only, merging overlapping roles so concurrent jobs aren't double counted.

## Getting started

Requires Node.js 18.17 or newer.

```bash
git clone https://github.com/ritunotfound24/ai-job-portal.git
cd ai-job-portal
npm install
cp .env.example .env        # then set AUTH_SECRET to a long random string
npm run setup               # creates the SQLite database and loads demo data
npm run dev
```

Open http://localhost:3000. Demo accounts (password `password123`):

- Candidate: `priya@demo.dev`
- Recruiter: `ananya@nimbuslabs.dev`

### Using PostgreSQL instead of SQLite

Change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`, point `DATABASE_URL` at your database, and run `npm run setup` again.

### Optional LLM summary

Set `LLM_API_KEY` (and optionally `LLM_BASE_URL` / `LLM_MODEL`) in `.env`. Any OpenAI-compatible chat completions endpoint works. Without a key the app uses only the built-in analyzer.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Generate the Prisma client and build for production |
| `npm test` | Run unit tests for the matching and analysis engine |
| `npm run typecheck` | Type-check the project |
| `npm run setup` | Push the schema and seed demo data |

## Project structure

```
prisma/
  schema.prisma          User, Resume, Job, Application models
  seed.ts                Demo recruiters, jobs and a candidate
src/
  app/
    actions/             Server actions: auth, resume, jobs, applications
    dashboard/           Candidate tracker / recruiter applicant review
    jobs/                Listing, detail and "post a job" pages
    resume/              Upload and analysis results
  components/            UI components and client forms
  lib/
    skills.ts            Skill taxonomy and extraction
    text.ts              Tokenizer and TF-IDF similarity
    resume-analyzer.ts   Scoring, feedback, experience estimation
    matcher.ts           Job ranking
    session.ts, auth.ts  JWT sessions
  middleware.ts          Protects signed-in routes
tests/                   node:test unit tests
```

## Possible next steps

- Swap TF-IDF for sentence embeddings for better semantic matching
- Email notifications when an application changes status
- Recruiter-side search across all candidates

## License

MIT
