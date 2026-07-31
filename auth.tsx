import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { GraduationCap, Building2, ArrowLeft, MailCheck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  mode: z.enum(["login", "signup"]).catch("login"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — InternHub" },
      {
        name: "description",
        content:
          "Sign in or create your InternHub account as a student or recruiter. Email verification keeps every account genuine.",
      },
      { property: "og:title", content: "Sign in — InternHub" },
      {
        property: "og:description",
        content: "Create your InternHub student or recruiter account with verified email sign-up.",
      },
    ],
  }),
  component: AuthPage,
});

const credentialsSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

const signupSchema = credentialsSchema.extend({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
});

type Role = "student" | "recruiter";

/** Lightweight human check — a small arithmetic challenge, no third-party script. */
function useCaptcha() {
  const [challenge, setChallenge] = useState({ a: 0, b: 0 });
  const [answer, setAnswer] = useState("");

  const refresh = () =>
    setChallenge({ a: 2 + Math.floor(Math.random() * 8), b: 2 + Math.floor(Math.random() * 8) });

  useEffect(refresh, []);

  return {
    challenge,
    answer,
    setAnswer,
    refresh,
    isValid: Number(answer) === challenge.a + challenge.b,
  };
}

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const [role, setRole] = useState<Role>("student");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const captcha = useCaptcha();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, navigate]);

  const isSignup = mode === "signup";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!captcha.isValid) {
      toast.error("Please solve the human check correctly.");
      return;
    }

    const parsed = isSignup
      ? signupSchema.safeParse({ email, password, fullName })
      : credentialsSchema.safeParse({ email, password });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details.");
      return;
    }

    setBusy(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName, role },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setAwaitingConfirm(true);
          return;
        }
        toast.success("Account created.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
      }
    } catch (error) {
      captcha.refresh();
      captcha.setAnswer("");
      toast.error(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    const parsed = z.string().email().safeParse(email.trim());
    if (!parsed.success) {
      toast.error("Enter your email first, then request a reset link.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent — check your inbox.");
  }

  if (awaitingConfirm) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <Card className="w-full max-w-md border-border/70 shadow-card">
          <CardContent className="p-8 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-ai-soft">
              <MailCheck className="size-6 text-ai" />
            </span>
            <h1 className="mt-5 text-xl font-semibold">Confirm your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a verification link to <span className="font-medium">{email}</span>. Click it
              to activate your account, then come back and sign in.
            </p>
            <Button
              className="mt-6 w-full"
              variant="secondary"
              onClick={() => {
                setAwaitingConfirm(false);
                navigate({ to: "/auth", search: { mode: "login" } });
              }}
            >
              Back to sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <div className="mx-auto w-full max-w-md flex-1 px-4 py-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to InternHub
        </Link>

        <Card className="mt-6 border-border/70 shadow-card">
          <CardHeader>
            <CardTitle className="text-xl">
              {isSignup ? "Create your account" : "Sign in"}
            </CardTitle>
            <CardDescription>
              {isSignup
                ? "Verified email sign-up for students and recruiters."
                : "Welcome back to your internship dashboard."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={mode}
              onValueChange={(value) =>
                navigate({ to: "/auth", search: { mode: value as "login" | "signup" } })
              }
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {isSignup && (
                <>
                  <div className="space-y-2">
                    <Label>I am a</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {(
                        [
                          { value: "student", label: "Student", icon: GraduationCap },
                          { value: "recruiter", label: "Recruiter", icon: Building2 },
                        ] as const
                      ).map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setRole(option.value)}
                          className={cn(
                            "flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-colors",
                            role === option.value
                              ? "border-primary bg-primary-soft"
                              : "border-border hover:bg-muted",
                          )}
                        >
                          <option.icon className="size-4 text-primary" />
                          <span className="text-sm font-medium">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      maxLength={120}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Aarav Sharma"
                      autoComplete="name"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  maxLength={255}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@college.edu"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  maxLength={72}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                />
              </div>

              <div className="space-y-2 rounded-xl border border-border bg-muted/50 p-3">
                <Label htmlFor="captcha" className="flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="size-3.5 text-ai" />
                  Human check: what is {captcha.challenge.a} + {captcha.challenge.b}?
                </Label>
                <Input
                  id="captcha"
                  inputMode="numeric"
                  value={captcha.answer}
                  maxLength={3}
                  onChange={(event) => captcha.setAnswer(event.target.value)}
                  placeholder="Answer"
                />
              </div>

              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
              </Button>
            </form>

            {!isSignup && (
              <button
                type="button"
                onClick={resetPassword}
                className="mt-4 w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                Forgot your password?
              </button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
