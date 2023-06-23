import * as mongoose from 'mongoose';
import Board from './board.interface';

const boardSchema = new mongoose.Schema<Board>({
  description: { type: String, required: true },
  online: { type: Boolean, default: false },
  inputTopic: { type: String, required: true },
  outputTopic: { type: String, required: true },
  user: {
    ref: 'User',
    type: mongoose.Schema.Types.ObjectId,
  },
}, { 
  timestamps: true 
});

const BoardModel = mongoose.model<Board & mongoose.Document>('Board', boardSchema);

export default BoardModel;