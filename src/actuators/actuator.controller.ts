import { Router, Request, Response, RequestHandler } from 'express';
import Controller from '../interfaces/controller.interface';
import Actuator from './actuator.interface';
import ActuatorModel from './actuator.model';
import { MqttClient } from 'mqtt';

class ActuatorController implements Controller {
  public path = '/actuators';
  public router = Router();
  public mqttClient!: MqttClient;
  private actuator = ActuatorModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Rotas de consulta
    this.router.get(this.path, this.getAllActuators);
    this.router.get(`${this.path}/:id`, this.getActuatorsById);

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
      // adicionar verificação: se o atuador estiver em uso, proibir a deleção
      const actuator = await this.actuator.findByIdAndDelete(id);
      return res.status(200).json({ message: `Atuador <<${actuator?.id}>> deletado com sucesso` });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}

export default ActuatorController;