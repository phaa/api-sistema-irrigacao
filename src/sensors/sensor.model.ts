import * as mongoose from 'mongoose';
import Sensor from './sensor.interface';

const sensorSchema = new mongoose.Schema<Sensor>({
  pin: { type: Number, required: true },
  description: { type: String, required: true },
  lastValue: { type: Number, default: 0 },
  board: {
    ref: 'Board',
    type: mongoose.Schema.Types.ObjectId,
  },
  greenhouse: {
    ref: 'Greenhouse',
    type: mongoose.Schema.Types.ObjectId,
  },
}, { 
  timestamps: true 
});

const SensorModel = mongoose.model<Sensor & mongoose.Document>('Sensor', sensorSchema);

export default SensorModel;