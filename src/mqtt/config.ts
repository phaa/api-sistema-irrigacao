export const MqttConfig = {
    brokerUrl: "mqtt://localhost:1883", 
    port: 1883,
    topicsPrefix: "ifrn/esp32/estufa/",
    actuatorsTopics: {
        pump: "/pump",
        solenoid: "/solenoid",
        exaust: "/exaust"
    },
    sensorsTopics: {
        allData: "/all-data",
        airTemperature: "/air-temperature",
        airHumidity: "/air-humidity",
        soilHumidity: "/soil-humidity",
        sunIncidente: "/sun-incidence",
        rainIncidente: "/rain-incidence",
    }
}
