/**
 * Datos realistas de planetas del sistema solar
 * Incluye parámetros orbitales, físicos y visuales
 */

export const PLANET_DATA = {
    mercury: {
        name: 'Mercurio',
        size: 0.383, // Radio relativo a la Tierra
        mass: 0.055, // Masa relativa a la Tierra
        distance: 0.387, // Distancia media en AU
        periapsis: 0.307, // Perihelio en AU
        apoapsis: 0.467, // Afelio en AU
        eccentricity: 0.206,
        inclination: 7.0, // Inclinación orbital en grados
        orbitalPeriod: 87.97, // Días terrestres
        rotationPeriod: 58.65, // Días terrestres
        texture: 'mercury.png',
        color: 0x8C7853,
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
        orbitalPeriod: 224.7,
        rotationPeriod: -243.02, // Rotación retrógrada
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
        orbitalPeriod: 365.25,
        rotationPeriod: 1.0,
        texture: 'earth.png',
        color: 0x6B93D6,
        hasAtmosphere: true,
        atmosphereColor: 0x87CEEB,
        hasRings: false,
        moons: [
            {
                name: 'Luna',
                size: 0.273,
                distance: 0.00257, // En AU
                orbitalPeriod: 27.32,
                texture: 'moon.png',
                color: 0xC0C0C0
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
        orbitalPeriod: 686.98,
        rotationPeriod: 1.03,
        texture: 'mars.png',
        color: 0xCD5C5C,
        hasAtmosphere: true,
        atmosphereColor: 0xFFB6C1,
        hasRings: false,
        moons: [
            {
                name: 'Fobos',
                size: 0.0001,
                distance: 0.000063,
                orbitalPeriod: 0.32,
                color: 0x8B7355
            },
            {
                name: 'Deimos',
                size: 0.00006,
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
        orbitalPeriod: 4332.59,
        rotationPeriod: 0.41,
        texture: 'jupiter.png',
        color: 0xD8CA9D,
        hasAtmosphere: true,
        atmosphereColor: 0xFFE4B5,
        hasRings: true,
        ringColor: 0x8B7355,
        moons: [
            {
                name: 'Ío',
                size: 0.286,
                distance: 0.00282,
                orbitalPeriod: 1.77,
                color: 0xFFFF99
            },
            {
                name: 'Europa',
                size: 0.245,
                distance: 0.00449,
                orbitalPeriod: 3.55,
                color: 0xB0E0E6
            },
            {
                name: 'Ganimedes',
                size: 0.413,
                distance: 0.00716,
                orbitalPeriod: 7.15,
                color: 0x8B7D6B
            },
            {
                name: 'Calisto',
                size: 0.378,
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
        orbitalPeriod: 10759.22,
        rotationPeriod: 0.45,
        texture: 'saturn.png',
        color: 0xFAD5A5,
        hasAtmosphere: true,
        atmosphereColor: 0xFFE4B5,
        hasRings: true,
        ringColor: 0xC0C0C0,
        ringInnerRadius: 1.2,
        ringOuterRadius: 2.3,
        moons: [
            {
                name: 'Titán',
                size: 0.404,
                distance: 0.00817,
                orbitalPeriod: 15.95,
                color: 0xDEB887
            },
            {
                name: 'Encélado',
                size: 0.0396,
                distance: 0.00159,
                orbitalPeriod: 1.37,
                color: 0xF0F8FF
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
        orbitalPeriod: 30688.5,
        rotationPeriod: -0.72, // Rotación retrógrada
        texture: 'uranus.png',
        color: 0x4FD0E7,
        hasAtmosphere: true,
        atmosphereColor: 0x87CEEB,
        hasRings: true,
        ringColor: 0x696969,
        ringInnerRadius: 1.5,
        ringOuterRadius: 2.0,
        moons: [
            {
                name: 'Miranda',
                size: 0.0372,
                distance: 0.000866,
                orbitalPeriod: 1.41,
                color: 0x8B7D6B
            },
            {
                name: 'Ariel',
                size: 0.0911,
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
        orbitalPeriod: 60182,
        rotationPeriod: 0.67,
        texture: 'neptune.png',
        color: 0x4B70DD,
        hasAtmosphere: true,
        atmosphereColor: 0x87CEEB,
        hasRings: true,
        ringColor: 0x696969,
        moons: [
            {
                name: 'Tritón',
                size: 0.212,
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