# main.py
import time
import ubinascii
from umqtt.simple import MQTTClient
from machine import Pin, ADC, reset
import urequests as requests
import json
import dht

# MQTT
mqttClient = None
MQTT_BROKER = "test.mosquitto.org"
CLIENT_ID = ubinascii.hexlify(machine.unique_id())
SUBSCRIBE_TOPIC = b"esp32/placa/input"
PUBLISH_TOPIC = b"esp32/server/input"

# Controle para loop não blocante
last_publish = time.time()
loop_interval = 10
 
# Saídas digitais
outputs = {}

# Sensores
sensors = {}


def reset_esp():
    print("Resetando")
    time.sleep(5)
    reset()
    
    
def toggle_output_pin(pin, value):
    global outputs
    if pin in outputs:
        # Se o pino já foi inicializado, muda o valor
        outputs[pin].value(value)
    else:
        # Se não existe, inicializa ele, armazena
        pino = Pin(pin, Pin.OUT, value=value)
        outputs[pin] = pino
        
        
    print(outputs)


def create_sensor_instance(sensor_type, pin):
    if sensor_type == 'dht11':
        sensor = dht.DHT11(Pin(pin))
        return sensor
    else:
        # Todos os outros sensores usam apenas leituras analógicas padrão
        sensor = ADC(Pin(pin))
        sensor.atten(ADC.ATTN_11DB)
        return sensor
    

def setup_sensors():
    global sensors
    response = requests.get(url='http://10.0.0.205:8000/sensors').json()
    sensors_arr = response['sensors']
    
    for sensor in sensors_arr:
        pin = sensor['pin']
        sensor_type = sensor['sensorType']
        instance = create_sensor_instance(sensor_type, pin)
        sensors[pin] = {
            'value': 0,
            'type': sensor_type,
            'instance': instance
        }


def read_sensors():
    global sensors
    for pin, sensor in sensors.items():
        sensor_instance = sensor['instance']
        try:
            if sensor['type'] == 'dht11':
                sensor_instance.measure()
                temp = sensor_instance.temperature()
                hum = sensor_instance.humidity()
                sensor['value'] = '{}/{}'.format(temp, hum)
            else:
                sensor['value'] = sensor_instance.read()
        except:
                print('Não foi possível ler o sensor')
    '''
    print('Sensores com valor: ')
    #print(sensors)
    response = {}
    for pin, sensor_props in sensors.items():
        response[pin] = sensor_props['value']
                
    print(json.dumps(response) + '\n')
    '''


def send_sensor_data():
    response = { 'method': 'get_sensor_data' }
    sensor_data = []
    
    global sensors
    for pin, sensor_props in sensors.items():
        sensor_data.append({
            'pin': pin,
            'value': sensor_props['value']
        })
                
    response['data'] = sensor_data
    print(json.dumps(response).encode())
    mqttClient.publish(PUBLISH_TOPIC, json.dumps(response).encode())
    

def sub_cb(topic_binary, msg_binary):
    topic = topic_binary.decode()
    params = msg_binary.decode().split("/")
    
    pin = int(params[0])
    state = params[1]
    
    response = {}
    
    if topic == 'esp32/placa/input':
        if state == 'low' or state == 'high':
            toggle_output_pin(pin, 0 if state == 'low' else 1)
            response['method'] = 'toggle'
            response['state'] = state
            response['pin'] = pin
            
    # Publica a payload
    mqttClient.publish(PUBLISH_TOPIC, json.dumps(response).encode())


# debug quantidade de memória disponível
def free(full=False):
  gc.collect()
  F = gc.mem_free()
  A = gc.mem_alloc()
  T = F+A
  P = '{0:.2f}%'.format(F/T*100)
  return ('Total:{0} Free:{1} ({2})'.format(T,F,P))


def setup_mqtt():
    print(f"Iniciando conexão com o broker: {MQTT_BROKER}")
    
    global mqttClient
    mqttClient = MQTTClient(CLIENT_ID, MQTT_BROKER, 1883)
    mqttClient.set_callback(sub_cb)
    mqttClient.connect()
    mqttClient.subscribe(SUBSCRIBE_TOPIC)
    
    print(f"Conectado ao broker: {MQTT_BROKER}")
    
    while True:
        mqttClient.check_msg()
        
        # Publica mensagem a cada segundo
        global last_publish
        if (time.time() - last_publish) >= loop_interval:
            read_sensors()
            send_sensor_data()
            last_publish = time.time()
            
        time.sleep(1)


if __name__ == "__main__":
    while True:
        try:
            # Pegar todos os sensores
            setup_sensors()
            #  Inicializar MQTT
            setup_mqtt()
        except OSError as e:
            print("Erro: " + str(e))
            reset_esp()
            
            
            
'''if cmd == "soil_moisture":
            soil_moisture = get_random_reading()
            response += "/soil_moisture/" + str(soil_moisture)

        if cmd == "air_temperature":
            air_temperature = get_random_reading()
            response += "/air_temperature/" + str(air_temperature)

        if cmd == "air_humidity":
            air_humidity = get_random_reading()
            response += "/air_humidity/" + str(air_humidity)

        if cmd == "sun_incidence":
            sun_incidence = get_random_reading()
            response += "/sun_incidence/" + str(sun_incidence)

        if cmd == "water_level":
            water_level = get_random_reading()
            response += "/water_level/" + str(water_level)
            
        #print(response)
        
        if sensor_type == 'soil_moisture':
            pin = ADC(Pin(pin))
            pin.atten(ADC.ATTN_11DB)
            return pin
        elif sensor_type == 'dht11':
            return read_dht11
        elif sensor_type == 'sun_incidence':
            return read_sun_incidence
        elif sensor_type == 'water_level':
            return read_water_level
'''


