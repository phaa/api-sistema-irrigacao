#include <SPI.h>
#include <Ethernet.h>
#include <PubSubClient.h>
#include <DFRobot_DHT11.h>

// Debug
#define DEBUG
#ifdef DEBUG
#define DEBUG_PRINT(x)  DEBUG_PRINT (x)
#define DEBUG_PRINTLN(x)  DEBUG_PRINTLN (x)
#else
#define DEBUG_PRINT(x)
#define DEBUG_PRINTLN(x)
#endif

// Ethernet
#define ETHERNET_CS_PIN 10
byte mac[] = { 0x00, 0xAA, 0xBB, 0xCC, 0xDE, 0x02 };
EthernetClient ethClient;

// MQTT
const char* mqttServer = "10.44.1.35";
const char* inputTopic = "esp32/placa/input";
const char* outputTopic = "esp32/server/input";
PubSubClient client(ethClient);

// Sensores
DFRobot_DHT11 DHT;
#define DHT11_PIN 54


void setup() {
  Serial.begin(9600);

  for (int pin = 2; pin <= 53; pin++) {
    pinMode(pin, OUTPUT);
  }

  connectEthernet();
  iniMQTT();

  // buscar pinos de saída no servidor
  delay(1500);
}

void loop() {
  DHT.read(DHT11_PIN);

  if (!client.connected()) {
    reconnect();
  }
  client.loop();
}

void initEthernet() {
  Ethernet.init(CS_PIN);
  // Inicia a conexão ethernet:
  DEBUG_PRINTLN("Incializando Ethernet");
  if (Ethernet.begin(mac) == 0) {
    DEBUG_PRINTLN("Falha ao conseguir endereço via DHCP");
    if (Ethernet.hardwareStatus() == EthernetNoHardware) {
      DEBUG_PRINTLN("Módulo ethernet não encontrado.");
    } else if (Ethernet.linkStatus() == LinkOFF) {
      DEBUG_PRINTLN("Cabo ethernet não conectado.");
    }
    // Daqui em diante não há nada para fazer, então para no loop
    while (true) {
      delay(1);
    }
  }
  // Printa o IP
  DEBUG_PRINT("IP atribuído: ");
  DEBUG_PRINTLN(Ethernet.localIP());
}


void callback(char* topic, byte* payload, unsigned int length) {
  DEBUG_PRINT("Mensagem recebida [");
  DEBUG_PRINT(topic);
  DEBUG_PRINT("] ");

  // Monta uma string com os bytes recebidos
  String inputString;
  for (int i = 0; i < length; i++) {
    DEBUG_PRINT((char)payload[i]);
    inputString += (char)payload[i];
  }
  DEBUG_PRINTLN();

  if (String(topic) == "esp32/placa/input") {
    // exemplo do comando:
    // A:15 leitura analógica da porta 15
    // HIGH:2 ligar pino 2
    // LOW:2 desligar pino 3
    uint8_t cmdIndex = inputString.indexOf(":");
    String cmd = inputString.substring(0, cmdIndex);
    uint8_t pin = inputString.substring(cmdIndex + 1, inputString.length()).toInt();

    // pin/cmd/value? | 10/a/78.0 | 10/on | 10/off
    String response = "";

    switch (cmd) {
      case "low":
        response = String(pin) + "/LOW";
        break;
      case "high":
        response = String(pin) + "/HIGH";
        // retorna leitura de incidência solar
        break;
      case "soil_moisture":
        // retorna leitura do sensor de solo
        
        response = String(pin) + "/soil_moisture/" + String();
        break;
      case "air_temperature":
        // retorna leitura do DHT 11.temperatura
        break;
      case "air_humidity":
        // retorna leitura do DHT 11.umidade
        break;
      case "sun_incidence":
        // retorna leitura de incidência solar
        break;
      // adicionar casos para sensor de fluxo de água
      default:
        DEBUG_PRINTLN("Não encontrado sensor desse tipo");
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
    else if (cmd.equals("LOW")) {
      digitalWrite(pin, LOW);
      response = String(pin) + "/LOW";
    }
    else if (cmd.equals("HIGH")) {
      digitalWrite(pin, HIGH);

    }

    DEBUG_PRINTLN(response);
    int strLen = response.length() + 1;
    char charArray[strLen];
    response.toCharArray(charArray, strLen);

    client.publish(outputTopic, charArray);
  }
}


// MQTT
void initMQTT() {
  client.setServer(mqttServer, 1883);
  client.setCallback(callback);
}

void reconnect() {
  // Repete o loop enquanto não estiver conectado
  while (!client.connected()) {
    DEBUG_PRINTLN("Iniciando conexão MQTT...");
    if (client.connect("arduino-estufa")) {
      DEBUG_PRINTLN("Conexão bem sucedida");
      //client.publish("outTopic", "hello world");
      client.subscribe(inputTopic);
      DEBUG_PRINT("Inscrito no tópico: ");
      DEBUG_PRINTLN(inputTopic);
    } else {
      DEBUG_PRINT("erro, rc=");
      DEBUG_PRINT(client.state());
      DEBUG_PRINTLN(" tentando novamente em 5s");
      delay(5000);
    }
  }
}
