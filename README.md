# Agrosoft - API for Greenhouse IoT Irrigation System

<p align="center">
  <img src="https://github.com/phaa/iot-sistema-irrigacao/blob/main/estufa1.jpeg" title="Project at VI Secitex" width="500" />
</p>

<p align="center">
  <img src="https://github.com/phaa/iot-sistema-irrigacao/blob/main/estufa2.jpeg" title="Project at VI Secitex" width="500" />
</p>

<p align="center">
  <img src="https://github.com/phaa/iot-sistema-irrigacao/blob/main/estufa3.jpeg" title="Project at VI Secitex" width="500" />
</p>

## Presentation

This innovative project originated during the Internet of Things (IoT) course of the Internet Systems Technology undergraduate program at the Federal Institute of Education, Science and Technology of Rio Grande do Norte (IFRN), *Campus* Canguaretama, and was warmly received and recognized by the board at the VI Science, Technology and Extension Week (Secitex) of IFRN in Currais Novos in 2023.

The central motivation was to develop a low-cost and accessible automation system for greenhouses, specifically aimed at family farmers who face challenges in managing larger production areas, with the goal of empowering them to significantly increase their productivity through the intelligent optimization of resource use, constantly maintaining crops in ideal temperature and soil/air humidity conditions.

This TypeScript *backend* API serves as the bridge between the IoT devices (based on ESP32 and Arduino) and the system's control and data storage logic, receiving sensor data via MQTT, processing it, storing it in MongoDB Atlas, and sending control commands to the actuators, also via MQTT.

## Technologies Used

* **TypeScript:** Programming language that adds static typing to JavaScript, improving code maintainability and scalability.
* **Node.js:** *Server-side* JavaScript runtime environment.
* **Express:** Minimalist and flexible web framework for Node.js, used to build the RESTful API.
* **Mongoose:** MongoDB object modeling library for Node.js, providing an elegant way to interact with the database.
* **MQTT (Message Queuing Telemetry Transport):** Lightweight messaging protocol used for communication between the API and IoT devices.
* **MongoDB Atlas:** Scalable and fully managed cloud database service.
* **.env:** Used to securely manage environment variables.
* **cors:** Express middleware to enable Cross-Origin Resource Sharing (CORS).
* **body-parser:** Express middleware to parse HTTP request bodies.

## Setup and Installation

To run this API locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/phaa/api-sistema-irrigacao.git](https://github.com/phaa/api-sistema-irrigacao.git)
    cd api-sistema-irrigacao
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure environment variables:**
    Create a `.env` file in the project root and fill it with the following information:
    ```env
    PORT=3000 # Or your preferred port
    MONGO_USER=<your_mongodb_atlas_username>
    MONGO_PASSWORD=<your_mongodb_atlas_password>
    MONGO_PATH=<your_mongodb_atlas_cluster_url>
    MQTT_BROKER_URL=<your_mqtt_broker_url>
    ```
    Make sure to replace the placeholders (`<...>`) with your correct credentials and URLs.

4.  **Run the API:**
    ```bash
    npm start
    ```
    This command will start the development server using `ts-node-dev`.

## Main Features

The API implements the following main functionalities:

* **MQTT Communication:**
    * Subscribed to the `esp32/server/input` topic to receive commands and data from ESP32 devices.
    * Publishes commands for actuators on the `esp32/placa/input` topic.
    * Processes MQTT messages to update the state of sensors and actuators in the database.
* **Sensor Management:**
    * Stores information about sensors (type, pin, description, reference values).
    * Receives sensor data (temperature, humidity, soil moisture, water level) and updates it in the database.
    * Implements logic to convert raw sensor values into meaningful units (e.g., soil moisture in percentage).
* **Actuator Management:**
    * Stores information about actuators (type, pin, description, current state).
    * Receives commands to change the state of actuators (on/off) via MQTT.
    * Provides endpoints to manually control actuators via HTTP requests (implemented in the controllers).
* **Automation Logic:**
    * Implements an automatic mode where the API makes decisions about triggering actuators based on sensor values and predefined limits.
    * The control logic for irrigation, lighting, and exhaust is based on the minimum and maximum values configured for each sensor.
* **Reading Storage:**
    * Periodically (every hour, configurable), stores sensor readings in the database for history and future analysis.
* **RESTful Endpoints:**
    * Provides endpoints to manage users, sensors, actuators, and readings via HTTP requests (implemented in the controllers).

## File Structure
```
api-sistema-irrigacao/
├── actuators/
│   ├── actuator.controller.ts
│   ├── actuator.interface.ts
│   └── actuator.model.ts
├── controllers/
│   ├── user.controller.ts
│   ├── sensor.controller.ts
│   ├── actuator.controller.ts
│   └── reading.controller.ts
├── interfaces/
│   ├── actuatorPayload.interface.ts
│   └── sensorPayload.interface.ts
├── models/
│   ├── user.model.ts
│   ├── sensor.model.ts
│   ├── actuator.model.ts
│   └── reading.model.ts
├── sensors/
│   ├── sensor.controller.ts
│   ├── sensor.interface.ts
│   └── sensor.model.ts
├── utils/
│   └── timer.ts
├── app.ts
├── .env
├── .gitignore
├── package-lock.json
├── package.json
├── README.md
└── tsconfig.json
```

## Next Steps and Future Improvements

Similar to the IoT part, this API can be improved with:

* Implementation of authentication and authorization to protect API endpoints.
* Creation of unit and integration tests to ensure code robustness.
* Improvements to the automation logic, perhaps with the introduction of more complex rules or machine learning.
* Implementation of a more detailed logging system.
* API documentation using tools like Swagger or OpenAPI.

## Developer

[Pedro Henrique Amorim de Azevedo](https://github.com/phaa)
