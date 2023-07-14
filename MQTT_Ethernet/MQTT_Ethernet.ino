#include <SPI.h>
#include <Ethernet.h>
#include <PubSubClient.h>
#include <dht.h>
//https://portal.vidadesilicio.com.br/wp-content/uploads/2017/05/DHTlib.zip

// Debug
#define DEBUG
#ifdef DEBUG
#define DEBUG_PRINT(x) Serial.print(x)
#define DEBUG_PRINTLN(x) Serial.println(x)
#else
#define DEBUG_PRINT(x)
#define DEBUG_PRINTLN(x)
#endif

// Ethernet
#define ETHERNET_CS_PIN 10
byte mac[] = { 0x00, 0xAA, 0xBB, 0xCC, 0xDE, 0x02 };
EthernetClient ethClient;

// MQTT 10.44.1.35
const char* mqttServer = "test.mosquitto.org";
const char* inputTopic = "esp32/placa/input";
const char* outputTopic = "esp32/server/input";
PubSubClient mqttClient(ethClient);

// Sensores
#define DHT11_PIN A0
dht DHT;
float humidity = 0;
float temperature = 0;

// Auxiliar para o contador
unsigned long previousTime5s = 0;

void setup() {
  #ifdef DEBUG
    Serial.begin(115200);
  #endif
  
  initPins();
  initSensors();
  initEthernet();
  initMQTT();

  delay(1500);
}

void loop() {
  checkCommunication();
  //salvar temperatura e umidade de forma assincrona e salvar em variavel

  if (millis() - previousTime5s >= 5000) {
    DHT.read11(DHT11_PIN);

    temperature = DHT.temperature;
    humidity = DHT.humidity;

    previousTime5s = millis();
  }
}

void callback(char* topic, byte* payload, unsigned int length) {
  /* DEBUG_PRINT("[MQTT] Mensagem recebida [");
  DEBUG_PRINT(topic);
  DEBUG_PRINT("] "); */

  // Monta uma string com os bytes recebidos
  String inputString;
  for (int i = 0; i < length; i++) {
    DEBUG_PRINT((char)payload[i]);
    inputString += (char)payload[i];
  }
  DEBUG_PRINTLN();

  if (String(topic) == "esp32/placa/input") {
    // 15/sensor_typeleitura analógica da porta 15
    // 2/HIGH ligar pino 2
    // 3/LOW desligar pino 3
    uint8_t dotsIndex = inputString.indexOf("/");

    // mesmo que não usemos o pino diretamente no arduino, ele serve para identificar
    // o sensor/atuador no servidor
    String stringPin = inputString.substring(0, dotsIndex);
    uint8_t pin = stringPin.toInt();

    String cmd = inputString.substring(dotsIndex + 1, inputString.length());

    // pin/cmd/value? | 10/a/78.0 | 10/high | 10/low
    String response = "";
    if (cmd.equals("low")) {
      response = stringPin + "/low";
      digitalWrite(pin, HIGH);
    } else if (cmd.equals("high")) {
      response = stringPin + "/high";
      digitalWrite(pin, LOW);
    } else if (cmd.equals("soil_moisture")) {
      response = stringPin + "/soil_moisture/" + String("20");
    } else if (cmd.equals("air_temperature")) {
      response = stringPin + "/air_temperature/" + String(temperature);
      DEBUG_PRINT("No if de temperatura ");
      DEBUG_PRINTLN(temperature);
    } else if (cmd.equals("air_humidity")) {
      response = stringPin + "/air_humidity/" + String(humidity);
      DEBUG_PRINT("No if de umidade ");
      DEBUG_PRINTLN(humidity);
    } else if (cmd.equals("sun_incidence")) {
      // retorna leitura de incidência solar
    } else if (cmd.equals("flow")) {
      // retorna leitura do sensor de fluxo
      // verifica se a bomba tá ligada
      // se estiver desligada, mas o sensor tiver leitura, desativa a bomba
    } else if (cmd.equals("rain")) {
      // retorna leitura do sensor de chuva
    }

    DEBUG_PRINT("[MQTT] Resposta: ");
    DEBUG_PRINTLN(response);
    //DEBUG_PRINTLN(response);
    int strLen = response.length() + 1;
    char charArray[strLen];
    response.toCharArray(charArray, strLen);

    mqttClient.publish(outputTopic, charArray);
  }
}

// Pinos
void initPins() {
  for (int pin = 2; pin <= 53; pin++) {
    pinMode(pin, OUTPUT);
    digitalWrite(pin, HIGH);
  }
}

// Sensores
void initSensors() {
  // Umidade e temperatura do ar
  DHT.read11(DHT11_PIN);
  temperature = DHT.temperature;
  humidity = DHT.humidity;
}

// Checagem de comunicação
void checkCommunication() {
  checkEthernet();

  if (!mqttClient.connected()) {
    reconnect();
  }
  mqttClient.loop();
}

// Ethernet
void initEthernet() {
  Ethernet.init(ETHERNET_CS_PIN);
  // Inicia a conexão ethernet:
  DEBUG_PRINTLN("[Ethernet] Incializando Ethernet...");
  if (Ethernet.begin(mac) == 0) {
    DEBUG_PRINTLN("[Ethernet] Falha ao conseguir endereço via DHCP");
    if (Ethernet.hardwareStatus() == EthernetNoHardware) {
      DEBUG_PRINTLN("[Ethernet] Módulo ethernet não encontrado.");
    } else if (Ethernet.linkStatus() == LinkOFF) {
      DEBUG_PRINTLN("[Ethernet] Cabo ethernet não conectado.");
    }
    // Daqui em diante não há nada para fazer, então para no loop
    while (true) {
      delay(1);
    }
  }
  // Printa o IP
  DEBUG_PRINT("[Ethernet] IP atribuído: ");
  DEBUG_PRINTLN(Ethernet.localIP());
}

void checkEthernet() {
  switch (Ethernet.maintain()) {
    case 1:
      DEBUG_PRINTLN("[Ethernet] Ocorreu um erro ao renovar o IP");
      break;

    case 2:
      DEBUG_PRINTLN("[Ethernet] Renovação do IP feita com sucesso");
      DEBUG_PRINT("[Ethernet] Endereço IP: ");
      DEBUG_PRINTLN(Ethernet.localIP());
      break;

    case 3:
      DEBUG_PRINTLN("[Ethernet] Ocorreu um erro ao reconectar");
      break;

    case 4:
      DEBUG_PRINTLN("[Ethernet] Reconexão feita com sucesso");
      DEBUG_PRINT("[Ethernet] Endereço IP: ");
      DEBUG_PRINTLN(Ethernet.localIP());
      break;

    default:
      break;
  }
}

// MQTT
void initMQTT() {
  mqttClient.setServer(mqttServer, 1883);
  mqttClient.setCallback(callback);
}

void reconnect() {
  if (Ethernet.linkStatus() == LinkON) {
    DEBUG_PRINTLN("[Ethernet] Ethernet OK");
    while (!mqttClient.connected()) {
      DEBUG_PRINTLN("[MQTT] Iniciando conexão MQTT...");
      if (mqttClient.connect("arduino-estufa")) {
        DEBUG_PRINTLN("[MQTT] Conexão bem sucedida");
        //client.publish("outTopic", "hello world");
        mqttClient.subscribe(inputTopic);
        DEBUG_PRINT("[MQTT] Inscrito no tópico: ");
        DEBUG_PRINTLN(inputTopic);
      } else {
        DEBUG_PRINT("[MQTT] erro, rc=");
        DEBUG_PRINT(mqttClient.state());
        DEBUG_PRINTLN(" tentando novamente em 5s");
        delay(5000);
      }
    }
  } else {
    initEthernet();
  }
}


//    if (cmd.equals("READ")) {
//      // A0 = GPIO 54 e A15 = GPIO 69
//      if (pin >= 54 && pin <= 69) {
//        DEBUG_PRINTLN(analogRead(pin));
//        response = String(pin) + "/a/" + String(30);
//        DEBUG_PRINT("temp:");
//        DEBUG_PRINT(DHT.temperature);
//        DEBUG_PRINT("  humi:");
//        DEBUG_PRINTLN(DHT.humidity);
//      }
//    }