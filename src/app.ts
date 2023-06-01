import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { MqttClient, connect } from "mqtt";

//Models
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

interface Test {
  name?: string;
}

class App {
  // Varáveis de classe 
  private app: express.Application;
  private mqttClient!: MqttClient;
  private controllers: Controller[];

  // Dados de sensores e estufas
  private greenhouses!: Greenhouse[];
  private boards!: Board[];

  constructor(controllers: Controller[]) {
    this.app = express();
    this.controllers = controllers;
  }

  public async initialize() {
    this.mqttLoop = this.mqttLoop.bind(this);

    // Aguarda o sistema conectar com o Mongo e sincronizar dados
    await this.connectDatabase();
    await this.syncToDatabase();

    // Executa demais funções inicializadoras
    this.initExpress();
    this.initializeMiddlewares();
    this.initializeControllers();
    this.configureMqtt();
    this.configureMqttLoop();

    const test: Test = {};
    test.name = "pedro";
    console.log("nome : " + test.name);
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
    this.greenhouses = await GreenhouseModel.find<Greenhouse>();
    for await (let greenhouse of this.greenhouses) {
      const greenhouseSensors = await SensorModel.find<Sensor>({ greenhouse: greenhouse.id });
      greenhouse.sensors = greenhouseSensors;

      const greenhouseActuators = await ActuatorModel.find<Actuator>({ greenhouse: greenhouse.id });
      greenhouse.actuators = greenhouseActuators;
    }

    this.boards = await BoardModel.find<Board>();
    for await (let board of this.boards) {
      const boardSensors = await SensorModel.find<Sensor>();
      board.sensors = boardSensors;

      const boardActuators = await ActuatorModel.find<Actuator>({ board: board.id });
      board.actuators = boardActuators;
    }
    //console.log(this.boards)s
  }

  private configureMqtt() {
    const { MQTT_BROKER_URL } = process.env;
    this.mqttClient = connect(`mqtt://${MQTT_BROKER_URL}`);

    this.mqttClient.on("connect", () => {
      console.log(`Conectado com sucesso ao broker: ${MQTT_BROKER_URL}`);
    });

    const topics: string[] = this.boards.map(board => `placa/${board.id}/response`);
    this.mqttClient.subscribe(topics, () => {
      console.log("Iniciando inscrição nos tópicos...");
      topics.forEach(topic => console.log(`Inscrito no tópico ${topic}`));
    });

    this.mqttClient.on("message", async (topic: string, payload: Buffer) => {
      console.log("Received Message:", topic, payload.toString())

      const boardId = topic.split("/")[1];
      const board = this.getLoadedBoardById(boardId);
      if (!!board) {
        const splitResponse = payload.toString().split('/'); // pin/cmd/value? | 10/a/78.0 | 10/on | 10/off
        const pin = Number(splitResponse[0]);
        const cmd = splitResponse[1];

        if (splitResponse.length > 2) {
          const actuator = this.getLoadedActuator(board.id, pin);
          if (!!actuator) {
            actuator.lastValue = (cmd == "on") ? 1 : 0;
            await ActuatorModel.findByIdAndUpdate(actuator.id, { lastValue: actuator.lastValue }, { new: true });
            console.log(`Comando ${cmd} para o pino ${pin} confirmado, mudando no BD...`);
          }
          //console.log(`Atuador: ${this.getLoadedActuator(board.id, pin)}`);
        }
        else {
          const analogRead = Number(splitResponse[2]);
          const sensor = this.getLoadedSensor(board.id, pin);
          if (!!sensor) {
            sensor.lastValue = analogRead;
            await SensorModel.findByIdAndUpdate(sensor.id, { lastValue: sensor.lastValue }, { new: true });
            console.log(`Leitura analógica: ${analogRead}, setando BD...`);
          }
          //console.log(`Sensor: ${this.getLoadedSensor(board.id, pin)}`)
        }
      }
    });
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
        this.mqttClient.publish(`placa/${board.id}/command`, `reading:${sensor.pin}`);
        //console.log(`Publicou "reading:${sensor.pin}" no tópico "placa/${board.id}/command"`);
      }
    }
  }

  private getLoadedBoardById(boardId: string) {
    for (let board of this.boards) {
      if (board.id == boardId) {
        return board;
      }
    }
    return null;
  }

  private getLoadedSensor(boardId: string, pin: number) {
    for (let board of this.boards) {
      if (board.id == boardId) {
        for (let sensor of board.sensors) {
          if (sensor.pin == pin) {
            return sensor;
          }
        }
      }
    }
  }

  private getLoadedActuator(boardId: string, pin: number) {
    for (let board of this.boards) {
      if (board.id == boardId) {
        for (let actuator of board.actuators) {
          if (actuator.pin == pin) {
            return actuator;
          }
        }
      }
    }
  }
}

export default App;