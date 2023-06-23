interface Sensor {
  id: string;
  pin: number;
  description: string;
  lastValue?: number;
  sensorType: string;
  idealValue: number;
};

export default Sensor;