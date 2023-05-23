import { Types } from 'mongoose';

interface Sensor {
  id: string;
  pin: number;
  description: string;
  lastValue?: number;
  board: Types.ObjectId,
  greenhouse: Types.ObjectId,
};

export default Sensor;