import { Router, Request, Response, RequestHandler } from 'express';
import Controller from '../interfaces/controller.interface';
import Reading from './reading.interface';
import ReadingModel from './reading.model';

class ReadingController implements Controller {
  public path = '/readings';
  public router = Router();
  private reading = ReadingModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Rotas de consulta
    this.router.get(this.path, this.getAll);
    this.router.get(`${this.path}/:id`, this.getById);
    this.router.get(`${this.path}/filter-by-interval`, this.getByInterval);

    // Rotas de modificação
    this.router.patch(`${this.path}/:id`, this.modify);
    this.router.delete(`${this.path}/:id`, this.delete);
    this.router.post(this.path, this.create);
  }

  private getAll: RequestHandler = async (req: Request, res: Response) => {
    try {
      const readings: Reading[] = await this.reading.find<Reading>();
      return res.status(200).json({ sensors: readings });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  //User.findOneAndUpdate({ _id: doc._id }, { name: 'test3' }, { new: true });
  private getById: RequestHandler = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const reading = await this.reading.findById(id);
      return res.status(200).json({ reading: reading });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private getByInterval: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { start, end } = req.body;
      const readings: Reading[] = await this.reading.find<Reading>({ "created_on": { "$gte": start, "$lt": end } });
      return res.status(200).json({ sensors: readings });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private modify: RequestHandler = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const readingData: Reading = req.body;
      const reading = await this.reading.findByIdAndUpdate(id, readingData, { new: true });
      return res.status(200).json({ reading: reading });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private create: RequestHandler = async (req: Request, res: Response) => {
    try {
      // colocar verificação se o pino já está sendo usado na placa
      const readingData: Reading = req.body;
      const createdReading = new this.reading(readingData);
      await createdReading.save();
      return res.status(200).json({ reading: createdReading });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private delete: RequestHandler = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const reading = await this.reading.findByIdAndDelete(id);
      return res.status(200).json({ message: `Leitura ${reading?.id} deletada com sucesso` });
    }
    catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}

export default ReadingController;