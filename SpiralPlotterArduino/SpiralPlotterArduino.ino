
#include <RunningAverage.h>
#include <ArduinoJson.h>
#include <ArduinoJson.hpp>

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
  Input("start", 1),
  Input("cone", 2),
  Input("rotx", 3),
  Input("scalex", 4),
  Input("transx", 5)
};

void setup() {
  Serial.begin(9600);
  while (!Serial)
    continue;
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
  if (!doc.isNull()) {
    serializeJson(doc, Serial);
    Serial.println();
  }

  delay(50);
}
