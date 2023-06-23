import * as mongoose from 'mongoose';
import User from './users.interface';

const userSchema = new mongoose.Schema<User>({
  name: String,
  address: String,
  birth: Date,
}, { 
  timestamps: true 
});

const UserModel = mongoose.model<User & mongoose.Document>('User', userSchema);

export default UserModel;