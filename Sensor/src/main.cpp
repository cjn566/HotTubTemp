

// Include the libraries we need
#include <Arduino.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ESP8266WiFi.h>
#include <esp8266httpclient.h>
#include <WiFiClient.h>

#define UPPER_PIN 14
#define LOWER_PIN 12
#define LED_PIN 2
#define TEMPERATURE_PRECISION 10
#define RESET_TEMP 85.0

OneWire oneWire[] = {UPPER_PIN, LOWER_PIN};
DallasTemperature sensor[2];

// DeviceAddress upperProbe = { 0x28, 0x5D, 0x59, 0x4B, 0x5B, 0x20, 0x01, 0x4D };
// DeviceAddress lowerProbe = { 0x28, 0x59, 0x2C, 0x58, 0x5B, 0x20, 0x01, 0x9E };

WiFiClient wifiClient;

void blink() {
  digitalWrite(LED_PIN, LOW);
  delay(100);
  digitalWrite(LED_PIN, HIGH);  
  delay(100);
}

void setup(void)
{
  // start serial port
  Serial.begin(9600);

  pinMode(UPPER_PIN, INPUT_PULLUP);
  pinMode(LOWER_PIN, INPUT_PULLUP);
  pinMode(2, OUTPUT);
  
  DeviceAddress deviceAddress;
  for (int i = 0; i < 2; i++) {
    sensor[i].setOneWire(&oneWire[i]);
    sensor[i].begin();
    if (sensor[i].getAddress(deviceAddress, 0)){
      sensor[i].setResolution(deviceAddress, TEMPERATURE_PRECISION);
      printf("sensor %d found and set");
    }
  }

  // WiFi  
  WiFi.begin("hobbit hole", "aterriblepassword");
  Serial.print("Connecting");
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
    blink();
  }
  Serial.println();
  Serial.print("Connected, IP address: ");
  Serial.println(WiFi.localIP());
  WiFi.setAutoReconnect(true);
  WiFi.persistent(true);
}

float temp[2];
void loop(void)
{
  
  for (int i = 0; i < 2; i++) {
    sensor[i].requestTemperatures();
  }
  delay(100);

  for (int i = 0; i < 2; i++) {
    temp[i] = sensor[i].getTempCByIndex(0);
    if (temp[i] == DEVICE_DISCONNECTED_C)
    {
      Serial.printf("Error: Could not read temp from probe %d.\n", i);
    }
    if (temp[i] == RESET_TEMP)
    {
      Serial.printf("Error: Read default on temp for probe %d.\n", i);
    }
  }

  Serial.printf("probe 0, 1: %3.1f, %3.1f\n", temp[0], temp[1]);

  if (WiFi.status() == WL_CONNECTED) { //Check WiFi connection status
    float upperTempF = DallasTemperature::toFahrenheit(temp[0]);
    float lowerTempF = DallasTemperature::toFahrenheit(temp[1]);
    HTTPClient http;
    String params = "upper=" + String(upperTempF, 1) + "&lower=" + String(lowerTempF, 1);
    http.begin(wifiClient, "192.168.50.118", 3001, "/api/app/temp?" + params);
    int httpCode = http.GET();
    if (httpCode == 200) {
      Serial.println("Recorded.");
      blink();
    } else {
      Serial.println("GET request failed with code: " + String(httpCode));
      blink();
      blink();
      blink();
    } 
    http.end();
  } else {
    Serial.println("Network unavailable!");
      blink();
      blink();
      blink();
      blink();
  }

  delay(1000*60);
}