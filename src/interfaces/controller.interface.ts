import { Router } from 'express';
import { MqttClient } from 'mqtt';
 
interface Controller {
  path: string;
  router: Router;
  mqttClient?: MqttClient;
  outputTopic?: string;
  sudoMode?: boolean;
}
 
export default Controller;