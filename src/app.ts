import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import { MqttClient, connect } from 'mqtt';

// Interfaces
import Actuator from './actuators/actuator.interface';
import Sensor from './sensors/sensor.interface';
import ActuatorPayload from './interfaces/actuatorPayload.interface';
import SensorPayload from './interfaces/sensorPayload.interface';

// Models
import SensorModel from './sensors/sensor.model';
import ActuatorModel from './actuators/actuator.model';

// Controllers
import UserController from './users/users.controller';
import SensorController from './sensors/sensor.controller';
import ActuatorController from './actuators/actuator.controller';

// Utils
import Timer from './utils/timer';
import ReadingModel from './readings/reading.model';
import ReadingController from './readings/reading.controller';


class App {
  // Varáveis de classe 
  private app: express.Application;
  private mqttClient!: MqttClient;
  private store: boolean = false;
  private automaticMode: boolean = true;

  private serverInput: string = 'esp32/server/input';
  private boardInput: string = 'esp32/placa/input';

  private mqttTimer!: Timer;
  private storeReadingsTimer!: Timer;

  constructor() {
    this.app = express();
  }

  public async initialize() {
    // Seta a palavra-chave this p/ referenciar à própria instância da classe App
    this.bindFunctions();

    // Aguarda o sistema conectar com o Mongo
    await this.connectDatabase();

    // Configura o módulo MQTT
    this.initMqtt();

    // Configura os timers
    this.initTimers()

    // Configura o resto do sistema
    this.initExpress();
    this.initializeMiddlewares();
    this.initializeControllers();
  }

  //#region Inicializacao
  private bindFunctions() {
    this.handleMqttInput = this.handleMqttInput.bind(this);
    this.readingLoop = this.readingLoop.bind(this);
  }

  private async connectDatabase() {
    const { MONGO_USER, MONGO_PASSWORD, MONGO_PATH } = process.env;
    try {
      console.info('[BD] Conectando ao banco de dados...')
      await mongoose.connect(`mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_PATH}`);
      console.info('[BD] Conectado ao banco de dados com sucesso')
    } catch (error) {
      console.error(error);
    }
  }

  private initMqtt() {
    const { MQTT_BROKER_URL } = process.env;
    this.mqttClient = connect(`mqtt://${MQTT_BROKER_URL}`);

    this.mqttClient.on('connect', () => {
      console.log(`[MQTT] Módulo MQTT configurado com sucesso: ${MQTT_BROKER_URL}`);
    });

    this.mqttClient.subscribe(this.serverInput, () => {
      console.log(`[MQTT] Inscrito no tópico ${this.serverInput}`)
    });

    this.mqttClient.on('message', this.handleMqttInput);
  }

  private async initTimers() {
    this.storeReadingsTimer = new Timer(60000 * 60, this.readingLoop); // a cada hora

    // Começa o loop intermitente dos timers
    this.storeReadingsTimer.loop();
  }

  private initExpress() {
    const { PORT } = process.env;
    this.app.listen(PORT, () => {
      console.info(`[Express] Servidor iniciando na porta ${PORT}`);
    });
  }

  private initializeMiddlewares() {
    this.app.use(bodyParser.json());
    this.app.use(cors());
  }

  private initializeControllers() {
    console.info("[Express] Inciando controladores...")
    const controllers = [
      new UserController(),
      new SensorController(),
      new ActuatorController(this.mqttClient, this.boardInput, this.automaticMode),
      new ReadingController(),
    ];
    controllers.forEach((controller) => {
      this.app.use('/', controller.router);
    });
    console.info("[Express] Controladores iniciados com sucesso")
  }
  //#endregion

  //#region ManipulacaoMQTT
  private async handleMqttInput(topic: string, payloadBinary: Buffer) {
    const payload = JSON.parse(payloadBinary.toString());

    if (topic == this.serverInput) {
      if (payload.method === 'toggle') {
        await this.handleActuatorInput(payload as ActuatorPayload);
      }
      else if (payload.method === 'get_sensor_data') {
        await this.handleSensorInput(payload as SensorPayload);
      }
    }
  }

  private async handleSensorInput(payload: SensorPayload) {
    try {
      for await (const sensorData of payload.data) {
        const sensor = await SensorModel.findOne({ pin: sensorData.pin });

        if (!sensor) continue;

        let values: any = {}
        if (sensor.sensorType == 'dht11') {
          const splitValues = Number(sensorData.value) != 0 ? sensorData.value.split('/') : [0, 0];
          sensor.value = Number(splitValues[0]); // 0: temp
          sensor.value2 = Number(splitValues[1]); // 1: hum
        }
        else if (sensor.sensorType == 'soil_moisture') {
          sensor.value = this.map(Number(sensorData.value), 269, 632, 100, 0);
        }
        else if (sensor.sensorType == 'water_level') {
          sensor.value = this.map(Number(sensorData.value), 0, 2410, 0, 100);
        }

        console.info(`[Sensor Atualizado] ${sensor.description} - ${sensor.value} ${sensor?.value2}`);
        await sensor.save();

        if (!this.automaticMode) continue;

        const actuatorType = sensor.actuatorType;
        let state = '';

        // Lógica para irrigação e asperção: Menor valor de sensor = acionamento
        if (actuatorType == "watering" || actuatorType == "lighting") {
          if (values.value < sensor.min) {
            state = 'high';
          }
          else if (values.value >= sensor.max) {
            state = 'low';
          }
        }
        // Lógica para exaustão: Maior valor de sensor = acionamento
        else if (actuatorType == "exaust") {
          if (values.value >= sensor.max) {
            state = 'high';
          }
          else if (values.value < sensor.min) {
            state = 'low';
          }
        }

        // Enquanto a leitura estiver no intervalo aceitável, 
        // o algoritmo não apontará nenhuma mudança de estado ,
        // Por isso deve-se verificar se state foi atribuído
        if (!state) continue;

        const actuator = await ActuatorModel.findOne<Actuator>({ actuatorType: actuatorType });

        // Para evitar chamadas desnecessárias no MQTT, verificamos se o valor 
        // sugerido é diferente do que já está no banco de dados
        if (actuator && actuator.value != state) {
          /* this.mqttClient.publish(this.boardInput, `${actuator.pin}/${state}`);
          console.log(`${actuator.description} ${actuator.pin}/${state}`) */
        }
      }

      this.store = false;
    }
    catch (err) {
      console.error(err)
    }
  }

  private map(x: number, in_min: number, in_max: number, out_min: number, out_max: number) {
    const result = (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    return Number(result.toFixed(2));
  }

  private async handleActuatorInput(payload: ActuatorPayload) {
    try {
      const filter = { pin: payload.pin }
      const update = { value: payload.state }
      const actuator = await ActuatorModel.findOneAndUpdate<Actuator>(filter, update, { new: true });

      if (actuator) {
        console.info(`[Atualizando Atuador] ${actuator.description}/${actuator.value}`);
      }
    }
    catch (err) {
      console.error(err)
    }
  }

  private async readingLoop() {
    const sensors: Sensor[] = await SensorModel.find<Sensor>();

    for await(const sensor of sensors) {
      const reading = new ReadingModel({
        sensor: sensor.id,
        sensorType: sensor.sensorType,
        value: sensor.value,
        value2: sensor.value2 ? sensor.value2 : undefined
      });
  
      await reading.save();
      console.info(`[Leitura salva] ${reading.sensorType} - ${reading.value}`);
    }

    
  }
  
  //#endregion
}

export default App;