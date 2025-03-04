const mongoose=require('mongoose');

const QuoteSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    quote: { type: String, required: true },
});

export default mongoose.models.Quote || mongoose.model('Quote', QuoteSchema);