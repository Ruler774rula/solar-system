import * as THREE from 'three';
import { getFresnelMat } from "./getFresnelMat.js";
import { ImprovedNoise } from 'jsm/math/ImprovedNoise.js';
// sun

function getCorona() {
    // Ajustar el radio de la corona proporcionalmente al nuevo tamaño del Sol
    const radius = 2.025; // Reducido proporcionalmente a la nueva escala (4.05/2)
    const material = new THREE.MeshBasicMaterial({
        color: 0xffff99,
        side: THREE.BackSide,
    });
    const geo = new THREE.IcosahedronGeometry(radius, 6);
    const mesh = new THREE.Mesh(geo, material);
    const noise = new ImprovedNoise();

    let v3 = new THREE.Vector3();
    let p = new THREE.Vector3();
    let pos = geo.attributes.position;
    pos.usage = THREE.DynamicDrawUsage;
    const len = pos.count;

    function update(t) {
        for (let i = 0; i < len; i += 1) {
            p.fromBufferAttribute(pos, i).normalize();
            v3.copy(p).multiplyScalar(3.0);
            let ns = noise.noise(v3.x + Math.cos(t), v3.y + Math.sin(t), v3.z + t);
            v3.copy(p)
                .setLength(radius)
                .addScaledVector(p, ns * 0.4);
            pos.setXYZ(i, v3.x, v3.y, v3.z);
        }
        pos.needsUpdate = true;
    }
    mesh.userData.update = update;
    return mesh;
}
function getSun() {
    
    const sunMat = new THREE.MeshStandardMaterial({
        emissive: 0xff4400,
        emissiveIntensity: 2.0,
        color: 0xffaa00,
    });
    // Aumentar el tamaño del Sol para que sea más realista comparado con los planetas
    // El Sol real es ~109 veces el radio de la Tierra, aquí usamos ~8 para mejor visualización
    const geo = new THREE.IcosahedronGeometry(2.25, 6); // Reducido proporcionalmente a la nueva escala (4.5/2)
    const sun = new THREE.Mesh(geo, sunMat);

    const sunRimMat = getFresnelMat({ rimHex: 0xffff99, facingHex: 0x000000 });
    const rimMesh = new THREE.Mesh(geo, sunRimMat);
    rimMesh.scale.setScalar(1.01);
    sun.add(rimMesh);

    const coronaMesh = getCorona();
    sun.add(coronaMesh);

    // Luz interna del Sol sin atenuación por distancia
  const sunLight = new THREE.PointLight(0xffff99, 8, 0); // distance = 0 elimina atenuación
  sunLight.position.set(0, 0, 0);
  sunLight.decay = 0; // Sin decaimiento de luz
  sun.add(sunLight);
    sun.userData.update = (t) => {
        sun.rotation.y = t;
        coronaMesh.userData.update(t);
    };
    return sun;
}
export default getSun;