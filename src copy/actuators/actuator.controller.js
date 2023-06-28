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
const actuator_model_1 = __importDefault(require("./actuator.model"));
class ActuatorController {
    constructor() {
        this.path = '/actuators';
        this.router = (0, express_1.Router)();
        this.actuator = actuator_model_1.default;
        this.getAllActuators = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const actuators = yield this.actuator.find();
                return res.status(200).json({ actuators: actuators });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
        this.getActuatorsByGreenhouse = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const greenhouseId = req.params.greenhouseId;
                const actuators = yield this.actuator.find({ greenhouse: greenhouseId });
                return res.status(200).json({ actuators: actuators });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
        this.getActuatorsByBoard = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const boardId = req.params.greenhouseId;
                const actuators = yield this.actuator.find({ board: boardId });
                return res.status(200).json({ actuators: actuators });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
        //User.findOneAndUpdate({ _id: doc._id }, { name: 'test3' }, { new: true });
        this.getActuatorsById = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const actuator = yield this.actuator.findById(id);
                return res.status(200).json({ actuator: actuator });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
        this.modifyActuator = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const actuatorData = req.body;
                const actuator = yield this.actuator.findByIdAndUpdate(id, actuatorData, { new: true });
                return res.status(200).json({ actuator: actuator });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
        this.createActuator = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const actuatorData = req.body;
                const createdActuator = new this.actuator(actuatorData);
                yield createdActuator.save();
                return res.status(200).json({ actuator: createdActuator });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
        this.deleteActuator = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const actuator = yield this.actuator.findByIdAndDelete(id);
                return res.status(200).json({ message: `Atuador <<${actuator === null || actuator === void 0 ? void 0 : actuator.id}>> deletado com sucesso` });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Rotas de consulta
        this.router.get(this.path, this.getAllActuators);
        this.router.get(`${this.path}/:id`, this.getActuatorsById);
        this.router.get(`${this.path}/by-greenhouse/:greenhouseId`, this.getActuatorsByGreenhouse);
        this.router.get(`${this.path}/by-board/:boardId`, this.getActuatorsByBoard);
        // Rotas de modificação
        this.router.patch(`${this.path}/:id`, this.modifyActuator);
        this.router.delete(`${this.path}/:id`, this.deleteActuator);
        this.router.post(this.path, this.createActuator);
    }
}
exports.default = ActuatorController;
