/**
 * Client-safe AI matching utilities.
 *
 * Scoring is a hybrid content-based model: weighted skill overlap (cosine
 * similarity over a bag-of-skills vector), plus academic eligibility,
 * location fit, resume keyword evidence and career-goal alignment.
 */

export type MatchProfileInput = {
  skills?: string[] | null;
  certifications?: string[] | null;
  resume_text?: string | null;
  cgpa?: number | null;
  preferred_location?: string | null;
  career_goal?: string | null;
  branch?: string | null;
};

export type MatchInternshipInput = {
  title: string;
  description?: string | null;
  required_skills?: string[] | null;
  preferred_skills?: string[] | null;
  location?: string | null;
  work_mode?: string | null;
  min_cgpa?: number | null;
};

export type MatchResult = {
  score: number;
  skillScore: number;
  matched: string[];
  missing: string[];
  reasons: string[];
  eligible: boolean;
};

const norm = (value: string) => value.trim().toLowerCase().replace(/[\s_]+/g, " ");

export function normalizeSkills(list?: string[] | null): string[] {
  if (!list) return [];
  const seen = new Set<string>();
  for (const item of list) {
    const value = norm(item ?? "");
    if (value) seen.add(value);
  }
  return [...seen];
}

export function parseSkillInput(raw: string): string[] {
  return normalizeSkills(raw.split(/[,\n;]/));
}

/** Cosine similarity between two bag-of-skills sets. */
function cosine(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b);
  const dot = a.reduce((acc, skill) => acc + (setB.has(skill) ? 1 : 0), 0);
  return dot / Math.sqrt(a.length * b.length);
}

export function scoreMatch(
  profile: MatchProfileInput,
  internship: MatchInternshipInput,
): MatchResult {
  const studentSkills = normalizeSkills([
    ...(profile.skills ?? []),
    ...(profile.certifications ?? []),
  ]);
  const required = normalizeSkills(internship.required_skills);
  const preferred = normalizeSkills(internship.preferred_skills);
  const resume = (profile.resume_text ?? "").toLowerCase();

  const studentSet = new Set(studentSkills);
  const hasSkill = (skill: string) => studentSet.has(skill) || (!!resume && resume.includes(skill));

  const matched = required.filter(hasSkill);
  const missing = required.filter((skill) => !hasSkill(skill));
  const matchedPreferred = preferred.filter(hasSkill);

  const coverage = required.length ? matched.length / required.length : 0.6;
  const similarity = cosine(studentSkills, [...required, ...preferred]);
  const skillScore = Math.round((coverage * 0.75 + similarity * 0.25) * 100);

  const reasons: string[] = [];
  let score = skillScore * 0.68;

  if (matchedPreferred.length) {
    score += Math.min(matchedPreferred.length * 3, 9);
    reasons.push(`Bonus skills: ${matchedPreferred.slice(0, 3).join(", ")}`);
  }

  const minCgpa = internship.min_cgpa ?? null;
  const cgpa = profile.cgpa ?? null;
  const eligible = minCgpa === null || cgpa === null || cgpa >= minCgpa;
  if (minCgpa !== null && cgpa !== null) {
    if (cgpa >= minCgpa) {
      score += 8;
      reasons.push(`CGPA ${cgpa} meets the ${minCgpa} cut-off`);
    } else {
      score -= 18;
      reasons.push(`CGPA ${cgpa} is below the ${minCgpa} cut-off`);
    }
  }

  const preferredLocation = norm(profile.preferred_location ?? "");
  const jobLocation = norm(internship.location ?? "");
  if (internship.work_mode === "remote") {
    score += 5;
    reasons.push("Remote role — works from anywhere");
  } else if (preferredLocation && jobLocation && jobLocation.includes(preferredLocation)) {
    score += 7;
    reasons.push(`Located in your preferred city (${internship.location})`);
  }

  const goal = norm(profile.career_goal ?? "");
  const haystack = `${internship.title} ${internship.description ?? ""}`.toLowerCase();
  if (goal) {
    const goalHit = goal.split(" ").filter((word) => word.length > 3 && haystack.includes(word));
    if (goalHit.length) {
      score += 6;
      reasons.push("Aligned with your stated career goal");
    }
  }

  if (resume && matched.length) {
    reasons.unshift(`Resume evidence for ${matched.slice(0, 3).join(", ")}`);
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    skillScore,
    matched,
    missing,
    reasons,
    eligible,
  };
}

export function profileCompletion(profile: Record<string, unknown> | null | undefined): number {
  if (!profile) return 0;
  const fields = [
    "full_name",
    "branch",
    "college",
    "cgpa",
    "graduation_year",
    "headline",
    "career_goal",
    "preferred_location",
    "resume_text",
    "linkedin_url",
  ];
  let filled = fields.reduce((acc, key) => {
    const value = profile[key];
    return acc + (value !== null && value !== undefined && `${value}`.trim() !== "" ? 1 : 0);
  }, 0);
  const skills = profile["skills"];
  if (Array.isArray(skills) && skills.length >= 3) filled += 2;
  const certs = profile["certifications"];
  if (Array.isArray(certs) && certs.length >= 1) filled += 1;
  return Math.round((filled / (fields.length + 3)) * 100);
}

export function scoreTone(score: number): "strong" | "good" | "weak" {
  if (score >= 75) return "strong";
  if (score >= 50) return "good";
  return "weak";
}
