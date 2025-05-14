import mongoose from 'mongoose';
const { Schema } = mongoose;

const PollSchema = new Schema({
  question: {
    type: String,
    required: [true, 'Poll question is required'],
    maxlength: [200, 'Question cannot be more than 200 characters']
  },
  options: [{
    id: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    votes: {
      type: Number,
      default: 0
    }
  }],
  totalVotes: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      delete ret.__v;
    }
  }
});

export default mongoose.models.Poll || mongoose.model('Poll', PollSchema);
