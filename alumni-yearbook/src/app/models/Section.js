import { title } from 'process';
import {mongoose} from 'mongoose'
//const mongoose = require('mongoose');

const SectionSchema = new mongoose.Schema({
    email: { type: String, required: true },
    cloudinaryId: { type: String, required: true },
    cloudinaryUrl: { type: String, required: true },
    headtitle: { type: String, required: true },
});

export default mongoose.models.Section || mongoose.model('Section', SectionSchema);