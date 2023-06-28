"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const sensor_controller_1 = __importDefault(require("./sensors/sensor.controller"));
const validate_env_1 = __importDefault(require("./utils/validate-env"));
const greenhouse_controller_1 = __importDefault(require("./greenhouses/greenhouse.controller"));
const actuator_controller_1 = __importDefault(require("./actuators/actuator.controller"));
const board_controller_1 = __importDefault(require("./board/board.controller"));
const users_controller_1 = __importDefault(require("./users/users.controller"));
(0, validate_env_1.default)();
const app = new app_1.default([
    new users_controller_1.default(),
    new greenhouse_controller_1.default(),
    new board_controller_1.default(),
    new sensor_controller_1.default(),
    new actuator_controller_1.default(),
]);
app.initialize();
