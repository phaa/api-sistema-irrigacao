import Actuator from "../actuators/actuator.interface";
import Sensor from "../sensors/sensor.interface";
import User from "../users/users.interface";

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
  user: User;

  // Opcionais
  sensors?: Sensor[];
  actuators?: Actuator[];
};

export default Greenhouse;