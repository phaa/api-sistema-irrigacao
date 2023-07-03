import 'dotenv/config';
import App from './app';
import validateEnv from './utils/validate-env';
 
validateEnv();
 
const app = new App();
 
app.initialize();