import * as THREE from "three";
import GUI from "lil-gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";

/**
 * Debug
 */
const debugObject = {};
const gui = new GUI({ width: 500 });

/**
 * Colors
 * */
const COLOR_COMBOS = [
  {
    primary: "#ff4b80",
    secondary: "#fadbde",
  },
  {
    primary: "#492632",
    secondary: "#8d253c",
  },
  {
    primary: "#23697f",
    secondary: "#c4aa7c",
  },
  {
    primary: "#3ab6c6",
    secondary: "#235f6c",
  },
  {
    primary: "#992620",
    secondary: "#f6471c",
  },
  {
    primary: "#fad652",
    secondary: "#256477",
  },
  {
    primary: "#ff7b2f",
    secondary: "#fec449",
  },
  {
    primary: "#809c9e",
    secondary: "#ff3c55",
  },
  {
    primary: "#439a58",
    secondary: "#ff7b2f",
  },
  {
    primary: "#43393c",
    secondary: "#ffad85",
  },
];

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader();
const gradientTexture = textureLoader.load("./textures/gradients/3.jpg");
gradientTexture.magFilter = THREE.NearestFilter;

/**
 * Objects
 */
const dimensions = {
  card: {
    width: 1,
    height: 0.3,
    depth: 0.05,
  },
  positionRange: {
    x: 6,
    y: 3,
  },
};

const cardCount = 144;
const cards = [];

const rows = 16;
const cols = cardCount / rows;

const randomDisplacement = (position) => {
  const displacement = (Math.random() - 0.5) * 0.2;

  return position + displacement;
};

// Pen Nib Shape
const svgMarkup = document.querySelector(".pen-nib").innerHTML;
const svgLoader = new SVGLoader();
const svgData = svgLoader.parse(svgMarkup);
let penNibGeometry;
svgData.paths.forEach((path) => {
  const shapes = SVGLoader.createShapes(path);

  shapes.forEach((shape) => {
    penNibGeometry = new THREE.ExtrudeGeometry(shape, {
      depth: 100,
      bevelEnabled: false,
    });
  });
});

for (let i = 0; i < cardCount; i++) {
  const row = i % rows;
  const col = Math.floor(i / rows);

  const cardGroup = new THREE.Group();

  const card = new THREE.Mesh(
    new THREE.BoxGeometry(
      dimensions.card.width,
      dimensions.card.height,
      dimensions.card.depth
    ),
    new THREE.MeshStandardMaterial({
      color: "#555",
    })
  );

  const penNib = new THREE.Mesh(
    penNibGeometry,
    new THREE.MeshStandardMaterial({
      color: "#666",
    })
  );
  penNib.scale.setScalar(0.0002);
  penNib.rotation.z = Math.PI;
  penNib.position.set(0.11, 0.108, 0.015);
  cardGroup.add(card, penNib);

  cardGroup.position.x = randomDisplacement(
    dimensions.positionRange.x / 2 - (dimensions.positionRange.x / cols) * col
  );
  cardGroup.position.y = randomDisplacement(
    dimensions.positionRange.y / 2 - (dimensions.positionRange.y / rows) * row
  );
  cardGroup.position.z = Math.random() * -2;

  cardGroup.rotation.x = ((Math.random() - 0.5) * Math.PI) / 4;
  cardGroup.rotation.y = ((Math.random() - 0.5) * Math.PI) / 2;
  cardGroup.rotation.z = ((Math.random() - 0.5) * Math.PI) / 4;

  cardGroup.scale.setScalar(Math.random() * 0.5 + 0.2);
  cards.push(cardGroup);
}

scene.add(...cards);

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight("#ffffff", 3);
gui.add(directionalLight.position, "z").min(-2).max(2).step(0.001);
directionalLight.position.z = 2;

directionalLight.castShadow;

scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // update sizes object
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
});

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.z = 3;

scene.add(camera);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));

/**
 * Shadows
 */
renderer.shadowMap.enabled = false;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Cast and receive light
directionalLight.castShadow = true;
cards.map((card) => {
  card.castShadow = true;
  card.receiveShadow = true;
});

// Mapping
directionalLight.shadow.mapSize.width = 256;
directionalLight.shadow.mapSize.height = 256;

directionalLight.shadow.camera.far = 5;
directionalLight.shadow.camera.top = 5;
directionalLight.shadow.camera.left = 5;
directionalLight.shadow.camera.bottom = -5;
directionalLight.shadow.camera.right = -5;

/**
 * Mouse Movement
 */
const raycaster = new THREE.Raycaster();
raycaster.far = 10;

function onPointerMove(event) {
  const pointer = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );
  raycaster.setFromCamera(pointer, camera);

  const intersections = raycaster.intersectObjects(scene.children, true);
  if (intersections.length > 0) {
    for (let i = 0; i < intersections.length; i++) {
      const colorComboId = Math.floor(Math.random() * 9);
      const primaryColor = COLOR_COMBOS[colorComboId].primary;
      const secondaryColor = COLOR_COMBOS[colorComboId].secondary;
      const cardToChange = intersections[i].object.parent;
      cardToChange.children.map((child) => {
        const currentColor = child.material?.color.getHexString();

        if (currentColor === "555555" || currentColor === "666666") {
          switch (child.geometry.type) {
            case "BoxGeometry":
              child.material.color = new THREE.Color(primaryColor);
              break;
            case "ExtrudeGeometry":
              child.material.color = new THREE.Color(secondaryColor);
              break;
          }
        }
      });
    }
  }
}
window.addEventListener("mousemove", onPointerMove);

/**
 * Animate
 */

const tick = () => {
  // Render
  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();
gui.hide();
