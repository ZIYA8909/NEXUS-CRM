import { Schema, model, Document, Types } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  manager: Types.ObjectId;
  members: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    manager: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  { 
    timestamps: true 
  }
);

export const Team = model<ITeam>('Team', TeamSchema);
