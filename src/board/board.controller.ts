import { Router, Request, Response, RequestHandler } from 'express';
import Controller from '../interfaces/controller.interface';
import Board from './board.interface';
import BoardModel from './board.model';

class BoardController implements Controller {
  public path = '/boards';
  public router = Router();
  private boards = BoardModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(this.path, this.getAllBoards);
    this.router.get(`${this.path}/:id`, this.getBoardById);
    this.router.patch(`${this.path}/:id`, this.modifyBoard);
    this.router.delete(`${this.path}/:id`, this.deleteBoard);
    this.router.post(this.path, this.createBoard);
  }

  private getAllBoards: RequestHandler = async (req: Request, res: Response) => {
    try {
      const boards = await this.boards.find();
      return res.status(200).json({ boards: boards });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  //User.findOneAndUpdate({ _id: doc._id }, { name: 'test3' }, { new: true });
  private getBoardById: RequestHandler = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const board = await this.boards.findById(id);
      return res.status(200).json({ board: board });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private modifyBoard: RequestHandler = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const boardData: Board = req.body;
      const board = await this.boards.findByIdAndUpdate(id, boardData, { new: true });
      return res.status(200).json({ board: board });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private createBoard: RequestHandler = async (req: Request, res: Response) => {
    try {
      const boardData: Board = req.body;
      const createdBoard = new this.boards(boardData);
      await createdBoard.save();
      return res.status(200).json({ board: createdBoard });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private deleteBoard: RequestHandler = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const board = await this.boards.findByIdAndDelete(id);
      return res.status(200).json({ message: `Placa <<${board?.id}>> deletada com sucesso` });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}

export default BoardController;