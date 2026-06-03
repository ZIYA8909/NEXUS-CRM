import { Schema, model, Document, Types } from 'mongoose';

export interface INotification extends Document {
  recipient: Types.ObjectId;
  title: string;
  message: string;
  type: 'Lead Assigned' | 'Task Due' | 'Deal Closed' | 'Customer Added';
  isRead: boolean;
  relatedTo?: {
    modelType: 'Lead' | 'Customer' | 'Task';
    modelId: Types.ObjectId;
  };
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['Lead Assigned', 'Task Due', 'Deal Closed', 'Customer Added'], 
      required: true,
      index: true
    },
    isRead: { type: Boolean, default: false, index: true },
    relatedTo: {
      modelType: { type: String, enum: ['Lead', 'Customer', 'Task'] },
      modelId: { type: Schema.Types.ObjectId, refPath: 'relatedTo.modelType' }
    },
    createdAt: { type: Date, default: Date.now, expires: '30d', index: true } // auto delete after 30 days
  }
);

export const Notification = model<INotification>('Notification', NotificationSchema);
