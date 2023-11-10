#include <ArduinoJson.h>
#include <ArduinoJson.hpp>

int sensorPin = A0;
int sensorValue = 0;

void setup()
{
	Serial.begin(9600);
	while (!Serial)
		continue;
}

void loop()
{
	sensorValue = analogRead(sensorPin);

	DynamicJsonDocument doc(1024);

	doc["lineLength"] = sensorValue;

	serializeJson(doc, Serial);
	Serial.println();
	delay(100);
}
