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
        this.startAngle = 0; // Ángulo inicial fijo para alineación correcta
        
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
        
        // Control de tiempo para evitar saltos de posición
        this.accumulatedTime = 0;
        this.lastUpdateTime = 0;
        this.isFirstUpdate = true;
        
        this.createPlanet();
        this.createOrbit();
        this.createMoons();
        this.createLabel();
    }
    
    calculateDisplaySize() {
        if (this.options.realisticScale) {
            // Escala realista (muy pequeña para la mayoría de planetas)
            return this.data.size * 0.05 * this.options.scale; // Reducido de 0.1 a 0.05
        } else {
            // Escala visual mejorada para mejor visualización
            const baseSize = Math.max(0.05, this.data.size * 0.1); // Reducido de 0.1 y 0.2 a 0.05 y 0.1
            return Math.min(baseSize * this.options.scale, 1.0); // Reducido de 2.0 a 1.0
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
            specular: 0x222222,
            side: THREE.FrontSide,
            transparent: false,
            alphaTest: 0.1
        });
        
        // Crear la esfera del planeta
        const planetSphere = new THREE.Mesh(geometry, material);
        planetSphere.castShadow = true;
        planetSphere.receiveShadow = true;
        
        // Crear un grupo para manejar la inclinación axial
        this.mesh = new THREE.Group();
        this.mesh.userData = { planet: this, type: 'planet' };
        
        // Aplicar inclinación axial al grupo
        if (this.data.axialTilt !== undefined) {
            // Convertir grados a radianes
            const axialTiltRad = (this.data.axialTilt * Math.PI) / 180;
            // Aplicar la inclinación del eje del planeta
            this.mesh.rotation.z = axialTiltRad;
        }
        
        // Añadir la esfera al grupo inclinado
        this.mesh.add(planetSphere);
        
        // Guardar referencia a la esfera para la rotación
        this.planetSphere = planetSphere;
        
        // Efecto Fresnel para el borde
        if (this.data.hasAtmosphere) {
            const fresnelMat = getFresnelMat({ 
                rimHex: this.data.atmosphereColor || 0x87CEEB, 
                facingHex: 0x000000 
            });
            const fresnelMesh = new THREE.Mesh(geometry, fresnelMat);
            fresnelMesh.scale.setScalar(1.01);
            planetSphere.add(fresnelMesh);
            
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
            side: THREE.BackSide,
            depthWrite: false,
            depthTest: true,
            blending: THREE.NormalBlending
        });
        
        this.atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        this.group.add(this.atmosphere);
    }
    
    createRings() {
        // Si hay segmentos de anillos definidos, crear anillos múltiples
        if (this.data.ringSegments && this.data.ringSegments.length > 0) {
            this.rings = new THREE.Group();
            
            this.data.ringSegments.forEach((segment, index) => {
                const innerRadius = this.size * segment.innerRadius;
                const outerRadius = this.size * segment.outerRadius;
                
                const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 128);
                const ringMaterial = new THREE.MeshBasicMaterial({
                    color: segment.color || this.data.ringColor || 0xC0C0C0,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: segment.opacity || 0.7,
                    depthWrite: false,
                    depthTest: true,
                    blending: THREE.NormalBlending
                });
                
                // Añadir textura para mayor realismo
                const ringTexture = this.createRingTexture(segment.color);
                ringMaterial.map = ringTexture;
                
                const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
                ringMesh.rotation.x = Math.PI / 2;
                
                this.rings.add(ringMesh);
            });
        } else {
            // Anillo simple (compatibilidad con planetas sin segmentos)
            const innerRadius = this.size * (this.data.ringInnerRadius || 1.5);
            const outerRadius = this.size * (this.data.ringOuterRadius || 2.5);
            
            const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: this.data.ringColor || 0xC0C0C0,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.7,
                depthWrite: false,
                depthTest: true,
                blending: THREE.NormalBlending
            });
            
            this.rings = new THREE.Mesh(ringGeometry, ringMaterial);
            this.rings.rotation.x = Math.PI / 2;
            
            // Añadir variación en los anillos
            const ringTexture = this.createRingTexture();
            ringMaterial.map = ringTexture;
        }
        
        // Aplicar inclinación axial a los anillos (están en el plano ecuatorial del planeta)
        if (this.rings && this.data.axialTilt !== undefined) {
            // Convertir grados a radianes
            const axialTiltRad = (this.data.axialTilt * Math.PI) / 180;
            // Aplicar la inclinación del eje del planeta a los anillos
            this.rings.rotation.z = axialTiltRad;
        }
        
        this.group.add(this.rings);
    }
    
    createRingTexture(ringColor = null) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 32;
        const context = canvas.getContext('2d');
        
        // Convertir color hex a RGB si se proporciona
        let baseColor = { r: 255, g: 255, b: 255 };
        if (ringColor) {
            baseColor.r = (ringColor >> 16) & 255;
            baseColor.g = (ringColor >> 8) & 255;
            baseColor.b = ringColor & 255;
        }
        
        // Crear patrón de anillos más realista con variaciones
        const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
        for (let i = 0; i < 40; i++) {
            const pos = i / 40;
            const alpha = Math.random() * 0.6 + 0.2;
            const brightness = Math.random() * 0.4 + 0.6;
            
            const r = Math.floor(baseColor.r * brightness);
            const g = Math.floor(baseColor.g * brightness);
            const b = Math.floor(baseColor.b * brightness);
            
            gradient.addColorStop(pos, `rgba(${r}, ${g}, ${b}, ${alpha})`);
        }
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Añadir algunas líneas más oscuras para simular gaps en los anillos
        context.fillStyle = 'rgba(0, 0, 0, 0.3)';
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * canvas.width;
            context.fillRect(x, 0, 2, canvas.height);
        }
        
        return new THREE.CanvasTexture(canvas);
    }
    
    createMoons() {
        if (!this.options.showMoons || !this.data.moons) return;
        
        this.data.moons.forEach((moonData, index) => {
            const moon = this.createMoon(moonData, index);
            this.moons.push(moon);
            
            // Aplicar inclinación a las órbitas de las lunas
            if (moonData.eclipticInclination !== undefined) {
                // Caso especial: Luna orbita en el plano de la eclíptica
                const eclipticInclinationRad = (moonData.eclipticInclination * Math.PI) / 180;
                moon.group.rotation.z = eclipticInclinationRad;
            } else if (this.data.axialTilt !== undefined) {
                // Caso general: lunas regulares siguen la inclinación axial del planeta
                const axialTiltRad = (this.data.axialTilt * Math.PI) / 180;
                moon.group.rotation.z = axialTiltRad;
            }
            
            this.group.add(moon.group);
        });
    }
    
    createMoon(moonData, index) {
        let moonSize = Math.max(0.0025, moonData.size * this.size * 0.175); // Escala de la luna reducida a la mitad

        let moonDistance;
        
        // Para Saturno, usar las distancias en radios planetarios directamente
        if (this.data.name === 'Saturno') {
            moonDistance = moonData.distance * this.size; // distancia ya está en radios planetarios
        } else {
            // Escala de distancia revisada para mayor realismo y visibilidad
            const moonDistanceScale = 400;
            moonDistance = moonData.distance * moonDistanceScale;

            // Para Júpiter, aumentar el espaciado para evitar solapamientos
            if (this.data.name === 'Júpiter') {
                moonDistance *= 1.5;
            }

            // Caso específico para la Luna de la Tierra
            if (this.data.name === 'Tierra') {
                moonDistance *= 0.75; // Acercar un poco la Luna
            }

            // Caso específico para las lunas de Marte
            if (this.data.name === 'Marte') {
                moonSize *= 0.08; // Aumentar ligeramente el tamaño para mejor visibilidad
                moonDistance *= (moonData.name === 'Deimos') ? 2.5 : 1.5; // Mejor separación proporcional a las distancias reales
            }
        }

        // Asegurar una distancia mínima para que la luna no quede dentro del planeta
        const minMoonDistance = this.size * 1.1 + moonSize;
        moonDistance = Math.max(minMoonDistance, moonDistance);
        
        const moonGeometry = new THREE.SphereGeometry(moonSize, 16, 16);
        const moonMaterial = new THREE.MeshPhongMaterial({
            color: moonData.color,
            shininess: 5,
            specular: 0x111111,
            side: THREE.FrontSide,
            transparent: false,
            alphaTest: 0.1
        });
        
        if (moonData.texture) {
            const textureLoader = new THREE.TextureLoader();
            moonMaterial.map = textureLoader.load(`./textures/${moonData.texture}`);
        }
        
        const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
        moonMesh.castShadow = true;
        moonMesh.receiveShadow = true;
        const moonGroup = new THREE.Group();
        moonGroup.add(moonMesh);
        
        // Órbita de la luna
        const moonOrbit = this.createMoonOrbit(moonDistance);
        moonGroup.add(moonOrbit);
        
        // Calcular velocidad orbital realista
        // Convertir período orbital de días a unidades de simulación
        // Factor de conversión: 1 día real = 0.001 unidades de tiempo de simulación
        const timeConversionFactor = 0.001;
        const orbitalSpeedInSimulation = (2 * Math.PI) / (moonData.orbitalPeriod * timeConversionFactor);
        
        const moon = {
            name: moonData.name,
            mesh: moonMesh,
            group: moonGroup,
            distance: moonDistance,
            orbitalPeriod: moonData.orbitalPeriod,
            angle: Math.random() * Math.PI * 2,
            speed: orbitalSpeedInSimulation
        };
        
        // Ahora configurar el userData correctamente con el objeto moon completo
        moonMesh.userData = { moon: moon, parent: this, type: 'moon' };
        
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
            color: 0xaaaaaa,  // Color más claro para mejor visibilidad
            transparent: true,
            opacity: 0.6      // Opacidad aumentada de 0.2 a 0.6
        });
        
        return new THREE.Line(geometry, material);
    }
    
    createOrbit() {
        this.orbitLine = this.orbitalMechanics.createOrbitLine(
            this.semiMajorAxis * 20, // Reducido de 40 a 20 para mejor renderizado
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
        canvas.width = 512; // Mayor resolución para texto más nítido
        canvas.height = 128;
        
        // Sin fondo - transparente
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Texto del label con contorno para mejor visibilidad
        context.fillStyle = 'white';
        context.strokeStyle = 'black';
        context.lineWidth = 3;
        context.font = 'bold 32px Arial'; // Fuente más grande para mejor calidad
        context.textAlign = 'center';
        
        // Dibujar contorno
        context.strokeText(this.data.name, canvas.width / 2, canvas.height / 2 + 12);
        // Dibujar texto
        context.fillText(this.data.name, canvas.width / 2, canvas.height / 2 + 12);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            alphaTest: 0.1
        });
        this.label = new THREE.Sprite(material);
        this.label.scale.set(0.1, 0.025, 1); // Escala inicial muy pequeña para evitar el flash grande
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
    
    update(time, camera = null, system = null) {
        // Manejar primera actualización
        if (this.isFirstUpdate) {
            this.lastUpdateTime = time;
            this.isFirstUpdate = false;
            return;
        }
        
        // Calcular delta de tiempo y acumular según timeScale
        const deltaTime = time - this.lastUpdateTime;
        this.accumulatedTime += deltaTime * this.orbitalMechanics.timeScale;
        this.lastUpdateTime = time;
        
        // Calcular nueva posición orbital usando tiempo acumulado
        const position = this.orbitalMechanics.calculateOrbitalPosition({
            semiMajorAxis: this.semiMajorAxis * 20, // Reducido de 40 a 20 para mejor renderizado
            eccentricity: this.eccentricity,
            orbitalSpeed: -this.orbitalSpeed, // Invertir dirección orbital
            startAngle: this.startAngle,
            inclination: this.inclination
        }, this.accumulatedTime);
        
        this.group.position.copy(position);
        this.currentDistance = position.length() / 20; // Ajustado al nuevo factor
        
        // Actualizar temperatura
        this.temperature = this.orbitalMechanics.calculatePlanetTemperature(
            this.currentDistance,
            5778, // Temperatura del Sol
            1.0,  // Radio del Sol
            0.3   // Albedo promedio
        );
        

        
        // Rotación del planeta sobre su propio eje
        if (this.planetSphere) {
            const rotationPeriod = Math.abs(this.data.rotationPeriod); // Usar valor absoluto
            const rotationSpeed = 2 * Math.PI / (rotationPeriod * 3600); // rad/s
            // Factor de aceleración muy alto para hacer visible la rotación
            // Si el período original era negativo, invertir la dirección
            const direction = this.data.rotationPeriod < 0 ? -1 : 1;
            this.planetSphere.rotation.y += rotationSpeed * direction * this.orbitalMechanics.timeScale * 200000;
        }
        this.moons.forEach(moon => {
            // Aplicar velocidad orbital realista sin factor adicional
            // Invertir dirección orbital de las lunas (excepto las que ya tienen órbita retrógrada)
            const moonDirection = moon.orbitalPeriod < 0 ? 1 : -1; // Si ya es retrógrada, mantener dirección
            moon.angle += moon.speed * deltaTime * this.orbitalMechanics.timeScale * moonDirection;
            moon.mesh.position.x = Math.cos(moon.angle) * moon.distance;
            moon.mesh.position.z = Math.sin(moon.angle) * moon.distance;

            // Rotación síncrona: la luna siempre muestra la misma cara al planeta
            // La mayoría de las lunas tienen rotación síncrona (período de rotación = período orbital)
            moon.mesh.rotation.y = moon.angle;
            
            // Actualizar etiqueta de la luna si existe
            if (moon.label && moon.label.visible) {
                // Calcular posición mundial de la luna
                const moonWorldPosition = new THREE.Vector3();
                moon.mesh.getWorldPosition(moonWorldPosition);
                
                // Posicionar la etiqueta encima de la luna
                const moonSize = moon.mesh.geometry.parameters.radius;
                moon.label.position.copy(moonWorldPosition);
                moon.label.position.y += moonSize * 2 + 0.01;
                
                // Escalado basado en la distancia de la cámara
                if (camera) {
                    const distance = camera.position.distanceTo(moonWorldPosition);
                    const scale = Math.max(0.01, distance * 0.05);
                    moon.label.scale.set(scale, scale * 0.25, 1);
                }
            }
        });

        
        // Actualizar label con escalado constante
        if (this.label && this.showLabel) {
            // Verificar si las etiquetas están ocultas por transición
            if (system && system.labelsHiddenForTransition) {
                this.label.visible = false;
            } else {
                this.label.position.copy(this.group.position);
                // Ajuste de posición para acercar más a planetas pequeños
                 if (this.size < 0.5) { // Umbral para considerar un planeta pequeño (ej: Mercurio, Marte)
                     this.label.position.y += this.size * 1.0 + 0.05; // Más cerca para planetas pequeños
                 } else {
                     this.label.position.y += this.size * 1.2 + 0.2; // Mantener la posición anterior para planetas grandes
                 }
                
                // Escalado para mantener un tamaño visual más constante en pantalla
                if (camera) {
                    const distance = camera.position.distanceTo(this.group.position);
                    // Control de opacidad y escalado basado en la distancia para un efecto de desvanecimiento
                    const maxDistance = 150; // Distancia a la que la etiqueta desaparece por completo
                    const fadeStartDistance = 100; // Distancia a la que comienza el desvanecimiento

                    if (distance > maxDistance) {
                        this.label.visible = false;
                    } else {
                        this.label.visible = true;
                        let opacity = 1;
                        if (distance > fadeStartDistance) {
                            opacity = 1 - (distance - fadeStartDistance) / (maxDistance - fadeStartDistance);
                        }
                        // Solo actualizar opacidad si no se está haciendo fade in
                        if (this.label.material.opacity >= 1 || !this.label.visible) {
                            this.label.material.opacity = Math.max(0, opacity); // Asegura que la opacidad no sea negativa
                        }
                        this.label.material.transparent = true; // Habilita la transparencia

                        // Escala inversamente proporcional a la distancia, con un límite mínimo para que no desaparezca
                        const minScaleFactor = 0.05; // Escala mínima para la letra cuando está muy lejos
                        const scale = Math.max(minScaleFactor, distance * 0.12); // Factor ajustado para etiquetas más grandes y reducción gradual
                        this.label.scale.set(3.0 * scale, 0.75 * scale, 1);
                    }
                }
            }
        }
        
        // Actualizar trail
        if (this.showTrail) {
            this.updateTrail();
        }
    }
    
    setSelected(selected) {
        this.isSelected = selected;
        
        if (this.planetSphere && this.planetSphere.children.length > 0) {
            // Cambiar intensidad del efecto Fresnel
            const fresnelMesh = this.planetSphere.children[0];
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
    
    getInfo(camera = null, controls = null) {
        const info = {
            name: this.data.name,
            size: this.data.size,
            mass: this.data.mass,
            distance: this.data.distance,
            currentDistance: this.currentDistance,
            periapsis: this.data.periapsis,
            apoapsis: this.data.apoapsis,
            eccentricity: this.data.eccentricity,
            inclination: this.data.inclination,
            axialTilt: this.data.axialTilt,
            orbitalPeriod: this.data.orbitalPeriod,
            rotationPeriod: this.data.rotationPeriod,
            temperature: this.data.temperature ? this.data.temperature.average : this.temperature,
            temperatureRange: this.data.temperature ? `${this.data.temperature.min}-${this.data.temperature.max} K` : null,
            hasAtmosphere: this.data.hasAtmosphere,
            hasRings: this.data.hasRings,
            moons: (this.data.moons || []).map(moon => ({
                ...moon,
                eclipticInclination: moon.eclipticInclination
            }))
        };
        
        return info;
    }
    
    dispose() {
        // Limpiar recursos
        if (this.planetSphere) {
            this.planetSphere.geometry.dispose();
            this.planetSphere.material.dispose();
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
            
            // Limpiar etiqueta de la luna si existe
            if (moon.label) {
                moon.label.material.dispose();
            }
        });
    }
}