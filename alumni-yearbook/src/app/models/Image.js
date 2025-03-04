import { title } from 'process';

const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
    email: { type: String, required: true },
    cloudinaryId: { type: String, required: true },
    cloudinaryUrl: { type: String, required: true },
    caption: { type: String, required: true },
    headtitle: { type: String, required: true },
});

export default mongoose.models.Image || mongoose.model('Image', ImageSchema);
