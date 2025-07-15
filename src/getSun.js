import * as THREE from 'three';
import { getFresnelMat } from "./getFresnelMat.js";
import { ImprovedNoise } from 'jsm/math/ImprovedNoise.js';
// sun

// Shader optimizado para efecto de fuego dinámico
const fireVertexShader = `
    uniform float time;
    varying vec2 vUv;
    varying vec3 vNormal;
    
    void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        
        vec3 pos = position;
        
        // Perturbación suave sin ruido granulado
        float wave1 = sin(pos.y * 3.0 + time * 2.0) * 0.05;
        float wave2 = cos(pos.x * 2.0 + time * 1.5) * 0.03;
        float wave3 = sin(pos.z * 4.0 + time * 2.5) * 0.02;
        
        pos += normal * (wave1 + wave2 + wave3);
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
`;

const fireFragmentShader = `
    uniform float time;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform vec3 color3;
    varying vec2 vUv;
    varying vec3 vNormal;
    
    void main() {
        // Gradiente suave sin ruido granulado
        float gradient = vUv.y;
        
        // Ondas dinámicas para simular movimiento de llamas
        float wave1 = sin(vUv.y * 8.0 + time * 3.0) * 0.1;
        float wave2 = cos(vUv.x * 6.0 + time * 2.0) * 0.05;
        float dynamicGradient = gradient + wave1 + wave2;
        
        // Mezcla suave de colores
        vec3 finalColor;
        if (dynamicGradient < 0.4) {
            finalColor = mix(color1, color2, dynamicGradient / 0.4);
        } else {
            finalColor = mix(color2, color3, (dynamicGradient - 0.4) / 0.6);
        }
        
        // Pulsación dinámica más suave
        float pulse = 1.0 + sin(time * 4.0) * 0.15 + cos(time * 6.0) * 0.1;
        finalColor *= pulse;
        
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

// Corona eliminada por problemas de funcionamiento
function getSun() {
    // Material de fuego principal optimizado
    const fireMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0.0 },
            color1: { value: new THREE.Color(0xff2200) }, // Rojo intenso
            color2: { value: new THREE.Color(0xff6600) }, // Naranja
            color3: { value: new THREE.Color(0xffaa00) }  // Amarillo naranja
        },
        vertexShader: fireVertexShader,
        fragmentShader: fireFragmentShader,
        transparent: false
    });
    
    // Geometría principal del sol (reducida para mejor rendimiento)
    const geo = new THREE.IcosahedronGeometry(2.25, 4);
    const sun = new THREE.Mesh(geo, fireMaterial);
    
    // Solo una capa adicional para mantener el efecto pero optimizar rendimiento
    const outerGlowMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0.0 },
            color1: { value: new THREE.Color(0xff6600) }, // Naranja
            color2: { value: new THREE.Color(0xffaa00) }, // Amarillo naranja
            color3: { value: new THREE.Color(0xffff99) }  // Amarillo claro
        },
        vertexShader: fireVertexShader,
        fragmentShader: fireFragmentShader,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });
    
    const outerGlowMesh = new THREE.Mesh(geo, outerGlowMaterial);
    outerGlowMesh.scale.setScalar(1.08);
    sun.add(outerGlowMesh);

    // Efecto Fresnel simplificado
    const sunRimMat = getFresnelMat({ rimHex: 0xffff99, facingHex: 0xff4400 });
    const rimMesh = new THREE.Mesh(geo, sunRimMat);
    rimMesh.scale.setScalar(1.12);
    sun.add(rimMesh);

    // Iluminación principal
    const sunLight = new THREE.PointLight(0xffff99, 8, 0);
    sunLight.position.set(0, 0, 0);
    sunLight.decay = 0;
    sun.add(sunLight);
    
    // Luz dinámica con variación suave
    const dynamicLight = new THREE.PointLight(0xff6600, 3, 0);
    dynamicLight.position.set(0, 0, 0);
    dynamicLight.decay = 0;
    sun.add(dynamicLight);
    
    // Función de actualización optimizada
    sun.userData.update = (t) => {
        // Rotación suave del sol
        sun.rotation.y = t * 0.3;
        
        // Actualizar shaders con tiempo
        fireMaterial.uniforms.time.value = t;
        outerGlowMaterial.uniforms.time.value = t * 1.5;
        
        // Variación dinámica de luz más suave
        const lightVariation = 1.0 + Math.sin(t * 3.0) * 0.2 + Math.cos(t * 5.0) * 0.1;
        dynamicLight.intensity = 3 * lightVariation;
        
        // Rotaciones diferenciales suaves
        outerGlowMesh.rotation.y = t * 0.4;
        rimMesh.rotation.y = t * 0.2;
    };
    
    return sun;
}
export default getSun;