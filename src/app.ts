import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import { MqttClient, connect } from 'mqtt';


// Interfaces
import Actuator from './actuators/actuator.interface';
import Sensor from './sensors/sensor.interface';

// Models
import SensorModel from './sensors/sensor.model';
import ActuatorModel from './actuators/actuator.model';

// Controllers
import Controller from './interfaces/controller.interface';
import UserController from './users/users.controller';
import SensorController from './sensors/sensor.controller';
import ActuatorController from './actuators/actuator.controller';
import { Payload } from './interfaces/payload.interface';

class App {
  // Varáveis de classe 
  private app: express.Application;
  private mqttClient!: MqttClient;
  private sensors!: Sensor[];
  private actuators!: Actuator[];

  private serverInput: string;
  private boardInput: string;

  constructor() {
    this.app = express();
    this.serverInput = 'esp32/server/input';
    this.boardInput = 'esp32/placa/input';
  }

  public async initialize() {
    this.mqttLoop = this.mqttLoop.bind(this);
    this.handleMqttLoop = this.handleMqttLoop.bind(this);

    // Aguarda o sistema conectar com o Mongo
    await this.connectDatabase();
    await this.syncToDatabase();

    // Configura mqtt
    this.configureMqtt();
    this.configureMqttLoop();

    // Executa demais funções inicializadoras
    this.initExpress();
    this.initializeMiddlewares();
    this.initializeControllers();
  }

  private initExpress() {
    const { PORT } = process.env;
    this.app.listen(PORT, () => {
      console.log(`Servidor iniciando na porta ${PORT}`);
    });
  }

  private initializeMiddlewares() {
    this.app.use(bodyParser.json());
    this.app.use(cors());
    /* this.app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      next();
    }); */
  }

  private initializeControllers() {
    const controllers = [
      new UserController(),
      new SensorController(),
      new ActuatorController(this.mqttClient, this.boardInput),
    ];
    controllers.forEach((controller) => {
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

    this.mqttClient.subscribe(this.serverInput, () => {
      console.log(`Inscrito no tópico ${this.serverInput}`)
    });

    this.mqttClient.on('message', this.handleMqttLoop);
  }

  private async handleMqttLoop(topic: string, payloadBinary: Buffer) {
    const payload = this.processPayload(payloadBinary);

    if (topic == this.serverInput) {
      if (payload.fromActuator) {
        await this.handleActuatorReading(payload);
      }
      else if (payload.fromSensor) {
        await this.handleSensorReading(payload);
      }
    }
  }

  private async handleSensorReading(payload: Payload) {
    try {
      const sensor = this.getLoadedSensor(payload.pin);

      // Atualiza no banco de dados
      await SensorModel.findByIdAndUpdate(sensor.id, { value: payload.reading }, { new: true });
      sensor.value = payload.reading;

      // Recupera o atuador para aquele tipo de dado proveniente
      const actuatorType = this.getActuatorForSensor(sensor.sensorType);

      // Lógica para irrigação e asperção: Menor valor de sensor = acionamento
      let state = '';
      if (actuatorType == "watering" || actuatorType == "sprinkler") {
        if (sensor.value < sensor.idealValue - sensor.threshold) {
          state = 'HIGH';
        }
        else if (sensor.value >= sensor.idealValue + sensor.threshold) {
          state = 'LOW';
        }
      }
      // Lógica para exaustão e cobertura: Maior valor de sensor = acionamento
      else if (actuatorType == "exaust" || actuatorType == "sun_cover") {
        if (sensor.value >= sensor.idealValue + sensor.threshold) {
          state = 'HIGH';
        }
        else if (sensor.value < sensor.idealValue - sensor.threshold) {
          state = 'LOW';
        }
      }

      this.toggleActuator(actuatorType, state);
    }
    catch (err) {
      console.log(err)
    }
  }

  private async handleActuatorReading(payload: Payload) {
    try {
      const actuator = this.getLoadedActuator(payload.pin);
      actuator.value = payload.cmd;

      // Atualiza no banco de dados
      await ActuatorModel.findByIdAndUpdate(actuator.id, { value: actuator.value }, { new: true });
    }
    catch (err) {
      console.log(err)
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
    /* for (let sensor of this.sensors) {
      this.mqttClient.publish(this.boardInput, `READ:${sensor.pin}`);
      console.log(`Solicitando leitura do sensor '${sensor.description}' | Pino:${sensor.pin} | Id: ${sensor.id}`);
    } */
  }

  private processPayload(payloadBinary: Buffer) {
    // pin/cmd/value? | 10/a/78.0 | 10/on | 10/off
    const payload = payloadBinary.toString();
    const splitInput = payload.split('/');

    const processedPayload: Payload = {
      pin: Number(splitInput[0]),
      cmd: splitInput[1],
      reading: Number(splitInput[2]) | 0,
      fromSensor: payload.split('/').length == 3,
      fromActuator: payload.split('/').length == 2
    };

    return processedPayload;
  }

  private toggleActuator(actuatorType: string, state: string) {
    const loadedActuator = this.getLoadedActuatorByType(actuatorType);
    this.mqttClient.publish(this.boardInput, `${state}:${loadedActuator.pin}`);
    console.log(`${loadedActuator.description} ${loadedActuator.pin}: ${state}`)
  }

  private getLoadedActuatorByType(actuatorType: string) {
    const actuators = this.actuators.find(actuator => actuator.actuatorType == actuatorType);

    if (actuators === undefined) {
      throw new TypeError('Não há atuador desse tipo');
    }

    return actuators;
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

  private getActuatorForSensor(sensorType: string) {
    // retorna um tipo de atuador para as entradas de cada tipo de sensor
    switch (sensorType) {
      case 'soil_moisture': {
        return 'watering';
      }
      case 'air_temperature': {
        return 'exaust';
      }
      case 'air_humidity': {
        return 'sprinkler';
      }
      case 'sun_incidence': {
        return 'sun_cover';
      }
      default: {
        throw new TypeError('Não há esse tipo de sensor');
      }
    }
  }
}

export default App;