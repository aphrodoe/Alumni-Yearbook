"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, Quote, ChevronLeft, ChevronRight, Check } from "lucide-react"; 
import { getSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function UserPreferenceForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    photo: null as File | null,
    photoPreview: "",
    quote: "",
    clubs: "",
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
    setFormData({
      ...formData,
      [name]: value,
    });
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
              quote: formData.quote,
              clubs: formData.clubs,
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
        return !!formData.quote;
      case 3:
        return !!formData.clubs;
      case 4:
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
              ? "Your Quote"
              : step === 3
              ? "Extracurricular Activities"
              : "Review & Submit"}
          </h2>

          {step === 1 && (
            <div className="space-y-4">
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
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Quote className="h-5 w-5 text-blue-600" />
                <Label htmlFor="quote" className="text-lg font-medium">Your Yearbook Quote</Label>
              </div>
              <Textarea
                id="quote"
                name="quote"
                value={formData.quote}
                onChange={handleInputChange}
                placeholder="Share a memorable quote that represents your journey..."
                className="min-h-[150px] bg-white border-gray-300"
              />
              <p className="text-sm text-gray-500">
                This quote will appear in your yearbook profile and be visible to your classmates. 
                Make it meaningful and representative of your time at the institution. Or just a funny one!
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clubs">Clubs & Activities</Label>
                <Textarea
                  id="clubs"
                  name="clubs"
                  value={formData.clubs}
                  onChange={handleInputChange}
                  placeholder="List your clubs, activities, sports teams, and other extracurricular involvements..."
                  className="min-h-[150px] bg-white border-gray-300"
                />
              </div>
              <p className="text-sm text-gray-500">
                Share the extracurricular activities that made your time at school memorable. 
                Leave a message for any club/society you were part of.
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Review Your Information</h3>
                <p className="text-sm text-gray-700">
                  Please review the information you've provided. Once submitted, this information will be 
                  used in your yearbook profile and will be visible to other students.
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
                  <h4 className="font-medium text-gray-700">Quote</h4>
                  <p className="text-sm text-gray-600 mt-1">{formData.quote || "No quote provided"}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Extracurricular Activities</h4>
                <p className="text-sm text-gray-600">{formData.clubs || "No activities specified"}</p>
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