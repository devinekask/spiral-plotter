#include <RunningAverage.h>
#include <ArduinoJson.h>
#include <ArduinoJson.hpp>

int sensorPin = A0;
int prevLineLength = 0;

RunningAverage raLineLength(5);

void setup()
{
  raLineLength.clear();
	Serial.begin(9600);
	while (!Serial)
		continue;
}

void loop()
{
  int sensorValue = analogRead(sensorPin);
  raLineLength.addValue(sensorValue);

	DynamicJsonDocument doc(1024);

  int lineLength = floor(raLineLength.getAverage());
//  int lineLength = sensorValue;
  if(abs(lineLength-prevLineLength)>2){
	  doc["lineLength"] = lineLength;
    prevLineLength = lineLength;
	  serializeJson(doc, Serial);
	  Serial.println();
  }
	delay(50);
}
