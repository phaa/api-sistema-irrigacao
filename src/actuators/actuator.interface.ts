interface Actuator {
  id: string;
  pin: number;
  description: string;
  lastValue?: string;
  actuatorType: string;
};

export default Actuator;