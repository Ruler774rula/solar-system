/**
 * Sistema de planetas realistas con mecánicas orbitales avanzadas
 * Reemplaza el sistema básico con cálculos físicos precisos
 */

import * as THREE from 'three';
import { getFresnelMat } from './getFresnelMat.js';
import { PLANET_DATA } from './planetData.js';
import { OrbitalMechanics } from './orbitalMechanics.js';

export class RealisticPlanet {
    constructor(planetKey, orbitalMechanics, options = {}) {
        this.orbitalMechanics = orbitalMechanics;
        this.data = PLANET_DATA[planetKey];
        this.options = {
            scale: options.scale || 1.0,
            showMoons: options.showMoons !== false,
            realisticScale: options.realisticScale || false,
            ...options
        };
        
        // Propiedades orbitales
        this.semiMajorAxis = this.data.distance;
        this.eccentricity = this.data.eccentricity;
        this.inclination = this.data.inclination;
        this.orbitalSpeed = this.orbitalMechanics.calculateOrbitalSpeed(this.semiMajorAxis);
        this.startAngle = Math.random() * Math.PI * 2;
        
        // Propiedades físicas
        this.size = this.calculateDisplaySize();
        this.mass = this.data.mass;
        this.temperature = 0;
        this.currentDistance = this.data.distance;
        
        // Objetos 3D
        this.group = new THREE.Group();
        this.mesh = null;
        this.atmosphere = null;
        this.rings = null;
        this.moons = [];
        this.orbitLine = null;
        this.label = null;
        this.trail = null;
        
        // Estado
        this.isSelected = false;
        this.showOrbit = true;
        this.showLabel = true;
        this.showTrail = false;
        
        this.createPlanet();
        this.createOrbit();
        this.createMoons();
        this.createLabel();
    }
    
    calculateDisplaySize() {
        if (this.options.realisticScale) {
            // Escala realista (muy pequeña para la mayoría de planetas)
            return this.data.size * 0.1 * this.options.scale;
        } else {
            // Escala visual mejorada para mejor visualización
            const baseSize = Math.max(0.1, this.data.size * 0.2);
            return Math.min(baseSize * this.options.scale, 2.0); // Limitar tamaño máximo
        }
    }
    
    createPlanet() {
        // Geometría del planeta
        const geometry = new THREE.SphereGeometry(this.size, 32, 32);
        
        // Material del planeta con textura
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load(`./textures/${this.data.texture}`);
        
        const material = new THREE.MeshPhongMaterial({
            map: texture,
            color: this.data.color,
            shininess: 10,
            specular: 0x222222
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData = { planet: this, type: 'planet' };
        
        // Efecto Fresnel para el borde
        if (this.data.hasAtmosphere) {
            const fresnelMat = getFresnelMat({ 
                rimHex: this.data.atmosphereColor || 0x87CEEB, 
                facingHex: 0x000000 
            });
            const fresnelMesh = new THREE.Mesh(geometry, fresnelMat);
            fresnelMesh.scale.setScalar(1.01);
            this.mesh.add(fresnelMesh);
            
            // Atmósfera adicional
            this.createAtmosphere();
        }
        
        // Anillos para planetas que los tienen
        if (this.data.hasRings) {
            this.createRings();
        }
        
        this.group.add(this.mesh);
    }
    
    createAtmosphere() {
        const atmosphereGeometry = new THREE.SphereGeometry(this.size * 1.05, 32, 32);
        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: this.data.atmosphereColor || 0x87CEEB,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide
        });
        
        this.atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        this.group.add(this.atmosphere);
    }
    
    createRings() {
        const innerRadius = this.size * (this.data.ringInnerRadius || 1.5);
        const outerRadius = this.size * (this.data.ringOuterRadius || 2.5);
        
        const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: this.data.ringColor || 0xC0C0C0,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        
        this.rings = new THREE.Mesh(ringGeometry, ringMaterial);
        this.rings.rotation.x = Math.PI / 2;
        
        // Añadir variación en los anillos
        const ringTexture = this.createRingTexture();
        ringMaterial.map = ringTexture;
        
        this.group.add(this.rings);
    }
    
    createRingTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 32;
        const context = canvas.getContext('2d');
        
        // Crear patrón de anillos
        const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
        for (let i = 0; i < 20; i++) {
            const pos = i / 20;
            const alpha = Math.random() * 0.5 + 0.3;
            gradient.addColorStop(pos, `rgba(255, 255, 255, ${alpha})`);
        }
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        return new THREE.CanvasTexture(canvas);
    }
    
    createMoons() {
        if (!this.options.showMoons || !this.data.moons) return;
        
        this.data.moons.forEach((moonData, index) => {
            const moon = this.createMoon(moonData, index);
            this.moons.push(moon);
            this.group.add(moon.group);
        });
    }
    
    createMoon(moonData, index) {
        const moonSize = moonData.size * this.size * 0.5; // Escala relativa al planeta
        const moonDistance = moonData.distance * 100; // Convertir AU a unidades de visualización
        
        const moonGeometry = new THREE.SphereGeometry(moonSize, 16, 16);
        const moonMaterial = new THREE.MeshPhongMaterial({
            color: moonData.color,
            shininess: 5,
            specular: 0x111111
        });
        
        if (moonData.texture) {
            const textureLoader = new THREE.TextureLoader();
            moonMaterial.map = textureLoader.load(`./textures/${moonData.texture}`);
        }
        
        const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
        moonMesh.castShadow = true;
        moonMesh.receiveShadow = true;
        moonMesh.userData = { moon: moonData, parent: this, type: 'moon' };
        
        const moonGroup = new THREE.Group();
        moonGroup.add(moonMesh);
        
        // Órbita de la luna
        const moonOrbit = this.createMoonOrbit(moonDistance);
        moonGroup.add(moonOrbit);
        
        const moon = {
            name: moonData.name,
            mesh: moonMesh,
            group: moonGroup,
            distance: moonDistance,
            orbitalPeriod: moonData.orbitalPeriod,
            angle: Math.random() * Math.PI * 2,
            speed: (2 * Math.PI) / moonData.orbitalPeriod * 0.01
        };
        
        return moon;
    }
    
    createMoonOrbit(distance) {
        const points = [];
        const segments = 64;
        
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(
                distance * Math.cos(angle),
                0,
                distance * Math.sin(angle)
            ));
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x666666,
            transparent: true,
            opacity: 0.2
        });
        
        return new THREE.Line(geometry, material);
    }
    
    createOrbit() {
        this.orbitLine = this.orbitalMechanics.createOrbitLine(
            this.semiMajorAxis * 10, // Escalar para visualización
            this.eccentricity,
            this.inclination
        );
        
        // Personalizar color de órbita según el planeta - más gruesa y luminosa
        const orbitColor = this.getOrbitColor();
        this.orbitLine.material.color.setHex(orbitColor);
        this.orbitLine.material.linewidth = 3; // Más gruesa
        this.orbitLine.material.transparent = true;
        this.orbitLine.material.opacity = 0.8; // Más visible
    }
    
    getOrbitColor() {
        const colors = {
            mercury: 0x8C7853,
            venus: 0xFFC649,
            earth: 0x6B93D6,
            mars: 0xCD5C5C,
            jupiter: 0xD8CA9D,
            saturn: 0xFAD5A5,
            uranus: 0x4FD0E7,
            neptune: 0x4B70DD
        };
        
        return colors[Object.keys(PLANET_DATA).find(key => PLANET_DATA[key] === this.data)] || 0x444444;
    }
    
    createLabel() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        // Sin fondo - transparente
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Texto del label con contorno para mejor visibilidad
        context.fillStyle = 'white';
        context.strokeStyle = 'black';
        context.lineWidth = 3;
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        
        // Dibujar contorno
        context.strokeText(this.data.name, canvas.width / 2, canvas.height / 2 + 8);
        // Dibujar texto
        context.fillText(this.data.name, canvas.width / 2, canvas.height / 2 + 8);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            alphaTest: 0.1
        });
        this.label = new THREE.Sprite(material);
        this.label.scale.set(6, 1.5, 1); // Escala inicial más grande
        this.label.userData = { planet: this, type: 'label' };
    }
    
    createTrail() {
        if (this.trail) return;
        
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(300); // 100 puntos * 3 coordenadas
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.LineBasicMaterial({
            color: this.getOrbitColor(),
            transparent: true,
            opacity: 0.6
        });
        
        this.trail = new THREE.Line(geometry, material);
        this.trail.userData = { positions: [], maxLength: 100 };
    }
    
    updateTrail() {
        if (!this.trail || !this.showTrail) return;
        
        const userData = this.trail.userData;
        
        // Agregar nueva posición
        userData.positions.push(this.group.position.clone());
        
        // Limitar longitud
        if (userData.positions.length > userData.maxLength) {
            userData.positions.shift();
        }
        
        // Actualizar geometría
        const positions = new Float32Array(userData.positions.length * 3);
        userData.positions.forEach((pos, i) => {
            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = pos.y;
            positions[i * 3 + 2] = pos.z;
        });
        
        this.trail.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.trail.geometry.attributes.position.needsUpdate = true;
    }
    
    update(time, camera = null) {
        // Calcular nueva posición orbital
        const position = this.orbitalMechanics.calculateOrbitalPosition({
            semiMajorAxis: this.semiMajorAxis * 10, // Escalar para visualización
            eccentricity: this.eccentricity,
            orbitalSpeed: this.orbitalSpeed * this.orbitalMechanics.timeScale,
            startAngle: this.startAngle,
            inclination: this.inclination
        }, time);
        
        this.group.position.copy(position);
        this.currentDistance = position.length() / 10; // Convertir de vuelta a AU
        
        // Actualizar temperatura
        this.temperature = this.orbitalMechanics.calculatePlanetTemperature(
            this.currentDistance,
            5778, // Temperatura del Sol
            1.0,  // Radio del Sol
            0.3   // Albedo promedio
        );
        
        // Rotación del planeta
        if (this.mesh) {
            const rotationSpeed = (2 * Math.PI) / this.data.rotationPeriod * 0.001;
            this.mesh.rotation.y += rotationSpeed * this.orbitalMechanics.timeScale;
        }
        
        // Actualizar lunas
        this.moons.forEach(moon => {
            moon.angle += moon.speed * this.orbitalMechanics.timeScale;
            moon.mesh.position.x = Math.cos(moon.angle) * moon.distance;
            moon.mesh.position.z = Math.sin(moon.angle) * moon.distance;
            moon.mesh.rotation.y += 0.01 * this.orbitalMechanics.timeScale;
        });
        
        // Actualizar label con escalado dinámico
        if (this.label && this.showLabel) {
            this.label.position.copy(this.group.position);
            this.label.position.y += this.size + 1.0;
            
            // Escalado dinámico basado en la distancia de la cámara
            if (camera) {
                const distance = camera.position.distanceTo(this.group.position);
                const scale = Math.max(0.5, Math.min(3.0, distance * 0.1)); // Escala entre 0.5 y 3.0
                this.label.scale.set(6 * scale, 1.5 * scale, 1);
            }
        }
        
        // Actualizar trail
        if (this.showTrail) {
            this.updateTrail();
        }
    }
    
    setSelected(selected) {
        this.isSelected = selected;
        
        if (this.mesh && this.mesh.children.length > 0) {
            // Cambiar intensidad del efecto Fresnel
            const fresnelMesh = this.mesh.children[0];
            if (fresnelMesh && fresnelMesh.material.uniforms) {
                fresnelMesh.material.uniforms.fresnelBias.value = selected ? 0.2 : 0.1;
                fresnelMesh.material.uniforms.fresnelScale.value = selected ? 1.5 : 1.0;
            }
        }
    }
    
    setShowOrbit(show) {
        this.showOrbit = show;
        if (this.orbitLine) {
            this.orbitLine.visible = show;
        }
    }
    
    setShowLabel(show) {
        this.showLabel = show;
        if (this.label) {
            this.label.visible = show;
        }
    }
    
    setShowTrail(show) {
        this.showTrail = show;
        if (show && !this.trail) {
            this.createTrail();
        }
        if (this.trail) {
            this.trail.visible = show;
        }
    }
    
    getInfo() {
        return {
            name: this.data.name,
            size: this.data.size,
            mass: this.data.mass,
            distance: this.data.distance,
            currentDistance: this.currentDistance,
            periapsis: this.data.periapsis,
            apoapsis: this.data.apoapsis,
            eccentricity: this.data.eccentricity,
            inclination: this.data.inclination,
            orbitalPeriod: this.data.orbitalPeriod,
            rotationPeriod: this.data.rotationPeriod,
            temperature: this.temperature,
            hasAtmosphere: this.data.hasAtmosphere,
            hasRings: this.data.hasRings,
            moons: this.data.moons || []
        };
    }
    
    dispose() {
        // Limpiar recursos
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
        
        if (this.atmosphere) {
            this.atmosphere.geometry.dispose();
            this.atmosphere.material.dispose();
        }
        
        if (this.rings) {
            this.rings.geometry.dispose();
            this.rings.material.dispose();
        }
        
        if (this.orbitLine) {
            this.orbitLine.geometry.dispose();
            this.orbitLine.material.dispose();
        }
        
        if (this.label) {
            this.label.material.dispose();
        }
        
        if (this.trail) {
            this.trail.geometry.dispose();
            this.trail.material.dispose();
        }
        
        this.moons.forEach(moon => {
            moon.mesh.geometry.dispose();
            moon.mesh.material.dispose();
        });
    }
}