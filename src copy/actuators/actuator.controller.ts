import { Router, Request, Response, RequestHandler } from 'express';
import Controller from '../interfaces/controller.interface';
import Actuator from './actuator.interface';
import ActuatorModel from './actuator.model';

class ActuatorController implements Controller {
  public path = '/actuators';
  public router = Router();
  private actuator = ActuatorModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
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

  private getAllActuators: RequestHandler = async (req: Request, res: Response) => {
    try {
      const actuators = await this.actuator.find();
      return res.status(200).json({ actuators: actuators });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private getActuatorsByGreenhouse: RequestHandler = async (req: Request, res: Response) => {
    try {
      const greenhouseId = req.params.greenhouseId;
      const actuators = await this.actuator.find({ greenhouse: greenhouseId });
      return res.status(200).json({ actuators: actuators });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private getActuatorsByBoard: RequestHandler = async (req: Request, res: Response) => {
    try {
      const boardId = req.params.greenhouseId;
      const actuators = await this.actuator.find({ board: boardId });
      return res.status(200).json({ actuators: actuators });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  //User.findOneAndUpdate({ _id: doc._id }, { name: 'test3' }, { new: true });
  private getActuatorsById: RequestHandler = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const actuator = await this.actuator.findById(id);
      return res.status(200).json({ actuator: actuator });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private modifyActuator: RequestHandler = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const actuatorData: Actuator = req.body;
      const actuator = await this.actuator.findByIdAndUpdate(id, actuatorData, { new: true });
      return res.status(200).json({ actuator: actuator });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private createActuator: RequestHandler = async (req: Request, res: Response) => {
    try {
      const actuatorData: Actuator = req.body;
      const createdActuator = new this.actuator(actuatorData);
      await createdActuator.save();
      return res.status(200).json({ actuator: createdActuator });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private deleteActuator: RequestHandler = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const actuator = await this.actuator.findByIdAndDelete(id);
      return res.status(200).json({ message: `Atuador <<${actuator?.id}>> deletado com sucesso` });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}

export default ActuatorController;