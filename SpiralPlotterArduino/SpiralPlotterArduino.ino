
#include <RunningAverage.h>
#include <ArduinoJson.h>
#include <ArduinoJson.hpp>

int BTNLED = 10;
int BTN = 13;
bool plotterReady = false;

unsigned long lastDebounceTime = 0;
unsigned long debounceDelay = 50;

int buttonState;          
int lastButtonState = LOW;

class Input {
  RunningAverage average;
public:
  Input(String name, int pin)
    : name(name), pin(pin), average(5) {}
  String name;
  int pin;
  int previous = 0;

  void read() {
    int sensorValue = analogRead(pin);
    average.addValue(sensorValue);
  }

  int getAverage() {
    return floor(average.getAverage());
  }
};


Input inputs[] = {
  Input("rotateX", A2),
  Input("rotateY", A1),
  Input("rotateZ", A3),

  Input("transX", A7),
  Input("transY", A8),
  Input("scaleX", A5),
  Input("scaleY", A4),

  Input("cone", A15),
  Input("smoothness", A11),
  Input("start", A12),
  Input("increment", A14),
  Input("lineLength", A13)
};

void setup() {
  Serial.begin(9600);

  pinMode(BTNLED, OUTPUT);
  pinMode(BTN, INPUT);

  while (!Serial)
    continue;

  digitalWrite(BTNLED, HIGH);
}

void loop() {
  DynamicJsonDocument doc(1024);
  for (byte i = 0; i < 12; i = i + 1) {
    inputs[i].read();
    int value = inputs[i].getAverage();
    if (abs(value - inputs[i].previous) > 2) {
      doc[inputs[i].name] = value;
      inputs[i].previous = value;
    }
  }

  if (Serial.available() > 0) {
    String serialMessage = Serial.readStringUntil('\n');
    if (serialMessage == "ready") {
      plotterReady = true;
    }
    if (serialMessage == "busy") {
      plotterReady = false;
    }
  }

  int buttonReading = digitalRead(BTN);
  
  if (buttonReading != lastButtonState) {
    lastDebounceTime = millis();
  }
  if ((millis() - lastDebounceTime) > debounceDelay) {
    if (buttonReading != buttonState) {
      buttonState = buttonReading;
      if (buttonState == HIGH) {
        plotterReady = false;
        doc["plot"] = true;
      }
    }
  }
  lastButtonState = buttonReading;

  if (plotterReady) {
    digitalWrite(BTNLED, HIGH);
  } else {
    digitalWrite(BTNLED, LOW);
  }


  if (!doc.isNull()) {
    serializeJson(doc, Serial);
    Serial.println();
  }

  delay(50);
}
