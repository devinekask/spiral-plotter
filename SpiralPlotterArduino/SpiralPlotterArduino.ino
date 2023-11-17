
#include <RunningAverage.h>
#include <ArduinoJson.h>
#include <ArduinoJson.hpp>

int BTNLED = 10;
int BTN = 13;
bool plotterReady = false;

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
  Input("lineLength", 0),
  Input("increment", 1),
  Input("cone", 2),
  Input("rotateX", 3),
  Input("scaleX", 4),
  Input("transX", 5)
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
  for (byte i = 0; i < 6; i = i + 1) {
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

  int buttonState = digitalRead(BTN);
  if (buttonState == HIGH) {
    plotterReady = false;
    doc["plot"] = true;
  }

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
