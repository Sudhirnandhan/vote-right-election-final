import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Vote, Clock, LogOut, Users, CheckCircle, AlertCircle } from "lucide-react";

interface Election {
  id: string;
  title: string;
  description: string;
  status: "active" | "upcoming" | "completed";
  candidates: Candidate[];
  endTime: Date;
  hasVoted: boolean;
}

interface Candidate {
  id: string;
  name: string;
  party: string;
  description: string;
}

interface VoterDashboardProps {
  onLogout: () => void;
  onVote: (electionId: string, candidateId: string) => void;
}

export const VoterDashboard = ({ onLogout, onVote }: VoterDashboardProps) => {
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 minutes in seconds
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string>("");

  // Mock elections data
  const [elections] = useState<Election[]>([
    {
      id: "1",
      title: "Student Council President 2024",
      description: "Annual student council presidential election",
      status: "active",
      hasVoted: false,
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      candidates: [
        {
          id: "c1",
          name: "Sarah Johnson",
          party: "Progressive Student Alliance",
          description: "Focused on campus sustainability and student welfare"
        },
        {
          id: "c2", 
          name: "Michael Chen",
          party: "Student First Coalition",
          description: "Advocating for academic excellence and career development"
        },
        {
          id: "c3",
          name: "Emily Rodriguez", 
          party: "Unity Campus Movement",
          description: "Building bridges across diverse student communities"
        }
      ]
    },
    {
      id: "2",
      title: "Campus Budget Allocation",
      description: "Vote on priority areas for next year's campus budget",
      status: "upcoming",
      hasVoted: false,
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      candidates: [
        {
          id: "b1",
          name: "Academic Resources",
          party: "Budget Option",
          description: "Library upgrades, lab equipment, and study spaces"
        },
        {
          id: "b2",
          name: "Student Activities",
          party: "Budget Option", 
          description: "Sports, clubs, events, and recreational facilities"
        }
      ]
    }
  ]);

  // Session timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
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
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
              {/* Session Timer */}
              <div className="flex items-center space-x-2 bg-muted rounded-lg px-3 py-2">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium">Session: {formatTime(timeLeft)}</span>
                <Progress 
                  value={sessionProgress} 
                  className="w-16 h-2" 
                />
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
          // Elections List
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Available Elections</h2>
              <p className="text-muted-foreground">Select an election to cast your vote</p>
            </div>

            <div className="grid gap-4">
              {elections.map((election) => (
                <Card 
                  key={election.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    election.status === "active" ? "border-primary" : ""
                  }`}
                  onClick={() => election.status === "active" && !election.hasVoted && setSelectedElection(election)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="flex items-center space-x-2">
                          <span>{election.title}</span>
                          {election.hasVoted && (
                            <CheckCircle className="h-5 w-5 text-success" />
                          )}
                        </CardTitle>
                        <CardDescription>{election.description}</CardDescription>
                      </div>
                      
                      <Badge 
                        variant={
                          election.status === "active" ? "default" :
                          election.status === "upcoming" ? "secondary" : "outline"
                        }
                      >
                        {election.status === "active" ? "Active" :
                         election.status === "upcoming" ? "Upcoming" : "Completed"}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{election.candidates.length} candidates</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>Ends {election.endTime.toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {election.hasVoted ? (
                        <Badge variant="outline" className="text-success border-success">
                          Voted ✓
                        </Badge>
                      ) : election.status === "active" ? (
                        <Button size="sm">
                          Vote Now
                        </Button>
                      ) : (
                        <Badge variant="secondary">
                          {election.status === "upcoming" ? "Not Started" : "Ended"}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          // Voting Interface
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => setSelectedElection(null)}
              >
                ← Back to Elections
              </Button>
              <div>
                <h2 className="text-2xl font-bold">{selectedElection.title}</h2>
                <p className="text-muted-foreground">{selectedElection.description}</p>
              </div>
            </div>

            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  <span>Select Your Candidate</span>
                </CardTitle>
                <CardDescription>
                  Choose one candidate. Your vote cannot be changed once submitted.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {selectedElection.candidates.map((candidate, index) => (
                  <div key={candidate.id}>
                    <div 
                      className={`
                        p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${selectedCandidate === candidate.id 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                        }
                      `}
                      onClick={() => setSelectedCandidate(candidate.id)}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`
                          w-6 h-6 rounded-full border-2 flex items-center justify-center
                          ${selectedCandidate === candidate.id 
                            ? "border-primary bg-primary" 
                            : "border-border"
                          }
                        `}>
                          {selectedCandidate === candidate.id && (
                            <CheckCircle className="h-4 w-4 text-primary-foreground" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{candidate.name}</h3>
                          <p className="text-sm text-primary font-medium">{candidate.party}</p>
                          <p className="text-sm text-muted-foreground mt-1">{candidate.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    {index < selectedElection.candidates.length - 1 && (
                      <Separator className="my-4" />
                    )}
                  </div>
                ))}
                
                <div className="pt-4">
                  <Button 
                    onClick={handleVote}
                    disabled={!selectedCandidate}
                    className="w-full h-12 text-lg font-medium"
                  >
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