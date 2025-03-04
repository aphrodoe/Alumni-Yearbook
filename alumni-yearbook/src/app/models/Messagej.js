const mongoose=require('mongoose');

const MessageJuniorSchema = new mongoose.Schema({
    email: { type: String, required: true },
    email_receiver: { type: String, required: true },
    message: { type: String, required: true },
});

export default mongoose.models.MessageJunior || mongoose.model('MessageJunior', MessageJuniorSchema);