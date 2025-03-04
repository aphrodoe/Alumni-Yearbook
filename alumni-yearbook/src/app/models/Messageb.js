const mongoose=require('mongoose');

const MessageBatchmateSchema = new mongoose.Schema({
    email: { type: String, required: true },
    email_receiver: { type: String, required: true },
    message: { type: String, required: true },
});

export default mongoose.models.MessageBatchmate || mongoose.model('MessageBatchmate', MessageBatchmateSchema);