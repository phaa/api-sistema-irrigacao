import Board from "../board/board.interface";
import Greenhouse from "../greenhouses/greenhouse.interface";

interface User {
  id: string;
  name: string;
  address: string;
  birth: Date;  
  createdAt: string;
  updatedAt: string;

  // Opcionais
  greenhouses?: Greenhouse[];
  boards?: Board[];
};

export default User;