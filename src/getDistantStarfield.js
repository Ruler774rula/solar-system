import * as THREE from "three";

export default function getDistantStarfield({ numStars = 800, size = 0.3, distance = 750 } = {}) {
  function randomSpherePoint() {
    // Starfield más lejano que la órbita de Neptuno (30 AU * 20 = 600 unidades)
    const radius = Math.random() * 250 + distance; // Entre 750 y 1000 unidades
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    let x = radius * Math.sin(phi) * Math.cos(theta);
    let y = radius * Math.sin(phi) * Math.sin(theta);
    let z = radius * Math.cos(phi);

    return {
      pos: new THREE.Vector3(x, y, z),
      hue: 0.6 + Math.random() * 0.3, // Variación de color más amplia
      minDist: radius,
    };
  }
  const verts = [];
  const colors = [];
  const positions = [];
  let col;
  for (let i = 0; i < numStars; i += 1) {
    let p = randomSpherePoint();
    const { pos, hue } = p;
    positions.push(p);
    // Estrellas más brillantes y con más variación de color
    col = new THREE.Color().setHSL(hue, 0.4, Math.random() * 0.5 + 0.5);
    verts.push(pos.x, pos.y, pos.z);
    colors.push(col.r, col.g, col.b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size,
    vertexColors: true,
    map: new THREE.TextureLoader().load(
      "./src/circle.png"
    ),
  });
  const points = new THREE.Points(geo, mat);
  return points;
}