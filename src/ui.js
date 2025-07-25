/**
 * Interfaz de Usuario para el Simulador de Sistema Solar
 * Maneja todos los controles y paneles de información
 */

export class UI {
    constructor(simulator) {
        this.simulator = simulator;
        this.elements = {};
        this.isInitialized = false;
        this.isVisible = true;

        
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
        this.initCustomScrollBehavior();
        this.setupResponsiveLayout();
        this.hideLoading();
        this.isInitialized = true;
    }
    

    
    setupResponsiveLayout() {
        // Gestionar estados de compresión/expansión de paneles
        const controlsPanel = document.getElementById('controls-panel');
        const infoPanel = document.getElementById('info-panel');

        // Añadir clase compact al panel de controles por defecto
        if (controlsPanel) {
            controlsPanel.classList.add('compact');
        }

        // Contraer panel de información cuando se cierra
        const closeInfoBtn = document.querySelector('.close-info-btn');
        if (closeInfoBtn) {
            closeInfoBtn.addEventListener('click', () => {
                if (infoPanel) {
                    infoPanel.classList.remove('expanded');
                }
            });
        }
    }
    

    
    setDefaultValues() {
        // Configurar velocidad por defecto a 1.0x con velocidad moderada
        if (this.elements.timeScale) {
            this.elements.timeScale.value = 0.001;
            this.elements.timeScaleValue.textContent = '0.001x';
            this.simulator.setTimeScale(0.0001); // Velocidad por defecto aún más lenta
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
            exportDataBtn: document.getElementById('export-data-btn'),
            hideUIBtn: document.getElementById('hide-ui-btn'),
            planetInfo: document.getElementById('planet-info'),
            planetItems: document.getElementById('planet-items'),
            followingStatus: document.getElementById('following-status'),
            simulationStatus: document.getElementById('simulation-status'),
            closeInfoPanelBtn: document.getElementById('close-info-panel-btn')
        };
    }
    
    setupEventListeners() {
        // Controles de simulación con soporte para eventos táctiles
        const addTouchFeedback = (element) => {
            if (!element) return;
            
            // Añadir feedback visual para eventos táctiles
            element.addEventListener('touchstart', function() {
                this.classList.add('touch-active');
            }, { passive: true });
            
            element.addEventListener('touchend', function() {
                this.classList.remove('touch-active');
            }, { passive: true });
        };
        
        // Aplicar feedback táctil a todos los botones
        const buttons = document.querySelectorAll('.ui-button');
        buttons.forEach(button => addTouchFeedback(button));
        
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
            if (value <= 0.01) {
                // Para valores de 0.0001 a 0.01, mapear a velocidades extremadamente lentas
                actualSpeed = value * 0.01; // 0.000001 a 0.0001
            } else if (value <= 0.1) {
                // Para valores de 0.01 a 0.1, mapear a velocidades muy lentas
                actualSpeed = 0.0001 + (value - 0.01) * 0.001; // 0.0001 a 0.00019
            } else if (value <= 1.0) {
                // Para valores de 0.1 a 1.0, mapear a velocidades lentas
                actualSpeed = 0.00019 + (value - 0.1) * 0.005; // 0.00019 a 0.00064
            } else {
                // Para valores de 1.0 a 5.0, incremento más rápido
                actualSpeed = 0.00064 + (value - 1.0) * 0.01; // 0.00064 a 0.04064
            }
            this.simulator.setTimeScale(actualSpeed);
            this.elements.timeScaleValue.textContent = `${value.toFixed(4)}x`;
        });
        
        // Opciones visuales
        this.elements.showOrbits.addEventListener('change', (e) => {
            this.simulator.toggleOrbits();
        });
        
        this.elements.showLabels.addEventListener('change', (e) => {
            this.simulator.toggleLabels();
        });
        
        // Herramientas
        this.elements.exportDataBtn.addEventListener('click', () => {
            this.exportData();
        });
        
        this.elements.hideUIBtn.addEventListener('click', () => {
            this.simulator.toggleUI();
        });

        this.elements.closeInfoPanelBtn.addEventListener('click', () => {
            if (this.simulator.selectedPlanet) {
                this.selectPlanet(this.simulator.selectedPlanet);
            }
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
            
            // Añadir eventos para escritorio y móvil
            planetItem.addEventListener('click', () => {
                this.selectPlanet(planet);
                // Expandir panel de información cuando se selecciona un planeta
                const infoPanel = document.getElementById('info-panel');
                if (infoPanel) {
                    infoPanel.classList.add('expanded');
                }
            });
            
            this.elements.planetItems.appendChild(planetItem);
        });
        
        // Verificar si necesita scroll y agregar clase correspondiente
        this.checkScrollIndicators();
    }
    
    selectPlanet(planet) {
        // Si el planeta ya está seleccionado, deseleccionarlo
        if (this.simulator.selectedPlanet === planet) {
            // Deseleccionar planeta
            this.simulator.selectPlanet(null);
            this.simulator.stopFollowing();
            return;
        }
        
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
        
        // Usar un estilo único para todos los dispositivos
        const titleStyle = "position: relative; padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.2); margin-bottom: 15px;";
        const titleTextStyle = "margin: 0; padding-right: 30px;";
        
        const html = `
            <div style="${titleStyle}">
                <h4 style="${titleTextStyle}">${planetInfo.name}</h4>
            </div>
            
            <div class="ui-section" style="margin-bottom: 20px;">
                <h5 style="margin: 0 0 10px 0; color: #4CAF50; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Características Físicas</h5>
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
                        <div class="info-label">Temperatura</div>
                        <div class="info-value">${planetInfo.temperature.toFixed(0)} K (${(planetInfo.temperature - 273.15).toFixed(0)}°C)</div>
                    </div>
                    ${planetInfo.temperatureRange ? `
                    <div class="info-item">
                        <div class="info-label">Rango Temp.</div>
                        <div class="info-value">${planetInfo.temperatureRange}</div>
                    </div>` : ''}
                    <div class="info-item">
                        <div class="info-label">Atmósfera</div>
                        <div class="info-value">${planetInfo.hasAtmosphere ? 'Sí' : 'No'}</div>
                    </div>
                </div>
            </div>
            
            <div class="ui-section" style="margin-bottom: 20px;">
                <h5 style="margin: 0 0 10px 0; color: #2196F3; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Órbita y Rotación</h5>
                <div class="info-grid">
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
                        <div class="info-label">Inclinación Orbital</div>
                        <div class="info-value">${planetInfo.inclination.toFixed(2)}°</div>
                    </div>
                    ${planetInfo.axialTilt !== undefined ? `
                    <div class="info-item">
                        <div class="info-label">Inclinación Axial</div>
                        <div class="info-value">${planetInfo.axialTilt.toFixed(1)}°</div>
                    </div>` : ''}
                    <div class="info-item">
                        <div class="info-label">Período Orbital</div>
                        <div class="info-value">${planetInfo.orbitalPeriod.toFixed(1)} días</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Período Rotación</div>
                        <div class="info-value">${planetInfo.rotationPeriod.toFixed(1)} h</div>
                    </div>
                </div>
            </div>
            
            ${planetInfo.hasRings ? `
                <div class="ui-section" style="margin-bottom: 20px;">
                    <h5 style="margin: 0 0 10px 0; color: #FF9800; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Anillos</h5>
                    <div class="info-item">
                        <div class="info-label">Sistema de anillos</div>
                        <div class="info-value">Presente</div>
                    </div>
                </div>
            ` : ''}
            
            ${planetInfo.moons.length > 0 ? `
                <div class="ui-section" style="margin-bottom: 20px;">
                    <h5 style="margin: 0 0 10px 0; color: #9C27B0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Lunas (${planetInfo.moons.length})</h5>
                    <div class="info-grid">
                        ${planetInfo.moons.map(moon => `
                            <div class="info-item moon-clickable" data-moon-name="${moon.name}" style="cursor: pointer; transition: background-color 0.2s;">
                                <div class="info-label">${moon.name}</div>
                                <div class="info-value">${moon.distance.toFixed(3)} AU${moon.eclipticInclination !== undefined ? ` (Incl. Eclíptica: ${moon.eclipticInclination.toFixed(1)}°)` : ''}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
        `;
        
        this.elements.planetInfo.innerHTML = html;
        
        // Agregar event listeners para las lunas clickeables
        const moonElements = this.elements.planetInfo.querySelectorAll('.moon-clickable');
        moonElements.forEach(moonElement => {
            moonElement.addEventListener('click', (e) => {
                const moonName = e.currentTarget.getAttribute('data-moon-name');
                this.selectMoon(moonName);
            });
            
            // Agregar efectos hover
            moonElement.addEventListener('mouseenter', (e) => {
                e.currentTarget.style.backgroundColor = 'rgba(156, 39, 176, 0.2)';
            });
            
            moonElement.addEventListener('mouseleave', (e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
            });
        });
        
        // Verificar si necesita scroll después de actualizar el contenido
        setTimeout(() => this.checkScrollIndicators(), 100);
    }
    
    selectMoon(moonName) {
        if (!this.simulator.selectedPlanet) return;
        
        // Buscar la luna en el planeta seleccionado
        const moon = this.simulator.selectedPlanet.moons.find(m => m.name === moonName);
        if (moon) {
            this.simulator.selectMoon(moon, this.simulator.selectedPlanet);
        }
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
            this.updatePlanetInfo(this.simulator.selectedPlanet.getInfo(this.simulator.camera, this.simulator.controls));
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
            case 'KeyH':
                this.simulator.toggleUI();
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
    
    // Método para ocultar/mostrar UI
    toggle(show) {
        this.isVisible = show;
        
        if (show) {
            // Mostrar UI
            if (this.elements.uiContainer) {
                this.elements.uiContainer.style.display = 'block';
                this.elements.uiContainer.classList.remove('mobile-hidden');
            }
            // Ocultar botón de mostrar UI
            this.hideShowUIButton();
        } else {
            // Ocultar UI
            if (this.elements.uiContainer) {
                this.elements.uiContainer.style.display = 'none';
                this.elements.uiContainer.classList.add('mobile-hidden');
            }
            // Mostrar botón de mostrar UI
            this.createShowUIButton();
        }
    }
    
    createShowUIButton() {
        // Eliminar botón existente si existe
        this.hideShowUIButton();
        
        const button = document.createElement('button');
        button.id = 'show-ui-btn';
        button.innerHTML = '☰';
        
        // Estilos base para el botón
        let buttonStyles = `
            position: fixed;
            background: rgba(0, 0, 0, 0.3);
            color: #4CAF50;
            border: 2px solid #4CAF50;
            border-radius: 50%;
            cursor: pointer;
            z-index: 10001;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            top: 20px;
            left: 20px;
            width: 44px;
            height: 44px;
            font-size: 18px;
        `;
        
        button.style.cssText = buttonStyles;
        
        // Eventos para hover
        button.addEventListener('mouseenter', () => {
            button.style.background = 'rgba(76, 175, 80, 0.2)';
            button.style.borderColor = '#66BB6A';
            button.style.color = '#66BB6A';
            button.style.transform = 'scale(1.1)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.background = 'rgba(0, 0, 0, 0.3)';
            button.style.borderColor = '#4CAF50';
            button.style.color = '#4CAF50';
            button.style.transform = 'scale(1)';
        });
        
        // Evento de clic para todos los dispositivos
        button.addEventListener('click', () => {
            this.simulator.toggleUI();
        });
        
        // Añadir eventos de toque
        button.addEventListener('touchstart', () => {
            button.style.transform = 'scale(1.1)';
            button.style.background = 'rgba(76, 175, 80, 0.2)';
            button.style.borderColor = '#66BB6A';
            button.style.color = '#66BB6A';
        }, { passive: true });
        
        button.addEventListener('touchend', () => {
            button.style.transform = 'scale(1)';
            button.style.background = 'rgba(0, 0, 0, 0.3)';
            button.style.borderColor = '#4CAF50';
            button.style.color = '#4CAF50';
        }, { passive: true });
        
        document.body.appendChild(button);
    }
    
    hideShowUIButton() {
        const existingButton = document.getElementById('show-ui-btn');
        if (existingButton) {
            existingButton.remove();
        }
    }
    
    // Método para verificar si los elementos necesitan scroll - SIMPLIFICADO
    checkScrollIndicators() {
        // Método simplificado sin indicadores de flecha
        // Solo verifica si hay scroll disponible para efectos de estilo básicos
        if (this.elements.planetInfo && this.elements.planetInfo.parentElement) {
            const infoPanel = this.elements.planetInfo.parentElement;
            const hasVerticalScroll = infoPanel.scrollHeight > infoPanel.clientHeight;
            
            if (hasVerticalScroll) {
                infoPanel.classList.add('has-scroll');
            } else {
                infoPanel.classList.remove('has-scroll');
            }
        }
        
        if (this.elements.planetItems && this.elements.planetItems.parentElement) {
            const planetList = this.elements.planetItems.parentElement.parentElement;
            const hasVerticalScroll = planetList.scrollHeight > planetList.clientHeight;
            
            if (hasVerticalScroll) {
                planetList.classList.add('has-scroll');
            } else {
                planetList.classList.remove('has-scroll');
            }
        }
    }
    
    // Método para personalizar el comportamiento del scroll
    initCustomScrollBehavior() {
        // Agregar efectos de scroll suave para elementos específicos
        const scrollableElements = ['.info-panel', '.planet-list'];
        
        scrollableElements.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                // Agregar listener para detectar cambios en el scroll
                element.addEventListener('scroll', () => {
                    this.handleScrollEffects(element);
                });
                
                // Agregar listener para redimensionamiento
                const resizeObserver = new ResizeObserver(() => {
                    this.checkScrollIndicators();
                });
                resizeObserver.observe(element);
            }
        });
    }
    
    // Efectos adicionales durante el scroll
    handleScrollEffects(element) {
        // Agregar efecto de fade en los bordes durante el scroll
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight;
        const clientHeight = element.clientHeight;
        
        // Calcular opacidad del indicador inferior
        const bottomOpacity = (scrollHeight - scrollTop - clientHeight) > 10 ? 1 : 0;
        
        // Aplicar efectos visuales si es necesario
        if (element.classList.contains('has-scroll')) {
            const indicator = element.querySelector('::after');
            if (indicator) {
                indicator.style.opacity = bottomOpacity;
            }
        }
    }
}