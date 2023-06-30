import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { MqttClient, connect } from 'mqtt';

// Interfaces
import Actuator from './actuators/actuator.interface';
import Sensor from './sensors/sensor.interface';

// Models
import SensorModel from './sensors/sensor.model';
import ActuatorModel from './actuators/actuator.model';

// Controllers
import Controller from './interfaces/controller.interface';

class App {
  // Varáveis de classe 
  private app: express.Application;
  private mqttClient!: MqttClient;
  private controllers: Controller[];
  private sensors!: Sensor[];
  private actuators!: Actuator[];

  private inputTopic: string;
  private outputTopic: string;

  constructor(controllers: Controller[]) {
    this.app = express();
    this.controllers = controllers;
    this.inputTopic = 'esp32/placa/input';
    this.outputTopic = 'esp32/placa/output';
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
      console.log('Conectando ao banco de dados')
      await mongoose.connect(`mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_PATH}`);
      console.log('Conectado com sucesso ao banco de dados')
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

    this.mqttClient.on('connect', () => {
      console.log(`Conectado com sucesso ao broker: ${MQTT_BROKER_URL}`);
    });

    this.mqttClient.subscribe(this.outputTopic, () => {
      console.log(`Inscrito no tópico ${this.outputTopic}`)
    });

    this.mqttClient.on('message', this.handleMqttLoop);
  }

  private async handleMqttLoop(topic: string, payloadBinary: Buffer) {
    const payload = payloadBinary.toString();
    const params = this.processPayload(payload)

    if (topic == this.inputTopic) {
      if (this.hasActuatorCmd(payload)) {
        const actuator = this.getLoadedActuator(params.pin);
        actuator.lastValue = params.cmd;

        // Atualiza no banco de dados
        await ActuatorModel.findByIdAndUpdate(actuator.id, { lastValue: actuator.lastValue }, { new: true });
      }
      else if (this.hasSensorReading(payload)) {
        const sensor = this.getLoadedSensor(params.pin);
        sensor.lastValue = params.reading;

        // Atualiza no banco de dados
        await SensorModel.findByIdAndUpdate(sensor.id, { lastValue: sensor.lastValue }, { new: true });

        // Recupera o atuador para aquele tipo de dado proveniente 
        // do sensor e decide se liga ou não o atuador
        const actuatorType = this.getActuatorFromSensor(sensor.sensorType);
        if (sensor.lastValue < sensor.idealValue) {
          this.toggleActuator(actuatorType, 'HIGH')
        }
        else if (sensor.lastValue >= sensor.idealValue + 10) {
          this.toggleActuator(actuatorType, 'LOW')
        }
      }
    }
  }

  // Arranjo para evitar o time drift
  private configureMqttLoop() {
    // Verifica a hora atual e calcula o delay até o proximo intervalo
    const func = this.mqttLoop;
    const interval = 10000; // 1 min /30s
    let now = new Date();
    //console.log('\n'+now+'\n')
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
    /* for (let board of this.boards) {
      for (let sensor of board.sensors) {
        this.mqttClient.publish(`placa/${board.id}/input`, `reading:${sensor.pin}`);
        //console.log(`Publicou 'reading:${sensor.pin}' no tópico 'placa/${board.id}/command'`);
      }
    } */


    // a cada 10s vai 
  }

  private processPayload(payload: string) {
    // pin/cmd/value? | 10/a/78.0 | 10/on | 10/off
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
    const sensors = this.sensors.find(sensor => sensor.pin == pin);

    if (sensors === undefined) {
      throw new TypeError('Não há sensor nesse pino');
    }

    return sensors;
  }

  private getLoadedActuator(pin: number) {
    const actuators = this.actuators.find(actuator => actuator.pin == pin);

    if (actuators === undefined) {
      throw new TypeError('Não há atuador nesse pino');
    }

    return actuators;
  }

  private getLoadedActuatorByType(actuatorType: string) {
    const actuators = this.actuators.find(actuator => actuator.actuatorType == actuatorType);

    if (actuators === undefined) {
      throw new TypeError('Não há atuador desse tipo');
    }

    return actuators;
  }

  private getActuatorFromSensor(sensorType: string) {
    // retorna um tipo de atuador para as entradas de cada tipo de sensor
    switch (sensorType) {
      case 'soil_moisture': {
        return 'main_pump';
      }
      case 'air_temperature': {
        return 'exaust';
      } 
      /**case 'air_humidity': {
        return 'sprinkler';
        break;
      }
      case 'sun_incidence': {
        return 'sun_cover';
        break;
      }*/
      default: {
        throw new TypeError('Não há esse tipo de sensor');
      }
    }
  }

  private toggleActuator(actuatorType: string, state: string) {
    const loadedActuator = this.getLoadedActuatorByType(actuatorType);
    this.mqttClient.publish(this.inputTopic, `${state}:${loadedActuator.pin}`);
  }

}

export default App;