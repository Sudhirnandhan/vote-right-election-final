import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Download, Home, Shield } from "lucide-react";

interface VoteConfirmationProps {
  electionTitle: string;
  candidateName: string;
  onBackToDashboard: () => void;
}

export const VoteConfirmation = ({ electionTitle, candidateName, onBackToDashboard }: VoteConfirmationProps) => {
  const [confirmationId] = useState(() => 
    `VR${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  );
  const [timestamp] = useState(new Date());

  useEffect(() => {
    // Auto-redirect after 10 seconds
    const timer = setTimeout(() => {
      onBackToDashboard();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onBackToDashboard]);

  const generateReceipt = () => {
    const receiptData = `
VOTE CONFIRMATION RECEIPT
========================
VoteRight Secure Voting System

Confirmation ID: ${confirmationId}
Election: ${electionTitle}
Vote Cast: ${candidateName}
Timestamp: ${timestamp.toLocaleString()}
Status: CONFIRMED ✓

This receipt confirms your vote was successfully recorded.
Your vote is anonymous and secure.
    `.trim();

    const blob = new Blob([receiptData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vote-receipt-${confirmationId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Success Animation */}
        <div className="text-center">
          <div className="mx-auto w-24 h-24 bg-success rounded-full flex items-center justify-center animate-pulse-secure">
            <CheckCircle className="h-12 w-12 text-success-foreground animate-check-mark" />
          </div>
        </div>

        {/* Confirmation Card */}
        <Card className="border-2 border-success shadow-lg animate-slide-in">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-success">Vote Confirmed!</CardTitle>
            <CardDescription>
              Your vote has been successfully recorded and encrypted
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Vote Details */}
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Election:</span>
                  <span className="text-sm font-medium">{electionTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Vote Cast For:</span>
                  <span className="text-sm font-medium text-primary">{candidateName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Confirmation ID:</span>
                  <span className="text-xs font-mono bg-background px-2 py-1 rounded">
                    {confirmationId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Timestamp:</span>
                  <span className="text-sm">{timestamp.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-primary">Your Vote is Secure</p>
                  <p className="text-muted-foreground mt-1">
                    Your identity is protected and your vote is anonymous. 
                    This confirmation only proves you participated in the election.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                onClick={generateReceipt}
                variant="outline" 
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Receipt
              </Button>
              
              <Button 
                onClick={onBackToDashboard}
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>

            {/* Auto-redirect notice */}
            <p className="text-xs text-center text-muted-foreground">
              Returning to dashboard automatically in a few seconds...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};