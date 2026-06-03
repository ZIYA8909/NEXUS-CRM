import { Schema, model, Document, Types } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  dueDate: Date;
  assignedUser: Types.ObjectId;
  status: 'Pending' | 'In Progress' | 'Completed';
  relatedTo?: {
    modelType: 'Lead' | 'Customer';
    modelId: Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    priority: { 
      type: String, 
      enum: ['Low', 'Medium', 'High'], 
      default: 'Medium',
      index: true 
    },
    dueDate: { type: Date, required: true, index: true },
    assignedUser: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { 
      type: String, 
      enum: ['Pending', 'In Progress', 'Completed'], 
      default: 'Pending',
      index: true 
    },
    relatedTo: {
      modelType: { type: String, enum: ['Lead', 'Customer'] },
      modelId: { type: Schema.Types.ObjectId, refPath: 'relatedTo.modelType' }
    }
  },
  { 
    timestamps: true 
  }
);

export const Task = model<ITask>('Task', TaskSchema);
