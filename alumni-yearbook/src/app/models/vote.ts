import mongoose from 'mongoose';
const { Schema } = mongoose;

const VoteSchema = new Schema({
  pollId: {
    type: Schema.Types.ObjectId,
    ref: 'Poll',
    required: true
  },
  optionId: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
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

VoteSchema.index({ pollId: 1, userEmail: 1 }, { unique: true });

export default mongoose.models.Vote || mongoose.model('Vote', VoteSchema);
