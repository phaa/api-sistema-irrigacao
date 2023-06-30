import { Router } from 'express';
import { MqttClient } from 'mqtt';
 
interface Controller {
  path: string;
  router: Router;
  mqttClient: MqttClient;
}
 
export default Controller;