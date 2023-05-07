export const mqttConfig = {
    brokerUrl: "mqtt://localhost:1883", 
    port: 1883,
    topicsPrefix: "ifrn/esp32/estufa/",
    exaustTopics: [
        "/exaust",
    ],
    pumpTopics: [
        "/pump",
        "/solenoid",
    ],
    sensorsTopics: [
        "/air-temperature",
        "/air-humidity",
        "/soil-humidity",
        "/sun-incidence",
        "/rain",
    ]
}
