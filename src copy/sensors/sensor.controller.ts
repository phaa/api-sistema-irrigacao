import { Router, Request, Response, RequestHandler } from 'express';
import Controller from '../interfaces/controller.interface';
import Sensor from './sensor.interface';
import SensorModel from './sensor.model';

class SensorController implements Controller {
  public path = '/sensors';
  public router = Router();
  private sensor = SensorModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
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

  private getAllSensors: RequestHandler = async (req: Request, res: Response) => {
    try {
      const sensors: Sensor[] = await this.sensor.find<Sensor>();
      return res.status(200).json({ sensors: sensors });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private getSensorsByGreenhouse: RequestHandler = async (req: Request, res: Response) => {
    try {
      const greenhouseId = req.params.greenhouseId;
      const sensors = await this.sensor.find({ greenhouse: greenhouseId });
      return res.status(200).json({ sensors: sensors });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private getSensorsByBoard: RequestHandler = async (req: Request, res: Response) => {
    try {
      const boardId = req.params.boardId;
      const sensors = await this.sensor.find({ board: boardId });
      return res.status(200).json({ sensors: sensors });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  //User.findOneAndUpdate({ _id: doc._id }, { name: 'test3' }, { new: true });
  private getSensorById: RequestHandler = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const sensor = await this.sensor.findById(id);
      return res.status(200).json({ sensor: sensor });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private modifySensor: RequestHandler = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const sensorData: Sensor = req.body;
      const sensor = await this.sensor.findByIdAndUpdate(id, sensorData, { new: true });
      return res.status(200).json({ sensor: sensor });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private createSensor: RequestHandler = async (req: Request, res: Response) => {
    try {
      // colocar verificação se o pino já está sendo usado na placa
      const sensorData: Sensor = req.body;
      const createdSensor = new this.sensor(sensorData);
      await createdSensor.save();
      return res.status(200).json({ sensor: createdSensor });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private deleteSensor: RequestHandler = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const sensor = await this.sensor.findByIdAndDelete(id);
      return res.status(200).json({ message: `Sensor <<${sensor?.id}>> deletado com sucesso` });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}

export default SensorController;