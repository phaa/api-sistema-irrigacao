interface Sensor {
  id: string;
  pin: number;
  description: string;
  value: number;
  value2?: number;
  sensorType: string;
  actuatorType: string;
  max: number;
  min: number;
};

export default Sensor;