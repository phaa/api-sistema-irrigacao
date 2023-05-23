import Actuator from "../actuators/actuator.interface";
import Sensor from "../sensors/sensor.interface";

interface Greenhouse {
  id: string;
  description: string;
  irrigating?: boolean;
  operationMode?: string[];
  idealAirHumidity: number;
  idealAirTemperature: number;
  idealSoilMoisture: number;
  createdAt: string;
  updatedAt: string;

  // Opcionais
  sensors?: Sensor[];
  actuators?: Actuator[];
};

export default Greenhouse;