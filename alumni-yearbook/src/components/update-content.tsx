"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Upload, Save, Camera, MessageSquare, Info, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

type UserPreference = {
  photoUrl?: string;
  number?: string;
};

type UserAddInfo = {
  jeevanKaFunda?: string;
  iitjIs?: string;
  crazyMoment?: string;
  lifeTitle?: string;
};

export default function UpdateContent() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [userPreference, setUserPreference] = useState<UserPreference>({
    photoUrl: "",
    number: "",
  });
  
  const [userAddInfo, setUserAddInfo] = useState<UserAddInfo>({
    jeevanKaFunda: "",
    iitjIs: "",
    crazyMoment: "",
    lifeTitle: "",
  });
  
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  
  const [errors, setErrors] = useState({
    number: "",
    jeevanKaFunda: "",
    iitjIs: "",
    crazyMoment: "",
    lifeTitle: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.email) {
        try {
          setLoading(true);
          
          const prefResponse = await fetch(`/api/users/get-preference`);
          if (prefResponse.ok) {
            const prefData = await prefResponse.json();
            
            
            setUserPreference({
              photoUrl: prefData.photoUrl || "",
              number: prefData.number || "",
            });
            
            if (prefData.photoUrl) {
              setPhotoPreview(prefData.photoUrl);
            }
          } else {
            console.error("Failed to fetch preferences:", await prefResponse.text());
          }
          
          const addInfoResponse = await fetch(`/api/users/get-additional-info`);
          if (addInfoResponse.ok) {
            const addInfoData = await addInfoResponse.json();
            
            
            setUserAddInfo({
              jeevanKaFunda: addInfoData.jeevanKaFunda || "",
              iitjIs: addInfoData.iitjIs || "",
              crazyMoment: addInfoData.crazyMoment || "",
              lifeTitle: addInfoData.lifeTitle || "",
            });
          } else {
            console.error("Failed to fetch additional info:", await addInfoResponse.text());
          }
          
          setLoading(false);
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast.error("Failed to load your profile data");
          setLoading(false);
        }
      }
    };
    
    if (session?.user) {
      fetchUserData();
    }
  }, [session]);

  useEffect(() => {
    console.log("Current user preferences:", userPreference);
    console.log("Current photo preview:", photoPreview);
  }, [userPreference, photoPreview]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const validateWordCount = (value: string, field: string) => {
    if (value.trim() === "") return "";
    
    const wordCount = value.trim().split(/\s+/).length;
    if (wordCount > 10) {
      return `${field} must be 10 words or less`;
    }
    return "";
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === "number") {
      const numericValue = value.replace(/\D/g, "");
      
      setUserPreference({
        ...userPreference,
        number: numericValue,
      });

      if (numericValue.length > 0 && numericValue.length !== 10) {
        setErrors({ ...errors, number: "Mobile number must be exactly 10 digits" });
      } else {
        setErrors({ ...errors, number: "" });
      }
    } else if (["jeevanKaFunda", "iitjIs", "crazyMoment", "lifeTitle"].includes(name)) {
      setUserAddInfo({
        ...userAddInfo,
        [name]: value,
      });
      
      const errorMessage = validateWordCount(value, name);
      setErrors({ ...errors, [name]: errorMessage });
    }
  };

  const getWordCount = (text: string) => {
    return text?.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const updateProfilePhoto = async () => {
    if (!photo) {
      toast.error("Please select a photo to upload");
      return false;
    }
    
    try {
      setSaving(true);
      
      const reader = new FileReader();
      
      const photoUploadPromise = new Promise<boolean>((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            const response = await fetch("/api/users/update-photo", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                photoUrl: reader.result,
              }),
            });
            
            if (response.ok) {
              const result = await response.json();
              setUserPreference(prev => ({
                ...prev,
                photoUrl: result.photoUrl || prev.photoUrl
              }));
              toast.success("Profile photo updated successfully");
              resolve(true);
            } else {
              const error = await response.json();
              toast.error(`Failed to update photo: ${error.message}`);
              resolve(false);
            }
          } catch (error) {
            console.error("Error updating photo:", error);
            toast.error("Something went wrong. Please try again.");
            reject(error);
          }
        };
        
        reader.onerror = (error) => {
          reject(error);
        };
        
        reader.readAsDataURL(photo);
      });
      
      const result = await photoUploadPromise;
      setSaving(false);
      return result;
    } catch (error) {
      console.error("Error in photo upload process:", error);
      toast.error("Failed to process the photo");
      setSaving(false);
      return false;
    }
  };

  const updatePhoneNumber = async () => {
    if (!userPreference.number || userPreference.number.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return false;
    }
    
    try {
      setSaving(true);
      
      const response = await fetch("/api/users/update-number", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: userPreference.number,
        }),
      });
      
      if (response.ok) {
        toast.success("Phone number updated successfully");
        setSaving(false);
        return true;
      } else {
        const error = await response.json();
        toast.error(`Failed to update phone number: ${error.message}`);
        setSaving(false);
        return false;
      }
    } catch (error) {
      console.error("Error updating phone number:", error);
      toast.error("Something went wrong. Please try again.");
      setSaving(false);
      return false;
    }
  };

  const updateAdditionalInfo = async () => {
    const errorMessages = {
      jeevanKaFunda: validateWordCount(userAddInfo.jeevanKaFunda || "", "Jeevan Ka Funda"),
      iitjIs: validateWordCount(userAddInfo.iitjIs || "", "IITJ Is"),
      crazyMoment: validateWordCount(userAddInfo.crazyMoment || "", "Crazy Moment"),
      lifeTitle: validateWordCount(userAddInfo.lifeTitle || "", "Life Title"),
    };
    
    const hasErrors = Object.values(errorMessages).some(error => error !== "");
    
    if (hasErrors) {
      setErrors({
        ...errors,
        ...errorMessages,
      });
      toast.error("Please fix the errors before saving");
      return false;
    }
    
    try {
      setSaving(true);
      
      const response = await fetch("/api/users/update-additional-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jeevanKaFunda: userAddInfo.jeevanKaFunda,
          iitjIs: userAddInfo.iitjIs,
          crazyMoment: userAddInfo.crazyMoment,
          lifeTitle: userAddInfo.lifeTitle,
        }),
      });
      
      if (response.ok) {
        toast.success("Additional information updated successfully");
        setSaving(false);
        return true;
      } else {
        const error = await response.json();
        toast.error(`Failed to update information: ${error.message}`);
        setSaving(false);
        return false;
      }
    } catch (error) {
      console.error("Error updating additional info:", error);
      toast.error("Something went wrong. Please try again.");
      setSaving(false);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster />
      <h1 className="text-2xl font-bold mb-6">Update Your Profile</h1>
      
      <Tabs defaultValue="photo" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="photo" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            <span>Profile Photo</span>
          </TabsTrigger>
          <TabsTrigger value="number" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span>Phone Number</span>
          </TabsTrigger>
          <TabsTrigger value="aboutme" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span>About Me</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="photo">
          <Card>
            <CardHeader>
              <CardTitle>Update Profile Photo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-6">
                <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-blue-200 shadow-lg bg-gray-100">
                  {photoPreview ? (
                    <Image
                      src={photoPreview}
                      alt="Profile preview"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Upload className="h-12 w-12 text-blue-400" />
                    </div>
                  )}
                </div>
                
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-full transition-colors">
                    <Upload className="h-4 w-4" />
                    <span>{photo ? "Change photo" : "Upload new photo"}</span>
                  </div>
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </label>
                
                <Button 
                  className="w-full md:w-auto"
                  onClick={updateProfilePhoto}
                  disabled={!photo || saving}
                >
                  {saving ? 
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Saving...
                    </span> : 
                    <span className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Save Photo
                    </span>
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="number">
          <Card>
            <CardHeader>
              <CardTitle>Update Phone Number</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="number">Mobile Number</Label>
                  <Input
                    id="number"
                    name="number"
                    value={userPreference.number || ""}
                    onChange={handleInputChange}
                    placeholder="Enter your 10-digit mobile number"
                    className="mt-1"
                    maxLength={10}
                  />
                  {errors.number && <p className="text-red-500 text-sm mt-1">{errors.number}</p>}
                </div>
                
                <Button 
                  className="w-full md:w-auto"
                  onClick={updatePhoneNumber}
                  disabled={!userPreference.number || errors.number !== "" || saving}
                >
                  {saving ? 
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Saving...
                    </span> : 
                    <span className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Save Number
                    </span>
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="aboutme">
          <Card>
            <CardHeader>
              <CardTitle>Update About Me</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="jeevanKaFunda" className="flex justify-between">
                    <span>Jeevan Ka Funda</span>
                    <span className={`text-xs ${getWordCount(userAddInfo.jeevanKaFunda || "") > 10 ? 'text-red-500' : 'text-gray-500'}`}>
                      {getWordCount(userAddInfo.jeevanKaFunda || "")}/10 words
                    </span>
                  </Label>
                  <Textarea
                    id="jeevanKaFunda"
                    name="jeevanKaFunda"
                    value={userAddInfo.jeevanKaFunda || ""}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="Your life philosophy in a few words..."
                  />
                  {errors.jeevanKaFunda && <p className="text-red-500 text-sm mt-1">{errors.jeevanKaFunda}</p>}
                </div>
                
                <div>
                  <Label htmlFor="iitjIs" className="flex justify-between">
                    <span>For me IITJ is</span>
                    <span className={`text-xs ${getWordCount(userAddInfo.iitjIs || "") > 10 ? 'text-red-500' : 'text-gray-500'}`}>
                      {getWordCount(userAddInfo.iitjIs || "")}/10 words
                    </span>
                  </Label>
                  <Textarea
                    id="iitjIs"
                    name="iitjIs"
                    value={userAddInfo.iitjIs || ""}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="What IITJ means to you..."
                  />
                  {errors.iitjIs && <p className="text-red-500 text-sm mt-1">{errors.iitjIs}</p>}
                </div>
                
                <div>
                  <Label htmlFor="crazyMoment" className="flex justify-between">
                    <span>Life ka Crazy moment</span>
                    <span className={`text-xs ${getWordCount(userAddInfo.crazyMoment || "") > 10 ? 'text-red-500' : 'text-gray-500'}`}>
                      {getWordCount(userAddInfo.crazyMoment || "")}/10 words
                    </span>
                  </Label>
                  <Textarea
                    id="crazyMoment"
                    name="crazyMoment"
                    value={userAddInfo.crazyMoment || ""}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="A memorable crazy moment..."
                  />
                  {errors.crazyMoment && <p className="text-red-500 text-sm mt-1">{errors.crazyMoment}</p>}
                </div>
                
                <div>
                  <Label htmlFor="lifeTitle" className="flex justify-between">
                    <span>Title for my life at IITJ</span>
                    <span className={`text-xs ${getWordCount(userAddInfo.lifeTitle || "") > 10 ? 'text-red-500' : 'text-gray-500'}`}>
                      {getWordCount(userAddInfo.lifeTitle || "")}/10 words
                    </span>
                  </Label>
                  <Textarea
                    id="lifeTitle"
                    name="lifeTitle"
                    value={userAddInfo.lifeTitle || ""}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="If your IITJ life was a book title..."
                  />
                  {errors.lifeTitle && <p className="text-red-500 text-sm mt-1">{errors.lifeTitle}</p>}
                </div>
                
                <Button 
                  className="w-full md:w-auto"
                  onClick={updateAdditionalInfo}
                  disabled={saving}
                >
                  {saving ? 
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Saving...
                    </span> : 
                    <span className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Save Information
                    </span>
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}