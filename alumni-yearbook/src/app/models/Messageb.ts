import mongoose from 'mongoose';

const MessageBatchmateSchema = new mongoose.Schema({
    email_sender: { type: String, required: true },
    email_receiver: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

export default mongoose.models.MessageBatchmate || mongoose.model('MessageBatchmate', MessageBatchmateSchema);