# API para Sistema de Irrigação Inteligente (IoT)

<p align="center">
  <img src="https://github.com/phaa/iot-sistema-irrigacao/blob/main/estufa1.jpeg" title="Projeto na VI Secitex" width="500" />
</p>

<p align="center">
  <img src="https://github.com/phaa/iot-sistema-irrigacao/blob/main/estufa2.jpeg" title="Projeto na VI Secitex" width="500" />
</p>

<p align="center">
  <img src="https://github.com/phaa/iot-sistema-irrigacao/blob/main/estufa3.jpeg" title="Projeto na VI Secitex" width="500" />
</p>

## 🪴 Apresentação

Este projeto inovador nasceu durante a disciplina de Internet das Coisas (IoT) do curso de Tecnologia em Sistemas para Internet no Instituto Federal de Educação, Ciência e Tecnologia do Rio Grande do Norte (IFRN), *Campus* Canguaretama, e foi calorosamente recebido e reconhecido pela diretoria na VI Semana de Ciência, Tecnologia e Extensão (Secitex) do IFRN em Currais Novos em 2023. 

A motivação central foi desenvolver um sistema de automação de baixo custo e acessível para estufas, direcionado especialmente a produtores familiares que enfrentam desafios na gestão de áreas de produção maiores, com o objetivo de capacitá-los a aumentar significativamente sua produtividade através da otimização inteligente do uso de recursos, mantendo as plantações em condições ideais de temperatura e umidade do solo e do ar de forma constante. 

Esta API *backend* em TypeScript serve como a ponte entre os dispositivos IoT (baseados em ESP32 e Arduino) e a lógica de controle e armazenamento de dados do sistema, recebendo dados de sensores via MQTT, processando-os, armazenando-os em MongoDB Atlas e enviando comandos de controle para os atuadores, também via MQTT.

## ⚙️ Tecnologias Utilizadas

* **TypeScript:** Linguagem de programação que adiciona tipagem estática ao JavaScript, melhorando a manutenção e escalabilidade do código.
* **Node.js:** Ambiente de execução JavaScript *server-side*.
* **Express:** Framework web minimalista e flexível para Node.js, utilizado para construir a API RESTful.
* **Mongoose:** Biblioteca de modelagem de objetos MongoDB para Node.js, fornecendo uma maneira elegante de interagir com o banco de dados.
* **MQTT (Message Queuing Telemetry Transport):** Protocolo de mensagens leve, utilizado para a comunicação entre a API e os dispositivos IoT.
* **MongoDB Atlas:** Serviço de banco de dados na nuvem escalável e totalmente gerenciado.
* **.env:** Utilizado para gerenciar variáveis de ambiente de forma segura.
* **cors:** Middleware do Express para habilitar o Cross-Origin Resource Sharing (CORS).
* **body-parser:** Middleware do Express para analisar corpos de requisição HTTP.

## 🛠️ Configuração e Instalação

Para executar esta API localmente, siga os seguintes passos:

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/phaa/api-sistema-irrigacao.git
    cd api-sistema-irrigacao
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    # ou
    yarn install
    ```

3.  **Configure as variáveis de ambiente:**
    Crie um arquivo `.env` na raiz do projeto e preencha com as seguintes informações:
    ```env
    PORT=3000 # Ou a porta de sua preferência
    MONGO_USER=<seu_usuario_mongodb_atlas>
    MONGO_PASSWORD=<sua_senha_mongodb_atlas>
    MONGO_PATH=<url_do_seu_cluster_mongodb_atlas>
    MQTT_BROKER_URL=<url_do_seu_broker_mqtt>
    ```
    Certifique-se de substituir os placeholders (`<...>` ) pelas suas credenciais e URLs corretas.

4.  **Execute a API:**
    ```bash
    npm start
    ```
    Este comando iniciará o servidor de desenvolvimento utilizando o `ts-node-dev`.

## ⚙️ Funcionalidades Principais

A API implementa as seguintes funcionalidades:

* **Comunicação MQTT:**
    * Inscrita no tópico `esp32/server/input` para receber comandos e dados dos dispositivos ESP32.
    * Publica comandos para os atuadores no tópico `esp32/placa/input`.
    * Processa mensagens MQTT para atualizar o estado de sensores e atuadores no banco de dados.
* **Gerenciamento de Sensores:**
    * Armazena informações sobre os sensores (tipo, pin, descrição, valores de referência).
    * Recebe dados de sensores (temperatura, umidade, umidade do solo, nível da água) e os atualiza no banco de dados.
    * Implementa lógica para converter valores brutos de sensores em unidades significativas (ex: umidade do solo em porcentagem).
* **Gerenciamento de Atuadores:**
    * Armazena informações sobre os atuadores (tipo, pin, descrição, estado atual).
    * Recebe comandos para alterar o estado dos atuadores (ligar/desligar) via MQTT.
    * Fornece endpoints para controlar manualmente os atuadores via requisições HTTP (implementado nos controllers).
* **Lógica de Automação:**
    * Implementa um modo automático onde a API toma decisões sobre o acionamento dos atuadores com base nos valores dos sensores e em limites predefinidos.
    * A lógica de controle para irrigação, iluminação e exaustão é baseada nos valores mínimo e máximo configurados para cada sensor.
* **Armazenamento de Leituras:**
    * Periodicamente (a cada hora, configurável), armazena as leituras dos sensores no banco de dados para histórico e futuras análises.
* **Endpoints RESTful:**
    * Fornece endpoints para gerenciar usuários, sensores, atuadores e leituras através de requisições HTTP (implementados nos controllers).

## 📂 Estrutura de Arquivos
```
api-sistema-irrigacao/
├── actuators/
│   ├── actuator.controller.ts
│   ├── actuator.interface.ts
│   └──actuator.model.ts
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

## 🚀 Próximos Passos e Melhorias Futuras

Assim como na parte de IoT, esta API pode ser aprimorada com:

* Implementação de autenticação e autorização para proteger os endpoints da API.
* Criação de testes unitários e de integração para garantir a robustez do código.
* Melhorias na lógica de automação, talvez com a introdução de regras mais complexas ou aprendizado de máquina.
* Implementação de um sistema de logs mais detalhado.
* Documentação da API utilizando ferramentas como Swagger ou OpenAPI.

## 🧑‍💻 Desenvolvedor

[Pedro Henrique Amorim de Azevedo](https://github.com/phaa)
