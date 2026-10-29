import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { experienceFit, rankJobs } from "../src/lib/matcher";
import { analyzeResume } from "../src/lib/resume-analyzer";
import { tfidfSimilarity } from "../src/lib/text";
import { JOBS, SAMPLE_RESUME } from "./fixtures";

describe("tfidfSimilarity", () => {
  it("scores identical docs as 1 and unrelated docs near 0", () => {
    const sim = tfidfSimilarity(["react typescript frontend", "react typescript frontend", "cooking pasta recipes"]);
    assert.ok(Math.abs(sim(0, 1) - 1) < 1e-9);
    assert.equal(sim(0, 2), 0);
  });
});

describe("experienceFit", () => {
  it("gives full credit when requirement is met or absent", () => {
    assert.equal(experienceFit(2, 0), 1);
    assert.equal(experienceFit(3, 2), 1);
  });
  it("gives partial credit when short", () => {
    assert.equal(experienceFit(1, 4), 0.25);
  });
});

describe("rankJobs", () => {
  const analysis = analyzeResume(SAMPLE_RESUME, new Date(2026, 9, 1));
  const candidate = { skills: analysis.skills, experienceYears: analysis.experienceYears, text: SAMPLE_RESUME };
  const ranked = rankJobs(candidate, JOBS);

  it("ranks the frontend role first and the ML role last for a web developer", () => {
    assert.equal(ranked[0].jobId, "frontend");
    assert.equal(ranked[ranked.length - 1].jobId, "ml");
  });

  it("reports matched and missing skills", () => {
    const ml = ranked.find((r) => r.jobId === "ml")!;
    assert.ok(ml.matchedSkills.includes("Python"));
    assert.ok(ml.missingSkills.includes("PyTorch"));
  });

  it("returns scores sorted and within range", () => {
    for (let i = 1; i < ranked.length; i++) assert.ok(ranked[i - 1].score >= ranked[i].score);
    for (const r of ranked) assert.ok(r.score >= 0 && r.score <= 100);
  });

  it("handles an empty job list", () => {
    assert.deepEqual(rankJobs(candidate, []), []);
  });
});
