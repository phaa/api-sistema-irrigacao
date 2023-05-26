import Actuator from "../actuators/actuator.interface";
import Sensor from "../sensors/sensor.interface";

interface Board {
  id: string;
  description: string;
  online?: boolean; // o mongo já bota um default de false
  inputTopic: string;
  outputTopic: string;

  // Opcionais
  sensors: Sensor[];
  actuators: Actuator[];
};

export default Board;