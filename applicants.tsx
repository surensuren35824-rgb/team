import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, GraduationCap, Mail } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";
import { MatchMeter } from "@/components/match-meter";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/internships/$id/applicants")({
  head: () => ({
    meta: [
      { title: "Applicants — InternHub" },
      {
        name: "description",
        content:
          "Review AI-ranked applicants for your internship, with matched skills, gaps and one-click status changes.",
      },
      { property: "og:title", content: "Applicants — InternHub" },
      {
        property: "og:description",
        content: "AI-ranked student applicants with matched skills and pipeline status controls.",
      },
    ],
  }),
  component: Applicants,
});

const statuses = ["applied", "shortlisted", "interview", "offered", "rejected"] as const;

function Applicants() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();

  const { data: internship } = useQuery({
    queryKey: ["internship", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internships")
        .select("id, title, status, required_skills")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: applications, isLoading } = useQuery({
    queryKey: ["applicants", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(
          "id, status, match_score, matched_skills, missing_skills, cover_note, created_at, student_id",
        )
        .eq("internship_id", id)
        .order("match_score", { ascending: false });
      if (error) throw error;
      const rows = data ?? [];
      if (rows.length === 0) return [];

      const { data: students, error: studentError } = await supabase
        .from("profiles")
        .select("id, full_name, email, college, branch, cgpa, skills, linkedin_url, github_url")
        .in(
          "id",
          rows.map((row) => row.student_id),
        );
      if (studentError) throw studentError;

      const byId = new Map((students ?? []).map((student) => [student.id, student]));
      return rows.map((row) => ({ ...row, profiles: byId.get(row.student_id) ?? null }));
    },
  });



  async function updateStatus(applicationId: string, status: string) {
    const { error } = await supabase
      .from("applications")
      .update({ status: status as (typeof statuses)[number] })
      .eq("id", applicationId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Status updated.");
    queryClient.invalidateQueries({ queryKey: ["applicants", id] });
    queryClient.invalidateQueries({ queryKey: ["my-internships"] });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Dashboard
        </Link>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold sm:text-3xl">
              {internship?.title ?? "Applicants"}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {applications?.length ?? 0} applicants, ranked by AI match score.
            </p>
          </div>
          {internship?.status ? <Badge variant="secondary">{internship.status}</Badge> : null}
        </div>

        {isLoading ? (
          <div className="mt-8 space-y-4">
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </div>
        ) : (applications ?? []).length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            No applications yet. Share the listing with placement cells to get started.
          </p>
        ) : (
          <div className="mt-8 space-y-4">
            {(applications ?? []).map((row) => (
              <Card key={row.id} className="border-border/70 shadow-card">
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-display text-base font-semibold">
                        {row.profiles?.full_name ?? "Student"}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <GraduationCap className="size-3.5" />
                          {row.profiles?.college ?? "—"}
                          {row.profiles?.branch ? ` · ${row.profiles.branch}` : ""}
                        </span>
                        {row.profiles?.cgpa != null && <span>CGPA {row.profiles.cgpa}</span>}
                        {row.profiles?.email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="size-3.5" />
                            {row.profiles.email}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {row.match_score != null ? <MatchMeter score={row.match_score} /> : null}
                      <Select
                        value={row.status}
                        onValueChange={(value) => updateStatus(row.id, value)}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((status) => (
                            <SelectItem key={status} value={status} className="capitalize">
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {row.matched_skills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {row.matched_skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="gap-1 font-normal capitalize"
                        >
                          <CheckCircle2 className="size-3" />
                          {skill}
                        </Badge>
                      ))}
                      {row.missing_skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="font-normal capitalize text-muted-foreground"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {row.cover_note ? (
                    <p className="mt-4 rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                      {row.cover_note}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-3 text-xs">
                    {row.profiles?.linkedin_url && (
                      <a
                        href={row.profiles.linkedin_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        LinkedIn
                      </a>
                    )}
                    {row.profiles?.github_url && (
                      <a
                        href={row.profiles.github_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        GitHub
                      </a>
                    )}
                    <span className="text-muted-foreground">
                      Applied {new Date(row.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Button asChild variant="outline" className="mt-8">
          <Link to="/internships/$id" params={{ id }}>
            View public listing
          </Link>
        </Button>
      </main>
    </div>
  );
}
