import * as mongoose from 'mongoose';
import Reading from './reading.interface';

const readingSchema = new mongoose.Schema<Reading>({
  value: { type: Number, required: true },
  sensor: {
    ref: 'Sensor',
    type: mongoose.Schema.Types.ObjectId,
  },
  sensorType: { type: String, required: true },
}, { 
  timestamps: true 
});

const ReadingModel = mongoose.model<Reading & mongoose.Document>('Reading', readingSchema);

export default ReadingModel;