import Sensor from "../sensors/sensor.interface";

interface Reading {
  id: string;
  value: number;
  value2?: number;
  sensor: Sensor;
  sensorType: string;
};

export default Reading;