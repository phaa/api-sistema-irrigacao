// MQTT
import { MqttConfig } from "./config";
import { MqttClient } from "mqtt";

// Models
import { Greenhouse } from "../models/greenhouse";
import { Sensor } from "../models/sensors";
import { Actuator } from "../models/actuators";

export class GreenhouseManager {
  // Estufa
  greenhouseId: number;
  greenhouse!: Greenhouse | null;

  // Sensores e atuadores
  sensors!: Sensor;
  actuators!: Actuator;

  // Configurações mqtt
  mqttClient: MqttClient;
  actuatorsTopics: string[];
  sensorsTopics: string[];
  
  constructor(client: MqttClient, greenhouseId: number) {
    this.mqttClient = client;
    this.greenhouseId = greenhouseId;
    this.actuatorsTopics = MqttConfig.actuatorsTopics;
    this.sensorsTopics = MqttConfig.sensorsTopics;
  }

  async setup(): Promise<void> {
    this.greenhouse = await Greenhouse.findOne({ 
      where: { id_greenhouse: this.greenhouseId },
      include: [Sensor, Actuator],
    });






    this.actuatorsTopics.forEach(topic => {
      this.mqttClient.subscribe(topic, () => {
        console.log(`Subscribe to topic "${topic}"`);
      });
    });

  }

  requestData(): string {
    this.mqttClient.publish(MqttConfig.sensorsTopics.allData, 'Hello mqtt')
    
    return "";
  }

  loop(): void {

  }
}