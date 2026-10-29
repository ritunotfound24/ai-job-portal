import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractSkills, normalizeSkillList } from "../src/lib/skills";

describe("extractSkills", () => {
  it("finds skills by alias, including symbols", () => {
    const skills = extractSkills("Worked with ReactJS, node.js, C++ and k8s on AWS EC2");
    for (const s of ["React", "Node.js", "C++", "Kubernetes", "AWS"]) {
      assert.ok(skills.includes(s), `expected ${s} in ${skills.join(", ")}`);
    }
  });

  it("does not match aliases inside other words", () => {
    const skills = extractSkills("I reacted quickly and enjoyed the rest of the spring semester");
    assert.ok(!skills.includes("React"));
    assert.ok(!skills.includes("REST APIs"));
    assert.ok(!skills.includes("Spring Boot"));
  });

  it("returns each skill once", () => {
    const skills = extractSkills("python Python PYTHON python3");
    assert.deepEqual(skills, ["Python"]);
  });
});

describe("normalizeSkillList", () => {
  it("maps aliases to canonical names and keeps unknown terms", () => {
    assert.deepEqual(normalizeSkillList("reactjs, postgres, Elixir\nreact"), ["React", "PostgreSQL", "Elixir"]);
  });
});
