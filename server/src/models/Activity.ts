import { Schema, model, Document, Types } from 'mongoose';

export interface IActivity extends Document {
  type: 'Call' | 'Meeting' | 'Email' | 'Note' | 'Status Change' | 'Task Completed';
  content: string;
  performedBy: Types.ObjectId;
  relatedTo: {
    modelType: 'Lead' | 'Customer';
    modelId: Types.ObjectId;
  };
  timestamp: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    type: { 
      type: String, 
      enum: ['Call', 'Meeting', 'Email', 'Note', 'Status Change', 'Task Completed'], 
      required: true,
      index: true
    },
    content: { type: String, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    relatedTo: {
      modelType: { type: String, required: true, enum: ['Lead', 'Customer'] },
      modelId: { type: Schema.Types.ObjectId, required: true, refPath: 'relatedTo.modelType', index: true }
    },
    timestamp: { type: Date, default: Date.now, index: true }
  }
);

export const Activity = model<IActivity>('Activity', ActivitySchema);
