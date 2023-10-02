interface SensorData {
  pin: number;
  value: string;
  type: string;
}

export default interface SensorPayload {
  data: SensorData[]
}

//{"method": "get_sensor_data", "data": [{"14": 0}, {"32": "2327"}] }
//{"method": "get_sensor_data", "data": [{"14": 0}, {"32": "2154"}]}