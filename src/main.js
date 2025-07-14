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
        this.followingPlanet = null;
        this.lastPlanetPosition = new THREE.Vector3();
        this.showOrbits = true;
        this.showLabels = true;
        this.showTrails = false;
        this.realisticScale = false;
        
        // Raycaster para selección
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // UI
        this.ui = null;
        
        this.init();
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
        this.controls.minDistance = 2;
        this.controls.maxDistance = 300; // Permitir alejar más la cámara
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
        
        // Crear campo de estrellas (más alejado)
        const starfield = getStarfield({ numStars: 1500, size: 0.8, distance: 400 });
        this.scene.add(starfield);
        
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
        // Luz ambiental suave para ver texturas lejanas
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(this.ambientLight);
        
        // Luz direccional del Sol más realista
        this.sunLight = new THREE.DirectionalLight(0xffffff, 4.0);
        this.sunLight.position.set(0, 0, 0);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 4096;
        this.sunLight.shadow.mapSize.height = 4096;
        this.sunLight.shadow.camera.near = 0.1;
        this.sunLight.shadow.camera.far = 2000;
        this.sunLight.shadow.camera.left = -500;
        this.sunLight.shadow.camera.right = 500;
        this.sunLight.shadow.camera.top = 500;
        this.sunLight.shadow.camera.bottom = -500;
        this.scene.add(this.sunLight);
        
        // Luz puntual en el Sol para iluminación realista
        this.pointLight = new THREE.PointLight(0xffffff, 5.0, 2000);
        this.pointLight.position.set(0, 0, 0);
        this.pointLight.castShadow = true;
        this.pointLight.shadow.mapSize.width = 4096;
        this.pointLight.shadow.mapSize.height = 4096;
        this.scene.add(this.pointLight);
    }
    
    createNebulas() {
        // Nebulas removed due to visual flickering
    }
    
    onMouseClick(event) {
        this.updateMousePosition(event);
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Obtener todos los objetos intersectables
        const intersectableObjects = [];
        this.planets.forEach(planet => {
            if (planet.mesh) intersectableObjects.push(planet.mesh);
            planet.moons.forEach(moon => {
                if (moon.mesh) intersectableObjects.push(moon.mesh);
            });
        });
        
        const intersects = this.raycaster.intersectObjects(intersectableObjects);
        
        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;
            
            if (intersectedObject.userData.planet) {
                this.selectPlanet(intersectedObject.userData.planet);
            } else if (intersectedObject.userData.parent) {
                this.selectPlanet(intersectedObject.userData.parent);
            }
        } else {
            this.selectPlanet(null);
        }
    }
    
    onMouseMove(event) {
        this.updateMousePosition(event);
        
        // Aquí se podría añadir lógica para hover effects
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
            case 'KeyT':
                this.toggleTrails();
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
        
        this.selectedPlanet = planet;
        
        if (planet) {
            planet.setSelected(true);
            if (this.ui) {
                this.ui.updatePlanetInfo(planet.getInfo());
            }
        } else {
            if (this.ui) {
                this.ui.clearPlanetInfo();
            }
        }
    }
    
    followPlanet(planet) {
        this.followingPlanet = planet;
        
        // Reiniciar datos de seguimiento para el nuevo planeta
        if (planet) {
            this.followData = {
                initialPlanetPos: planet.group.position.clone(),
                initialCameraPos: this.camera.position.clone(),
                initialTargetPos: this.controls.target.clone()
            };
        } else {
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
        });
    }
    
    toggleLabels() {
        this.showLabels = !this.showLabels;
        this.planets.forEach(planet => {
            planet.setShowLabel(this.showLabels);
        });
    }
    
    toggleTrails() {
        this.showTrails = !this.showTrails;
        this.planets.forEach(planet => {
            planet.setShowTrail(this.showTrails);
            if (this.showTrails && planet.trail) {
                this.scene.add(planet.trail);
            } else if (planet.trail) {
                this.scene.remove(planet.trail);
            }
        });
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
            if (this.lastPlanetPosition.lengthSq() === 0) {
                // First frame, just set the last position
                this.lastPlanetPosition.copy(this.followingPlanet.group.position);
            } else {
                const currentPlanetPosition = this.followingPlanet.group.position;
                const delta = new THREE.Vector3().subVectors(currentPlanetPosition, this.lastPlanetPosition);
                
                // Move the camera by the same amount the planet moved
                this.camera.position.add(delta);
                
                // Update the controls target to the new planet position
                this.controls.target.copy(currentPlanetPosition);
                
                // Store the new position for the next frame
                this.lastPlanetPosition.copy(currentPlanetPosition);
            }
        }
    }
    
    animate(time = 0) {
        requestAnimationFrame((t) => this.animate(t));
        
        if (!this.isPaused) {
            // Actualizar planetas con referencia a la cámara
            this.planets.forEach(planet => {
                planet.update(time * 0.001, this.camera);
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