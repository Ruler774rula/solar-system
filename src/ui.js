/**
 * Interfaz de Usuario para el Simulador de Sistema Solar
 * Maneja todos los controles y paneles de información
 */

export class UI {
    constructor(simulator) {
        this.simulator = simulator;
        this.elements = {};
        this.isInitialized = false;
        
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    init() {
        this.getElements();
        this.setupEventListeners();
        this.updatePlanetList();
        this.setDefaultValues();
        this.hideLoading();
        this.isInitialized = true;
    }
    
    setDefaultValues() {
        // Configurar velocidad por defecto a 1.0x con velocidad moderada
        if (this.elements.timeScale) {
            this.elements.timeScale.value = 1.0;
            this.elements.timeScaleValue.textContent = '1.0x';
            this.simulator.setTimeScale(0.05); // Velocidad por defecto más lenta pero visible
        }
    }
    
    getElements() {
        // Obtener referencias a elementos del DOM
        this.elements = {
            loading: document.getElementById('loading'),
            uiContainer: document.getElementById('ui-container'),
            pauseBtn: document.getElementById('pause-btn'),
            resetCameraBtn: document.getElementById('reset-camera-btn'),
            stopFollowBtn: document.getElementById('stop-follow-btn'),
            timeScale: document.getElementById('time-scale'),
            timeScaleValue: document.getElementById('time-scale-value'),
            showOrbits: document.getElementById('show-orbits'),
            showLabels: document.getElementById('show-labels'),
            showTrails: document.getElementById('show-trails'),
            exportDataBtn: document.getElementById('export-data-btn'),
            screenshotBtn: document.getElementById('screenshot-btn'),
            planetInfo: document.getElementById('planet-info'),
            planetItems: document.getElementById('planet-items'),
            followingStatus: document.getElementById('following-status'),
            simulationStatus: document.getElementById('simulation-status')
        };
    }
    
    setupEventListeners() {
        // Controles de simulación
        this.elements.pauseBtn.addEventListener('click', () => {
            this.simulator.togglePause();
        });
        
        this.elements.resetCameraBtn.addEventListener('click', () => {
            this.simulator.resetCamera();
        });
        
        this.elements.stopFollowBtn.addEventListener('click', () => {
            this.simulator.stopFollowing();
        });
        
        // Control de velocidad de tiempo con rango mejorado
        this.elements.timeScale.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            // Mapear el rango del slider (0.1-5.0) a velocidades apropiadas
            let actualSpeed;
            if (value <= 1.0) {
                // Para valores de 0.1 a 1.0, mapear a velocidades muy lentas
                actualSpeed = value * 0.05; // 0.005 a 0.05
            } else {
                // Para valores de 1.0 a 5.0, incremento más rápido
                actualSpeed = 0.05 + (value - 1.0) * 0.1; // 0.05 a 0.45
            }
            this.simulator.setTimeScale(actualSpeed);
            this.elements.timeScaleValue.textContent = `${value.toFixed(1)}x`;
        });
        
        // Opciones visuales
        this.elements.showOrbits.addEventListener('change', (e) => {
            this.simulator.toggleOrbits();
        });
        
        this.elements.showLabels.addEventListener('change', (e) => {
            this.simulator.toggleLabels();
        });
        
        this.elements.showTrails.addEventListener('change', (e) => {
            this.simulator.toggleTrails();
        });
        
        // Herramientas
        this.elements.exportDataBtn.addEventListener('click', () => {
            this.exportData();
        });
        
        this.elements.screenshotBtn.addEventListener('click', () => {
            this.simulator.captureScreenshot();
        });
    }
    
    updatePlanetList() {
        if (!this.elements.planetItems) return;
        
        this.elements.planetItems.innerHTML = '';
        
        const planets = this.simulator.getPlanets();
        planets.forEach(planet => {
            const planetItem = document.createElement('div');
            planetItem.className = 'planet-item';
            planetItem.textContent = planet.data.name;
            planetItem.addEventListener('click', () => {
                this.selectPlanet(planet);
            });
            
            this.elements.planetItems.appendChild(planetItem);
        });
    }
    
    selectPlanet(planet) {
        // Actualizar selección visual en la lista
        const planetItems = this.elements.planetItems.querySelectorAll('.planet-item');
        planetItems.forEach(item => item.classList.remove('selected'));
        
        const selectedItem = Array.from(planetItems).find(item => 
            item.textContent === planet.data.name
        );
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }
        
        // Seleccionar y seguir planeta en el simulador
        this.simulator.selectPlanet(planet);
        this.simulator.followPlanet(planet);
    }
    
    updatePlanetInfo(planetInfo) {
        if (!this.elements.planetInfo || !planetInfo) return;
        
        const html = `
            <h4>${planetInfo.name}</h4>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Tamaño</div>
                    <div class="info-value">${planetInfo.size.toFixed(3)} R⊕</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Masa</div>
                    <div class="info-value">${planetInfo.mass.toFixed(3)} M⊕</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Distancia</div>
                    <div class="info-value">${planetInfo.distance.toFixed(3)} AU</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Dist. Actual</div>
                    <div class="info-value">${planetInfo.currentDistance.toFixed(3)} AU</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Periapsis</div>
                    <div class="info-value">${planetInfo.periapsis.toFixed(3)} AU</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Apoapsis</div>
                    <div class="info-value">${planetInfo.apoapsis.toFixed(3)} AU</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Excentricidad</div>
                    <div class="info-value">${planetInfo.eccentricity.toFixed(4)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Inclinación</div>
                    <div class="info-value">${planetInfo.inclination.toFixed(2)}°</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Período Orbital</div>
                    <div class="info-value">${planetInfo.orbitalPeriod.toFixed(1)} días</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Período Rotación</div>
                    <div class="info-value">${planetInfo.rotationPeriod.toFixed(1)} h</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Temperatura</div>
                    <div class="info-value">${planetInfo.temperature.toFixed(0)} K</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Atmósfera</div>
                    <div class="info-value">${planetInfo.hasAtmosphere ? 'Sí' : 'No'}</div>
                </div>
            </div>
            
            ${planetInfo.hasRings ? '<div class="info-item"><strong>Tiene anillos</strong></div>' : ''}
            
            ${planetInfo.moons.length > 0 ? `
                <div class="ui-section">
                    <h4>Lunas (${planetInfo.moons.length})</h4>
                    ${planetInfo.moons.map(moon => `
                        <div class="info-item">
                            <div class="info-label">${moon.name}</div>
                            <div class="info-value">${moon.distance.toFixed(3)} AU</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <div class="ui-section">
                <button class="ui-button" onclick="window.solarSystem.followPlanet(window.solarSystem.getPlanetByName('${planetInfo.name}'))">
                    Seguir Planeta
                </button>
            </div>
        `;
        
        this.elements.planetInfo.innerHTML = html;
    }
    
    clearPlanetInfo() {
        if (this.elements.planetInfo) {
            this.elements.planetInfo.innerHTML = '<p>Haz clic en un planeta para ver su información</p>';
        }
        
        // Limpiar selección en la lista
        const planetItems = this.elements.planetItems.querySelectorAll('.planet-item');
        planetItems.forEach(item => item.classList.remove('selected'));
    }
    
    updateFollowingStatus(planetName) {
        if (!this.elements.followingStatus) return;
        
        if (planetName) {
            this.elements.followingStatus.textContent = `Siguiendo: ${planetName}`;
            this.elements.followingStatus.style.display = 'block';
        } else {
            this.elements.followingStatus.style.display = 'none';
        }
    }
    
    updatePauseStatus(isPaused) {
        if (!this.elements.pauseBtn || !this.elements.simulationStatus) return;
        
        this.elements.pauseBtn.textContent = isPaused ? 'Reanudar' : 'Pausar';
        this.elements.pauseBtn.classList.toggle('active', isPaused);
        this.elements.simulationStatus.textContent = isPaused ? 'Simulación: Pausada' : 'Simulación: Activa';
    }
    
    exportData() {
        const data = this.simulator.exportSystemData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `sistema-solar-${Date.now()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }
    
    hideLoading() {
        if (this.elements.loading) {
            this.elements.loading.style.display = 'none';
        }
        if (this.elements.uiContainer) {
            this.elements.uiContainer.style.display = 'block';
        }
    }
    
    showLoading() {
        if (this.elements.loading) {
            this.elements.loading.style.display = 'block';
        }
        if (this.elements.uiContainer) {
            this.elements.uiContainer.style.display = 'none';
        }
    }
    
    update() {
        // Actualizar información en tiempo real si es necesario
        if (this.simulator.selectedPlanet) {
            this.updatePlanetInfo(this.simulator.selectedPlanet.getInfo());
        }
    }
    
    // Métodos para controles de teclado
    handleKeyPress(key) {
        switch (key) {
            case 'Space':
                this.simulator.togglePause();
                break;
            case 'KeyR':
                this.simulator.resetCamera();
                break;
            case 'KeyO':
                this.elements.showOrbits.checked = !this.elements.showOrbits.checked;
                this.simulator.toggleOrbits();
                break;
            case 'KeyL':
                this.elements.showLabels.checked = !this.elements.showLabels.checked;
                this.simulator.toggleLabels();
                break;
            case 'KeyT':
                this.elements.showTrails.checked = !this.elements.showTrails.checked;
                this.simulator.toggleTrails();
                break;
            case 'KeyF':
                if (this.simulator.selectedPlanet) {
                    this.simulator.followPlanet(this.simulator.selectedPlanet);
                }
                break;
            case 'Escape':
                this.simulator.stopFollowing();
                break;
        }
    }
    
    // Mostrar notificaciones
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 10000;
            border: 1px solid ${type === 'error' ? '#f44336' : '#4CAF50'};
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}