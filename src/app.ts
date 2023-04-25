import express, { Express, Request, Response } from "express";
import { MqttClient, connect } from "mqtt";
import userRoutes from "./routes/users";
import connection from "./db/config";
import { json, urlencoded } from "body-parser";

const app: Express = express();

const mqttServer: string = "f69ddce2c70f45d98ef6f55e73514133.s2.eu.hivemq.cloud";

const mqttClient: MqttClient = connect(`mqtt://${mqttServer}` , { port: 8883 });

app.use(json());

app.use(urlencoded({ extended: true }));

app.use("/users", userRoutes);

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    res.status(500).json({ message: err.message });
  }
);

connection
  .sync()
  .then(() => {
    console.log("Banco de dados conectado com sucesso");
  })
  .catch((err) => {
    console.log("Erro", err);
  });

app.listen(3000, () => {
  console.log("Servidor iniciado na porta 3000");
});

mqttClient.subscribe('presence_phaa', () => {
  console.log("Inscrito com sucesso no tópico MQTT");
});
mqttClient.publish('presence_phaa', 'boa tarde');

mqttClient.on('message_phaa', (topic: string, message: string) => {
  console.log(message)
});