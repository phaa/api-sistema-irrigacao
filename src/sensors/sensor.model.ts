import * as mongoose from 'mongoose';
import Sensor from './sensor.interface';

const sensorSchema = new mongoose.Schema<Sensor>({
  pin: { type: Number, required: true },
  description: { type: String, required: true },
  value: { type: Number, default: 0 },
  value2: { type: Number, default: 0 },
  sensorType: { type: String, required: true },
  actuatorType: { type: String, required: true },
  max: { type: Number, required: true },
  min: { type: Number, required: true },
}, { 
  timestamps: true 
});

const SensorModel = mongoose.model<Sensor & mongoose.Document>('Sensor', sensorSchema);

export default SensorModel;