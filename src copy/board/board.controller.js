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
const board_model_1 = __importDefault(require("./board.model"));
class BoardController {
    constructor() {
        this.path = '/boards';
        this.router = (0, express_1.Router)();
        this.boards = board_model_1.default;
        this.getAllBoards = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const boards = yield this.boards.find();
                return res.status(200).json({ boards: boards });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
        //User.findOneAndUpdate({ _id: doc._id }, { name: 'test3' }, { new: true });
        this.getBoardById = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const board = yield this.boards.findById(id);
                return res.status(200).json({ board: board });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
        this.modifyBoard = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const boardData = req.body;
                const board = yield this.boards.findByIdAndUpdate(id, boardData, { new: true });
                return res.status(200).json({ board: board });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
        this.createBoard = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const boardData = req.body;
                const createdBoard = new this.boards(boardData);
                yield createdBoard.save();
                return res.status(200).json({ board: createdBoard });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
        this.deleteBoard = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const board = yield this.boards.findByIdAndDelete(id);
                return res.status(200).json({ message: `Placa <<${board === null || board === void 0 ? void 0 : board.id}>> deletada com sucesso` });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        });
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get(this.path, this.getAllBoards);
        this.router.get(`${this.path}/:id`, this.getBoardById);
        this.router.patch(`${this.path}/:id`, this.modifyBoard);
        this.router.delete(`${this.path}/:id`, this.deleteBoard);
        this.router.post(this.path, this.createBoard);
    }
}
exports.default = BoardController;
