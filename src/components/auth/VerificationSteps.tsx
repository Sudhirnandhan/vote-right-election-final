import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Fingerprint, Camera, Mail, MessageSquare, ArrowRight } from "lucide-react";

interface VerificationStepsProps {
  onComplete: () => void;
}

type VerificationStep = "otp" | "fingerprint" | "face";

export const VerificationSteps = ({ onComplete }: VerificationStepsProps) => {
  const [currentStep, setCurrentStep] = useState<VerificationStep>("otp");
  const [completedSteps, setCompletedSteps] = useState<Set<VerificationStep>>(new Set());
  const [otpValue, setOtpValue] = useState("");
  const [otpMethod, setOtpMethod] = useState<"email" | "sms">("email");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleOTPVerification = async () => {
    setIsVerifying(true);
    // Mock verification - any input works
    setTimeout(() => {
      setCompletedSteps(prev => new Set([...prev, "otp"]));
      setCurrentStep("fingerprint");
      setIsVerifying(false);
    }, 1500);
  };

  const handleFingerprintVerification = async () => {
    setIsVerifying(true);
    setTimeout(() => {
      setCompletedSteps(prev => new Set([...prev, "fingerprint"]));
      setCurrentStep("face");
      setIsVerifying(false);
    }, 2000);
  };

  const handleFaceVerification = async () => {
    setIsVerifying(true);
    setTimeout(() => {
      setCompletedSteps(prev => new Set([...prev, "face"]));
      setIsVerifying(false);
      onComplete();
    }, 2500);
  };

  const isStepCompleted = (step: VerificationStep) => completedSteps.has(step);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Progress Header */}
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Security Verification</h1>
          <div className="flex items-center justify-center space-x-4">
            {["otp", "fingerprint", "face"].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium
                  ${isStepCompleted(step as VerificationStep) 
                    ? "bg-success border-success text-success-foreground" 
                    : currentStep === step 
                      ? "bg-primary border-primary text-primary-foreground animate-pulse-secure" 
                      : "bg-muted border-border text-muted-foreground"
                  }
                `}>
                  {isStepCompleted(step as VerificationStep) ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 2 && (
                  <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* OTP Verification */}
        {currentStep === "otp" && (
          <Card className="animate-slide-in border-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-primary" />
                <span>OTP Verification</span>
              </CardTitle>
              <CardDescription>
                We've sent a verification code to your registered {otpMethod}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Button
                  variant={otpMethod === "email" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOtpMethod("email")}
                  className="flex-1"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button
                  variant={otpMethod === "sms" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOtpMethod("sms")}
                  className="flex-1"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  SMS
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="otp">Enter 6-digit OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value)}
                  className="h-12 text-center text-xl tracking-widest"
                  maxLength={6}
                />
              </div>

              <Button 
                onClick={handleOTPVerification}
                className="w-full h-12"
                disabled={isVerifying || otpValue.length < 6}
              >
                {isVerifying ? "Verifying..." : "Verify OTP"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Fingerprint Verification */}
        {currentStep === "fingerprint" && (
          <Card className="animate-slide-in border-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Fingerprint className="h-5 w-5 text-primary" />
                <span>Fingerprint Verification</span>
              </CardTitle>
              <CardDescription>
                Place your finger on the scanner to verify your identity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <div className={`
                  w-32 h-32 rounded-full border-4 border-primary flex items-center justify-center
                  ${isVerifying ? "animate-pulse-secure" : ""}
                `}>
                  <Fingerprint className="h-16 w-16 text-primary" />
                </div>
              </div>

              <Button 
                onClick={handleFingerprintVerification}
                className="w-full h-12"
                disabled={isVerifying}
              >
                {isVerifying ? "Scanning..." : "Scan Fingerprint"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Face Recognition */}
        {currentStep === "face" && (
          <Card className="animate-slide-in border-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="h-5 w-5 text-primary" />
                <span>Face Recognition</span>
              </CardTitle>
              <CardDescription>
                Position your face in the frame for biometric verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <div className={`
                  w-40 h-40 rounded-xl border-4 border-primary flex items-center justify-center bg-muted
                  ${isVerifying ? "animate-pulse-secure" : ""}
                `}>
                  <Camera className="h-20 w-20 text-primary" />
                </div>
              </div>

              <Button 
                onClick={handleFaceVerification}
                className="w-full h-12"
                disabled={isVerifying}
              >
                {isVerifying ? "Analyzing..." : "Start Face Scan"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};