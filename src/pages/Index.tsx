import { useState } from "react";
import { LoginForm, UserRole } from "@/components/auth/LoginForm";
import { VerificationSteps } from "@/components/auth/VerificationSteps";
import { VoterDashboard } from "@/components/voting/VoterDashboard";
import { VoteConfirmation } from "@/components/voting/VoteConfirmation";
import { ManagerDashboard } from "@/components/management/ManagerDashboard";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { useToast } from "@/hooks/use-toast";

type AppState = "login" | "verification" | "dashboard" | "confirmation" | "manager-dashboard" | "admin-dashboard";

interface VoteData {
  electionTitle: string;
  candidateName: string;
}

interface UserCredentials {
  username: string;
  password: string;
  role: UserRole;
}

const Index = () => {
  const [currentState, setCurrentState] = useState<AppState>("login");
  const [userCredentials, setUserCredentials] = useState<UserCredentials | null>(null);
  const [voteData, setVoteData] = useState<VoteData | null>(null);
  const { toast } = useToast();

  // Live: rely on VoterDashboard + backend; confirmation screen gets values from selection

  const handleLogin = (credentials: UserCredentials) => {
    setUserCredentials(credentials);
    
    // Different flow based on role
    if (credentials.role === "voter") {
      setCurrentState("verification");
      toast({
        title: "Voter Login Successful",
        description: "Proceeding to security verification",
      });
    } else if (credentials.role === "manager") {
      // For manager, we'll skip verification and go straight to manager dashboard
      // In a real app, you might still want verification for managers
      setCurrentState("manager-dashboard");
      toast({
        title: "Manager Login Successful",
        description: "Welcome to the Election Management Dashboard",
      });
    } else if (credentials.role === "admin") {
      // For admin, we'll skip verification and go straight to admin dashboard
      setCurrentState("admin-dashboard");
      toast({
        title: "Admin Login Successful",
        description: "Welcome to the System Administration Dashboard",
      });
    }
  };

  const handleVerificationComplete = () => {
    // After verification, direct to the appropriate dashboard based on role
    if (userCredentials?.role === "voter") {
      setCurrentState("dashboard");
      toast({
        title: "Verification Complete",
        description: "Welcome to your secure voting dashboard",
      });
    } else if (userCredentials?.role === "manager") {
      setCurrentState("manager-dashboard");
    } else if (userCredentials?.role === "admin") {
      setCurrentState("admin-dashboard");
    }
  };

  const handleVote = (electionId: string, candidateId: string) => {
    // For confirmation UI, we just store IDs; if needed we can fetch names by ID from backend
    setVoteData({ electionTitle: `Election ${electionId}`, candidateName: `Candidate ${candidateId}` });
    setCurrentState("confirmation");
    toast({ title: "Vote Cast Successfully", description: `Your vote has been recorded` });
  };

  const handleBackToDashboard = () => {
    // Return to the appropriate dashboard based on role
    if (userCredentials?.role === "voter") {
      setCurrentState("dashboard");
    } else if (userCredentials?.role === "manager") {
      setCurrentState("manager-dashboard");
    } else if (userCredentials?.role === "admin") {
      setCurrentState("admin-dashboard");
    }
    setVoteData(null);
  };

  const handleLogout = () => {
    setCurrentState("login");
    setUserCredentials(null);
    setVoteData(null);
    toast({
      title: "Logged Out",
      description: "Your session has ended securely",
    });
  };



  return (
    <>
      {currentState === "login" && (
        <LoginForm onLogin={handleLogin} />
      )}
      
      {currentState === "verification" && (
        <VerificationSteps onComplete={handleVerificationComplete} />
      )}
      
      {currentState === "dashboard" && (
        <VoterDashboard 
          onLogout={handleLogout}
          onVote={handleVote}
        />
      )}
      
      {currentState === "manager-dashboard" && (
        <ManagerDashboard onLogout={handleLogout} />
      )}
      
      {currentState === "admin-dashboard" && (
        <AdminDashboard onLogout={handleLogout} />
      )}
      
      {currentState === "confirmation" && voteData && (
        <VoteConfirmation 
          electionTitle={voteData.electionTitle}
          candidateName={voteData.candidateName}
          onBackToDashboard={handleBackToDashboard}
        />
      )}
    </>
  );
};

export default Index;
