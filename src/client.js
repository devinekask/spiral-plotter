import "./style.css";

import * as THREE from "three";
import { SVGRenderer } from "three/addons/renderers/SVGRenderer.js";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { io } from "socket.io-client";

let pause = true;
let socket; // will be assigned a value later
const scale = 3.77952756;

// https://www.generativehut.com/post/render-3d-scenes-from-webgl-to-svg
const renderer = new SVGRenderer();
renderer.overdraw = 0;
renderer.setSize(148 * scale, 105 * scale);
document.body.appendChild(renderer.domElement);
renderer.domElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
renderer.domElement.setAttribute("id", "svg");

/* const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement); */

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  1,
  500
);
camera.position.set(0, 0, 20);
camera.lookAt(0, 0, 0);

const material = new THREE.LineBasicMaterial({
  color: 0x000000,
  linewidth: 0.5,
});

const noise = new ImprovedNoise();

let gui;

const render = () => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  let radius = params.start;
  const points = [];

  for (let i = 0; i < params.lineLength; i++) {
    const x = Math.cos((i * Math.PI) / 180) * radius;
    const y = Math.sin((i * Math.PI) / 180) * radius;

    const vector = new THREE.Vector3(
      x,
      y,
      params.cone - (params.cone / params.lineLength) * i
    );

    vector.setX(
      vector.x + noise.noise(x * params.smoothness, y * params.smoothness, 0)
    );
    vector.setY(
      vector.y + noise.noise(y * params.smoothness, x * params.smoothness, 0)
    );
    vector.setZ(
      vector.z + noise.noise(y * params.smoothness, x * params.smoothness, 0)
    );

    points.push(vector);

    radius += params.increment;
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  geometry.rotateX(params.rotateX);
  geometry.rotateY(params.rotateY);
  geometry.rotateZ(params.rotateZ);

  geometry.translate(params.transX, params.transY, 0);

  geometry.scale(params.scaleX, params.scaleY, 1);

  const line = new THREE.Line(geometry, material);

  scene.add(line);
  if (!pause) {
    requestAnimationFrame(render);
  }
  renderer.render(scene, camera);
};

/*
const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
document.getElementById("a").href = url; */

const initGui = () => {
  gui = new GUI();

  gui.add(params, "lineLength", 100, 10000);
  gui.add(params, "rotateX", 0, 2 * Math.PI);
  gui.add(params, "rotateY", 0, 2 * Math.PI);
  gui.add(params, "rotateZ", 0, 2 * Math.PI);
  gui.add(params, "increment", 0.001, 0.01);
  gui.add(params, "start", 0, 100);
  gui.add(params, "smoothness", 0.1, 1);
  gui.add(params, "cone", -10, 10);
  gui.add(params, "transX", -1, 1);
  gui.add(params, "transY", -1, 1);
  gui.add(params, "scaleX", 0.1, 2);
  gui.add(params, "scaleY", 0.1, 2);
  gui.add(params, "plot");

  gui.onChange(() => {
    if (pause) {
      pause = false;
      render();
      setTimeout(() => {
        pause = true;
      }, 3000);
    }
  });

  console.log(gui.controllers);
};

const initSocket = () => {
  socket = io.connect("/");
  socket.on("connect", () => {
    console.log(`Connected: ${socket.id}`);
  });

  socket.on("parameters", (params) => {
    const values = JSON.parse(params);
    Object.keys(values).forEach((key) => {
      if (key === "plot") {
        sendSVG();
        return;
      }
      const controller = gui.controllers.find((c) => c.property === key);
      const mapped = mapRange(
        values[key],
        0,
        1024,
        controller._min,
        controller._max
      );
      controller.setValue(mapped);
    });
  });
};

const mapRange = (value, a, b, c, d) => {
  value = (value - a) / (b - a);
  return c + value * (d - c);
};

const sendSVG = () => {
  if (socket.connected) {
    const svg = document.getElementById("svg");
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    // source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

    socket.emit("svgstring", {
      svg: source,
    });
  }
};

const params = {
  lineLength: 5000,
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  increment: 0.001,
  start: 1,
  smoothness: 0.3,
  cone: 0,
  transX: 0,
  transY: 0,
  scaleX: 1,
  scaleY: 1,
  plot: sendSVG,
};

render();
initGui();
initSocket();

setTimeout(() => {
  pause = true;
}, 1000);
