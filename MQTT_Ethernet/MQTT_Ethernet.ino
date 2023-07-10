#include <SPI.h>
#include <Ethernet.h>
#include <PubSubClient.h>
#include <DFRobot_DHT11.h>

// Ethernet
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

  client.setServer(mqttServer, 1883);
  client.setCallback(callback);

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

void connectEthernet() {
  Serial.print("Iniciando conexão Ethernet...");

  if (Ethernet.begin(mac) == 0) {
    Serial.println("Ocorreu um problema ao obter um endereço IP");
    for (;;)
      ;
  }

  Serial.println("IP recebido por DHCP: ");
  for (byte thisByte = 0; thisByte < 4; thisByte++) {
    Serial.print(Ethernet.localIP()[thisByte], DEC);
    Serial.print(".");
  }
  Serial.println();
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Mensagem recebida [");
  Serial.print(topic);
  Serial.print("] ");

  // Monta uma string com os bytes recebidos
  String inputString;
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
    inputString += (char)payload[i];
  }
  Serial.println();

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
      case "":
        digitalWrite(2, HIGH);
        break;
      case 'b':
        digitalWrite(3, HIGH);
        break;
      case 'c':
        digitalWrite(4, HIGH);
        break;
      case 'd':
        digitalWrite(5, HIGH);
        break;
      case 'e':
        digitalWrite(6, HIGH);
        break;
      default:
        // turn all the LEDs off:
        for (int thisPin = 2; thisPin < 7; thisPin++) {
          digitalWrite(thisPin, LOW);
        }
    }

    if (cmd.equals("READ")) {
      // A0 = GPIO 54 e A15 = GPIO 69
      if (pin >= 54 && pin <= 69) {
        Serial.println(analogRead(pin));
        response = String(pin) + "/a/" + String(30);
        Serial.print("temp:");
        Serial.print(DHT.temperature);
        Serial.print("  humi:");
        Serial.println(DHT.humidity);
      }
    } else if (cmd.equals("LOW")) {
      digitalWrite(pin, LOW);
      response = String(pin) + "/LOW";
    } else if (cmd.equals("HIGH")) {
      digitalWrite(pin, HIGH);
      response = String(pin) + "/HIGH";
    }

    Serial.println(response);
    int strLen = response.length() + 1;
    char charArray[strLen];
    response.toCharArray(charArray, strLen);

    client.publish(outputTopic, charArray);
  }
}

void reconnect() {
  // Repete o loop enquanto não estiver conectado
  while (!client.connected()) {
    Serial.println("Iniciando conexão MQTT...");
    if (client.connect("arduino-estufa")) {
      Serial.println("Conexão bem sucedida");
      //client.publish("outTopic", "hello world");
      client.subscribe(inputTopic);
      Serial.print("Inscrito no tópico: ");
      Serial.println(inputTopic);
    } else {
      Serial.print("erro, rc=");
      Serial.print(client.state());
      Serial.println(" tentando novamente em 5s");
      delay(5000);
    }
  }
}