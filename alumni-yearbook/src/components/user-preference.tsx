"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, Quote, ChevronLeft, ChevronRight, Check, FolderInputIcon } from "lucide-react"; 
import { getSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function UserPreferenceForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<{ number: string }>({ number: '' });
  const totalSteps = 3;

  const [formData, setFormData] = useState({
    photo: null as File | null,
    photoPreview: "",
    number: "",
  });

  // Check if user has already completed preferences
  useEffect(() => {
    const checkIfPreferencesCompleted = async () => {
      const session = await getSession();
      if (session?.user?.email) {
        try {
          const response = await fetch(`/api/users/check-preferences?email=${session.user.email}`, {
            cache: "no-store",
            headers: {
              Pragma: "no-cache",
              "Cache-Control": "no-cache",
            },
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
      const file = e.target.files[0];
      setFormData({
        ...formData,
        photo: file,
        photoPreview: URL.createObjectURL(file),
      });
    }
  };


const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target;
  
  if (name === 'number') {
    const numericValue = value.replace(/\D/g, '');
    
    setFormData({
      ...formData,
      [name]: numericValue,
    });

    if (numericValue.length > 0 && numericValue.length !== 10) {
      setErrors({ ...errors, number: 'Mobile number must be exactly 10 digits' });
    } else {
      setErrors({ ...errors, number: '' });
    }
  } else {
    setFormData({
      ...formData,
      [name]: value,
    });
  }
};


  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Convert the image to base64 if it exists
      if (formData.photo) {
        const reader = new FileReader();
        reader.onloadend = () => {
          // Now send the base64 string to the server
          fetch("/api/users/update-preference", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
            body: JSON.stringify({
              photoUrl: reader.result, // This will be a base64 string
              number: formData.number,
            }),
            credentials: "include",
          })
            .then(async (response) => {
              if (response.ok) {
                await fetch("/api/users/change-preference", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-cache",
                    Pragma: "no-cache",
                  },
                });
                console.log("Preferences updated successfully");
                router.push("/dashboard"); // Redirect immediately after confirmation
              } else {
                const errorData = await response.json();
                console.error("Failed to update preferences:", errorData);
              }
            })
            .catch((error) => {
              console.error("Error updating preferences:", error);
            });
        };
        reader.readAsDataURL(formData.photo);
      } else {
        console.error("No photo selected");
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const isStepComplete = () => {
    switch (step) {
      case 1:
        return !!formData.photo;
      case 2:
        return !!formData.number;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="max-w-2xl mx-auto border-blue-200 bg-white shadow-lg">
        <CardContent className="pt-6">
          <div className="flex justify-between mb-6">
            {[...Array(totalSteps)].map((_, index) => (
              <div
                key={index}
                className={`h-2 w-1/5 rounded-full ${
                  step >= index + 1 ? "bg-blue-600" : "bg-gray-200"
                } transition-colors duration-300 ${
                  index !== totalSteps - 1 ? "mr-1" : ""
                }`}
              ></div>
            ))}
          </div>

          <h2 className="text-xl font-semibold text-blue-600 mb-4">
            {step === 1
              ? "Upload Photo"
              : step === 2
              ? "Your Mobile Number"
              : "Review & Submit"}
          </h2>

          {step === 1 && (
            <div className="space-y-4 min-w-[450px] min-h-[300px] flex flex-col items-center justify-center">
              <div className="flex flex-col items-center justify-center">
                {formData.photoPreview ? (
                  <div className="relative w-40 h-40 rounded-full overflow-hidden mb-4 border-4 border-blue-200 shadow-lg">
                    <Image
                      src={formData.photoPreview || "/placeholder.svg"}
                      alt="Profile preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-40 h-40 rounded-full bg-blue-50 flex items-center justify-center mb-4 border-4 border-blue-200 shadow-lg">
                    <Upload className="h-12 w-12 text-blue-400" />
                  </div>
                )}
                <label htmlFor="photo-upload" className="cursor-pointer mt-4">
                  <div className="flex items-center gap-2 text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-full transition-colors">
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
                <p className="text-sm text-gray-500 mt-4 text-center max-w-md">
                  Upload a high-quality photo for your yearbook profile. This will be visible to other students.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 min-w-[450px] min-h-[300px] flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <Quote className="h-5 w-5 text-blue-600" />
                <Label htmlFor="number" className="text-lg font-medium">Your Mobile Number</Label>
              </div>
              <Input
                id="number"
                name="number"
                value={formData.number}
                onChange={handleInputChange}
                className="bg-white border-gray-300"
                type="tel"
                placeholder="Enter your mobile number"
              />
              {errors.number && <p className="text-red-500 text-sm mt-1">{errors.number}</p>}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 min-w-[450px] min-h-[300px]">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Review Your Information</h3>
                <p className="text-sm text-gray-700">
                  Please review the information you've provided. Once submitted, this information will be 
                  used in your yearbook profile. It can be updated later if needed.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700">Photo</h4>
                  {formData.photoPreview ? (
                    <div className="relative w-20 h-20 rounded-full overflow-hidden mt-1">
                      <Image
                        src={formData.photoPreview}
                        alt="Profile"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : <p className="text-sm text-red-500">No photo uploaded</p>}
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700">Mobile Number</h4>
                  <p className="text-sm text-gray-600 mt-1">{formData.number || "No mobile number provided"}</p>
                </div>
              </div>
            </div>
          )}


          <div className="flex justify-between mt-6">
            {step > 1 ? (
              <Button
                type="button"
                onClick={handleBack}
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            ) : (
              <div></div>
            )}

            <Button 
              onClick={handleNext} 
              disabled={!isStepComplete()}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-300"
            >
              {step === totalSteps ? (
                <span className="flex items-center gap-2">
                  Submit <Check className="ml-2 h-4 w-4" />
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}