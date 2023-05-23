import 'dotenv/config';
import App from './app';
import SensorController from './sensors/sensor.controller';
import validateEnv from './utils/validate-env';
import GreenhouseController from './greenhouses/greenhouse.controller';
import ActuatorController from './actuators/actuator.controller';
import BoardController from './board/board.controller';
 
validateEnv();
 
const app = new App(
  [
    new GreenhouseController(),
    new BoardController(),
    new SensorController(),
    new ActuatorController(),
  ],
);
 
app.initialize();