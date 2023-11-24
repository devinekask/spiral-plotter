#!/usr/bin/env zx

import express from "express";
import fs from "fs/promises";
import http from "http";
import { nanoid } from "nanoid";
import { Server } from "socket.io";
import { $, argv } from "zx";
import { ReadlineParser, SerialPort } from "serialport";

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

const port = process.env.PORT || 3005;
let arduinoPort;
let parser;
let plotterReady = false;

SerialPort.list().then((ports) => {
  let done = false;
  let count = 0;
  let allports = ports.length;
  ports.forEach(function (port) {
    count = count + 1;
    const pm = port.manufacturer;

    if (typeof pm !== "undefined" && pm.includes("arduino")) {
      const path = port.path;
      arduinoPort = new SerialPort({ path, baudRate: 9600 });
      arduinoPort.on("open", function () {
        console.log(`Arduino is now connected at port ${path}`);
        parser = arduinoPort.pipe(new ReadlineParser({ delimiter: "\r\n" }));
      });
      done = true;
    }

    if (count === allports && done === false) {
      console.log(`can't find any arduino`);
    }
  });
});

if (argv.build) {
  await $`npm run build`;
}

if (argv.disengage) {
  await $`axicli --mode align `;
}

io.on("connection", (socket) => {
  if (arduinoPort) {
    plotterReady = true;
    arduinoPort.write("ready");
  }

  console.log("Socket connected", socket.id);

  socket.on("svgstring", async (data) => {
    if (plotterReady) {
      console.log("let's plot it");
      if (arduinoPort) {
        arduinoPort.write("busy");
        plotterReady = false;
      }

      //await sleep(5000);
      await plotIt(data.svg);

      console.log("done plotting");
      if (arduinoPort) {
        arduinoPort.write("ready");
        plotterReady = true;
      }
    } else {
      console.log("Received svg but plotter is not ready");
    }
  });

  socket.on("disconnect", (socket) => {
    console.log("Socket disconnected", socket.id);
  });

  if (parser) {
    parser.on("data", (json) => {
      try {
        const values = JSON.parse(json);
      } catch (e) {
        // console.log("error", e);
      }
      socket.emit("parameters", json);
    });
  }
});

app.use(express.static("dist"));

console.log("zx here");

httpServer.listen(port, () => {
  console.log(`Server listening on port ${port} - http://localhost:${port}`);
});

const writeSvg = (filename, data) => fs.writeFile(filename, data);

const optimizeSvg = (filename) =>
  //$`vpype read ${filename} scaleto -f 13.8cm 9.5cm linemerge --tolerance 0.5mm frame translate -- -5mm -9mm write -p a6 -l ${filename}`;
  //$`vpype read ${filename}  linemerge --tolerance 0.5mm  translate -- -5mm -9mm write -p a6 -c -l ${filename}`;
  $`vpype \
		read ${filename} \
		linemerge --tolerance 0.5mm \
		filter --min-length 2mm \
		linesort \
		rect --layer 'new' 0 0 148mm 105mm \
		scaleto -l all -f 13.8cm 9.5cm \
		translate -- -1mm -3mm \
		ldelete 2  \
		write -p a6  -l ${filename}`;

const plot = (filename) => $`axicli ${filename}`.nothrow();

const plotIt = async (data) => {
  const filename = `./output/spiral-${nanoid(8)}.svg`;
  await writeSvg(filename, data);
  await optimizeSvg(filename);
  return plot(filename);
};
