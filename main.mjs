#!/usr/bin/env zx

import express from "express";
import fs from "fs/promises";
import http from "http";
import { nanoid } from "nanoid";
import { Server } from "socket.io";
import { $, argv } from "zx";

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

const port = process.env.PORT || 3005;

app.use(express.static("dist"));

console.log("zx here");

if (argv.build) {
	await $`npm run build`;
}

if (argv.disengage) {
	await $`axicli --mode align `;
}

io.on("connection", (socket) => {
	console.log("Socket connected", socket.id);

	socket.on("plot", (data) => {
		plotIt(data.svg);
	});

	socket.on("disconnect", (socket) => {
		console.log("Socket disconnected", socket.id);
	});
});

httpServer.listen(port, () => {
	console.log(`App listening on port ${port}!`);
});

const writeSvg = (filename, data) => fs.writeFile(filename, data);

const optimizeSvg = (filename) =>
	//$`vpype read ${filename} scaleto -f 13.8cm 9.5cm linemerge --tolerance 0.5mm frame translate -- -5mm -9mm write -p a6 -l ${filename}`;
	//$`vpype read ${filename}  linemerge --tolerance 0.5mm  translate -- -5mm -9mm write -p a6 -c -l ${filename}`;
	$`vpype \
		read ${filename} \
		linemerge --tolerance 0.5mm \
		linesort \
		rect --layer 'new' 0 0 148mm 105mm \
		scaleto -l all -f 13.8cm 9.5cm \
		translate -- -1mm -3mm \
		ldelete 2  \
		write -p a6  -l ${filename}`;

const plot = (filename) => $`axicli ${filename}`;

const plotIt = async (data) => {
	const filename = `./output/spiral-${nanoid(8)}.svg`;
	await writeSvg(filename, data);
	await optimizeSvg(filename);
	await plot(filename);
	console.log("ready");
};
