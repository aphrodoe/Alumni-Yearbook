import mongoose from 'mongoose';

const GeneratedYearbookSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    s3Key: { type: String, required: true },
    s3Url: { type: String, required: true },
    generatedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['generating', 'completed', 'failed'], default: 'generating' }
});

export default mongoose.models.GeneratedYearbook || mongoose.model('GeneratedYearbook', GeneratedYearbookSchema);
