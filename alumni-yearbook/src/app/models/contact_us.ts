const mongoose = require('mongoose');

const ContactUsSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
});

export default mongoose.models.ContactUs || mongoose.model('ContactUs', ContactUsSchema);