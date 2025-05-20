import mongoose, { Schema, Document } from "mongoose";

export interface ISocialProfile extends Document {
  email: string;
  linkedinProfile: string;
  createdAt: Date;
  updatedAt: Date;
}

const SocialProfileSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    linkedinProfile: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.SocialProfile || 
  mongoose.model<ISocialProfile>("SocialProfile", SocialProfileSchema);