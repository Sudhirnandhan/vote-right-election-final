import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Vote, Users, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export type UserRole = "voter" | "manager" | "admin";

interface LoginFormProps {
  onLogin: (credentials: { username: string; password: string; role: UserRole }) => void;
}

// Prefer env if provided, fallback to common local default
const API_BASE = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:4000";

// Utility: login helper
async function loginRequest(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  return res;
}

export const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<UserRole>("voter");
  const [error, setError] = useState<string | null>(null);

  // Registration dialog state
  const [openRegister, setOpenRegister] = useState(false);
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regIsLoading, setRegIsLoading] = useState(false);
  const [regMessage, setRegMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // receive httpOnly cookies
        body: JSON.stringify({ email, password }),
      });

      if (res.status === 403) {
        setError("Account pending approval by admin.");
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message || "Login failed");
        setIsLoading(false);
        return;
      }

      const data = (await res.json()) as { role: UserRole; name: string; email: string };
      // Notify parent – keep username as email for now
      onLogin({ username: data.email, password: "", role: data.role });
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setSelectedTab(value as UserRole);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegIsLoading(true);
    setRegMessage(null);

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setRegMessage(data?.message || "Registration failed");
        setRegIsLoading(false);
        return;
      }

      // Backend sets role to "pending"; admin must approve and can assign manager role later.
      setRegMessage("Registered successfully. Await admin approval.");
      // Clear form inputs for safety
      setRegName("");
      setRegEmail("");
      setRegPassword("");
    } catch {
      setRegMessage("Network error. Please try again.");
    } finally {
      setRegIsLoading(false);
    }
  };

  // Role-specific headers/icons (display only)
  const roleConfig = {
    voter: {
      title: "Voter Login",
      description: "Enter your credentials to access the voting system",
      usernamePlaceholder: "Enter your email",
      usernameLabel: "Email",
      icon: <Shield className="h-5 w-5 text-primary" />,
    },
    manager: {
      title: "Election Manager Login",
      description: "Access election management dashboard",
      usernamePlaceholder: "Enter your email",
      usernameLabel: "Email",
      icon: <Users className="h-5 w-5 text-primary" />,
    },
    admin: {
      title: "Administrator Login",
      description: "Access system administration",
      usernamePlaceholder: "Enter your email",
      usernameLabel: "Email",
      icon: <Settings className="h-5 w-5 text-primary" />,
    },
  } as const;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="p-3 bg-primary rounded-xl">
              <Vote className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">VoteRight</h1>
          </div>
          <p className="text-muted-foreground">Secure Online Voting System</p>
        </div>

        {/* Login Form */}
        <Card className="border-2 shadow-lg">
          <CardHeader className="space-y-2">
            <Tabs defaultValue="voter" className="w-full" onValueChange={handleTabChange}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="voter">Voter</TabsTrigger>
                <TabsTrigger value="manager">Manager</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
              </TabsList>

              <div className="flex items-center space-x-2">
                {roleConfig[selectedTab].icon}
                <CardTitle>{roleConfig[selectedTab].title}</CardTitle>
              </div>
              <CardDescription>{roleConfig[selectedTab].description}</CardDescription>
            </Tabs>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{roleConfig[selectedTab].usernameLabel}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={roleConfig[selectedTab].usernamePlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full h-12 text-lg font-medium" disabled={isLoading}>
                {isLoading ? "Authenticating..." : "Login Securely"}
              </Button>

              <div className="text-sm text-center text-muted-foreground">
                Don't have an account?
                <Dialog open={openRegister} onOpenChange={setOpenRegister}>
                  <DialogTrigger asChild>
                    <Button variant="link" type="button" className="ml-1 p-0 h-auto">Register</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Account</DialogTitle>
                      <DialogDescription>
                        Submit your details. Your account will be marked as pending until an admin approves it and assigns the appropriate role.
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reg-name">Full Name</Label>
                        <Input id="reg-name" value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Enter your full name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-email">Email</Label>
                        <Input id="reg-email" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="Enter your email" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-password">Password</Label>
                        <Input id="reg-password" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="At least 8 characters with letters and numbers" required />
                      </div>

                      {regMessage && <p className="text-sm text-muted-foreground">{regMessage}</p>}

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpenRegister(false)}>Close</Button>
                        <Button type="submit" disabled={regIsLoading}>{regIsLoading ? "Submitting..." : "Submit"}</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="text-center text-sm text-muted-foreground">
          <p>🔒 Your session is secure and encrypted</p>
          <p>Session expires in 15 minutes after login</p>
        </div>
      </div>
    </div>
  );
};
