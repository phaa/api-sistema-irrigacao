import Actuator from "../actuators/actuator.interface";
import Sensor from "../sensors/sensor.interface";
import User from "../users/users.interface";

interface Board {
  id: string;
  description: string;
  online?: boolean; // o mongo já bota um default de false
  inputTopic: string;
  outputTopic: string;
  user: User;

  // Opcionais
  sensors: Sensor[];
  actuators: Actuator[];
};

export default Board;