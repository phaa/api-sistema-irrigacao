import { Router, Request, Response, RequestHandler } from 'express';
import Controller from '../interfaces/controller.interface';
import User from './users.interface';
import UserModel from './users.model';

class UserController implements Controller {
  public path = '/users';
  public router = Router();
  private users = UserModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(this.path, this.getAllUsers);
    this.router.get(`${this.path}/:id`, this.getUserById);
    this.router.patch(`${this.path}/:id`, this.modifyUser);
    this.router.delete(`${this.path}/:id`, this.deleteUser);
    this.router.post(this.path, this.createUser);
  }

  private getAllUsers: RequestHandler = async (req: Request, res: Response) => {
    try {
      const users = await this.users.find();
      return res.status(200).json({ users: users });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  //User.findOneAndUpdate({ _id: doc._id }, { name: 'test3' }, { new: true });
  private getUserById: RequestHandler = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const user = await this.users.findById(id);
      return res.status(200).json({ user: user });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private modifyUser: RequestHandler = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const userData: User = req.body;
      const user = await this.users.findByIdAndUpdate(id, userData, { new: true });
      return res.status(200).json({ user: user });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private createUser: RequestHandler = async (req: Request, res: Response) => {
    try {
      const userData: User = req.body;
      const createdGreenhouse = new this.users(userData);
      await createdGreenhouse.save();
      return res.status(200).json({ user: createdGreenhouse });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private deleteUser: RequestHandler = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const user = await this.users.findByIdAndDelete(id);
      return res.status(200).json({ message: `Usuário <<${user?.id}>> deletada com sucesso` });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}

export default UserController;