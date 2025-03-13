const mongoose=require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    hasCompletedPreferences: { type: Boolean, default: false },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);