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
  }

  private initializeControllers() {
    console.log("[Controllers] Inciando controladores...")
    const controllers = [
      new UserController(),
      new SensorController(),
      new ActuatorController(this.mqttClient, this.boardInput),
    ];
    controllers.forEach((controller) => {
      this.app.use('/', controller.router);
    });
    console.log("[Controllers] Controladores iniciados com sucesso")
  }

  private async connectDatabase() {
    const { MONGO_USER, MONGO_PASSWORD, MONGO_PATH } = process.env;
    try {
      console.log('[BD] Conectando ao banco de dados...')
      await mongoose.connect(`mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_PATH}`);
      console.log('[BD] Conectado ao banco de dados com sucesso')
    } catch (error) {
      console.log(error);
    }
  }

  private configureMqtt() {
    console.log("[MQTT] Configurando módulo MQTT...")
    const { MQTT_BROKER_URL } = process.env;
    this.mqttClient = connect(`mqtt://${MQTT_BROKER_URL}`);

    console.log(`[MQTT] Conectando ao broker ${MQTT_BROKER_URL}`)
    this.mqttClient.on('connect', () => {
      console.log(`[MQTT] Módulo MQTT configurado com sucesso.`);
    });

    this.mqttClient.subscribe(this.serverInput, () => {
      console.log(`[MQTT] Inscrito no tópico ${this.serverInput}`)
    });

    this.mqttClient.on('message', this.handleMqttLoop);
  }

  private async handleMqttLoop(topic: string, payloadBinary: Buffer) {
    const payload = this.processPayload(payloadBinary);

    if (topic == this.serverInput) {
      if (payload.fromActuator) {
        await this.handleActuatorInput(payload);
      }
      else if (payload.fromSensor) {
        await this.handleSensorInput(payload);
      }
    }
  }

  private async handleSensorInput(payload: Payload) {
    try {
      console.log("\n")

      const filter = {
        sensorType: payload.instruction,
        pin: payload.pin,
      }
      const update = { value: payload.reading }
      const sensor = await SensorModel.findOneAndUpdate<Sensor>(filter, update, { new: true });

      if (!!sensor) {
        console.log(`${sensor.description} = ${sensor.value}`)

        // Recupera o atuador para aquele tipo de sensor
        // Devo recuperar o tipo primeiro, pois diferentes atuadores lidam
        // de diferentes maneiras com as leituras de sensor
        const actuatorType = this.getActuatorTypeForSensor(sensor.sensorType);

        if (!!actuatorType) {
          console.log('tem actuator type: ' + actuatorType)
          let state = '';

          // Lógica para irrigação e asperção: Menor valor de sensor = acionamento
          if (actuatorType == "watering" /* || actuatorType == "sprinkler" */) {
            if (sensor.value < sensor.min) {
              state = 'high';
            }
            else if (sensor.value >= sensor.max) {
              state = 'low';
            }
          }
          // Lógica para exaustão e cobertura: Maior valor de sensor = acionamento
          else if (actuatorType == "exaust" /* || actuatorType == "sun_cover" */) {
            if (sensor.value >= sensor.max) {
              state = 'high';
            }
            else if (sensor.value < sensor.min) {
              state = 'low';
            }
          }

          // Devo testar se state não é vazio, porque enquanto a leitura estiver no intervalo
          // aceitável, o algoritmo não apontará nenhuma mudança de estado
          if (!!state) {

            const actuator = await ActuatorModel.findOne<Actuator>({ actuatorType: actuatorType });

            // Para evitar chamadas desnecessárias no MQTT, verificamos se o valor 
            // sugerido é diferente do que já está no banco de dados
            if (!!actuator && actuator.value != state) {
              console.log("Estado escolhido: " + state)
              this.toggleActuator(actuator, state);
            }
          }
        }
        else {
          //console.log(`O sensor ${sensor.description} não tem atuador vinculado`);
        }
      }
    }
    catch (err) {
      console.log(err)
    }
  }

  private async handleActuatorInput(payload: Payload) {
    try {
      const filter = { pin: payload.pin }
      const update = { value: payload.instruction }
      const actuator = await ActuatorModel.findOneAndUpdate<Actuator>(filter, update, { new: true });
      if(actuator) {
        console.log(`[Atuador] ${actuator.description}/${actuator.value}\n`);
      }
    }
    catch (err) {
      console.log(err)
    }
  }

  // Arranjo para evitar o time drift
  // criar uma função de loop para cada 1 hora
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
    for (let sensor of this.sensors) {
      this.mqttClient.publish(this.boardInput, `${sensor.pin}/${sensor.sensorType}`);
      //console.log(`Solicitando leitura '${sensor.description}' | Pino:${sensor.pin} | Id: ${sensor.id}`);
    }
  }

  private processPayload(payloadBinary: Buffer) {
    // pin/cmd/value? | 10/a/78.0 | 10/on | 10/off
    const payload = payloadBinary.toString();
    const splitInput = payload.split('/');

    const processedPayload: Payload = {
      pin: Number(splitInput[0]),
      instruction: splitInput[1],
      reading: Number(splitInput[2]) | 0,
      fromSensor: payload.split('/').length == 3,
      fromActuator: payload.split('/').length == 2
    };

    return processedPayload;
  }

  private toggleActuator(actuator: Actuator, state: string) {
    this.mqttClient.publish(this.boardInput, `${actuator.pin}/${state}`);
    console.log(`${actuator.description} ${actuator.pin}/${state}`)
  }

  private getActuatorTypeForSensor(sensorType: string) {
    // retorna um tipo de atuador para as entradas de cada tipo de sensor
    switch (sensorType) {
      case 'soil_moisture': {
        return 'watering';
      }
      case 'air_temperature': {
        return 'exaust';
      }
      case 'air_humidity': {
        return '';
      }
      case 'sun_incidence': {
        return '';
      }
      case 'flow': {
        return '';
      }
      case 'rain': {
        return '';
      }
      default: {
        throw new TypeError('Não há esse tipo de sensor');
      }
    }
  }
}

export default App;