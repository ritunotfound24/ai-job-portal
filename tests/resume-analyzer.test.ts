import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { analyzeResume, estimateExperienceYears } from "../src/lib/resume-analyzer";
import { SAMPLE_RESUME } from "./fixtures";

const NOW = new Date(2026, 9, 1);

describe("estimateExperienceYears", () => {
  it("uses an explicit statement when present", () => {
    assert.equal(estimateExperienceYears("I have 4+ years of experience in backend work"), 4);
  });

  it("sums non-overlapping date ranges from the experience section", () => {
    const years = estimateExperienceYears(SAMPLE_RESUME, NOW);
    // Jan–Jun 2025 (~0.5) + Jul–Dec 2024 (~0.5); the education range is ignored.
    assert.ok(years > 0.8 && years < 1.2, `got ${years}`);
  });

  it("merges overlapping ranges", () => {
    const text = "EXPERIENCE\nRole A Jan 2020 - Dec 2021\nRole B Jun 2021 - Dec 2021\n";
    const years = estimateExperienceYears(text, NOW);
    assert.ok(years > 1.8 && years < 2.1, `got ${years}`);
  });

  it("handles 'Present'", () => {
    const years = estimateExperienceYears("EXPERIENCE\nEngineer Jan 2025 - Present", NOW);
    assert.ok(years > 1.6 && years < 1.8, `got ${years}`);
  });

  it("returns 0 with no experience section", () => {
    assert.equal(estimateExperienceYears("Just a student who likes code", NOW), 0);
  });
});

describe("analyzeResume", () => {
  const result = analyzeResume(SAMPLE_RESUME, NOW);

  it("extracts skills", () => {
    for (const s of ["React", "TypeScript", "PostgreSQL", "Docker", "Next.js", "Express"]) {
      assert.ok(result.skills.includes(s), `missing ${s}`);
    }
  });

  it("detects sections and contact details", () => {
    assert.equal(result.sections.education, true);
    assert.equal(result.sections.experience, true);
    assert.equal(result.sections.projects, true);
    assert.equal(result.contact.email, true);
    assert.equal(result.contact.github, true);
  });

  it("scores a solid resume well and a weak one poorly", () => {
    const weak = analyzeResume("hello I know computers", NOW);
    assert.ok(result.score >= 60, `strong resume scored ${result.score}`);
    assert.ok(weak.score < 20, `weak resume scored ${weak.score}`);
    assert.ok(weak.feedback.length > result.feedback.length);
  });

  it("keeps the score within 0-100", () => {
    assert.ok(result.score >= 0 && result.score <= 100);
  });
});
