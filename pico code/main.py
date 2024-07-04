import network
import utime
import time
import urequests
from umqtt.simple import MQTTClient
from machine import Pin, ADC, RTC
import json
import ntptime

# Function to load configuration
def load_config(filename='config.txt'):
    config = {}
    with open(filename, 'r') as file:
        for line in file:
            if '=' in line:
                key, value = line.strip().split('=', 1)
                config[key] = value
    return config

# Load the configuration
config = load_config()
timelist = []

# WiFi and MQTT Configuration
wifi_ssid = config.get('WIFI_SSID')
wifi_password = config.get('WIFI_PASSWORD')
mqtt_host = config.get('MQTT_HOST')
mqtt_username = config.get('MQTT_USERNAME')
mqtt_password = config.get('MQTT_PASSWORD')
mqtt_client_id = config.get('MQTT_CLIENT_ID')
mqtt_publish_data = config.get('MQTT_PUBLISH_DATA')
mqtt_publish_lightswitchstate = config.get('MQTT_PUBLISH_LIGHTSWITCHSTATE')
mqtt_subscribe_schedulekey = config.get('MQTT_PUBLISH_SCHEDULE_KEY')
mqtt_subscribe_lightswitch = config.get('MQTT_SUBSCRIBE_LIGHTSWITCH')
mqtt_subscribe_handleschedule = config.get('MQTT_SUBSCRIBE_HANDLESCHEDULE')
mqtt_subscribe_automanual = config.get('MQTT_SUBSCRIBE_AUTOMANUAL')
mqtt_subscribe_sensor = config.get('MQTT_SUBSCRIBE_SENSOR')
mqtt_publish_curtains = config.get('MQTT_PUBLISH_CURTAINS')

# Timezone offset in seconds (2 hours ahead for UTC+2)
timezone_offset = 2 * 3600  # 2 hours * 3600 seconds/hour

# Connect to WiFi
wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.connect(wifi_ssid, wifi_password)
while not wlan.isconnected():
    print('Waiting for connection...')
    utime.sleep(1)
print("Connected to WiFi")

# Initialize MQTT client and set message callback
sensitivity = 50.0  # Default sensitivity
auto_mode = True    # Default to automatic mode
current_light_switch_state = 0
last_publish_time = 0
sensor_readings = []
schedule_action_performed = False  # Flag to track schedule actions
light = 0
key = []

# Initialize RTC for time keeping
rtc = RTC()

# Function to synchronize time with NTP server
def synchronize_time():
    ntptime.settime()  # Synchronize time with NTP server
    print("Time synchronized:", utime.localtime())

# Initialize RTC synchronization
synchronize_time()

# MQTT message callback function
def on_message(topic, msg):
    global sensitivity, auto_mode, timelist, current_light_switch_state, schedule_action_performed, key
    print(f"Received message '{msg}' on topic '{topic}'")
    
    # Handle light switch
    if topic == mqtt_subscribe_lightswitch.encode():
        if msg == b'1':
            red.value(1)
            current_light_switch_state = 1
        elif msg == b'0':
            red.value(0)
            current_light_switch_state = 0

    # Handle auto/manual switch
    if topic == mqtt_subscribe_automanual.encode():
        if msg == b'1':
            auto_mode = True
            print("Mode set to automatic")
        elif msg == b'0':
            auto_mode = False
            print("Mode set to manual")

    # Handle schedule
    if topic == mqtt_subscribe_handleschedule.encode():
        msg_string = msg.decode('utf-8')
        msg_dict = json.loads(msg_string)
        print(msg_dict['method'])
        if int(msg_dict['method']) == 1:  # Create schedule
            timelist.append(msg_dict)
            print(f"Schedule added: {msg_dict}")
        elif int(msg_dict['method']) == 0:  # Delete schedule
            timelist = [entry for entry in timelist if entry["time"] != msg_dict["time"]]
            print(f"Schedule removed: {msg_dict}")
            print(timelist)

    if topic == mqtt_subscribe_schedulekey.encode():
        msg_string = msg.decode('utf-8')
        msg_dict = json.loads(msg_string)
        key.append(msg_dict['fakeKey'])

    # Handle sensitivity changes
    if topic == mqtt_subscribe_sensor.encode():
        msg_string = msg.decode('utf-8')
        if msg_string.startswith("sensitivity:"):
            sensitivity = float(msg_string.split(":")[1])
            print(f"Sensitivity set to {sensitivity}")

# Initialize MQTT client
mqtt_client = MQTTClient(client_id=mqtt_client_id, server=mqtt_host,
                         user=mqtt_username, password=mqtt_password)
mqtt_client.set_callback(on_message)
mqtt_client.connect()
mqtt_client.subscribe(mqtt_subscribe_lightswitch)
mqtt_client.subscribe(mqtt_subscribe_handleschedule)
mqtt_client.subscribe(mqtt_subscribe_schedulekey)
mqtt_client.subscribe(mqtt_subscribe_automanual)
mqtt_client.subscribe(mqtt_subscribe_sensor)

# Publish initial values
mqtt_client.publish(mqtt_subscribe_sensor, 'sensitivity:50')
mqtt_client.publish(mqtt_subscribe_automanual, '1')

# LED setup
red = Pin('GP10', Pin.OUT)

# New light sensor setup
photoPIN = 26
photoRes = ADC(Pin(photoPIN))

# Hall-effect sensor setup
sensor_pin = 16
sensor = Pin(sensor_pin, Pin.IN)

last_sent_state = None

# Function to read light sensor
def read_light():
    light = photoRes.read_u16()
    light = round(light / 65535 * 100, 2)
    return light

# Helper function to check and execute schedules
def check_schedules():
    global schedule_action_performed, auto_mode, last_sent_state
    current_time = utime.localtime()  # Get current UTC time
    # Adjust time for timezone offset
    adjusted_time = utime.mktime(current_time) + timezone_offset
    local_time = utime.localtime(adjusted_time)

    formatted_time = f"{local_time[3]:02}:{local_time[4]:02}"  # Format current time as HH:MM

    # Loop through schedule entries and check if it's time to perform actions
    for entry in timelist:
        if entry["time"] == formatted_time:
            if not schedule_action_performed:
                auto_mode = False  # Disable auto mode due to schedule action
                if entry["state"] == 1:
                    red.value(1)
                    mqtt_client.publish(mqtt_publish_lightswitchstate, '1')
                    mqtt_client.publish(mqtt_subscribe_lightswitch, '1')
                    current_light_switch_state = 1
                    print("Light turned ON as per schedule")
                elif entry["state"] == 0:
                    red.value(0)
                    mqtt_client.publish(mqtt_publish_lightswitchstate, '0')
                    mqtt_client.publish(mqtt_subscribe_lightswitch, '0')
                    current_light_switch_state = 0
                    print("Light turned OFF as per schedule")
                    
                del timelist[0]
                schedule_action_performed = True
        else:
            schedule_action_performed = False

# Function to publish median of sensor readings every 30 seconds
def publish_sensor_data():
    global sensor_readings
    median_value = 0.0
    
    if sensor_readings:
        sensor_readings.sort()
        if len(sensor_readings) % 2 == 0:
            median_value = (sensor_readings[len(sensor_readings) // 2 - 1] + sensor_readings[len(sensor_readings) // 2]) / 2.0
        else:
            median_value = sensor_readings[len(sensor_readings) // 2]
        
        mqtt_client.publish(mqtt_publish_data, str(median_value))
        sensor_readings = []  # Clear readings after publishing

try:
    while True:
        # Check Hall-effect sensor
        sensor_value = sensor.value()
        
        if sensor_value == 0 and last_sent_state != 'closed':  # Magnet detected (curtains closed)
            auto_mode = False
            mqtt_client.publish(mqtt_subscribe_automanual, '0')
            mqtt_client.publish(mqtt_publish_curtains, 'closed')
            print("Curtains closed")
            last_sent_state = 'closed'
        
        elif sensor_value == 1 and last_sent_state != 'open':  # Magnet removed (curtains open)
            auto_mode = True
            mqtt_client.publish(mqtt_subscribe_automanual, '1')
            mqtt_client.publish(mqtt_publish_curtains, 'open')
            print("Curtains open")
            last_sent_state = 'open'

        # Read light sensor
        light = read_light()
        print(f"Current light level: {light}%")
        
        # Perform auto-mode logic if enabled
        if auto_mode:
            if light < sensitivity:
                red.value(1)
                if current_light_switch_state != 1:
                    mqtt_client.publish(mqtt_publish_lightswitchstate, '1')
                    current_light_switch_state = 1
                    mqtt_client.publish(mqtt_subscribe_lightswitch, '1')
                    print("Light turned ON based on sensitivity")
            else:
                red.value(0)
                if current_light_switch_state != 0:
                    mqtt_client.publish(mqtt_publish_lightswitchstate, '0')
                    current_light_switch_state = 0
                    mqtt_client.publish(mqtt_subscribe_lightswitch, '0')
                    print("Light turned OFF based on sensitivity")

        # Collect sensor readings for median calculation
        sensor_readings.append(light)

        # Check and execute schedules
        check_schedules()

        # Publish sensor data every 30 seconds
        current_time = time.time()
        if current_time - last_publish_time >= 30:
            publish_sensor_data()
            last_publish_time = current_time

        mqtt_client.check_msg()  # Check for incoming MQTT messages
        utime.sleep(1)
except Exception as e:
    print(f"An error occurred: {e}")
finally:
    mqtt_client.disconnect()
    wlan.disconnect()
