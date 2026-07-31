import { Link } from "@tanstack/react-router";
import { GraduationCap, LogOut, LayoutDashboard } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useAuth";

export function SiteHeader() {
  const { data: profile, user } = useProfile();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="surface-ai flex size-9 items-center justify-center rounded-xl">
            <GraduationCap className="size-5 text-primary-foreground" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">InternHub</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link to="/internships" className="transition-colors hover:text-foreground">
            Browse internships
          </Link>
          <a href="/#how-it-works" className="transition-colors hover:text-foreground">
            How it works
          </a>
          <a href="/#for-recruiters" className="transition-colors hover:text-foreground">
            For recruiters
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="secondary" size="sm">
                <Link to="/dashboard">
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/profile">{profile?.role === "recruiter" ? "Company" : "Profile"}</Link>
              </Button>

              <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sign out">
                <LogOut className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth" search={{ mode: "login" }}>
                  Sign in
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Get started
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
