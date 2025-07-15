/**
 * Datos realistas de planetas del sistema solar
 * Incluye parámetros orbitales, físicos y visuales
 */

export const PLANET_DATA = {
    mercury: {
        name: 'Mercurio',
        size: 0.353, // Radio relativo a la Tierra
        mass: 0.055, // Masa relativa a la Tierra
        distance: 0.387, // Distancia media en AU
        periapsis: 0.307, // Perihelio en AU
        apoapsis: 0.467, // Afelio en AU
        eccentricity: 0.206,
        inclination: 7.0, // Inclinación orbital en grados
        axialTilt: 0.034, // Inclinación del eje en grados
        orbitalPeriod: 87.97, // Días terrestres
        rotationPeriod: 1407.6, // Horas (58.65 días)
        temperature: {
            min: 100, // Kelvin (-173°C) lado nocturno
            max: 700, // Kelvin (427°C) lado diurno
            average: 440 // Kelvin (167°C)
        },
        texture: 'mercury.png',
        color: 0x999999, // Color grisáceo más realista
        hasAtmosphere: false,
        hasRings: false,
        moons: []
    },
    venus: {
        name: 'Venus',
        size: 0.949,
        mass: 0.815,
        distance: 0.723,
        periapsis: 0.718,
        apoapsis: 0.728,
        eccentricity: 0.007,
        inclination: 3.4,
        axialTilt: 177.4, // Inclinación del eje en grados (casi invertido)
        orbitalPeriod: 224.7,
        rotationPeriod: -5832.5, // Horas (243.02 días, rotación retrógrada)
        temperature: {
            min: 735, // Kelvin (462°C)
            max: 737, // Kelvin (464°C)
            average: 736 // Kelvin (463°C) - efecto invernadero extremo
        },
        texture: 'venus.png',
        color: 0xFFC649,
        hasAtmosphere: true,
        atmosphereColor: 0xFFE4B5,
        hasRings: false,
        moons: []
    },
    earth: {
        name: 'Tierra',
        size: 1.0,
        mass: 1.0,
        distance: 1.0,
        periapsis: 0.983,
        apoapsis: 1.017,
        eccentricity: 0.017,
        inclination: 0.0,
        axialTilt: 23.4, // Inclinación del eje en grados (causa las estaciones)
        orbitalPeriod: 365.25,
        rotationPeriod: 24.0, // Horas
        temperature: {
            min: 184, // Kelvin (-89°C) Antártida
            max: 331, // Kelvin (58°C) desiertos
            average: 288 // Kelvin (15°C)
        },
        texture: 'earth.png',
        color: 0x6B93D6,
        hasAtmosphere: true,
        atmosphereColor: 0x87CEEB,
        hasRings: false,
        moons: [
            {
                name: 'Luna',
                size: 0.15, // Escala aumentada pero proporcionalmente correcta
                distance: 0.00257, // En AU
                orbitalPeriod: 27.32,
                texture: 'moon.png',
                color: 0xC0C0C0,
                eclipticInclination: 5.1 // La Luna orbita en el plano de la eclíptica con 5.1° de inclinación
            }
        ]
    },
    mars: {
        name: 'Marte',
        size: 0.532,
        mass: 0.107,
        distance: 1.524,
        periapsis: 1.381,
        apoapsis: 1.666,
        eccentricity: 0.094,
        inclination: 1.9,
        axialTilt: 25.2, // Inclinación del eje en grados (similar a la Tierra)
        orbitalPeriod: 686.98,
        rotationPeriod: 24.6, // Horas (24h 37min)
        temperature: {
            min: 130, // Kelvin (-143°C) polos en invierno
            max: 308, // Kelvin (35°C) ecuador en verano
            average: 210 // Kelvin (-63°C)
        },
        texture: 'mars.png',
        color: 0xFF6B35, // Color más naranja
        hasAtmosphere: true,
        atmosphereColor: 0xFFB6C1,
        hasRings: false,
        moons: [
            {
                name: 'Fobos',
                size: 0.008, // Escala aumentada (22 km vs 12 km Deimos)
                distance: 0.000063,
                orbitalPeriod: 0.32,
                color: 0x8B7355
            },
            {
                name: 'Deimos',
                size: 0.005, // Escala aumentada pero menor que Fobos
                distance: 0.000157,
                orbitalPeriod: 1.26,
                color: 0x8B7355
            }
        ]
    },
    jupiter: {
        name: 'Júpiter',
        size: 11.21,
        mass: 317.8,
        distance: 5.204,
        periapsis: 4.950,
        apoapsis: 5.458,
        eccentricity: 0.049,
        inclination: 1.3,
        axialTilt: 3.1, // Inclinación del eje en grados (muy pequeña)
        orbitalPeriod: 4332.59,
        rotationPeriod: 9.9, // Horas
        temperature: {
            min: 110, // Kelvin (-163°C) en las nubes superiores
            max: 20000, // Kelvin en el núcleo
            average: 165 // Kelvin (-108°C) en la tropopausa
        },
        texture: 'jupiter.png',
        color: 0xD8CA9D,
        hasAtmosphere: true,
        atmosphereColor: 0xFFE4B5,
        hasRings: false, // Anillos eliminados para mayor realismo
        moons: [
            {
                name: 'Ío',
                size: 0.13, // Escala aumentada (3643 km diámetro)
                distance: 0.00282,
                orbitalPeriod: 1.77,
                color: 0xFFFF99
            },
            {
                name: 'Europa',
                size: 0.11, // Escala aumentada (3122 km diámetro)
                distance: 0.00449,
                orbitalPeriod: 3.55,
                color: 0xB0E0E6
            },
            {
                name: 'Ganimedes',
                size: 0.19, // La más grande (5268 km diámetro)
                distance: 0.00716,
                orbitalPeriod: 7.15,
                color: 0x8B7D6B
            },
            {
                name: 'Calisto',
                size: 0.16, // Segunda más grande (4821 km diámetro)
                distance: 0.01259,
                orbitalPeriod: 16.69,
                color: 0x696969
            }
        ]
    },
    saturn: {
        name: 'Saturno',
        size: 9.45,
        mass: 95.2,
        distance: 9.573,
        periapsis: 9.041,
        apoapsis: 10.124,
        eccentricity: 0.057,
        inclination: 2.5,
        axialTilt: 26.7, // Inclinación del eje en grados (similar a la Tierra)
        orbitalPeriod: 10759.22,
        rotationPeriod: 10.7, // Horas
        temperature: {
            min: 82, // Kelvin (-191°C) en las nubes superiores
            max: 11700, // Kelvin en el núcleo
            average: 134 // Kelvin (-139°C) en la tropopausa
        },
        texture: 'saturn.png',
        color: 0xFAD5A5,
        hasAtmosphere: true,
        atmosphereColor: 0xFFE4B5,
        hasRings: true,
        ringColor: 0xE6D7C3, // Color más realista de los anillos
        ringInnerRadius: 1.15, // Anillo D interno
        ringOuterRadius: 2.8, // Hasta el anillo F
        ringSegments: [
            { innerRadius: 1.235, outerRadius: 1.525, opacity: 0.4, color: 0x96846F }, // Anillo C
            { innerRadius: 1.525, outerRadius: 1.949, opacity: 0.9, color: 0xB5A690 }, // Anillo B
            // División de Cassini
            { innerRadius: 1.949, outerRadius: 2.024, opacity: 0.05, color: 0x3A3A3A }, 
            { innerRadius: 2.024, outerRadius: 2.267, opacity: 0.7, color: 0xC2B39A }, // Anillo A
            // División de Encke
            { innerRadius: 2.214, outerRadius: 2.217, opacity: 0.02, color: 0x282828 }
        ],
        moons: [
            {
                name: 'Encélado',
                size: 0.05, // Escala aumentada (498 km de diámetro)
                distance: 2.8, // cerca del anillo más exterior
                orbitalPeriod: 1.37,
                color: 0xF0F8FF,
                texture: null
            },
            {
                name: 'Tetis',
                size: 0.08, // Escala aumentada (1060 km de diámetro)
                distance: 3.2, // in planetary radii
                orbitalPeriod: 1.89,
                color: 0xE6E6FA,
                texture: null
            },
            {
                name: 'Dione',
                size: 0.08, // Escala aumentada (1120 km de diámetro)
                distance: 3.8, // in planetary radii
                orbitalPeriod: 2.74,
                color: 0xDCDCDC,
                texture: null
            },
            {
                name: 'Rea',
                size: 0.11, // Escala aumentada (1530 km de diámetro)
                distance: 4.5, // in planetary radii
                orbitalPeriod: 4.52,
                color: 0xC0C0C0,
                texture: null
            },
            {
                name: 'Titán',
                size: 0.18, // Menor que Ganimedes pero segunda más grande (5150 km)
                distance: 8.5, // in planetary radii
                orbitalPeriod: 15.95,
                color: 0xDEB887,
                texture: null
            },
            {
                name: 'Jápeto',
                size: 0.10, // Menor que Titán (1460 km de diámetro)
                distance: 15.0, // in planetary radii
                orbitalPeriod: 79.33,
                color: 0x8B7355, // Color más oscuro por su característica dicotomía
                texture: null
            }
        ]
    },
    uranus: {
        name: 'Urano',
        size: 4.01,
        mass: 14.5,
        distance: 19.165,
        periapsis: 18.324,
        apoapsis: 20.006,
        eccentricity: 0.046,
        inclination: 0.8,
        axialTilt: 97.8, // Inclinación del eje en grados (rota de lado)
        orbitalPeriod: 30688.5,
        rotationPeriod: -17.2, // Horas (rotación retrógrada)
        temperature: {
            min: 49, // Kelvin (-224°C) temperatura mínima registrada
            max: 5000, // Kelvin en el núcleo rocoso
            average: 59 // Kelvin (-214°C) en la tropopausa
        },
        texture: 'uranus.png',
        color: 0x4FD0E7,
        hasAtmosphere: true,
        atmosphereColor: 0x87CEEB,
        hasRings: true,
        ringColor: 0x696969,
        ringInnerRadius: 1.6,
        ringOuterRadius: 2.0,
        ringSegments: [
            { innerRadius: 1.6, outerRadius: 1.65, opacity: 0.6, color: 0x555555 }, // Anillo Epsilon (más opaco)
            { innerRadius: 1.75, outerRadius: 1.8, opacity: 0.4, color: 0x666666 } // Anillo Delta
        ],
        moons: [
            {
                name: 'Miranda',
                size: 0.03, // Más pequeña (472 km diámetro)
                distance: 0.000866,
                orbitalPeriod: 1.41,
                color: 0x8B7D6B
            },
            {
                name: 'Ariel',
                size: 0.07, // Más pequeña (1158 km diámetro)
                distance: 0.001278,
                orbitalPeriod: 2.52,
                color: 0xC0C0C0
            }
        ]
    },
    neptune: {
        name: 'Neptuno',
        size: 3.88,
        mass: 17.1,
        distance: 30.178,
        periapsis: 29.810,
        apoapsis: 30.546,
        eccentricity: 0.009,
        inclination: 1.8,
        axialTilt: 28.3, // Inclinación del eje en grados
        orbitalPeriod: 60182,
        rotationPeriod: 16.1, // Horas
        temperature: {
            min: 55, // Kelvin (-218°C) en las nubes superiores
            max: 5400, // Kelvin en el núcleo
            average: 72 // Kelvin (-201°C) en la tropopausa
        },
        texture: 'neptune.png',
        color: 0x6BB6FF, // Azul más claro
        hasAtmosphere: true,
        atmosphereColor: 0x87CEEB,
        hasRings: true,
        ringColor: 0x696969,
        ringInnerRadius: 1.4,
        ringOuterRadius: 1.6,
        ringSegments: [
            { innerRadius: 1.4, outerRadius: 1.45, opacity: 0.5, color: 0x444444 }, // Anillo Adams (más opaco)
            { innerRadius: 1.53, outerRadius: 1.55, opacity: 0.3, color: 0x555555 } // Anillo Le Verrier
        ],
        moons: [
            {
                name: 'Tritón',
                size: 0.12, // Escala aumentada pero menor que Titán (2707 km diámetro)
                distance: 0.00237,
                orbitalPeriod: -5.88, // Órbita retrógrada
                color: 0xF0F8FF
            }
        ]
    }
};

// Configuración del cinturón de asteroides
export const ASTEROID_BELT = {
    innerRadius: 2.2,
    outerRadius: 3.2,
    count: 1000,
    maxSize: 0.01,
    minSize: 0.001
};

// Configuración del Sol
export const SUN_DATA = {
    name: 'Sol',
    size: 109.2, // Radio relativo a la Tierra
    mass: 333000, // Masa relativa a la Tierra
    temperature: 5778, // Kelvin
    color: 0xFFFF00,
    coronaColor: 0xFFFFAA,
    intensity: 2.0
};