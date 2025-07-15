import * as THREE from 'three';

function getInstanced({ distance, mesh, size }) {
    const numObjs = 30 + Math.floor(Math.random() * 40); // Aumentar cantidad de asteroides (30-70)
    const instaMesh = new THREE.InstancedMesh(mesh.geometry, mesh.material, numObjs);
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < numObjs; i += 1) {
        // Distribuir en un rango más amplio entre Marte y Júpiter
        const radius = distance + Math.random() * 12 - 6; // Rango más amplio
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = (Math.random() - 0.5) * 2; // Añadir dispersión vertical
        const position = new THREE.Vector3(x, y, z);
        const quaternion = new THREE.Quaternion();
        quaternion.random();
        const currentSize = size + Math.random() * 0.06 - 0.03; // Tamaño más grande
        const scale = new THREE.Vector3().setScalar(currentSize);
        matrix.compose(position, quaternion, scale);
        instaMesh.setMatrixAt(i, matrix);
    }
    instaMesh.userData = {
        update(t) {
            const rate = -0.0002 * (index * 0.1);
            instaMesh.rotation.z = t * rate;
        }
    };
    return instaMesh;
}
function getAsteroidBelt(objs) {
    const group = new THREE.Group();
    objs.forEach((obj) => {
        // Posicionar entre Marte y Júpiter con nueva escala 30x
        const asteroids = getInstanced({ distance: 56, mesh: obj, size: 0.08 }); // Ajustado al nuevo factor de escala (20x)
        group.add(asteroids);
    });
    return group;
}

export default getAsteroidBelt;