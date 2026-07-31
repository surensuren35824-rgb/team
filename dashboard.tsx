import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Briefcase, PlusCircle, Sparkles, Users2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";
import { InternshipCard, type InternshipListItem } from "@/components/internship-card";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, type Profile } from "@/hooks/useAuth";
import { profileCompletion, scoreMatch } from "@/lib/matching";
import { getSkillGapPlan, type SkillGapPlan } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — InternHub" },
      {
        name: "description",
        content:
          "Your InternHub dashboard: ranked internship recommendations, application tracking and AI skill-gap guidance.",
      },
      { property: "og:title", content: "Dashboard — InternHub" },
      {
        property: "og:description",
        content: "Track applications, see ranked recommendations and close your skill gaps.",
      },
    ],
  }),
  component: Dashboard,
});

const statusTone: Record<string, string> = {
  applied: "bg-muted text-muted-foreground",
  shortlisted: "bg-ai-soft text-secondary-foreground",
  interview: "bg-primary-soft text-primary",
  offered: "bg-success/15 text-success",
  rejected: "bg-destructive/10 text-destructive",
  withdrawn: "bg-muted text-muted-foreground",
};

function Dashboard() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-10">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        {profile.role === "recruiter" ? (
          <RecruiterDashboard profile={profile} />
        ) : (
          <StudentDashboard profile={profile} />
        )}
      </main>
    </div>
  );
}

function StudentDashboard({ profile }: { profile: Profile }) {
  const completion = profileCompletion(profile);
  const [plan, setPlan] = useState<SkillGapPlan | null>(null);
  const [planBusy, setPlanBusy] = useState(false);
  const fetchPlan = useServerFn(getSkillGapPlan);

  const { data: internships } = useQuery({
    queryKey: ["internships", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internships")
        .select(
          "id, title, description, required_skills, preferred_skills, location, work_mode, stipend_min, stipend_max, duration_months, deadline, min_cgpa, companies ( name, logo_url, verified )",
        )
        .eq("status", "published")
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: applications } = useQuery({
    queryKey: ["my-applications", profile.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, status, match_score, created_at, internships ( id, title, companies ( name ) )")
        .eq("student_id", profile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const ranked = useMemo(() => {
    return (internships ?? [])
      .map((item) => ({ item, match: scoreMatch(profile, item) }))
      .sort((a, b) => b.match.score - a.match.score);
  }, [internships, profile]);

  const topGaps = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of ranked.slice(0, 12)) {
      for (const skill of row.match.missing) counts.set(skill, (counts.get(skill) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([skill]) => skill);
  }, [ranked]);

  async function generatePlan() {
    setPlanBusy(true);
    try {
      const result = await fetchPlan({
        data: {
          careerGoal: profile.career_goal ?? "",
          branch: profile.branch ?? "",
          skills: profile.skills ?? [],
          missingSkills: topGaps.slice(0, 8),
          targetRoles: ranked.slice(0, 5).map((row) => row.item.title),
        },
      });
      setPlan(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate your plan.");
    } finally {
      setPlanBusy(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            Hello{profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {ranked.length} open internships ranked against your profile.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/profile">Edit profile</Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Card className="border-border/70 shadow-card">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Profile strength
            </p>
            <p className="mt-2 font-display text-3xl font-semibold">{completion}%</p>
            <Progress value={completion} className="mt-3" />
            <p className="mt-3 text-xs text-muted-foreground">
              {completion < 80
                ? "Add your skills, CGPA and resume text to sharpen every match score."
                : "Your profile is strong — matching is running at full accuracy."}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Applications
            </p>
            <p className="mt-2 font-display text-3xl font-semibold">{applications?.length ?? 0}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              {applications?.filter((row) => row.status === "shortlisted").length ?? 0} shortlisted ·{" "}
              {applications?.filter((row) => row.status === "interview").length ?? 0} interviewing
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Best match
            </p>
            <p className="mt-2 font-display text-3xl font-semibold">
              {ranked[0]?.match.score ?? 0}%
            </p>
            <p className="mt-3 truncate text-xs text-muted-foreground">
              {ranked[0]?.item.title ?? "No open roles yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recommended for you</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/internships">See all</Link>
          </Button>
        </div>
        {ranked.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No published internships yet — check back soon.
          </p>
        ) : (
          <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {ranked.slice(0, 6).map(({ item, match }) => (
              <InternshipCard
                key={item.id}
                item={item as InternshipListItem}
                match={{ score: match.score, missing: match.missing }}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card className="border-border/70 shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Your applications</CardTitle>
            <CardDescription>Live status straight from recruiters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(applications ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You haven't applied anywhere yet. Start with your top match above.
              </p>
            ) : (
              (applications ?? []).map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{row.internships?.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {row.internships?.companies?.name} ·{" "}
                      {new Date(row.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusTone[row.status] ?? statusTone["applied"]}`}
                  >
                    {row.status}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-ai/30 bg-ai-soft/40 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-ai" />
              AI skill-gap plan
            </CardTitle>
            <CardDescription>
              {topGaps.length
                ? `Most requested skills you're missing: ${topGaps.slice(0, 4).join(", ")}`
                : "Add more skills to your profile to detect gaps."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {plan ? (
              <div className="space-y-4 text-sm">
                <p className="text-muted-foreground">{plan.summary}</p>
                <div className="space-y-3">
                  {plan.priorities.map((item) => (
                    <div key={item.skill} className="rounded-xl border border-border bg-card p-3">
                      <p className="text-sm font-semibold capitalize">{item.skill}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.why}</p>
                      <p className="mt-1.5 text-xs font-medium text-primary">{item.resource}</p>
                    </div>
                  ))}
                </div>
                {plan.certifications.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {plan.certifications.map((cert) => (
                      <Badge key={cert} variant="secondary" className="font-normal">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Generate a prioritised plan with courses to close the gaps blocking your top
                matches.
              </p>
            )}
            <Button className="mt-4 w-full" onClick={generatePlan} disabled={planBusy}>
              {planBusy ? "Thinking…" : plan ? "Regenerate plan" : "Generate my plan"}
            </Button>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function RecruiterDashboard({ profile }: { profile: Profile }) {
  const { data: company } = useQuery({
    queryKey: ["my-company", profile.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("owner_id", profile.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: internships } = useQuery({
    queryKey: ["my-internships", profile.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internships")
        .select("id, title, status, work_mode, location, created_at, applications ( id, status )")
        .eq("posted_by", profile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const totalApplicants = (internships ?? []).reduce(
    (acc, row) => acc + (row.applications?.length ?? 0),
    0,
  );

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            {company?.name ?? "Your recruiter workspace"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {company
              ? "Post roles and review AI-ranked applicants."
              : "Add your company details to start posting internships."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/profile">{company ? "Company settings" : "Add company"}</Link>
          </Button>
          <Button asChild disabled={!company}>
            <Link to="/internships/new">
              <PlusCircle className="size-4" />
              Post internship
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        <Card className="border-border/70 shadow-card">
          <CardContent className="p-5">
            <Briefcase className="size-5 text-primary" />
            <p className="mt-3 font-display text-3xl font-semibold">{internships?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground">Internships posted</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-card">
          <CardContent className="p-5">
            <Users2 className="size-5 text-ai" />
            <p className="mt-3 font-display text-3xl font-semibold">{totalApplicants}</p>
            <p className="text-xs text-muted-foreground">Total applicants</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-card">
          <CardContent className="p-5">
            <Sparkles className="size-5 text-success" />
            <p className="mt-3 font-display text-3xl font-semibold">
              {(internships ?? []).reduce(
                (acc, row) =>
                  acc + (row.applications ?? []).filter((a) => a.status === "shortlisted").length,
                0,
              )}
            </p>
            <p className="text-xs text-muted-foreground">Shortlisted</p>
          </CardContent>
        </Card>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Your internships</h2>
        {(internships ?? []).length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No internships posted yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {(internships ?? []).map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-4 shadow-card"
              >
                <div>
                  <p className="font-medium">{row.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {row.work_mode === "remote" ? "Remote" : row.location} ·{" "}
                    {row.applications?.length ?? 0} applicants
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={row.status === "published" ? "secondary" : "outline"}>
                    {row.status}
                  </Badge>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/internships/$id/applicants" params={{ id: row.id }}>
                      Review applicants
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
