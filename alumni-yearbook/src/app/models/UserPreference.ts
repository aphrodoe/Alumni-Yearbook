import mongoose from 'mongoose';

const UserPreferenceSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  photoUrl: {
    type: String,
    required: true,
  },
  number: {
    type: String,
    required: true,
  },
}, { timestamps: true });

export default mongoose.models.UserPreference || mongoose.model('UserPreference', UserPreferenceSchema);
