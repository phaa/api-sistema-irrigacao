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
    for (let greenhouse of this.greenhouses) {
      const greenhouseSensors = await SensorModel.find({ greenhouse: greenhouse.id });
      greenhouse.sensors = greenhouseSensors;

      const greenhouseActuators = await ActuatorModel.find({ greenhouse: greenhouse.id });
      greenhouse.actuators = greenhouseActuators;
    }

    this.boards = await BoardModel.find<Board>();
    for (let board of this.boards) {
      const boardSensors = await SensorModel.find({ board: board.id });
      board.sensors = boardSensors;

      const boardActuators = await ActuatorModel.find({ board: board.id });
      board.actuators = boardActuators;
    }
    console.log(this.boards)
  }

  private configureMqtt() {
    const { MQTT_BROKER_URL } = process.env;
    this.mqttClient = connect(`mqtt://${MQTT_BROKER_URL}`);

    this.mqttClient.on("connect", () => {
      console.log(`Conectado com sucesso ao broker: ${MQTT_BROKER_URL}`);
    });

    const topics: string[] = this.boards.map(board => board.outputTopic);
    this.mqttClient.subscribe(topics, () => {
      console.log("Iniciando inscrição nos tópicos...");
      topics.forEach(topic => console.log(`Inscrito no tópico ${topic}`));
    });

    this.mqttClient.on("message", (topic: string, payload: Buffer) => {
      console.log("Received Message:", topic, payload.toString())
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
    console.log(this.boards)
    // pedir o estado de todos os pinos que estão sendo utilizados em cada mcu
    for (let board of this.boards) {
      for (let sensor of board.sensors) {
        this.mqttClient.publish(board.inputTopic, `reading:${sensor.pin}`);
        console.log(`Publicou <<reading:${sensor.pin}>> no tópico ${board.inputTopic}`)
      } 
    }
  }
}

export default App;