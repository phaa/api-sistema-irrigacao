import { Types } from 'mongoose';

interface Actuator {
  id: string;
  pin: number;
  description: string;
  lastValue?: number;
  board: Types.ObjectId,
  greenhouse: Types.ObjectId,
};

export default Actuator;