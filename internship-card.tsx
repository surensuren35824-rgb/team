import { Link } from "@tanstack/react-router";
import { Building2, MapPin, Clock, IndianRupee, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MatchMeter } from "@/components/match-meter";

export type InternshipListItem = {
  id: string;
  title: string;
  location: string | null;
  work_mode: string;
  stipend_min: number | null;
  stipend_max: number | null;
  duration_months: number | null;
  required_skills: string[];
  deadline: string | null;
  companies?: { name: string; logo_url: string | null; verified: boolean } | null;
};

function stipendLabel(item: InternshipListItem) {
  if (!item.stipend_min && !item.stipend_max) return "Unpaid / not disclosed";
  if (item.stipend_min && item.stipend_max)
    return `${item.stipend_min.toLocaleString()} – ${item.stipend_max.toLocaleString()} /mo`;
  return `${(item.stipend_min ?? item.stipend_max)!.toLocaleString()} /mo`;
}

export function InternshipCard({
  item,
  match,
}: {
  item: InternshipListItem;
  match?: { score: number; missing: string[] } | null;
}) {
  return (
    <Card className="group h-full border-border/70 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift">
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Building2 className="size-3.5" />
              <span className="truncate">{item.companies?.name ?? "Company"}</span>
              {item.companies?.verified && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                  Verified
                </Badge>
              )}
            </div>
            <Link
              to="/internships/$id"
              params={{ id: item.id }}
              className="mt-1 block font-display text-base font-semibold leading-snug transition-colors group-hover:text-primary"
            >
              {item.title}
            </Link>
          </div>
          {match ? <MatchMeter score={match.score} /> : null}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" />
            {item.work_mode === "remote" ? "Remote" : (item.location ?? "—")}
          </span>
          {item.duration_months ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              {item.duration_months} months
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <IndianRupee className="size-3.5" />
            {stipendLabel(item)}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {item.required_skills.slice(0, 5).map((skill) => (
            <Badge key={skill} variant="outline" className="font-normal capitalize">
              {skill}
            </Badge>
          ))}
          {item.required_skills.length > 5 && (
            <Badge variant="outline" className="font-normal">
              +{item.required_skills.length - 5}
            </Badge>
          )}
        </div>

        {match && match.missing.length > 0 ? (
          <p className="mt-auto inline-flex items-start gap-1.5 rounded-lg bg-ai-soft px-2.5 py-2 text-xs text-secondary-foreground">
            <Sparkles className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Close the gap: <span className="capitalize">{match.missing.slice(0, 3).join(", ")}</span>
            </span>
          </p>
        ) : (
          <span className="mt-auto" />
        )}
      </CardContent>
    </Card>
  );
}
