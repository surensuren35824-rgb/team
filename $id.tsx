import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bookmark,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  IndianRupee,
  MapPin,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";
import { MatchMeter } from "@/components/match-meter";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useAuth";
import { scoreMatch } from "@/lib/matching";

export const Route = createFileRoute("/internships/$id")({
  head: () => ({
    meta: [
      { title: "Internship details — InternHub" },
      {
        name: "description",
        content:
          "Full internship details with required skills, stipend, eligibility and your personalised AI match score.",
      },
      { property: "og:title", content: "Internship details — InternHub" },
      {
        property: "og:description",
        content: "See required skills, stipend, eligibility and your AI match score for this role.",
      },
    ],
  }),
  component: InternshipDetail,
});

const coverNoteSchema = z.string().trim().max(1200, "Keep your note under 1200 characters");

function InternshipDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile, user } = useProfile();
  const [coverNote, setCoverNote] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: internship, isLoading } = useQuery({
    queryKey: ["internship", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internships")
        .select("*, companies ( name, logo_url, verified, website, industry, location )")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: application } = useQuery({
    queryKey: ["application", id, user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, status, match_score")
        .eq("internship_id", id)
        .eq("student_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const match = profile && internship ? scoreMatch(profile, internship) : null;
  const isStudent = profile?.role === "student";

  async function apply() {
    if (!user) {
      navigate({ to: "/auth", search: { mode: "login" } });
      return;
    }
    const parsed = coverNoteSchema.safeParse(coverNote);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("applications").insert({
      internship_id: id,
      student_id: user.id,
      cover_note: parsed.data || null,
      match_score: match?.score ?? null,
      matched_skills: match?.matched ?? [],
      missing_skills: match?.missing ?? [],
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Application submitted.");
    queryClient.invalidateQueries({ queryKey: ["application", id, user.id] });
    queryClient.invalidateQueries({ queryKey: ["my-applications"] });
  }

  async function save() {
    if (!user) {
      navigate({ to: "/auth", search: { mode: "login" } });
      return;
    }
    const { error } = await supabase
      .from("saved_internships")
      .insert({ internship_id: id, student_id: user.id });
    if (error) toast.error(error.message);
    else toast.success("Saved for later.");
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-5xl px-4 py-10">
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="text-xl font-semibold">This internship is no longer available</h1>
          <Button asChild className="mt-6">
            <Link to="/internships">Browse open internships</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Link
          to="/internships"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All internships
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Building2 className="size-4" />
              {internship.companies?.name}
              {internship.companies?.verified && <Badge variant="secondary">Verified</Badge>}
            </div>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{internship.title}</h1>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" />
                {internship.work_mode === "remote"
                  ? "Remote"
                  : `${internship.location ?? "—"} (${internship.work_mode})`}
              </span>
              {internship.duration_months ? (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4" />
                  {internship.duration_months} months
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <IndianRupee className="size-4" />
                {internship.stipend_min || internship.stipend_max
                  ? `${(internship.stipend_min ?? internship.stipend_max)!.toLocaleString()}${
                      internship.stipend_max && internship.stipend_min
                        ? ` – ${internship.stipend_max.toLocaleString()}`
                        : ""
                    } /mo`
                  : "Not disclosed"}
              </span>
              {internship.deadline ? (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="size-4" />
                  Apply by {new Date(internship.deadline).toLocaleDateString()}
                </span>
              ) : null}
            </div>

            <Card className="mt-6 border-border/70 shadow-card">
              <CardHeader>
                <CardTitle className="text-base">About the role</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 text-sm leading-relaxed text-muted-foreground">
                <p className="whitespace-pre-line">{internship.description}</p>
                {internship.responsibilities ? (
                  <div>
                    <h3 className="mb-1.5 font-semibold text-foreground">Responsibilities</h3>
                    <p className="whitespace-pre-line">{internship.responsibilities}</p>
                  </div>
                ) : null}
                <div>
                  <h3 className="mb-2 font-semibold text-foreground">Required skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {internship.required_skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="font-normal capitalize">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                {internship.preferred_skills.length > 0 && (
                  <div>
                    <h3 className="mb-2 font-semibold text-foreground">Nice to have</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {internship.preferred_skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="font-normal capitalize">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {internship.min_cgpa ? (
                  <p>Minimum CGPA: {internship.min_cgpa}</p>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-5">
            {match ? (
              <Card className="border-border/70 shadow-card">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-semibold">Your AI match</h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Based on your skills, resume, CGPA and goal.
                      </p>
                    </div>
                    <MatchMeter score={match.score} />
                  </div>
                  <ul className="mt-4 space-y-2 text-xs">
                    {match.matched.slice(0, 4).map((skill) => (
                      <li key={skill} className="flex items-center gap-1.5 text-success">
                        <CheckCircle2 className="size-3.5" />
                        <span className="capitalize text-foreground">{skill}</span>
                      </li>
                    ))}
                    {match.missing.slice(0, 4).map((skill) => (
                      <li key={skill} className="flex items-center gap-1.5 text-muted-foreground">
                        <XCircle className="size-3.5" />
                        <span className="capitalize">{skill} — not yet on your profile</span>
                      </li>
                    ))}
                  </ul>
                  {!match.eligible && (
                    <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      Your CGPA is below this role's cut-off.
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : null}

            <Card className="border-border/70 shadow-card">
              <CardContent className="space-y-3 p-5">
                {application ? (
                  <div className="rounded-lg bg-primary-soft px-3 py-3 text-sm">
                    <p className="font-medium">Application submitted</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Current status: <span className="capitalize">{application.status}</span>
                    </p>
                  </div>
                ) : (
                  <>
                    <label htmlFor="note" className="text-sm font-medium">
                      Cover note (optional)
                    </label>
                    <Textarea
                      id="note"
                      value={coverNote}
                      maxLength={1200}
                      rows={5}
                      placeholder="Why you're a strong fit for this internship…"
                      onChange={(event) => setCoverNote(event.target.value)}
                    />
                    <Button className="w-full" onClick={apply} disabled={busy || (!!profile && !isStudent)}>
                      {busy ? "Submitting…" : user ? "Apply now" : "Sign in to apply"}
                    </Button>
                    {profile && !isStudent && (
                      <p className="text-xs text-muted-foreground">
                        Only student accounts can apply to internships.
                      </p>
                    )}
                    <Button variant="outline" className="w-full" onClick={save}>
                      <Bookmark className="size-4" />
                      Save for later
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
