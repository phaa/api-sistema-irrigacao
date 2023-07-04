interface Sensor {
  id: string;
  pin: number;
  description: string;
  value?: number;
  sensorType: string;
  idealValue: number;
  threshold: number;
};

export default Sensor;