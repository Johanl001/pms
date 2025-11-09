# Wiring Diagram

## Components List

1. **ESP32 Development Board** (NodeMCU-32S)
2. **Capacitive Soil Moisture Sensor**
3. **DHT22 Temperature & Humidity Sensor**
4. **BH1750 Light Sensor**
5. **5V Water Pump**
6. **Relay Module** (for water pump)
7. **LED Grow Light**
8. **Second Relay Module** (for grow light)
9. **Breadboard and Jumper Wires**
10. **Power Supply** (5V adapter for ESP32 and actuators)

## Pin Connections

### Soil Moisture Sensor
- VCC → 3.3V (ESP32)
- GND → GND (ESP32)
- AOUT → Pin 34 (ESP32)

### DHT22 Sensor
- VCC → 3.3V (ESP32)
- GND → GND (ESP32)
- DATA → Pin 27 (ESP32)
- (Add 10kΩ pull-up resistor between DATA and VCC)

### BH1750 Light Sensor
- VCC → 3.3V (ESP32)
- GND → GND (ESP32)
- SCL → Pin 22 (ESP32)
- SDA → Pin 21 (ESP32)

### Water Pump Relay
- VCC → 5V (External Power)
- GND → GND (External Power)
- IN → Pin 18 (ESP32)
- NO (Normally Open) → Water Pump Positive
- COM (Common) → 5V Power Supply Positive
- Water Pump Negative → Power Supply Negative/GND

### Grow Light Relay
- VCC → 5V (External Power)
- GND → GND (External Power)
- IN → Pin 19 (ESP32)
- NO (Normally Open) → Grow Light Positive
- COM (Common) → 5V Power Supply Positive
- Grow Light Negative → Power Supply Negative/GND

## Power Considerations

1. **ESP32 Power**
   - Powered via USB or 5V pin
   - Current draw: ~100-500mA depending on WiFi usage

2. **Sensor Power**
   - All sensors powered from ESP32 3.3V pin
   - Total sensor current: ~50-100mA

3. **Actuator Power**
   - Water pump and grow light require separate 5V power supply
   - Current requirements:
     - Water pump: 100-300mA
     - Grow light: 200-1000mA (depending on LED count)
   - Use appropriately rated power supply (2A+ recommended)

## Wiring Diagram Visualization

```
                    +------------------+
                    |   ESP32 Board    |
                    |  (NodeMCU-32S)   |
                    +------------------+
         3.3V ------|3V3           Vin|------ 5V (from power supply)
                    |                 |
         GND  ------|GND           GND|------ GND (from power supply)
                    |                 |
Pin 34 (Soil) ------|VN            36 |
                    |                 |
Pin 27 (DHT)  ------|27            39 |
                    |                 |
Pin 22 (SCL)  ------|22            34 |---> Soil Moisture Sensor
                    |                 |
Pin 21 (SDA)  ------|21            35 |---> Light Sensor
                    |                 |
Pin 18 (Pump) ------|18            32 |
                    |                 |
Pin 19 (Light)------|19            33 |
                    |                 |
Pin 27 (DHT)  ------|27             5 |
                    |                 |
         3.3V ------|3V3            0 |
                    +------------------+

        +------------------+     +------------------+
        | Soil Moisture    |     | DHT22 Sensor     |
        | Sensor           |     |                  |
        |                  |     |                  |
VCC ----| VCC         GND |-----| GND          VCC |---- 3.3V
        |                  |     |                  |
AOUT ---| AOUT             |     | DATA             |---- Pin 27
        +------------------+     +------------------+
                                          |
                                          | (10kΩ pull-up to 3.3V)
                                          |
                                    +------------------+
                                    | BH1750 Light     |
                                    | Sensor           |
                                    |                  |
                             VCC ---| VCC         GND  |--- GND
                                    |                  |
                             SCL ---| SCL         SDA  |--- SDA
                                    +------------------+
                                          |         |
                                          |         |
                                    Pin 22     Pin 21

        +------------------+     +------------------+
        | Water Pump       |     | Relay Module     |
        |                  |     | (for pump)       |
        |                  |     |                  |
   +5V ---| (+)         (-) |-----| (-)          (+) |--- +5V (Power Supply)
        |                  |     |                  |
        +------------------+     | IN               |--- Pin 18
                                 |                  |
                                 | NO          COM  |
                                 +------------------+
                                          |         |
                                          |         |
                                    To Pump    To Power

        +------------------+     +------------------+
        | Grow Light       |     | Relay Module     |
        |                  |     | (for light)      |
        |                  |     |                  |
   +5V ---| (+)         (-) |-----| (-)          (+) |--- +5V (Power Supply)
        |                  |     |                  |
        +------------------+     | IN               |--- Pin 19
                                 |                  |
                                 | NO          COM  |
                                 +------------------+
                                          |         |
                                          |         |
                                   To Light    To Power
```

## Assembly Instructions

1. **Prepare the ESP32**
   - Connect the ESP32 to your computer via USB
   - Install the ESP32 board package in Arduino IDE
   - Verify you can upload sketches to the board

2. **Connect the Sensors**
   - Wire the soil moisture sensor to pin 34
   - Wire the DHT22 sensor to pin 27 with a 10kΩ pull-up resistor
   - Connect the BH1750 light sensor to pins 21 (SDA) and 22 (SCL)

3. **Set up the Relays**
   - Connect both relay modules to a separate 5V power supply
   - Wire the pump relay IN pin to ESP32 pin 18
   - Wire the light relay IN pin to ESP32 pin 19

4. **Connect the Actuators**
   - Connect the water pump to the pump relay (NO and COM terminals)
   - Connect the grow light to the light relay (NO and COM terminals)

5. **Power Up**
   - Connect the ESP32 to your computer for programming
   - Connect the separate 5V power supply to the relays and actuators
   - Upload the firmware to the ESP32

## Safety Notes

1. **Electrical Safety**
   - Always disconnect power before making connections
   - Ensure the power supply can handle the total current draw
   - Use appropriate wire gauge for the current requirements

2. **Water Safety**
   - Keep electronic components away from water
   - Ensure proper insulation of moisture sensor connections
   - Place the system in a location where water spills won't reach electronics

3. **Component Protection**
   - Use current-limiting resistors where required
   - Verify voltage levels before connecting components
   - Add fuses or circuit breakers for high-current devices