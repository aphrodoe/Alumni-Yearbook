import mongoose from 'mongoose';

const ImageSchema = new mongoose.Schema({
    email: { type: String, required: true },
    s3Key: { type: String, required: true },
    s3Url: { type: String, required: true },
    caption: { type: String, required: true },
    headtitle: { type: String, required: true },
});

export default mongoose.models.Image || mongoose.model('Image', ImageSchema);