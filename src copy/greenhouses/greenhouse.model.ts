import * as mongoose from 'mongoose';
import Greenhouse from './greenhouse.interface';

const greenhouseSchema = new mongoose.Schema<Greenhouse>({
  description: String,
  irrigating: {
    type: Boolean,
    default: false,
  },
  operationMode: { 
    type: Number, 
    default: 0 
  },
  idealAirHumidity: Number,
  idealAirTemperature: Number,
  idealSoilMoisture: Number,
  user: {
    ref: 'User',
    type: mongoose.Schema.Types.ObjectId,
  },
}, { 
  timestamps: true 
});

const GreenhouseModel = mongoose.model<Greenhouse & mongoose.Document>('Greenhouse', greenhouseSchema);

export default GreenhouseModel;