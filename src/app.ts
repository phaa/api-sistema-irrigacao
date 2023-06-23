import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { MqttClient, connect } from "mqtt";

// Models
import GreenhouseModel from './greenhouses/greenhouse.model';
import SensorModel from './sensors/sensor.model';

// Controllers
import Controller from './interfaces/controller.interface';
import Greenhouse from './greenhouses/greenhouse.interface';
import ActuatorModel from './actuators/actuator.model';
import Board from './board/board.interface';
import BoardModel from './board/board.model';
import Actuator from './actuators/actuator.interface';
import Sensor from './sensors/sensor.interface';


class App {
  // Varáveis de classe 
  private app: express.Application;
  private mqttClient!: MqttClient;
  private controllers: Controller[];
  private sensors!: Sensor[];
  private actuators!: Actuator[];

  private inputTopic!: 'esp32/placa/input';
  private outputTopic!: 'esp32/placa/output';

  constructor(controllers: Controller[]) {
    this.app = express();
    this.controllers = controllers;
  }

  public async initialize() {
    this.mqttLoop = this.mqttLoop.bind(this);

    // Aguarda o sistema conectar com o Mongo
    await this.connectDatabase();
    await this.syncToDatabase();

    // Executa demais funções inicializadoras
    this.initExpress();
    this.initializeMiddlewares();
    this.initializeControllers();
    this.configureMqtt();
    this.configureMqttLoop();
  }

  private initExpress() {
    const { PORT } = process.env;
    this.app.listen(PORT, () => {
      console.log(`Servidor iniciando na porta ${PORT}`);
    });
  }

  private initializeMiddlewares() {
    this.app.use(bodyParser.json());
  }

  private initializeControllers() {
    this.controllers.forEach((controller) => {
      this.app.use('/', controller.router);
    });
  }

  private async connectDatabase() {
    const { MONGO_USER, MONGO_PASSWORD, MONGO_PATH } = process.env;
    try {
      console.log("Conectando ao banco de dados")
      await mongoose.connect(`mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_PATH}`);
      console.log("Conectado com sucesso ao banco de dados")
    } catch (error) {
      console.log(error);
    }
  }

  private async syncToDatabase() {
    this.sensors = await SensorModel.find<Sensor>();
    this.actuators = await ActuatorModel.find<Actuator>();
  }

  private configureMqtt() {
    const { MQTT_BROKER_URL } = process.env;
    this.mqttClient = connect(`mqtt://${MQTT_BROKER_URL}`);

    this.mqttClient.on("connect", () => {
      console.log(`Conectado com sucesso ao broker: ${MQTT_BROKER_URL}`);
    });

    this.mqttClient.subscribe(this.outputTopic, () => {
      console.log(`Inscrito no tópico ${this.outputTopic}`)
    });

    this.mqttClient.on("message", this.handleMqttLoop);
  }

  private async handleMqttLoop(topic: string, payloadBinary: Buffer) {
    const payload = payloadBinary.toString();

    // pin/cmd/value? | 10/a/78.0 | 10/on | 10/off
    const params = this.processPayload(payload)

    if (this.hasActuatorCmd(payload)) {
      const actuator = this.getLoadedActuator(params.pin);
      if (actuator) {
        actuator.lastValue = Number(params.cmd) // lembrar de mudar no esp para enviar 0 ou 1
        console.log(`Comando ${params.pin}/${params.cmd}. Mudando no BD`);

        // Atualiza no banco de dados
        await ActuatorModel.findByIdAndUpdate(actuator.id, { lastValue: actuator.lastValue }, { new: true });
      }
    }
    else if (this.hasSensorReading(payload)) {
      const analogRead = params.reading;
      const sensor = this.getLoadedSensor(params.pin);
      if (sensor) {
        sensor.lastValue = analogRead;

        // Atualiza no banco de dados
        await SensorModel.findByIdAndUpdate(sensor.id, { lastValue: sensor.lastValue }, { new: true });

        switch (sensor.sensorType) {
          case "soil_moisture": {
            if (sensor.lastValue < sensor.idealValue) {
              this.toggleActuator(greenhouse)
            }
            else if (sensor.lastValue >= sensor.idealValue + 10) {

            }
            break;
          }
          case "air_temperature": {
            break;
          }
          case "air_humidity": {
            break;
          }
          case "sun_incidence": {
            break;
          }

        }

        //Adicionar condicionais que verificam as variáveis ideais da estufa e setam os atuadores de acordo
      }
    }
  }

  // Arranjo para evitar o time drift
  private configureMqttLoop() {
    // Verifica a hora atual e calcula o delay até o proximo intervalo
    const func = this.mqttLoop;
    const interval = 10000; // 1 min /30s
    let now = new Date();
    //console.log("\n"+now+"\n")
    let delay = interval - now.valueOf() % interval;

    const start = () => {
      // Executa a função passada
      func();
      // ... E inicia a recursividade
      this.configureMqttLoop();
    }

    // Segura a execução até o momento certo
    setTimeout(start, delay);
  }

  private async mqttLoop() {
    // console.log(this.boards)
    // pedir o estado de todos os pinos que estão sendo utilizados em cada mcu
    for (let board of this.boards) {
      for (let sensor of board.sensors) {
        this.mqttClient.publish(`placa/${board.id}/input`, `reading:${sensor.pin}`);
        //console.log(`Publicou "reading:${sensor.pin}" no tópico "placa/${board.id}/command"`);
      }
    }
  }

  private processPayload(payload: string) {
    const splitInput = payload.split('/');
    return {
      pin: Number(splitInput[0]),
      cmd: splitInput[1],
      reading: Number(splitInput[2])
    }
  }

  private hasActuatorCmd(payload: string) {
    return payload.split('/').length == 2;
  }

  private hasSensorReading(payload: string) {
    return payload.split('/').length == 3;
  }

  private getLoadedSensor(pin: number) {
    for (let sensor of this.sensors) {
      if (sensor.pin == pin) {
        return sensor;
      }
    }
  }

  private getLoadedActuator(pin: number) {
    for (let actuator of this.actuators) {
      if (actuator.pin == pin) {
        return actuator;
      }
    }
  }

  private toggleActuator(actuator: Actuator) {
    //let loadedActuator = this.getLoadedActuator(this.selectedBoardId, parseInt
  }
}

export default App;