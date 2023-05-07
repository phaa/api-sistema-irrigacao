import { MqttClient } from "mqtt";
import { mqttConfig } from "../config";


/**
 * Servidor manda: sensors
 */



class PumpHandler {
  client: MqttClient;
  topics: string[];
  prefix: string;

  constructor(client: MqttClient) {
    this.client = client;
    this.topics = mqttConfig.pumpTopics;
    this.prefix = mqttConfig.topicsPrefix + 1;
  }
  //"ifrn/esp32/estufa/"

  start(): void {
    this.client.subscribe("pump/start");

    // Se inscreve em todos os tópicos
    this.topics.forEach(topic => {
      this.client.subscribe(topic, () => {
        console.log(`Subscribe to topic "${topic}"`);
      });
    })

  }
}