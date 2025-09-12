import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LogOut, Users, PlusCircle, Edit, Trash2, BarChart, Calendar, CheckCircle, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Download } from "lucide-react";

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:4000";

// Helper: download CSV as file with auth cookies
async function downloadCsv(electionId: string, raw: boolean = false) {
  const url = `${API_BASE}/elections/${electionId}/${raw ? "results_raw.csv" : "results.csv"}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    alert("Failed to download CSV");
    return;
  }
  const blob = await res.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = raw ? `results_raw_${electionId}.csv` : `results_${electionId}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

interface ManagerDashboardProps {
  onLogout: () => void;
}

interface Election {
  id: string;
  title: string;
  description: string;
  status: "active" | "upcoming" | "completed";
  startDate: Date;
  endDate: Date;
  candidates: Candidate[];
  totalVotes: number;
}

interface Candidate {
  id: string;
  name: string;
  party: string;
  description: string;
  votes: number;
}

export const ManagerDashboard = ({ onLogout }: ManagerDashboardProps) => {
  const [activeTab, setActiveTab] = useState("elections");
  const [showNewElectionDialog, setShowNewElectionDialog] = useState(false);
  const [showNewCandidateDialog, setShowNewCandidateDialog] = useState(false);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  
  // Mock elections data
  const [elections, setElections] = useState<Election[]>([
    {
      id: "1",
      title: "Student Council President 2024",
      description: "Annual student council presidential election",
      status: "active",
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      totalVotes: 145,
      candidates: [
        {
          id: "c1",
          name: "Sarah Johnson",
          party: "Progressive Student Alliance",
          description: "Focused on campus sustainability and student welfare",
          votes: 68
        },
        {
          id: "c2",
          name: "Michael Chen",
          party: "Student First Coalition",
          description: "Advocating for academic excellence and career development",
          votes: 52
        },
        {
          id: "c3",
          name: "Emily Rodriguez",
          party: "Unity Campus Movement",
          description: "Building bridges across diverse student communities",
          votes: 25
        }
      ]
    },
    {
      id: "2",
      title: "Campus Budget Allocation",
      description: "Vote on priority areas for next year's campus budget",
      status: "upcoming",
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
      totalVotes: 0,
      candidates: [
        {
          id: "b1",
          name: "Academic Resources",
          party: "Budget Option",
          description: "Library upgrades, lab equipment, and study spaces",
          votes: 0
        },
        {
          id: "b2",
          name: "Student Activities",
          party: "Budget Option",
          description: "Sports, clubs, events, and recreational facilities",
          votes: 0
        }
      ]
    },
    {
      id: "3",
      title: "Faculty Excellence Award 2023",
      description: "Annual award recognizing outstanding faculty members",
      status: "completed",
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      totalVotes: 312,
      candidates: [
        {
          id: "f1",
          name: "Dr. James Wilson",
          party: "Science Department",
          description: "Innovative research in renewable energy",
          votes: 124
        },
        {
          id: "f2",
          name: "Prof. Maria Garcia",
          party: "Humanities Department",
          description: "Engaging teaching methods and student mentorship",
          votes: 188
        }
      ]
    }
  ]);

  // Form states
  const [newElection, setNewElection] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: ""
  });

  const [newCandidate, setNewCandidate] = useState({
    name: "",
    party: "",
    description: ""
  });

  const handleCreateElection = () => {
    const election: Election = {
      id: `e${Date.now()}`,
      title: newElection.title,
      description: newElection.description,
      status: "upcoming",
      startDate: new Date(newElection.startDate),
      endDate: new Date(newElection.endDate),
      candidates: [],
      totalVotes: 0
    };

    setElections([...elections, election]);
    setNewElection({ title: "", description: "", startDate: "", endDate: "" });
    setShowNewElectionDialog(false);
  };

  const handleCreateCandidate = () => {
    if (!selectedElection) return;

    const candidate: Candidate = {
      id: `c${Date.now()}`,
      name: newCandidate.name,
      party: newCandidate.party,
      description: newCandidate.description,
      votes: 0
    };

    const updatedElections = elections.map(election => {
      if (election.id === selectedElection.id) {
        return {
          ...election,
          candidates: [...election.candidates, candidate]
        };
      }
      return election;
    });

    setElections(updatedElections);
    setNewCandidate({ name: "", party: "", description: "" });
    setShowNewCandidateDialog(false);
  };

  const handleDeleteElection = (id: string) => {
    setElections(elections.filter(election => election.id !== id));
  };

  const handleDeleteCandidate = (electionId: string, candidateId: string) => {
    const updatedElections = elections.map(election => {
      if (election.id === electionId) {
        return {
          ...election,
          candidates: election.candidates.filter(candidate => candidate.id !== candidateId)
        };
      }
      return election;
    });

    setElections(updatedElections);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "upcoming": return "secondary";
      case "completed": return "outline";
      default: return "outline";
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const calculateProgress = (election: Election) => {
    const now = new Date();
    const start = election.startDate;
    const end = election.endDate;
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.round((elapsed / total) * 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary rounded-lg">
                <Users className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Election Manager Dashboard</h1>
                <p className="text-sm text-muted-foreground">Manage elections and candidates</p>
              </div>
            </div>
            
            <Button onClick={onLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="elections" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="elections">Elections</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>
          
          {/* Elections Tab */}
          <TabsContent value="elections" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Manage Elections</h2>
              <Dialog open={showNewElectionDialog} onOpenChange={setShowNewElectionDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Election
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Election</DialogTitle>
                    <DialogDescription>
                      Fill in the details to create a new election event.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Election Title</Label>
                      <Input 
                        id="title" 
                        value={newElection.title}
                        onChange={(e) => setNewElection({...newElection, title: e.target.value})}
                        placeholder="Enter election title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea 
                        id="description" 
                        value={newElection.description}
                        onChange={(e) => setNewElection({...newElection, description: e.target.value})}
                        placeholder="Enter election description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input 
                          id="startDate" 
                          type="date"
                          value={newElection.startDate}
                          onChange={(e) => setNewElection({...newElection, startDate: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input 
                          id="endDate" 
                          type="date"
                          value={newElection.endDate}
                          onChange={(e) => setNewElection({...newElection, endDate: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewElectionDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreateElection}>Create Election</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {elections.map((election) => (
                <Card key={election.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{election.title}</CardTitle>
                        <CardDescription>{election.description}</CardDescription>
                      </div>
                      <Badge variant={getStatusBadgeVariant(election.status)}>
                        {election.status.charAt(0).toUpperCase() + election.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {formatDate(election.startDate)} - {formatDate(election.endDate)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {election.candidates.length} candidates
                          </span>
                        </div>
                      </div>
                      {election.status === "active" && (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div className="w-24">
                            <Progress value={calculateProgress(election)} className="h-2" />
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">Candidates</h3>
                        <Dialog open={showNewCandidateDialog && selectedElection?.id === election.id} 
                          onOpenChange={(open) => {
                            setShowNewCandidateDialog(open);
                            if (open) setSelectedElection(election);
                          }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <PlusCircle className="h-3 w-3 mr-1" />
                              Add Candidate
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add New Candidate</DialogTitle>
                              <DialogDescription>
                                Add a candidate to "{election.title}"
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="name">Candidate Name</Label>
                                <Input 
                                  id="name" 
                                  value={newCandidate.name}
                                  onChange={(e) => setNewCandidate({...newCandidate, name: e.target.value})}
                                  placeholder="Enter candidate name"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="party">Party/Affiliation</Label>
                                <Input 
                                  id="party" 
                                  value={newCandidate.party}
                                  onChange={(e) => setNewCandidate({...newCandidate, party: e.target.value})}
                                  placeholder="Enter party or affiliation"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="candidateDescription">Description</Label>
                                <Textarea 
                                  id="candidateDescription" 
                                  value={newCandidate.description}
                                  onChange={(e) => setNewCandidate({...newCandidate, description: e.target.value})}
                                  placeholder="Enter candidate description"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setShowNewCandidateDialog(false)}>Cancel</Button>
                              <Button onClick={handleCreateCandidate}>Add Candidate</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>

                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Party/Affiliation</TableHead>
                              <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {election.candidates.map((candidate) => (
                              <TableRow key={candidate.id}>
                                <TableCell className="font-medium">{candidate.name}</TableCell>
                                <TableCell>{candidate.party}</TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-destructive"
                                      onClick={() => handleDeleteCandidate(election.id, candidate.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteElection(election.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            <h2 className="text-2xl font-bold">Election Results</h2>
            
            <div className="grid gap-4">
              {elections.map((election) => (
                <Card key={election.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{election.title}</CardTitle>
                        <CardDescription>
                          {election.status === "completed" 
                            ? `Completed on ${formatDate(election.endDate)}` 
                            : election.status === "active"
                              ? "Currently active"
                              : "Not started yet"}
                        </CardDescription>
                      </div>
                      <Badge variant={getStatusBadgeVariant(election.status)}>
                        {election.status.charAt(0).toUpperCase() + election.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {election.status === "completed" || election.status === "active" ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total Votes: {election.totalVotes}</span>
                          {election.status === "active" && (
                            <Badge variant="outline">Live Results</Badge>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          {election.candidates.sort((a, b) => b.votes - a.votes).map((candidate) => {
                            const percentage = election.totalVotes > 0 
                              ? Math.round((candidate.votes / election.totalVotes) * 100) 
                              : 0;
                            
                            return (
                              <div key={candidate.id} className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <div className="font-medium">{candidate.name}</div>
                                  <div className="text-sm">
                                    {candidate.votes} votes ({percentage}%)
                                  </div>
                                </div>
                                <Progress value={percentage} className="h-2" />
                                <p className="text-xs text-muted-foreground">{candidate.party}</p>
                              </div>
                            );
                          })}
                        </div>
                        
                        {election.status === "completed" && election.totalVotes > 0 && (
                          <div className="mt-4 p-3 bg-muted rounded-lg flex items-center space-x-2">
                            <CheckCircle className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">Winner: {
                                election.candidates.reduce((prev, current) => 
                                  (prev.votes > current.votes) ? prev : current
                                ).name
                              }</p>
                            </div>
                          </div>
                        )}
      {/* CSV download actions */}
      <div className="flex gap-2 justify-end mt-4">
       <Button variant="outline" size="sm" onClick={() => downloadCsv(election.id, false)}>
        <Download className="h-4 w-4 mr-2" />
        Download CSV
       </Button>
       <Button variant="ghost" size="sm" onClick={() => downloadCsv(election.id, true)}>
        Raw CSV
       </Button>
      </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>This election has not started yet.</p>
                        <p className="text-sm">Results will be available once voting begins.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-4">
            <h2 className="text-2xl font-bold">Voting Statistics</h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Voter Turnout</CardTitle>
                  <CardDescription>Participation rates across elections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center bg-muted rounded-md">
                    <BarChart className="h-16 w-16 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground ml-4">Chart visualization would appear here</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Election Summary</CardTitle>
                  <CardDescription>Overview of all elections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-3xl font-bold">{elections.length}</p>
                        <p className="text-sm text-muted-foreground">Total Elections</p>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-3xl font-bold">
                          {elections.filter(e => e.status === "active").length}
                        </p>
                        <p className="text-sm text-muted-foreground">Active</p>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-3xl font-bold">
                          {elections.reduce((total, election) => total + election.totalVotes, 0)}
                        </p>
                        <p className="text-sm text-muted-foreground">Total Votes</p>
                      </div>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Election</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Votes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {elections.map((election) => (
                          <TableRow key={election.id}>
                            <TableCell className="font-medium">{election.title}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(election.status)}>
                                {election.status.charAt(0).toUpperCase() + election.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>{election.totalVotes}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};