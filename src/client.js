import "./style.css";

import * as THREE from "three";
import { SVGRenderer } from "three/addons/renderers/SVGRenderer.js";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";
//import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { io } from "socket.io-client";

let pause = true;
let socket;
const scale = 3.77952756;

let scene, webGLrenderer, camera;

const noise = new ImprovedNoise();

/* let gui; */

const visualRenderer = () => {
  console.log("visualRenderer");
  spiralRender(webGLrenderer);
  /* if (!pause) {
    requestAnimationFrame(visualRenderer);
  } */
};

const initThree = () => {
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    500
  );
  camera.position.set(0, 0, 20);
  camera.lookAt(0, 0, 0);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  webGLrenderer = new THREE.WebGLRenderer();
  webGLrenderer.setSize(
    ((window.innerHeight * 0.95) / 2) * 3,
    window.innerHeight * 0.95
  );
  document.body.appendChild(webGLrenderer.domElement);
};

const spiralRender = (renderEngine) => {
  let radius = params.start.value;
  const points = [];

  for (let i = 0; i < params.lineLength.value; i++) {
    const x = Math.cos((i * Math.PI) / 180) * radius;
    const y = Math.sin((i * Math.PI) / 180) * radius;

    const vector = new THREE.Vector3(
      x,
      y,
      params.cone.value - (params.cone.value / params.lineLength.value) * i
    );

    vector.setX(
      vector.x +
        noise.noise(x * params.smoothness.value, y * params.smoothness.value, 0)
    );
    vector.setY(
      vector.y +
        noise.noise(y * params.smoothness.value, x * params.smoothness.value, 0)
    );
    vector.setZ(
      vector.z +
        noise.noise(y * params.smoothness.value, x * params.smoothness.value, 0)
    );

    points.push(vector);

    radius += params.increment.value;
  }

  const material = new THREE.LineBasicMaterial({
    color: 0x000000,
    linewidth: 0.5,
  });

  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  geometry.rotateX(params.rotateX.value);
  geometry.rotateY(params.rotateY.value);
  geometry.rotateZ(params.rotateZ.value);

  geometry.translate(params.transX.value, params.transY.value, 0);

  geometry.scale(params.scaleX.value, params.scaleY.value, 1);

  const line = new THREE.Line(geometry, material);

  scene.add(line);
  renderEngine.render(scene, camera);
  scene.remove(line);

  geometry.dispose();
  material.dispose();
};

/* const initGui = () => {
  gui = new GUI();
  gui.hide();

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
      visualRenderer();
      setTimeout(() => {
        pause = true;
      }, 3000);
    }
  });
  console.log("Run showGui() to show the GUI");
};
 */
/* const showGui = (show = true) => {
  if (show) {
    gui.show();
  } else {
    gui.hide();
  }
};
 */
const initSocket = () => {
  socket = io.connect("/");
  socket.on("connect", () => {
    console.log(`Connected: ${socket.id}`);
  });

  socket.on("parameters", (serialParams) => {
    const values = JSON.parse(serialParams);
    Object.keys(values).forEach((key) => {
      if (key === "plot") {
        sendSVG();
        return;
      }
      const controller = params[key];
      const mapped = mapRange(
        values[key],
        0,
        1024,
        controller.min,
        controller.max
      );
      controller.value = mapped;
    });
    visualRenderer();
  });
};

const mapRange = (value, a, b, c, d) => {
  value = (value - a) / (b - a);
  return c + value * (d - c);
};

const sendSVG = () => {
  if (socket.connected) {
    // https://www.generativehut.com/post/render-3d-scenes-from-webgl-to-svg
    const svgRenderer = new SVGRenderer();
    svgRenderer.overdraw = 0;
    svgRenderer.setSize(148 * scale, 105 * scale);
    document.body.appendChild(svgRenderer.domElement);
    svgRenderer.domElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svgRenderer.domElement.setAttribute("id", "svg");

    spiralRender(svgRenderer);

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
  lineLength: { min: 100, max: 10000, value: 5000 },
  rotateX: { min: 0, max: 2 * Math.PI, value: 0 },
  rotateY: { min: 0, max: 2 * Math.PI, value: 0 },
  rotateZ: { min: 0, max: 2 * Math.PI, value: 0 },
  increment: { min: 0.001, max: 0.01, value: 0.001 },
  start: { min: 0, max: 100, value: 1 },
  smoothness: { min: 0.1, max: 1, value: 0.3 },
  cone: { min: -10, max: 10, value: 0 },
  transX: { min: -1, max: 1, value: 0 },
  transY: { min: -1, max: 1, value: 0 },
  scaleX: { min: 0.1, max: 2, value: 1 },
  scaleY: { min: 0.1, max: 2, value: 1 },
};

initThree();
visualRenderer();
//initGui();
initSocket();

//window.showGui = showGui;
