interface Actuator {
  id: string;
  pin: number;
  description: string;
  value: string;
  actuatorType: string;
};

export default Actuator;