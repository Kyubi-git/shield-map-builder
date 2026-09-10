import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Official Sign In — HazardShield GIS" },
      {
        name: "description",
        content:
          "Secure sign in for disaster management officials using the HazardShield GIS relocation decision-support dashboard.",
      },
      { property: "og:title", content: "Official Sign In — HazardShield GIS" },
      {
        property: "og:description",
        content: "Secure sign in for disaster management officials using HazardShield GIS.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/" });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created. You can sign in now.");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-5 flex items-center gap-3 border-b border-border pb-4">
          <div className="grid size-9 place-items-center rounded-sm border border-border bg-secondary text-gis">
            <ShieldAlert className="size-6" />
          </div>
          <div>
            <h1 className="font-display text-base font-semibold uppercase tracking-wider">HazardShield GIS</h1>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Decision Support System</p>
          </div>
        </div>

        <div className="rounded border border-border bg-card p-5">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Register</TabsTrigger>
            </TabsList>

            {(["signin", "signup"] as const).map((tab) => (
              <TabsContent key={tab} value={tab}>
                <form
                  className="space-y-3 pt-2"
                  onSubmit={tab === "signin" ? handleSignIn : handleSignUp}
                >
                  <div>
                    <Label htmlFor={`${tab}-email`}>Official email</Label>
                    <Input
                      id={`${tab}-email`}
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${tab}-password`}>Password</Label>
                    <Input
                      id={`${tab}-password`}
                      type="password"
                      autoComplete={tab === "signin" ? "current-password" : "new-password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? "Please wait…" : tab === "signin" ? "Sign in" : "Create account"}
                  </Button>
                </form>
              </TabsContent>
            ))}
          </Tabs>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Decision-support outputs only — not a guaranteed prediction of hazard events.
        </p>
      </div>
    </main>
  );
}
