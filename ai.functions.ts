import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SkillGapInput = z.object({
  careerGoal: z.string().max(300).optional().default(""),
  branch: z.string().max(120).optional().default(""),
  skills: z.array(z.string().max(60)).max(60).default([]),
  missingSkills: z.array(z.string().max(60)).max(60).default([]),
  targetRoles: z.array(z.string().max(120)).max(20).default([]),
});

export type SkillGapPlan = {
  summary: string;
  priorities: { skill: string; why: string; resource: string }[];
  softSkills: string[];
  certifications: string[];
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

export const getSkillGapPlan = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SkillGapInput.parse(input))
  .handler(async ({ data }): Promise<SkillGapPlan> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured yet.");

    const prompt = [
      `Student branch: ${data.branch || "unspecified"}`,
      `Career goal: ${data.careerGoal || "unspecified"}`,
      `Current skills: ${data.skills.join(", ") || "none listed"}`,
      `Skills missing across internships they want: ${data.missingSkills.join(", ") || "none detected"}`,
      `Target internship roles: ${data.targetRoles.join(", ") || "general"}`,
    ].join("\n");

    const response = await fetch(GATEWAY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a university placement mentor. Return a concise, practical skill-gap plan. " +
              "Respond ONLY with JSON matching: " +
              '{"summary": string, "priorities": [{"skill": string, "why": string, "resource": string}], "softSkills": string[], "certifications": string[]}. ' +
              "Include at most 4 priorities, 4 soft skills and 3 certifications. Resources must be well-known free or low-cost courses.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[ai] skill gap failed [${response.status}]: ${body}`);
      if (response.status === 429) throw new Error("AI is busy right now — please retry shortly.");
      if (response.status === 402) throw new Error("AI credits exhausted for this workspace.");
      throw new Error("Could not generate the skill-gap plan.");
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = payload.choices?.[0]?.message?.content ?? "{}";

    let parsed: Partial<SkillGapPlan> = {};
    try {
      parsed = JSON.parse(raw) as Partial<SkillGapPlan>;
    } catch {
      parsed = {};
    }

    return {
      summary: parsed.summary ?? "No summary available.",
      priorities: Array.isArray(parsed.priorities) ? parsed.priorities.slice(0, 4) : [],
      softSkills: Array.isArray(parsed.softSkills) ? parsed.softSkills.slice(0, 4) : [],
      certifications: Array.isArray(parsed.certifications) ? parsed.certifications.slice(0, 3) : [],
    };
  });
