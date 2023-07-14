import Sensor from "../sensors/sensor.interface";

interface Reading {
  id: string;
  value: number;
  sensor: Sensor;
};

export default Reading;