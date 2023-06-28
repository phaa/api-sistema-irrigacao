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
const users_model_1 = __importDefault(require("./users.model"));
class UserController {
    constructor() {
        this.path = '/users';
        this.router = (0, express_1.Router)();
        this.users = users_model_1.default;
        this.getAllUsers = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield this.users.find();
                return res.status(200).json({ users: users });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
        //User.findOneAndUpdate({ _id: doc._id }, { name: 'test3' }, { new: true });
        this.getUserById = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const user = yield this.users.findById(id);
                return res.status(200).json({ user: user });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
        this.modifyUser = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const userData = req.body;
                const user = yield this.users.findByIdAndUpdate(id, userData, { new: true });
                return res.status(200).json({ user: user });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
        this.createUser = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userData = req.body;
                const createdGreenhouse = new this.users(userData);
                yield createdGreenhouse.save();
                return res.status(200).json({ user: createdGreenhouse });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
        this.deleteUser = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const user = yield this.users.findByIdAndDelete(id);
                return res.status(200).json({ message: `Usuário <<${user === null || user === void 0 ? void 0 : user.id}>> deletada com sucesso` });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get(this.path, this.getAllUsers);
        this.router.get(`${this.path}/:id`, this.getUserById);
        this.router.patch(`${this.path}/:id`, this.modifyUser);
        this.router.delete(`${this.path}/:id`, this.deleteUser);
        this.router.post(this.path, this.createUser);
    }
}
exports.default = UserController;
