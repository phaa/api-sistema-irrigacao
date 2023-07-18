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
dht DHT;

int flowPin = 2;    //Este é o pino de entrada no Arduino
double flowRate;    //Este é o valor que pretende-se calcular
volatile int count; 

void setup() {
#ifdef DEBUG
  Serial.begin(115200);
#endif

  initPins();
  initEthernet();
  initMQTT();

  delay(1500);
}

void loop() {
  checkCommunication();
}

void callback(char* topic, byte* payload, unsigned int length) {
  /* DEBUG_PRINT("[MQTT] Mensagem recebida [");
  DEBUG_PRINT(topic);
  DEBUG_PRINT("] "); */

  // Monta uma string com os bytes recebidos
  String inputString;
  for (int i = 0; i < length; i++) {
    //DEBUG_PRINT((char)payload[i]);
    inputString += (char)payload[i];
  }
  //DEBUG_PRINTLN();

  if (String(topic) == "esp32/placa/input") {

    String stringPin = getValue(inputString, '/', 0);
    String cmd = getValue(inputString, '/', 1);
    String store = getValue(inputString, '/', 2);

    uint8_t pin = stringPin.toInt();


    // pin/cmd/value? | 10/a/78.0 | 10/high | 10/low
    String response = stringPin;
    if (cmd.equals("low")) {
      response += "/low";
      digitalWrite(pin, HIGH);
    } else if (cmd.equals("high")) {
      response += "/high";
      digitalWrite(pin, LOW);
    } else if (cmd.equals("soil_moisture")) {
      // novo Agua: 305, Ar: 682 | antigo Agua:269, Ar: 632
      short soilMoisture = map(analogRead(pin), 269, 632, 100, 0);

      // Normaliza a entrada do sensor
      if (soilMoisture > 100) {
        soilMoisture = 100;
      } else if (soilMoisture < 0) {
        soilMoisture = 0;
      }

      response += "/soil_moisture/" + String(soilMoisture);
    } else if (cmd.equals("air_temperature")) {
      DHT.read11(pin);
      response += "/air_temperature/" + String(DHT.temperature);
    } else if (cmd.equals("air_humidity")) {
      DHT.read11(pin);
      response += "/air_humidity/" + String(DHT.humidity);
    } else if (cmd.equals("sun_incidence")) {
      response += "/sun_incidence/" + String(analogRead(pin));
    } else if (cmd.equals("water_level")) {
      response += "/water_level/" + String(analogRead(pin));
    }

    if (store != "") {
      response = response + "/" + store;
    }

    DEBUG_PRINT("[MQTT] Resposta: ");
    DEBUG_PRINTLN(response);

    int strLen = response.length() + 1;
    char charArray[strLen];
    response.toCharArray(charArray, strLen);

    mqttClient.publish(outputTopic, charArray);
  }
}

// Pinos
void initPins() {
  pinMode(2, INPUT); //Seta o pino de entrada
  attachInterrupt(0, Flow, RISING);  //Configura o interruptor 0 (pino 2 no Arduino Uno) para rodar a função "Flow"

  for (int pin = 3; pin <= 7; pin++) {
    pinMode(pin, OUTPUT);
    digitalWrite(pin, HIGH);
  }
}

// Sensores

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

String getValue(String data, char separator, int index) {
  int found = 0;
  int strIndex[] = { 0, -1 };
  int maxIndex = data.length() - 1;

  for (int i = 0; i <= maxIndex && found <= index; i++) {
    if (data.charAt(i) == separator || i == maxIndex) {
      found++;
      strIndex[0] = strIndex[1] + 1;
      strIndex[1] = (i == maxIndex) ? i + 1 : i;
    }
  }
  return found > index ? data.substring(strIndex[0], strIndex[1]) : "";
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