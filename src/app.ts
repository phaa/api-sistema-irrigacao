import express, { Express, Request, Response } from "express";
import { MqttClient, connect } from "mqtt";
import userRoutes from "./routes/users";
import connection from "./db/config";
import { json, urlencoded } from "body-parser";

const app: Express = express();
                                                      
const host = "test.mosquitto.org";
const port = "1883";
const connectUrl = `mqtt://${host}:${port}`;
const mqttClient: MqttClient = connect(connectUrl);

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

app.listen(3000, () => {
  console.log("Servidor iniciado na porta 3000");
});

const topic = "/nodejs/mqtt";

mqttClient.on("connect", () => {
  console.log("Connected");

});

mqttClient.subscribe([topic], () => {
  console.log(`Subscribe to topic "${topic}"`);
});

mqttClient.publish(topic, "nodejs mqtt test", { qos: 0, retain: false }, (error) => {
  if (error) {
    console.error(error);
  }
});

mqttClient.on("message", (topic, payload) => {
  console.log("Received Message:", topic, payload.toString())
});


/*
connection
  .sync()
  .then(() => {
    console.log("Banco de dados conectado com sucesso");
  })
  .catch((err) => {
    console.log("Erro", err);
  });
*/