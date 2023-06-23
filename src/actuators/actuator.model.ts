import * as mongoose from 'mongoose';
import Actuator from './actuator.interface';

const actuatorSchema = new mongoose.Schema<Actuator>({
  pin: { type: Number, required: true },
  description: { type: String, required: true },
  lastValue: { type: Number, default: 0 },
  actuatorType: { type: String, required: true },
}, { 
  timestamps: true 
});

const ActuatorModel = mongoose.model<Actuator & mongoose.Document>('Actuator', actuatorSchema);

export default ActuatorModel;