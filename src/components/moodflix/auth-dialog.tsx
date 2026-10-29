"use client";
/**
 * MoodFlix — Auth dialog (login / register).
 *
 * Uses the NextAuth credentials provider (login) and our /api/register
 * endpoint (sign-up). On success it closes the dialog and refreshes the
 * session so the header updates immediately.
 */
import { useState } from "react";
import { signIn } from "next-auth/react";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, UserRound } from "lucide-react";
import { useMoodflix } from "@/lib/store/moodflix-store";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export function AuthDialog() {
  const { authDialogOpen, authMode, closeAuth, openAuth } = useMoodflix();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setEmail("");
    setPassword("");
    setName("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (res?.error) {
        toast.error("Invalid email or password.");
      } else {
        toast.success("Welcome back!");
        closeAuth();
        reset();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.register({ name: name.trim() || undefined, email: email.trim().toLowerCase(), password });
      // Auto sign-in after registration.
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (res?.error) {
        toast.error("Account created — please sign in.");
        openAuth("login");
      } else {
        toast.success("Account created. Welcome to MoodFlix!");
        closeAuth();
        reset();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={authDialogOpen} onOpenChange={(o) => (o ? null : closeAuth())}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 text-black">
            <UserRound className="h-5 w-5" />
          </div>
          <DialogTitle className="text-center text-xl">
            {authMode === "login" ? "Welcome back" : "Create your account"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {authMode === "login"
              ? "Sign in to save your watchlist and watched history."
              : "Free, takes seconds. Your data stays private."}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={authMode} onValueChange={(v) => openAuth(v as "login" | "register")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign in</TabsTrigger>
            <TabsTrigger value="register">Sign up</TabsTrigger>
          </TabsList>

          {/* Login */}
          <TabsContent value="login" className="mt-4">
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-email" type="email" required autoComplete="email"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="pl-9" placeholder="you@example.com"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-password" type="password" required autoComplete="current-password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="pl-9" placeholder="••••••••"
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full gap-1.5 bg-gradient-to-r from-amber-400 to-rose-500 text-black hover:opacity-90 hover:text-black">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Sign in
              </Button>
            </form>
          </TabsContent>

          {/* Register */}
          <TabsContent value="register" className="mt-4">
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="reg-name">Name (optional)</Label>
                <Input
                  id="reg-name" type="text" autoComplete="name"
                  value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reg-email" type="email" required autoComplete="email"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="pl-9" placeholder="you@example.com"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reg-password" type="password" required minLength={6} autoComplete="new-password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="pl-9" placeholder="At least 6 characters"
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full gap-1.5 bg-gradient-to-r from-amber-400 to-rose-500 text-black hover:opacity-90 hover:text-black">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create account
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="text-center text-xs text-muted-foreground">
          Guests can use the questionnaire without an account.
        </p>
      </DialogContent>
    </Dialog>
  );
}
