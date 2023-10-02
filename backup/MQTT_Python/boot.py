# boot.py
import network, utime, machine, ubinascii

SSID = "TUPI"
#SSID = "pc-esp"
SSID_PASSWORD = "12345678"



def connect_wifi():
    sta_if = network.WLAN(network.STA_IF)
    
    if not sta_if.isconnected():
        print('Conectando à rede', end='')
        sta_if.active(True)
        sta_if.connect(SSID, SSID_PASSWORD)
        
        while not sta_if.isconnected():
            print(".", end='')
            utime.sleep(1)
            
    print("\nConexão bem sucedida!")
    print("IP do Esp:", sta_if.ifconfig()[0])
    
print("Conectando à rede Wifi")
connect_wifi()

