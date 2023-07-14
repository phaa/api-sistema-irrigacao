interface Sensor {
  id: string;
  pin: number;
  description: string;
  value: number;
  sensorType: string;
  max: number;
  min: number;
};

export default Sensor;