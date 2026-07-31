import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";
import { InternshipCard, type InternshipListItem } from "@/components/internship-card";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useAuth";
import { scoreMatch } from "@/lib/matching";

export const Route = createFileRoute("/internships/")({
  head: () => ({
    meta: [
      { title: "Browse internships — InternHub" },
      {
        name: "description",
        content:
          "Search open internships by skill, city, work mode and stipend. Signed-in students see an AI match score on every listing.",
      },
      { property: "og:title", content: "Browse internships — InternHub" },
      {
        property: "og:description",
        content: "Filter open internships by skill, city, work mode and stipend on InternHub.",
      },
    ],
  }),
  component: BrowseInternships,
});

export const internshipSelect =
  "id, title, description, required_skills, preferred_skills, location, work_mode, stipend_min, stipend_max, duration_months, deadline, min_cgpa, companies ( name, logo_url, verified )";

function BrowseInternships() {
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("all");
  const [sort, setSort] = useState("match");
  const { data: profile } = useProfile();

  const { data, isLoading } = useQuery({
    queryKey: ["internships", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internships")
        .select(internshipSelect)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = (data ?? [])
      .filter((item) => (mode === "all" ? true : item.work_mode === mode))
      .filter((item) => {
        if (!term) return true;
        const haystack = [
          item.title,
          item.location ?? "",
          item.companies?.name ?? "",
          ...(item.required_skills ?? []),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(term);
      })
      .map((item) => ({
        item,
        match: profile ? scoreMatch(profile, item) : null,
      }));

    if (sort === "match" && profile) {
      rows.sort((a, b) => (b.match?.score ?? 0) - (a.match?.score ?? 0));
    } else if (sort === "stipend") {
      rows.sort((a, b) => (b.item.stipend_max ?? 0) - (a.item.stipend_max ?? 0));
    }
    return rows;
  }, [data, search, mode, sort, profile]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-semibold sm:text-3xl">Open internships</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {profile
            ? "Sorted by how well each role matches your profile."
            : "Sign in as a student to see your AI match score on every listing."}
        </p>

        <div className="mt-6 grid gap-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:grid-cols-[1fr_auto_auto]">
          <div className="space-y-1.5">
            <Label htmlFor="search" className="text-xs">
              Search
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                className="pl-9"
                placeholder="Role, skill, company or city"
                value={search}
                maxLength={120}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Work mode</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modes</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="onsite">On-site</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs">
              <SlidersHorizontal className="size-3.5" />
              Sort
            </Label>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="match">Best match</SelectItem>
                <SelectItem value="recent">Most recent</SelectItem>
                <SelectItem value="stipend">Highest stipend</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((key) => (
              <Skeleton key={key} className="h-52 rounded-xl" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="font-medium">No internships match those filters yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try clearing the search or widening the work mode.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {results.map(({ item, match }) => (
              <InternshipCard
                key={item.id}
                item={item as InternshipListItem}
                match={match ? { score: match.score, missing: match.missing } : null}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
