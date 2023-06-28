"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const mongoose_1 = __importDefault(require("mongoose"));
const mqtt_1 = require("mqtt");
// Models
const greenhouse_model_1 = __importDefault(require("./greenhouses/greenhouse.model"));
const sensor_model_1 = __importDefault(require("./sensors/sensor.model"));
const actuator_model_1 = __importDefault(require("./actuators/actuator.model"));
const board_model_1 = __importDefault(require("./board/board.model"));
class App {
    constructor(controllers) {
        this.app = (0, express_1.default)();
        this.controllers = controllers;
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            this.mqttLoop = this.mqttLoop.bind(this);
            // Aguarda o sistema conectar com o Mongo e sincronizar dados
            yield this.connectDatabase();
            yield this.syncToDatabase();
            // Executa demais funções inicializadoras
            this.initExpress();
            this.initializeMiddlewares();
            this.initializeControllers();
            this.configureMqtt();
            this.configureMqttLoop();
        });
    }
    initExpress() {
        const { PORT } = process.env;
        this.app.listen(PORT, () => {
            console.log(`Servidor iniciando na porta ${PORT}`);
        });
    }
    initializeMiddlewares() {
        this.app.use(body_parser_1.default.json());
    }
    initializeControllers() {
        this.controllers.forEach((controller) => {
            this.app.use('/', controller.router);
        });
    }
    connectDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            const { MONGO_USER, MONGO_PASSWORD, MONGO_PATH } = process.env;
            try {
                console.log("Conectando ao banco de dados");
                yield mongoose_1.default.connect(`mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_PATH}`);
                console.log("Conectado com sucesso ao banco de dados");
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    syncToDatabase() {
        var _a, e_1, _b, _c, _d, e_2, _e, _f;
        return __awaiter(this, void 0, void 0, function* () {
            this.greenhouses = yield greenhouse_model_1.default.find();
            try {
                for (var _g = true, _h = __asyncValues(this.greenhouses), _j; _j = yield _h.next(), _a = _j.done, !_a;) {
                    _c = _j.value;
                    _g = false;
                    try {
                        let greenhouse = _c;
                        const greenhouseSensors = yield sensor_model_1.default.find({ greenhouse: greenhouse.id });
                        greenhouse.sensors = greenhouseSensors;
                        const greenhouseActuators = yield actuator_model_1.default.find({ greenhouse: greenhouse.id });
                        greenhouse.actuators = greenhouseActuators;
                    }
                    finally {
                        _g = true;
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_g && !_a && (_b = _h.return)) yield _b.call(_h);
                }
                finally { if (e_1) throw e_1.error; }
            }
            this.boards = yield board_model_1.default.find();
            try {
                for (var _k = true, _l = __asyncValues(this.boards), _m; _m = yield _l.next(), _d = _m.done, !_d;) {
                    _f = _m.value;
                    _k = false;
                    try {
                        let board = _f;
                        const boardSensors = yield sensor_model_1.default.find();
                        board.sensors = boardSensors;
                        const boardActuators = yield actuator_model_1.default.find({ board: board.id });
                        board.actuators = boardActuators;
                    }
                    finally {
                        _k = true;
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (!_k && !_d && (_e = _l.return)) yield _e.call(_l);
                }
                finally { if (e_2) throw e_2.error; }
            }
        });
    }
    configureMqtt() {
        const { MQTT_BROKER_URL } = process.env;
        this.mqttClient = (0, mqtt_1.connect)(`mqtt://${MQTT_BROKER_URL}`);
        this.mqttClient.on("connect", () => {
            console.log(`Conectado com sucesso ao broker: ${MQTT_BROKER_URL}`);
        });
        const topics = this.boards.map(board => `placa/${board.id}/output`);
        this.mqttClient.subscribe(topics, () => {
            console.log("Iniciando inscrição nos tópicos...");
            topics.forEach(topic => console.log(`Inscrito no tópico ${topic}`));
        });
        this.mqttClient.on("message", (topic, payload) => __awaiter(this, void 0, void 0, function* () {
            console.log("Received Message:", topic, payload.toString());
            const boardId = topic.split("/")[1];
            const board = this.getLoadedBoardById(boardId);
            if (!!board) {
                const splitResponse = payload.toString().split('/'); // pin/cmd/value? | 10/a/78.0 | 10/on | 10/off
                const pin = Number(splitResponse[0]);
                const cmd = splitResponse[1];
                if (splitResponse.length == 2) {
                    const actuator = this.getLoadedActuator(board.id, pin);
                    if (!!actuator) {
                        actuator.lastValue = (cmd == "on") ? 1 : 0;
                        yield actuator_model_1.default.findByIdAndUpdate(actuator.id, { lastValue: actuator.lastValue }, { new: true });
                        console.log(`Comando ${cmd} para o pino ${pin} confirmado, mudando no BD...`);
                    }
                    //console.log(`Atuador: ${this.getLoadedActuator(board.id, pin)}`);
                }
                else if (splitResponse.length == 3) {
                    const analogRead = Number(splitResponse[2]);
                    const sensor = this.getLoadedSensor(board.id, pin);
                    if (!!sensor) {
                        sensor.lastValue = analogRead;
                        // Atualiza no banco de dados
                        yield sensor_model_1.default.findByIdAndUpdate(sensor.id, { lastValue: sensor.lastValue }, { new: true });
                        const greenhouse = this.getLoadedGreenhouse(sensor.greenhouse + "");
                        if (greenhouse) {
                            switch (sensor.sensorType) {
                                case "soil_moisture": {
                                    if (sensor.lastValue < greenhouse.idealSoilMoisture) {
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
                        }
                        //console.log(greenhouse)
                        //Adicionar condicionais que verificam as variáveis ideais da estufa e setam os atuadores de acordo
                    }
                    //console.log(`Sensor: ${this.getLoadedSensor(board.id, pin)}`)
                }
            }
        }));
    }
    // Arranjo para evitar o time drift
    configureMqttLoop() {
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
        };
        // Segura a execução até o momento certo
        setTimeout(start, delay);
    }
    mqttLoop() {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log(this.boards)
            // pedir o estado de todos os pinos que estão sendo utilizados em cada mcu
            for (let board of this.boards) {
                for (let sensor of board.sensors) {
                    this.mqttClient.publish(`placa/${board.id}/input`, `reading:${sensor.pin}`);
                    //console.log(`Publicou "reading:${sensor.pin}" no tópico "placa/${board.id}/command"`);
                }
            }
        });
    }
    getLoadedBoardById(boardId) {
        for (let board of this.boards) {
            if (board.id == boardId) {
                return board;
            }
        }
        return null;
    }
    getLoadedSensor(boardId, pin) {
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
    getLoadedActuator(boardId, pin) {
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
    getLoadedGreenhouse(greenhouseId) {
        for (let greenhouse of this.greenhouses) {
            if (greenhouse.id == greenhouseId) {
                return greenhouse;
            }
        }
    }
}
exports.default = App;
