/**
 * Sistema Solar Realista - Archivo Principal
 * Integra mecánicas orbitales avanzadas y planetas realistas
 */

import * as THREE from "three";
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import { OBJLoader } from "jsm/loaders/OBJLoader.js";
import getSun from "./getSun.js";
import getNebula from "./getNebula.js";
import getStarfield from "./getStarfield.js";
import getDistantStarfield from "./getDistantStarfield.js";
import getAsteroidBelt from "./getAsteroidBelt.js";
import { RealisticPlanet } from "./realisticPlanet.js";
import { OrbitalMechanics } from "./orbitalMechanics.js";
import { PLANET_DATA } from "./planetData.js";
import { UI } from "./ui.js";

class RealisticSolarSystem {
    constructor() {
        // Configuración de la escena
        this.w = window.innerWidth;
        this.h = window.innerHeight;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.w / this.h, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        // Sistema orbital
        this.orbitalMechanics = new OrbitalMechanics();
        this.planets = new Map();
        this.solarSystem = new THREE.Group();
        
        // Estado de la simulación
        this.isPaused = false;
        this.selectedPlanet = null;
        this.selectedMoon = null;
        this.followingPlanet = null;
        this.lastPlanetPosition = new THREE.Vector3();
        this.showOrbits = true;
        this.showLabels = true;
        this.realisticScale = true;
        this.labelsHiddenForTransition = false;
        this.showUI = true;
        
        // Raycaster para selección
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // UI
        this.ui = null;
        
        this.init();
    }
    
    selectMoon(moon, parentPlanet) {
        // Deseleccionar luna anterior
        if (this.selectedMoon && this.selectedMoon.label) {
            this.selectedMoon.label.visible = false;
        }
        
        this.selectedMoon = moon;
        
        if (moon) {
            // Crear label para la luna si no existe
            if (!moon.label) {
                this.createMoonLabel(moon);
            }
            
            // Mostrar label de la luna
            if (moon.label) {
                moon.label.visible = true;
            }
            
            // Hacer zoom a la luna
            this.followMoon(moon, parentPlanet);
        }
    }
    
    createMoonLabel(moon) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;
        
        // Sin fondo - transparente
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Texto del label con contorno para mejor visibilidad
        context.fillStyle = 'white';
        context.strokeStyle = 'black';
        context.lineWidth = 3;
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        
        // Dibujar contorno
        context.strokeText(moon.name, canvas.width / 2, canvas.height / 2 + 12);
        // Dibujar texto
        context.fillText(moon.name, canvas.width / 2, canvas.height / 2 + 12);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            alphaTest: 0.1
        });
        
        moon.label = new THREE.Sprite(material);
        moon.label.scale.set(0.05, 0.0125, 1);
        moon.label.userData = { moon: moon, type: 'moonLabel' };
        
        this.scene.add(moon.label);
    }
    
    followMoon(moon, parentPlanet) {
        // Calcular la posición mundial de la luna
        const moonWorldPosition = new THREE.Vector3();
        moon.mesh.getWorldPosition(moonWorldPosition);
        
        // Ocultar todas las etiquetas antes del zoom
        this.hideLabelsForTransition();
        
        // Calcular distancia apropiada para la luna
        const moonSize = moon.mesh.geometry.parameters.radius;
        const distance = Math.max(moonSize * 8, 0.02); // Distancia mínima muy pequeña para lunas
        
        // Ajustar distancia mínima de la cámara para la luna
        this.controls.minDistance = Math.max(moonSize * 2, 0.01);
        
        // Posicionar la cámara cerca de la luna
        const direction = new THREE.Vector3(1, 0.5, 1).normalize();
        this.camera.position.copy(moonWorldPosition).add(direction.multiplyScalar(distance));
        this.controls.target.copy(moonWorldPosition);
        
        // Actualizar controles
        this.controls.update();
        
        // Mostrar las etiquetas después del zoom con un pequeño delay
        setTimeout(() => {
            this.showLabelsAfterTransition();
        }, 100);
    }
    
    init() {
        this.setupRenderer();
        this.setupCamera();
        this.setupControls();
        this.setupEventListeners();
        this.loadAssets();
    }
    
    setupRenderer() {
        this.renderer.setSize(this.w, this.h);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.8;
        document.body.appendChild(this.renderer.domElement);
    }
    
    setupCamera() {
        this.camera.position.set(0, 5, 15);
        this.camera.lookAt(0, 0, 0);
    }
    
    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 2.0; // Distancia mínima fija muy pequeña
        this.controls.maxDistance = 650; // Ajustado para que la órbita de Neptuno quede al límite
        this.controls.enablePan = true;
        this.controls.enableZoom = true;
    }
    
    setupEventListeners() {
        // Redimensionamiento de ventana
        window.addEventListener('resize', () => this.handleWindowResize(), false);
        
        // Eventos del ratón para selección
        this.renderer.domElement.addEventListener('click', (event) => this.onMouseClick(event));
        this.renderer.domElement.addEventListener('mousemove', (event) => this.onMouseMove(event));
        
        // Eventos de teclado
        window.addEventListener('keydown', (event) => this.onKeyDown(event));
    }
    
    loadAssets() {
        const sceneData = { objs: [] };
        const manager = new THREE.LoadingManager();
        
        manager.onLoad = () => this.initScene(sceneData);
        
        // Cargar modelos de asteroides
        const loader = new OBJLoader(manager);
        const objs = ['Rock1', 'Rock2', 'Rock3'];
        
        objs.forEach((name) => {
            const path = `./rocks/${name}.obj`;
            loader.load(path, (obj) => {
                obj.traverse((child) => {
                    if (child.isMesh) {
                        sceneData.objs.push(child);
                    }
                });
            });
        });
    }
    
    initScene(data) {
        // Configurar sistema solar
        this.scene.add(this.solarSystem);
        
        // Crear el Sol
        const sun = getSun();
        sun.position.set(0, 0, 0);
        this.solarSystem.add(sun);
        
        // Crear planetas realistas
        this.createRealisticPlanets();
        
        // Crear cinturón de asteroides
        const asteroidBelt = getAsteroidBelt(data.objs);
        this.solarSystem.add(asteroidBelt);
        
        // Crear campo de estrellas entre Urano y Neptuno (19-30 AU * 20 = 380-600 unidades)
        const starfield = getStarfield({ numStars: 1500, size: 0.8, distance: 500 });
        this.scene.add(starfield);
        
        // Crear starfield distante más allá de la órbita de Neptuno
        const distantStarfield = getDistantStarfield({ numStars: 800, size: 0.3, distance: 750 });
        this.scene.add(distantStarfield);
        
        // Configurar iluminación
        this.setupLighting();
        
        // Crear nebulosas lejanas
        this.createNebulas();
        
        // Inicializar UI
        this.ui = new UI(this);
        
        // Iniciar animación
        this.animate();
    }
    
    createRealisticPlanets() {
        const planetKeys = Object.keys(PLANET_DATA);
        
        planetKeys.forEach(planetKey => {
            const planet = new RealisticPlanet(planetKey, this.orbitalMechanics, {
                scale: 1.0,
                showMoons: true,
                realisticScale: this.realisticScale
            });
            
            this.planets.set(planetKey, planet);
            this.solarSystem.add(planet.group);
            
            // Añadir órbita a la escena
            if (planet.orbitLine) {
                this.solarSystem.add(planet.orbitLine);
            }
            
            // Añadir label a la escena
            if (planet.label) {
                this.scene.add(planet.label);
            }
        });
    }
    
    setupLighting() {
        // Luz ambiental reducida para permitir sombras más visibles
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(this.ambientLight);
        
        // Luz direccional del Sol con intensidad reducida y color blanco puro
        this.sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
        this.sunLight.position.set(0, 0, 0);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 4096;
        this.sunLight.shadow.mapSize.height = 4096;
        this.sunLight.shadow.camera.near = 0.1;
        this.sunLight.shadow.camera.far = 8000;
        this.sunLight.shadow.camera.left = -800;
        this.sunLight.shadow.camera.right = 800;
        this.sunLight.shadow.camera.top = 800;
        this.sunLight.shadow.camera.bottom = -800;
        this.scene.add(this.sunLight);
        
        // Luz puntual en el Sol sin atenuación por distancia para iluminación uniforme
        this.pointLight = new THREE.PointLight(0xffffff, 5.0, 0); // distance = 0 elimina atenuación
        this.pointLight.position.set(0, 0, 0);
        this.pointLight.castShadow = true;
        this.pointLight.shadow.mapSize.width = 4096;
        this.pointLight.shadow.mapSize.height = 4096;
        this.pointLight.decay = 0; // Sin decaimiento de luz
        this.scene.add(this.pointLight);
        
        // Luz adicional suave para iluminar las caras de los planetas sin lavar las sombras
        this.hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x080820, 0.15);
        this.scene.add(this.hemisphereLight);
    }
    
    createNebulas() {
        // Nebulas removed due to visual flickering
    }
    
    onMouseClick(event) {
        this.updateMousePosition(event);
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Obtener todos los objetos intersectables con prioridad: primero planetas y lunas, luego aros
        const intersectableObjects = [];
        
        // Primero añadir meshes de planetas y lunas (mayor prioridad)
        this.planets.forEach(planet => {
            if (planet.mesh) intersectableObjects.push(planet.mesh);
            planet.moons.forEach(moon => {
                if (moon.mesh) intersectableObjects.push(moon.mesh);
            });
        });
        
        // Luego añadir aros de selección (menor prioridad) - solo si no están seleccionados
        this.planets.forEach(planet => {
            if (planet.selectionRing && !planet.isSelected) {
                intersectableObjects.push(planet.selectionRing);
            }
        });
        
        const intersects = this.raycaster.intersectObjects(intersectableObjects);
        
        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;
            
            if (intersectedObject.userData.planet) {
                // Solo seleccionar si el planeta no está ya seleccionado
                if (!intersectedObject.userData.planet.isSelected) {
                    this.selectPlanet(intersectedObject.userData.planet);
                }
            } else if (intersectedObject.userData.parent) {
                // Solo seleccionar si el planeta no está ya seleccionado
                if (!intersectedObject.userData.parent.isSelected) {
                    this.selectPlanet(intersectedObject.userData.parent);
                }
            } else if (intersectedObject.userData.moon) {
                // Clic directo en una luna
                const moon = intersectedObject.userData.moon;
                const parentPlanet = intersectedObject.userData.parent;
                this.selectMoon(moon, parentPlanet);
            }
        }
        // Removido: no deseleccionar planeta al hacer clic fuera
        // La deselección solo ocurrirá desde la UI
    }
    
    onMouseMove(event) {
        this.updateMousePosition(event);
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Obtener todos los objetos intersectables incluyendo aros de selección
        const intersectableObjects = [];
        this.planets.forEach(planet => {
            if (planet.mesh) intersectableObjects.push(planet.mesh);
            // Solo incluir aro de selección si el planeta no está seleccionado
            if (planet.selectionRing && !planet.isSelected) {
                intersectableObjects.push(planet.selectionRing);
            }
            planet.moons.forEach(moon => {
                if (moon.mesh) intersectableObjects.push(moon.mesh);
            });
        });
        
        const intersects = this.raycaster.intersectObjects(intersectableObjects);
        
        // Resetear hover de todos los planetas
        this.planets.forEach(planet => {
            planet.setHovered(false);
        });
        
        // Aplicar hover al planeta intersectado
        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;
            
            if (intersectedObject.userData.planet) {
                intersectedObject.userData.planet.setHovered(true);
                this.renderer.domElement.style.cursor = 'pointer';
            } else if (intersectedObject.userData.parent) {
                intersectedObject.userData.parent.setHovered(true);
                this.renderer.domElement.style.cursor = 'pointer';
            } else if (intersectedObject.userData.type === 'planet') {
                // Hover sobre el mesh del planeta directamente
                const planet = intersectedObject.userData.planet || intersectedObject.parent?.userData?.planet;
                if (planet) {
                    planet.setHovered(true);
                    this.renderer.domElement.style.cursor = 'pointer';
                } else {
                    this.renderer.domElement.style.cursor = 'default';
                }
            } else {
                this.renderer.domElement.style.cursor = 'default';
            }
        } else {
            this.renderer.domElement.style.cursor = 'default';
        }
    }
    
    updateMousePosition(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }
    
    onKeyDown(event) {
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.togglePause();
                break;
            case 'KeyR':
                this.resetCamera();
                break;
            case 'KeyO':
                this.toggleOrbits();
                break;
            case 'KeyL':
                this.toggleLabels();
                break;
            case 'KeyH':
                this.toggleUI();
                break;
            case 'KeyF':
                if (this.selectedPlanet) {
                    this.followPlanet(this.selectedPlanet);
                }
                break;
            case 'Escape':
                this.stopFollowing();
                break;
        }
    }
    
    selectPlanet(planet) {
        // Deseleccionar planeta anterior
        if (this.selectedPlanet) {
            this.selectedPlanet.setSelected(false);
        }
        
        // Deseleccionar luna anterior si existe
        if (this.selectedMoon) {
            this.selectedMoon = null;
        }
        
        this.selectedPlanet = planet;
        
        if (planet) {
            planet.setSelected(true);
            
            // Hacer zoom automático al planeta seleccionado
            this.followPlanet(planet);
            
            // Actualizar UI
            if (this.ui) {
                // Actualizar selección en la lista de planetas
                const planetItems = this.ui.elements.planetItems.querySelectorAll('.planet-item');
                planetItems.forEach(item => item.classList.remove('selected'));
                
                const selectedItem = Array.from(planetItems).find(item => 
                    item.textContent === planet.data.name
                );
                if (selectedItem) {
                    selectedItem.classList.add('selected');
                }
                
                this.ui.updatePlanetInfo(planet.getInfo(this.camera, this.controls));
            }
        } else {
            // Restaurar distancia mínima por defecto cuando no hay planeta seleccionado
            this.controls.minDistance = 2.0;
            
            if (this.ui) {
                this.ui.clearPlanetInfo();
            }
        }
    }
    
    followPlanet(planet) {
        this.followingPlanet = planet;
        
        // Resetear la posición anterior para forzar reposicionamiento inicial
        this.lastPlanetPosition.set(0, 0, 0);
        
        // Reiniciar datos de seguimiento para el nuevo planeta
        if (planet) {
            // Ocultar todas las etiquetas antes del zoom
            this.hideLabelsForTransition();
            
            // Ajustar distancia mínima de la cámara basada en el planeta específico
            const planetDistances = {
                'Mercurio': 0.139,
                'Venus': 0.199,
                'Tierra': 0.209,
                'Marte': 0.154
            };
            
            const minDistance = planetDistances[planet.data.name] || Math.max(planet.size * 1.5, 0.5);
            
            this.controls.minDistance = minDistance;
            
            this.followData = {
                initialPlanetPos: planet.group.position.clone(),
                initialCameraPos: this.camera.position.clone(),
                initialTargetPos: this.controls.target.clone()
            };
        } else {
            // Restaurar distancia mínima por defecto cuando se deja de seguir
            this.controls.minDistance = 2.0;
            this.followData = null;
        }
        
        if (this.ui) {
            this.ui.updateFollowingStatus(planet ? planet.data.name : null);
        }
    }
    
    stopFollowing() {
        this.followingPlanet = null;
        this.followData = null;
        this.controls.autoRotate = false; // Restaurar controles normales
        
        // Restaurar distancia mínima por defecto
        this.controls.minDistance = 2.0;
        
        if (this.ui) {
            this.ui.updateFollowingStatus(null);
        }
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.ui) {
            this.ui.updatePauseStatus(this.isPaused);
        }
    }
    
    resetCamera() {
        this.stopFollowing();
        this.camera.position.set(0, 5, 15);
        this.camera.lookAt(0, 0, 0);
        this.controls.reset();
    }
    
    toggleOrbits() {
        this.showOrbits = !this.showOrbits;
        this.planets.forEach(planet => {
            planet.setShowOrbit(this.showOrbits);
            // También ocultar/mostrar las órbitas de las lunas
            if (planet.moons) {
                planet.moons.forEach(moon => {
                    if (moon.group && moon.group.children.length > 1) {
                        // El segundo hijo del grupo de la luna es la órbita
                        const moonOrbit = moon.group.children[1];
                        if (moonOrbit) {
                            moonOrbit.visible = this.showOrbits;
                        }
                    }
                });
            }
        });
    }
    
    toggleLabels() {
        this.showLabels = !this.showLabels;
        this.planets.forEach(planet => {
            planet.setShowLabel(this.showLabels);
        });
    }
    
    toggleUI() {
        this.showUI = !this.showUI;
        if (this.ui) {
            this.ui.toggle(this.showUI);
        }
        
        // Controlar la visibilidad de los aros de selección de planetas
        this.planets.forEach(planet => {
            planet.setUIVisible(this.showUI);
        });
    }
    
    selectMoon(moon, parentPlanet) {
        // Deseleccionar luna anterior
        if (this.selectedMoon && this.selectedMoon.label) {
            this.scene.remove(this.selectedMoon.label);
            this.selectedMoon.label.material.dispose();
            this.selectedMoon.label.material.map.dispose();
            this.selectedMoon.label = null;
        }
        
        this.selectedMoon = moon;
        
        if (moon) {
            // Crear y mostrar label para la luna
            if (!moon.label) {
                moon.label = this.createMoonLabel(moon.name);
                this.scene.add(moon.label);
            }
            
            // Seguir la luna
            this.followMoon(moon, parentPlanet);
        }
    }
    
    createMoonLabel(moonName) {
        // Crear canvas para el texto
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        // Configurar el texto
        context.font = 'Bold 24px Arial';
        context.fillStyle = 'rgba(255, 255, 255, 0.9)';
        context.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        context.lineWidth = 3;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Dibujar el texto con contorno
        const x = canvas.width / 2;
        const y = canvas.height / 2;
        context.strokeText(moonName, x, y);
        context.fillText(moonName, x, y);
        
        // Crear textura y sprite
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(0.5, 0.125, 1);
        
        return sprite;
    }
    
    followMoon(moon, parentPlanet) {
        // Calcular posición mundial de la luna
        const moonWorldPosition = new THREE.Vector3();
        moon.mesh.getWorldPosition(moonWorldPosition);
        
        // Ocultar etiquetas durante la transición
        this.hideLabelsForTransition();
        
        // Determinar distancia apropiada basada en el tamaño de la luna
        const moonSize = moon.mesh.geometry.parameters.radius || 0.01;
        const distance = Math.max(moonSize * 8, 0.05); // Distancia mínima muy pequeña para lunas
        const minDistance = Math.max(moonSize * 2, 0.02);
        
        // Posicionar cámara
        const direction = new THREE.Vector3(1, 0.5, 1).normalize();
        this.camera.position.copy(moonWorldPosition).add(direction.multiplyScalar(distance));
        this.controls.target.copy(moonWorldPosition);
        this.controls.minDistance = minDistance;
        
        // Actualizar controles
        this.controls.update();
        
        // Mostrar etiquetas después de un delay
        setTimeout(() => {
            this.showLabelsAfterTransition();
        }, 500);
    }
    
    setTimeScale(scale) {
        this.orbitalMechanics.setTimeScale(scale);
    }
    
    setRealisticScale(realistic) {
        this.realisticScale = realistic;
        // Recrear planetas con nueva escala
        this.planets.forEach(planet => {
            planet.dispose();
            this.solarSystem.remove(planet.group);
            if (planet.orbitLine) this.solarSystem.remove(planet.orbitLine);
            if (planet.label) this.scene.remove(planet.label);
            if (planet.trail) this.scene.remove(planet.trail);
        });
        
        this.planets.clear();
        this.createRealisticPlanets();
    }
    
    updateCameraFollow() {
        if (this.followingPlanet && !this.isPaused) {
            const currentPlanetPosition = this.followingPlanet.group.position;
            
            if (this.lastPlanetPosition.lengthSq() === 0) {
                // Primera vez siguiendo este planeta
                this.lastPlanetPosition.copy(currentPlanetPosition);
                
                // Posicionar la cámara a una distancia apropiada del planeta
                const planetSize = this.followingPlanet.size;
                const distance = Math.max(planetSize * 3, 0.5); // Distancia mínima reducida para planetas pequeños
                
                const direction = new THREE.Vector3(1, 0.5, 1).normalize();
                this.camera.position.copy(currentPlanetPosition).add(direction.multiplyScalar(distance));
                this.controls.target.copy(currentPlanetPosition);
                
                // Mostrar las etiquetas después del zoom con un pequeño delay
                setTimeout(() => {
                    this.showLabelsAfterTransition();
                }, 100);
            } else {
                // Seguir el movimiento del planeta suavemente
                const delta = new THREE.Vector3().subVectors(currentPlanetPosition, this.lastPlanetPosition);
                
                // Mover la cámara y el target de los controles
                this.camera.position.add(delta);
                this.controls.target.add(delta);
                
                // Actualizar la posición anterior
                this.lastPlanetPosition.copy(currentPlanetPosition);
            }
            
            // Asegurar que los controles se actualicen
            this.controls.update();
        }
    }
    
    animate(time = 0) {
        requestAnimationFrame((t) => this.animate(t));
        
        if (!this.isPaused) {
            // Actualizar planetas con referencia a la cámara y al sistema
            this.planets.forEach(planet => {
                planet.update(time * 0.001, this.camera, this);
            });
            
            // Actualizar seguimiento de cámara
            this.updateCameraFollow();
        }
        
        // Siempre actualizar controles para permitir zoom durante seguimiento
        this.controls.update();
        
        // Actualizar UI
        if (this.ui) {
            this.ui.update();
        }
        
        // Renderizar escena
        this.renderer.render(this.scene, this.camera);
    }
    
    hideLabelsForTransition() {
        this.labelsHiddenForTransition = true;
        this.planets.forEach(planet => {
            if (planet.label) {
                planet.label.visible = false;
            }
        });
    }
    
    showLabelsAfterTransition() {
        this.labelsHiddenForTransition = false;
        if (this.showLabels) {
            this.planets.forEach(planet => {
                if (planet.label && planet.showLabel) {
                    planet.label.visible = true;
                    planet.label.material.opacity = 0; // Empezar invisible
                    
                    // Animar el fade in
                    const fadeInDuration = 500; // 500ms
                    const startTime = Date.now();
                    
                    const fadeIn = () => {
                        const elapsed = Date.now() - startTime;
                        const progress = Math.min(elapsed / fadeInDuration, 1);
                        
                        // Función de easing suave (ease-out)
                        const easedProgress = 1 - Math.pow(1 - progress, 3);
                        planet.label.material.opacity = easedProgress;
                        
                        if (progress < 1) {
                            requestAnimationFrame(fadeIn);
                        }
                    };
                    
                    requestAnimationFrame(fadeIn);
                }
            });
        }
        
        // Fade in del aro del planeta seleccionado después de un pequeño delay
        if (this.selectedPlanet) {
            setTimeout(() => {
                this.selectedPlanet.showSelectionRingWithFadeIn();
            }, 300); // Delay de 300ms para que ocurra después de mostrar la info
        }
    }
    
    handleWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    // Métodos públicos para la UI
    getPlanets() {
        return Array.from(this.planets.values());
    }
    
    getPlanetByName(name) {
        for (const planet of this.planets.values()) {
            if (planet.data.name === name) {
                return planet;
            }
        }
        return null;
    }
    
    exportSystemData() {
        const data = {
            timestamp: new Date().toISOString(),
            timeScale: this.orbitalMechanics.timeScale,
            planets: []
        };
        
        this.planets.forEach(planet => {
            data.planets.push({
                name: planet.data.name,
                position: {
                    x: planet.group.position.x,
                    y: planet.group.position.y,
                    z: planet.group.position.z
                },
                info: planet.getInfo()
            });
        });
        
        return data;
    }
    
    captureScreenshot() {
        const link = document.createElement('a');
        link.download = `solar-system-${Date.now()}.png`;
        link.href = this.renderer.domElement.toDataURL();
        link.click();
    }
}

// Inicializar el sistema solar cuando se carga la página
window.addEventListener('DOMContentLoaded', () => {
    window.solarSystem = new RealisticSolarSystem();
});

export { RealisticSolarSystem };