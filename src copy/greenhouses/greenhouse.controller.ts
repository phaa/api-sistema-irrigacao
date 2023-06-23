import { Router, Request, Response, RequestHandler } from 'express';
import Controller from '../interfaces/controller.interface';
import Greenhouse from './greenhouse.interface';
import GreenhouseModel from './greenhouse.model';

class GreenhouseController implements Controller {
  public path = '/greenhouses';
  public router = Router();
  private greenhouses = GreenhouseModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(this.path, this.getAllGreenhouses);
    this.router.get(`${this.path}/:id`, this.getGreenhouseById);
    this.router.patch(`${this.path}/:id`, this.modifyGreenhouse);
    this.router.delete(`${this.path}/:id`, this.deleteGreenhouse);
    this.router.post(this.path, this.createGreenhouse);
  }

  private getAllGreenhouses: RequestHandler = async (req: Request, res: Response) => {
    try {
      const greenhouses = await this.greenhouses.find();
      return res.status(200).json({ greenhouses: greenhouses });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  //User.findOneAndUpdate({ _id: doc._id }, { name: 'test3' }, { new: true });
  private getGreenhouseById: RequestHandler = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const greenhouse = await this.greenhouses.findById(id);
      return res.status(200).json({ greenhouse: greenhouse });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private modifyGreenhouse: RequestHandler = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const greenhouseData: Greenhouse = req.body;
      const greenhouse = await this.greenhouses.findByIdAndUpdate(id, greenhouseData, { new: true });
      return res.status(200).json({ greenhouse: greenhouse });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private createGreenhouse: RequestHandler = async (req: Request, res: Response) => {
    try {
      const greenhouseData: Greenhouse = req.body;
      const createdGreenhouse = new this.greenhouses(greenhouseData);
      await createdGreenhouse.save();
      return res.status(200).json({ greenhouse: createdGreenhouse });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private deleteGreenhouse: RequestHandler = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const greenhouse = await this.greenhouses.findByIdAndDelete(id);
      return res.status(200).json({ message: `Estufa <<${greenhouse?.id}>> deletada com sucesso` });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}

export default GreenhouseController;