/**
 * Sistema de mecánicas orbitales realistas
 * Implementa las leyes de Kepler para cálculos precisos de órbitas
 */

import * as THREE from 'three';

export class OrbitalMechanics {
    constructor() {
        this.G = 6.67430e-11; // Constante gravitacional (simplificada para la simulación)
        this.AU = 149597870.7; // Unidad astronómica en km
        this.timeScale = 1.0;
    }

    /**
     * Calcula la velocidad orbital usando la tercera ley de Kepler
     * @param {number} semiMajorAxis - Semieje mayor en AU
     * @param {number} starMass - Masa de la estrella (relativa al Sol)
     * @returns {number} Velocidad angular en radianes por unidad de tiempo
     */
    calculateOrbitalSpeed(semiMajorAxis, starMass = 1.0) {
        // Tercera ley de Kepler: T² ∝ a³/M
        const period = Math.sqrt(Math.pow(semiMajorAxis, 3) / starMass);
        return (2 * Math.PI) / period;
    }

    /**
     * Calcula la posición orbital usando la ecuación de Kepler
     * @param {Object} planet - Objeto planeta con parámetros orbitales
     * @param {number} time - Tiempo actual de la simulación
     * @returns {THREE.Vector3} Posición del planeta
     */
    calculateOrbitalPosition(planet, time) {
        const { semiMajorAxis, eccentricity, orbitalSpeed, startAngle = 0, inclination = 0 } = planet;
        
        // Anomalía media
        const meanAnomaly = (orbitalSpeed * time + startAngle) % (2 * Math.PI);
        
        // Resolver la ecuación de Kepler para obtener la anomalía excéntrica
        const eccentricAnomaly = this.solveKeplerEquation(meanAnomaly, eccentricity);
        
        // Calcular la anomalía verdadera
        const trueAnomaly = 2 * Math.atan2(
            Math.sqrt(1 + eccentricity) * Math.sin(eccentricAnomaly / 2),
            Math.sqrt(1 - eccentricity) * Math.cos(eccentricAnomaly / 2)
        );
        
        // Distancia actual al foco
        const radius = semiMajorAxis * (1 - eccentricity * Math.cos(eccentricAnomaly));
        
        // Posición en el plano orbital
        const x = radius * Math.cos(trueAnomaly);
        const z = radius * Math.sin(trueAnomaly);
        const y = 0;
        
        // Aplicar inclinación orbital
        const position = new THREE.Vector3(x, y, z);
        if (inclination !== 0) {
            position.applyAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(inclination));
        }
        
        return position;
    }

    /**
     * Resuelve la ecuación de Kepler usando el método de Newton-Raphson
     * @param {number} meanAnomaly - Anomalía media
     * @param {number} eccentricity - Excentricidad orbital
     * @returns {number} Anomalía excéntrica
     */
    solveKeplerEquation(meanAnomaly, eccentricity) {
        let E = meanAnomaly; // Aproximación inicial
        const tolerance = 1e-8;
        const maxIterations = 10;
        
        for (let i = 0; i < maxIterations; i++) {
            const f = E - eccentricity * Math.sin(E) - meanAnomaly;
            const df = 1 - eccentricity * Math.cos(E);
            const deltaE = f / df;
            
            E -= deltaE;
            
            if (Math.abs(deltaE) < tolerance) {
                break;
            }
        }
        
        return E;
    }

    /**
     * Crea una línea de órbita elíptica
     * @param {number} semiMajorAxis - Semieje mayor
     * @param {number} eccentricity - Excentricidad
     * @param {number} inclination - Inclinación en grados
     * @param {number} segments - Número de segmentos para la línea
     * @returns {THREE.Line} Línea de órbita
     */
    createOrbitLine(semiMajorAxis, eccentricity, inclination = 0, segments = 128) {
        const points = [];
        
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const radius = semiMajorAxis * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(angle));
            
            const x = radius * Math.cos(angle);
            const z = radius * Math.sin(angle);
            const y = 0;
            
            const point = new THREE.Vector3(x, y, z);
            
            // Aplicar inclinación
            if (inclination !== 0) {
                point.applyAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(inclination));
            }
            
            points.push(point);
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x888888, // Color más claro
            transparent: true,
            opacity: 0.7, // Más opaco
            linewidth: 2 // Más grueso (aunque limitado en WebGL)
        });
        
        return new THREE.Line(geometry, material);
    }

    /**
     * Calcula la temperatura aproximada de un planeta
     * @param {number} distance - Distancia a la estrella en AU
     * @param {number} starTemperature - Temperatura de la estrella en K
     * @param {number} starRadius - Radio de la estrella (relativo al Sol)
     * @param {number} albedo - Albedo del planeta (0-1)
     * @returns {number} Temperatura en Celsius
     */
    calculatePlanetTemperature(distance, starTemperature = 5778, starRadius = 1.0, albedo = 0.3) {
        // Ley de Stefan-Boltzmann simplificada
        const solarConstant = 1361; // W/m² a 1 AU del Sol
        const flux = solarConstant * (starRadius * starRadius) / (distance * distance);
        const effectiveFlux = flux * (1 - albedo) / 4;
        const temperature = Math.pow(effectiveFlux / 5.67e-8, 0.25);
        
        return temperature - 273.15; // Convertir a Celsius
    }

    /**
     * Verifica si un planeta está en la zona habitable
     * @param {number} distance - Distancia a la estrella en AU
     * @param {number} starMass - Masa de la estrella (relativa al Sol)
     * @returns {boolean} True si está en la zona habitable
     */
    isInHabitableZone(distance, starMass = 1.0) {
        // Zona habitable aproximada basada en la masa estelar
        const innerEdge = 0.95 * Math.sqrt(starMass);
        const outerEdge = 1.37 * Math.sqrt(starMass);
        
        return distance >= innerEdge && distance <= outerEdge;
    }

    /**
     * Calcula la velocidad de escape de un planeta
     * @param {number} mass - Masa del planeta (relativa a la Tierra)
     * @param {number} radius - Radio del planeta (relativo a la Tierra)
     * @returns {number} Velocidad de escape en km/s
     */
    calculateEscapeVelocity(mass, radius) {
        const earthEscapeVelocity = 11.2; // km/s
        return earthEscapeVelocity * Math.sqrt(mass / radius);
    }

    /**
     * Simula efectos de marea
     * @param {Object} planet - Planeta
     * @param {Object} moon - Luna
     * @returns {number} Fuerza de marea relativa
     */
    calculateTidalForce(planet, moon) {
        const distance = planet.position.distanceTo(moon.position);
        const tidalForce = (moon.mass * planet.size) / Math.pow(distance, 3);
        return tidalForce;
    }

    /**
     * Actualiza la escala de tiempo de la simulación
     * @param {number} scale - Nueva escala de tiempo
     */
    setTimeScale(scale) {
        this.timeScale = Math.max(0.001, Math.min(1.0, scale));
    }

    /**
     * Convierte unidades astronómicas a unidades de la simulación
     * @param {number} au - Distancia en AU
     * @param {number} scale - Factor de escala
     * @returns {number} Distancia en unidades de simulación
     */
    auToSimulationUnits(au, scale = 10) {
        return au * scale;
    }

    /**
     * Convierte días terrestres a unidades de tiempo de simulación
     * @param {number} days - Días terrestres
     * @param {number} scale - Factor de escala temporal
     * @returns {number} Tiempo en unidades de simulación
     */
    daysToSimulationTime(days, scale = 0.001) {
        return days * scale;
    }
}