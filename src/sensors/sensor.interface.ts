interface Sensor {
  id: string;
  pin: number;
  description: string;
  value?: number;
  sensorType: string;
  idealValue: number;
};

export default Sensor;