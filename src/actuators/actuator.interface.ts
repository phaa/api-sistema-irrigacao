interface Actuator {
  id: string;
  pin: number;
  description: string;
  lastValue?: number;
  actuatorType: string;
};

export default Actuator;