"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Upload, Quote, CheckCircle } from "lucide-react"
import { getSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export default function UserPreferenceForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const totalSteps = 5
  const progress = (step / totalSteps) * 100

  const [formData, setFormData] = useState({
    photo: null as File | null,
    photoPreview: "",
    quote: "",
    step3Data: "",
    step4Data: "",
    step5Data: "",
  })

  // Check if user has already completed preferences
  useEffect(() => {
    const checkIfPreferencesCompleted = async () => {
      const session = await getSession();
      if (session?.user?.email) {
        try {
          const response = await fetch(`/api/users/check-preferences?email=${session.user.email}`, {
            cache: 'no-store',
            headers: {
              'Pragma': 'no-cache',
              'Cache-Control': 'no-cache'
            }
          });
          const data = await response.json();
          console.log("Preference check from form:", data);
          
          if (data.hasCompletedPreferences === true) {
            console.log("User already completed preferences, redirecting to dashboard");
            router.push("/dashboard");
          }
        } catch (error) {
          console.error("Error checking preferences from form:", error);
        }
      } else {
        console.log("No session found, user may need to login");
      }
    };
    
    checkIfPreferencesCompleted();
  }, [router]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFormData({
        ...formData,
        photo: file,
        photoPreview: URL.createObjectURL(file),
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      fetch('/api/users/update-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          photoUrl: formData.photoPreview,
          quote: formData.quote,
        }),
        credentials: 'include' 
      })
      .then(async response => {
        if (response.ok) {
          console.log("Preferences updated successfully");
          setTimeout(() => {
            router.push('/dashboard');
          }, 500);
        } else {
          const errorData = await response.json();
          console.error('Failed to update preferences:', errorData);
        }
      })
      .catch(error => {
        console.error('Error updating preferences:', error);
      });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const isStepComplete = () => {
    switch (step) {
      case 1:
        return !!formData.photo
      case 2:
        return !!formData.quote
      case 3:
        return !!formData.step3Data
      case 4:
        return !!formData.step4Data
      case 5:
        return !!formData.step5Data
      default:
        return false
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>
            Step {step} of {totalSteps}: {step === 1 ? "Upload Photo" : step === 2 ? "Add Quote" : `Step ${step}`}
          </CardDescription>
          <Progress value={progress} className="h-2 mt-2" />
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center">
                {formData.photoPreview ? (
                  <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4">
                    <Image
                      src={formData.photoPreview || "/placeholder.svg"}
                      alt="Profile preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 text-primary">
                    <Upload className="h-4 w-4" />
                    <span>{formData.photo ? "Change photo" : "Upload your photo"}</span>
                  </div>
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Quote className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Your Favorite Quote</h3>
              </div>
              <Textarea
                name="quote"
                value={formData.quote}
                onChange={handleInputChange}
                placeholder="Enter a quote that inspires you..."
                className="min-h-[120px]"
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Step 3</h3>
              <Input
                name="step3Data"
                value={formData.step3Data}
                onChange={handleInputChange}
                placeholder="Enter information for step 3..."
              />
              <p className="text-sm text-muted-foreground">
                This is a placeholder for step 3. You can customize this question later.
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Step 4</h3>
              <Input
                name="step4Data"
                value={formData.step4Data}
                onChange={handleInputChange}
                placeholder="Enter information for step 4..."
              />
              <p className="text-sm text-muted-foreground">
                This is a placeholder for step 4. You can customize this question later.
              </p>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Step 5</h3>
              <Input
                name="step5Data"
                value={formData.step5Data}
                onChange={handleInputChange}
                placeholder="Enter information for step 5..."
              />
              <p className="text-sm text-muted-foreground">
                This is a placeholder for step 5. You can customize this question later.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={step === 1}>
            Back
          </Button>
          <Button onClick={handleNext} disabled={!isStepComplete()}>
            {step === totalSteps ? (
              <span className="flex items-center gap-2">
                Complete <CheckCircle className="h-4 w-4" />
              </span>
            ) : (
              "Next"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}