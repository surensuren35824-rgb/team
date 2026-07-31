import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useAuth";
import { parseSkillInput } from "@/lib/matching";

export const Route = createFileRoute("/_authenticated/internships/new")({
  head: () => ({
    meta: [
      { title: "Post an internship — InternHub" },
      {
        name: "description",
        content:
          "Publish an internship on InternHub with required skills, stipend and eligibility so applicants arrive pre-ranked.",
      },
      { property: "og:title", content: "Post an internship — InternHub" },
      {
        property: "og:description",
        content: "Define required skills once and receive AI-ranked student applicants.",
      },
    ],
  }),
  component: NewInternship,
});

const schema = z.object({
  title: z.string().trim().min(4, "Enter a role title").max(160),
  description: z.string().trim().min(30, "Describe the role in at least 30 characters").max(6000),
  responsibilities: z.string().trim().max(3000).optional(),
  location: z.string().trim().max(120).optional(),
  work_mode: z.enum(["remote", "hybrid", "onsite"]),
  duration_months: z.number().int().min(1).max(24).nullable(),
  stipend_min: z.number().min(0).max(10000000).nullable(),
  stipend_max: z.number().min(0).max(10000000).nullable(),
  openings: z.number().int().min(1).max(500),
  min_cgpa: z.number().min(0).max(10).nullable(),
  deadline: z.string().max(20).optional(),
});

function NewInternship() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    responsibilities: "",
    location: "",
    work_mode: "remote",
    duration_months: "3",
    stipend_min: "",
    stipend_max: "",
    openings: "1",
    min_cgpa: "",
    deadline: "",
    required_skills: "",
    preferred_skills: "",
  });

  const { data: company, isLoading } = useQuery({
    queryKey: ["my-company", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .eq("owner_id", profile!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value })),
  });

  async function submit(status: "draft" | "published") {
    if (!profile || !company) return;
    const required = parseSkillInput(form.required_skills);
    if (required.length === 0) {
      toast.error("Add at least one required skill so matching can work.");
      return;
    }
    const parsed = schema.safeParse({
      title: form.title,
      description: form.description,
      responsibilities: form.responsibilities,
      location: form.location,
      work_mode: form.work_mode,
      duration_months: form.duration_months ? Number(form.duration_months) : null,
      stipend_min: form.stipend_min ? Number(form.stipend_min) : null,
      stipend_max: form.stipend_max ? Number(form.stipend_max) : null,
      openings: form.openings ? Number(form.openings) : 1,
      min_cgpa: form.min_cgpa ? Number(form.min_cgpa) : null,
      deadline: form.deadline,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }

    setBusy(true);
    const { data, error } = await supabase
      .from("internships")
      .insert({
        company_id: company.id,
        posted_by: profile.id,
        title: parsed.data.title,
        description: parsed.data.description,
        responsibilities: parsed.data.responsibilities || null,
        location: parsed.data.location || null,
        work_mode: parsed.data.work_mode,
        duration_months: parsed.data.duration_months,
        stipend_min: parsed.data.stipend_min,
        stipend_max: parsed.data.stipend_max,
        openings: parsed.data.openings,
        min_cgpa: parsed.data.min_cgpa,
        deadline: parsed.data.deadline || null,
        required_skills: required,
        preferred_skills: parseSkillInput(form.preferred_skills),
        status,
      })
      .select("id")
      .single();
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "published" ? "Internship published." : "Draft saved.");
    navigate({ to: "/internships/$id/applicants", params: { id: data.id } });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <p className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="text-xl font-semibold">Add your company first</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Internships are posted under a company profile.
          </p>
          <Button className="mt-6" onClick={() => navigate({ to: "/profile" })}>
            Add company details
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold sm:text-3xl">Post an internship</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Posting as {company.name}.</p>

        <Card className="mt-6 border-border/70 shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Role</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                maxLength={160}
                placeholder="Frontend Engineering Intern"
                {...field("title")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={6} maxLength={6000} {...field("description")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="responsibilities">Responsibilities</Label>
              <Textarea
                id="responsibilities"
                rows={4}
                maxLength={3000}
                {...field("responsibilities")}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-5 border-border/70 shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Skills & eligibility</CardTitle>
            <CardDescription>
              Comma separated. Required skills drive applicant ranking.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="required_skills">Required skills</Label>
              <Input
                id="required_skills"
                maxLength={600}
                placeholder="react, typescript, rest apis"
                {...field("required_skills")}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="preferred_skills">Preferred skills</Label>
              <Input
                id="preferred_skills"
                maxLength={600}
                placeholder="docker, graphql"
                {...field("preferred_skills")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_cgpa">Minimum CGPA</Label>
              <Input id="min_cgpa" inputMode="decimal" maxLength={5} {...field("min_cgpa")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="openings">Openings</Label>
              <Input id="openings" inputMode="numeric" maxLength={3} {...field("openings")} />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-5 border-border/70 shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Logistics</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Work mode</Label>
              <Select
                value={form.work_mode}
                onValueChange={(value) => setForm((prev) => ({ ...prev, work_mode: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" maxLength={120} {...field("location")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration_months">Duration (months)</Label>
              <Input
                id="duration_months"
                inputMode="numeric"
                maxLength={2}
                {...field("duration_months")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Application deadline</Label>
              <Input id="deadline" type="date" {...field("deadline")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stipend_min">Stipend min /mo</Label>
              <Input id="stipend_min" inputMode="numeric" maxLength={8} {...field("stipend_min")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stipend_max">Stipend max /mo</Label>
              <Input id="stipend_max" inputMode="numeric" maxLength={8} {...field("stipend_max")} />
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => submit("published")} disabled={busy}>
            {busy ? "Saving…" : "Publish internship"}
          </Button>
          <Button variant="outline" onClick={() => submit("draft")} disabled={busy}>
            Save as draft
          </Button>
        </div>
      </main>
    </div>
  );
}
