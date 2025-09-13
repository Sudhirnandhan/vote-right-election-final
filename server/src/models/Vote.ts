import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IVote extends Document {
  electionId: Types.ObjectId;
  voterId: Types.ObjectId; // reference to User
  candidateId: Types.ObjectId; // reference to ICandidate._id (subdoc)
  organizationId?: string; // tenant scope
  createdAt: Date;
}

const voteSchema = new Schema<IVote>(
  {
    electionId: { type: Schema.Types.ObjectId, ref: "Election", required: true, index: true },
    voterId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    candidateId: { type: Schema.Types.ObjectId, required: true },
    organizationId: { type: String, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

voteSchema.index({ electionId: 1, voterId: 1 }, { unique: true }); // 1 vote per voter per election

export const Vote: Model<IVote> = mongoose.models.Vote || mongoose.model<IVote>("Vote", voteSchema);