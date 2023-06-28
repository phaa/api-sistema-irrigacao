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
const greenhouse_model_1 = __importDefault(require("./greenhouse.model"));
class GreenhouseController {
    constructor() {
        this.path = '/greenhouses';
        this.router = (0, express_1.Router)();
        this.greenhouses = greenhouse_model_1.default;
        this.getAllGreenhouses = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const greenhouses = yield this.greenhouses.find();
                return res.status(200).json({ greenhouses: greenhouses });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
        //User.findOneAndUpdate({ _id: doc._id }, { name: 'test3' }, { new: true });
        this.getGreenhouseById = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const greenhouse = yield this.greenhouses.findById(id);
                return res.status(200).json({ greenhouse: greenhouse });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
        this.modifyGreenhouse = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const greenhouseData = req.body;
                const greenhouse = yield this.greenhouses.findByIdAndUpdate(id, greenhouseData, { new: true });
                return res.status(200).json({ greenhouse: greenhouse });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
        this.createGreenhouse = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const greenhouseData = req.body;
                const createdGreenhouse = new this.greenhouses(greenhouseData);
                yield createdGreenhouse.save();
                return res.status(200).json({ greenhouse: createdGreenhouse });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
        this.deleteGreenhouse = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const greenhouse = yield this.greenhouses.findByIdAndDelete(id);
                return res.status(200).json({ message: `Estufa <<${greenhouse === null || greenhouse === void 0 ? void 0 : greenhouse.id}>> deletada com sucesso` });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get(this.path, this.getAllGreenhouses);
        this.router.get(`${this.path}/:id`, this.getGreenhouseById);
        this.router.patch(`${this.path}/:id`, this.modifyGreenhouse);
        this.router.delete(`${this.path}/:id`, this.deleteGreenhouse);
        this.router.post(this.path, this.createGreenhouse);
    }
}
exports.default = GreenhouseController;
