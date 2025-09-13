import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Vote, Clock, LogOut, Users, CheckCircle, AlertCircle } from "lucide-react";

// Backend election types
interface ServerCandidate { _id: string; name: string }
interface ServerElection { _id: string; title: string; status: "open" | "closed"; endAt?: string; candidates?: ServerCandidate[] }

// UI types
interface ElectionListItem {
  id: string;
  title: string;
  status: "active" | "upcoming" | "completed";
  candidatesCount: number;
  endTime?: Date;
  hasVoted: boolean;
}

interface CandidateItem { id: string; name: string }

interface VoterDashboardProps {
  onLogout: () => void;
  onVote: (electionId: string, candidateId: string) => void;
}

export const VoterDashboard = ({ onLogout, onVote }: VoterDashboardProps) => {
  const [timeLeft, setTimeLeft] = useState(20 * 60);
  const [elections, setElections] = useState<ElectionListItem[]>([]);
  const [selectedElection, setSelectedElection] = useState<{ id: string; title: string; candidates: CandidateItem[] } | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

  // Load elections from server
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/elections`, { credentials: "include" });
        const data: ServerElection[] = await res.json();
        const mapped: ElectionListItem[] = data.map((e) => ({
          id: e._id,
          title: e.title,
          status: e.status === "open" ? "active" : "completed", // no explicit "upcoming" status server-side
          candidatesCount: Array.isArray(e.candidates) ? e.candidates.length : 0,
          endTime: e.endAt ? new Date(e.endAt) : undefined,
          hasVoted: false, // could be derived if backend exposes it later
        }));
        setElections(mapped);
      } catch {
        setElections([]);
      }
    };
    load();
  }, [API_BASE]);

  // Session timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onLogout]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const openElection = async (id: string, title: string) => {
    try {
      const res = await fetch(`${API_BASE}/elections/${id}`, { credentials: "include" });
      if (!res.ok) return;
      const e: ServerElection = await res.json();
      const candidates: CandidateItem[] = (e.candidates ?? []).map((c) => ({ id: c._id, name: c.name }));
      setSelectedElection({ id: e._id, title: e.title, candidates });
      setSelectedCandidate("");
    } catch {}
  };

  const handleVote = () => {
    if (selectedElection && selectedCandidate) {
      onVote(selectedElection.id, selectedCandidate);
      setSelectedElection(null);
      setSelectedCandidate("");
    }
  };

  const sessionProgress = (timeLeft / (20 * 60)) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary rounded-lg">
                <Vote className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">VoteRight Dashboard</h1>
                <p className="text-sm text-muted-foreground">Secure Voting Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-muted rounded-lg px-3 py-2">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium">Session: {formatTime(timeLeft)}</span>
                <Progress value={sessionProgress} className="w-16 h-2" />
              </div>
              <Button onClick={onLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {!selectedElection ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Available Elections</h2>
              <p className="text-muted-foreground">Select an election to cast your vote</p>
            </div>
            <div className="grid gap-4">
              {elections.map((election) => (
                <Card
                  key={election.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${election.status === "active" ? "border-primary" : ""}`}
                  onClick={() => election.status === "active" && !election.hasVoted && openElection(election.id, election.title)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="flex items-center space-x-2">
                          <span>{election.title}</span>
                          {election.hasVoted && <CheckCircle className="h-5 w-5 text-success" />}
                        </CardTitle>
                        <CardDescription>&nbsp;</CardDescription>
                      </div>
                      <Badge variant={election.status === "active" ? "default" : election.status === "upcoming" ? "secondary" : "outline"}>
                        {election.status === "active" ? "Active" : election.status === "upcoming" ? "Upcoming" : "Completed"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{election.candidatesCount} candidates</span>
                        </div>
                        {election.endTime && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>Ends {election.endTime.toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      {election.hasVoted ? (
                        <Badge variant="outline" className="text-success border-success">Voted ✓</Badge>
                      ) : election.status === "active" ? (
                        <Button size="sm">Vote Now</Button>
                      ) : (
                        <Badge variant="secondary">{election.status === "upcoming" ? "Not Started" : "Ended"}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => setSelectedElection(null)}>
                ← Back to Elections
              </Button>
              <div>
                <h2 className="text-2xl font-bold">{selectedElection.title}</h2>
                <p className="text-muted-foreground">&nbsp;</p>
              </div>
            </div>

            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  <span>Select Your Candidate</span>
                </CardTitle>
                <CardDescription>Choose one candidate. Your vote cannot be changed once submitted.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedElection.candidates.map((candidate, index) => (
                  <div key={candidate.id}>
                    <div
                      className={`
                        p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${selectedCandidate === candidate.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
                      `}
                      onClick={() => setSelectedCandidate(candidate.id)}
                    >
                      <div className="flex items-start space-x-4">
                        <div
                          className={`
                            w-6 h-6 rounded-full border-2 flex items-center justify-center
                            ${selectedCandidate === candidate.id ? "border-primary bg-primary" : "border-border"}
                          `}
                        >
                          {selectedCandidate === candidate.id && <CheckCircle className="h-4 w-4 text-primary-foreground" />}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{candidate.name}</h3>
                        </div>
                      </div>
                    </div>
                    {index < selectedElection.candidates.length - 1 && <Separator className="my-4" />}
                  </div>
                ))}
                <div className="pt-4">
                  <Button onClick={handleVote} disabled={!selectedCandidate} className="w-full h-12 text-lg font-medium">
                    Cast Your Vote
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};