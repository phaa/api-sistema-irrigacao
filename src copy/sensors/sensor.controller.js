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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sensor_model_1 = __importDefault(require("./sensor.model"));
class SensorController {
    constructor() {
        this.path = '/sensors';
        this.router = (0, express_1.Router)();
        this.sensor = sensor_model_1.default;
        this.getAllSensors = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const sensors = yield this.sensor.find();
                return res.status(200).json({ sensors: sensors });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
        this.getSensorsByGreenhouse = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const greenhouseId = req.params.greenhouseId;
                const sensors = yield this.sensor.find({ greenhouse: greenhouseId });
                return res.status(200).json({ sensors: sensors });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
        this.getSensorsByBoard = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const boardId = req.params.boardId;
                const sensors = yield this.sensor.find({ board: boardId });
                return res.status(200).json({ sensors: sensors });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
        //User.findOneAndUpdate({ _id: doc._id }, { name: 'test3' }, { new: true });
        this.getSensorById = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const sensor = yield this.sensor.findById(id);
                return res.status(200).json({ sensor: sensor });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
        this.modifySensor = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const sensorData = req.body;
                const sensor = yield this.sensor.findByIdAndUpdate(id, sensorData, { new: true });
                return res.status(200).json({ sensor: sensor });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
        this.createSensor = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                // colocar verificação se o pino já está sendo usado na placa
                const sensorData = req.body;
                const createdSensor = new this.sensor(sensorData);
                yield createdSensor.save();
                return res.status(200).json({ sensor: createdSensor });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
        this.deleteSensor = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const sensor = yield this.sensor.findByIdAndDelete(id);
                return res.status(200).json({ message: `Sensor <<${sensor === null || sensor === void 0 ? void 0 : sensor.id}>> deletado com sucesso` });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Rotas de consulta
        this.router.get(this.path, this.getAllSensors);
        this.router.get(`${this.path}/:id`, this.getSensorById);
        this.router.get(`${this.path}/by-greenhouse/:greenhouseId`, this.getSensorsByGreenhouse);
        this.router.get(`${this.path}/by-board/:boardId`, this.getSensorsByBoard);
        // Rotas de modificação
        this.router.patch(`${this.path}/:id`, this.modifySensor);
        this.router.delete(`${this.path}/:id`, this.deleteSensor);
        this.router.post(this.path, this.createSensor);
    }
}
exports.default = SensorController;
