import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useAuth";
import { parseSkillInput, profileCompletion } from "@/lib/matching";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — InternHub" },
      {
        name: "description",
        content:
          "Keep your skills, CGPA, resume summary and company details up to date so InternHub matching stays accurate.",
      },
      { property: "og:title", content: "Your profile — InternHub" },
      {
        property: "og:description",
        content: "Update your skills, academics and resume summary to improve every match score.",
      },
    ],
  }),
  component: ProfilePage,
});

const studentSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  headline: z.string().trim().max(160).optional(),
  college: z.string().trim().max(160).optional(),
  branch: z.string().trim().max(120).optional(),
  cgpa: z.number().min(0).max(10).nullable(),
  graduation_year: z.number().int().min(1990).max(2100).nullable(),
  career_goal: z.string().trim().max(300).optional(),
  preferred_location: z.string().trim().max(120).optional(),
  resume_text: z.string().trim().max(6000).optional(),
  linkedin_url: z.string().trim().url("Enter a valid URL").max(255).or(z.literal("")).optional(),
  github_url: z.string().trim().url("Enter a valid URL").max(255).or(z.literal("")).optional(),
});

const companySchema = z.object({
  name: z.string().trim().min(2, "Enter your company name").max(160),
  industry: z.string().trim().max(120).optional(),
  location: z.string().trim().max(120).optional(),
  website: z.string().trim().url("Enter a valid URL").max(255).or(z.literal("")).optional(),
  description: z.string().trim().max(2000).optional(),
});

function ProfilePage() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold sm:text-3xl">Your profile</h1>
        {profile.role === "recruiter" ? (
          <RecruiterProfile ownerId={profile.id} />
        ) : (
          <StudentProfile />
        )}
      </main>
    </div>
  );
}

function StudentProfile() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    full_name: "",
    headline: "",
    college: "",
    branch: "",
    cgpa: "",
    graduation_year: "",
    career_goal: "",
    preferred_location: "",
    resume_text: "",
    linkedin_url: "",
    github_url: "",
    skills: "",
    certifications: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      headline: profile.headline ?? "",
      college: profile.college ?? "",
      branch: profile.branch ?? "",
      cgpa: profile.cgpa != null ? String(profile.cgpa) : "",
      graduation_year: profile.graduation_year != null ? String(profile.graduation_year) : "",
      career_goal: profile.career_goal ?? "",
      preferred_location: profile.preferred_location ?? "",
      resume_text: profile.resume_text ?? "",
      linkedin_url: profile.linkedin_url ?? "",
      github_url: profile.github_url ?? "",
      skills: (profile.skills ?? []).join(", "),
      certifications: (profile.certifications ?? []).join(", "),
    });
  }, [profile]);

  const completion = profileCompletion({
    ...profile,
    ...form,
    skills: parseSkillInput(form.skills),
    certifications: parseSkillInput(form.certifications),
  });

  async function save() {
    if (!profile) return;
    const parsed = studentSchema.safeParse({
      full_name: form.full_name,
      headline: form.headline,
      college: form.college,
      branch: form.branch,
      cgpa: form.cgpa ? Number(form.cgpa) : null,
      graduation_year: form.graduation_year ? Number(form.graduation_year) : null,
      career_goal: form.career_goal,
      preferred_location: form.preferred_location,
      resume_text: form.resume_text,
      linkedin_url: form.linkedin_url,
      github_url: form.github_url,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }

    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: parsed.data.full_name,
        headline: parsed.data.headline || null,
        college: parsed.data.college || null,
        branch: parsed.data.branch || null,
        cgpa: parsed.data.cgpa,
        graduation_year: parsed.data.graduation_year,
        career_goal: parsed.data.career_goal || null,
        preferred_location: parsed.data.preferred_location || null,
        resume_text: parsed.data.resume_text || null,
        linkedin_url: parsed.data.linkedin_url || null,
        github_url: parsed.data.github_url || null,
        skills: parseSkillInput(form.skills),
        certifications: parseSkillInput(form.certifications),
      })
      .eq("id", profile.id);

    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile saved — your match scores just updated.");
    queryClient.invalidateQueries({ queryKey: ["profile", profile.id] });
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value })),
  });

  return (
    <>
      <Card className="mt-6 border-border/70 shadow-card">
        <CardContent className="p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Profile strength</span>
            <span className="font-display text-lg font-semibold">{completion}%</span>
          </div>
          <Progress value={completion} className="mt-3" />
        </CardContent>
      </Card>

      <Card className="mt-5 border-border/70 shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Academics & identity</CardTitle>
          <CardDescription>Used for eligibility checks and match scoring.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" maxLength={120} {...field("full_name")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              maxLength={160}
              placeholder="Final-year CSE student · Frontend & data"
              {...field("headline")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="college">College</Label>
            <Input id="college" maxLength={160} {...field("college")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch">Branch</Label>
            <Input id="branch" maxLength={120} {...field("branch")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cgpa">CGPA (out of 10)</Label>
            <Input id="cgpa" inputMode="decimal" maxLength={5} {...field("cgpa")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="graduation_year">Graduation year</Label>
            <Input
              id="graduation_year"
              inputMode="numeric"
              maxLength={4}
              {...field("graduation_year")}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-5 border-border/70 shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Skills & goals</CardTitle>
          <CardDescription>Comma separated. These drive your match scores directly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="skills">Skills</Label>
            <Textarea
              id="skills"
              rows={3}
              maxLength={1500}
              placeholder="react, typescript, sql, python"
              {...field("skills")}
            />
            <div className="flex flex-wrap gap-1.5">
              {parseSkillInput(form.skills)
                .slice(0, 14)
                .map((skill) => (
                  <Badge key={skill} variant="outline" className="font-normal capitalize">
                    {skill}
                  </Badge>
                ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="certifications">Certifications</Label>
            <Input
              id="certifications"
              maxLength={600}
              placeholder="aws cloud practitioner, google data analytics"
              {...field("certifications")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="career_goal">Career goal</Label>
            <Input
              id="career_goal"
              maxLength={300}
              placeholder="Frontend engineer at a product company"
              {...field("career_goal")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferred_location">Preferred location</Label>
            <Input id="preferred_location" maxLength={120} {...field("preferred_location")} />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-5 border-border/70 shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Resume summary & links</CardTitle>
          <CardDescription>
            Paste your resume text — matching scans it for evidence of each required skill.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resume_text">Resume text</Label>
            <Textarea id="resume_text" rows={8} maxLength={6000} {...field("resume_text")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn</Label>
              <Input id="linkedin_url" maxLength={255} {...field("linkedin_url")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github_url">GitHub</Label>
              <Input id="github_url" maxLength={255} {...field("github_url")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button className="mt-6 w-full sm:w-auto" onClick={save} disabled={busy}>
        {busy ? "Saving…" : "Save profile"}
      </Button>
    </>
  );
}

function RecruiterProfile({ ownerId }: { ownerId: string }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    industry: "",
    location: "",
    website: "",
    description: "",
  });
  const [busy, setBusy] = useState(false);

  const { data: company } = useQuery({
    queryKey: ["my-company", ownerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("owner_id", ownerId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!company) return;
    setForm({
      name: company.name ?? "",
      industry: company.industry ?? "",
      location: company.location ?? "",
      website: company.website ?? "",
      description: company.description ?? "",
    });
  }, [company]);

  async function save() {
    const parsed = companySchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setBusy(true);
    const payload = {
      name: parsed.data.name,
      industry: parsed.data.industry || null,
      location: parsed.data.location || null,
      description: parsed.data.description || null,
      website: parsed.data.website || null,
      owner_id: ownerId,
    };

    const { error } = company
      ? await supabase.from("companies").update(payload).eq("id", company.id)
      : await supabase.from("companies").insert(payload);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Company details saved.");
    queryClient.invalidateQueries({ queryKey: ["my-company", ownerId] });
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value })),
  });

  return (
    <>
      <Card className="mt-6 border-border/70 shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Company details</CardTitle>
          <CardDescription>Students see this on every internship you post.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Company name</Label>
            <Input id="name" maxLength={160} {...field("name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input id="industry" maxLength={120} {...field("industry")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Headquarters</Label>
            <Input id="location" maxLength={120} {...field("location")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" maxLength={255} placeholder="https://" {...field("website")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">About</Label>
            <Textarea id="description" rows={5} maxLength={2000} {...field("description")} />
          </div>
        </CardContent>
      </Card>
      <Button className="mt-6 w-full sm:w-auto" onClick={save} disabled={busy}>
        {busy ? "Saving…" : company ? "Save company" : "Create company"}
      </Button>
    </>
  );
}
