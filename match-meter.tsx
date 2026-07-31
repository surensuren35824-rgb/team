import { cn } from "@/lib/utils";
import { scoreTone } from "@/lib/matching";

export function MatchMeter({
  score,
  size = "md",
  label = "AI match",
}: {
  score: number;
  size?: "sm" | "md";
  label?: string;
}) {
  const tone = scoreTone(score);
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center rounded-xl border px-2.5 py-1.5 text-center",
        tone === "strong" && "border-success/40 bg-success/10 text-success",
        tone === "good" && "border-ai/40 bg-ai-soft text-secondary-foreground",
        tone === "weak" && "border-border bg-muted text-muted-foreground",
      )}
      title={`${label}: ${score}%`}
    >
      <span className={cn("font-display font-semibold leading-none", size === "md" ? "text-lg" : "text-sm")}>
        {score}%
      </span>
      <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide opacity-80">
        {label}
      </span>
    </div>
  );
}
