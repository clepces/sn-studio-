// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export interface ExecutionItem {
  exec_id: number;
  exec_type: string;
  description: string;
  details: string | null;
  result: string;
  created_at: string;
}

export interface TranslationHistoryItem {
  id: string;
  key: string;
  action: string;
  description: string;
  status: string;
  timestamp: string;
}

export const translationHistory: TranslationHistoryItem[] = [
  {
    id: 'evt-audit-init',
    key: 'IDS_MAIN_MENU_TITLE',
    action: 'AUDIT',
    description: 'Verificación canónica de 7.828 cadenas UTF-8 BOM certificada',
    status: 'CERTIFIED',
    timestamp: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: 'evt-token-guard',
    key: 'IDS_FLEET_STATUS',
    action: 'TOKEN_GUARD',
    description: 'Blindaje de variables dinámicas %s y [VALUE] comprobado (Cero corrupción)',
    status: 'SECURE',
    timestamp: new Date(Date.now() - 180000).toISOString(),
  },
  {
    id: 'evt-sqlite-sync',
    key: 'IDS_CAPITAL_SHIP_NAME',
    action: 'SYNC',
    description: 'Sincronización atómica con tabla tbl_string_entries en storage/database.sqlite',
    status: 'SAVED',
    timestamp: new Date(Date.now() - 60000).toISOString(),
  },
];

export interface StringEntry {
  id: string;
  key: string;
  original: string;
  translated: string;
  status: 'TRANSLATED' | 'UNTRANSLATED' | 'REVIEW';
  tokens: string[];
}

export interface Project {
  project_id: string;
  name: string;
  version: string;
  base_file_path: string;
  target_file_path: string;
  total_strings: number;
  translated_count: number;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// SHARED STATE
// ---------------------------------------------------------------------------

export let nextExecId = 6;
export const executions: ExecutionItem[] = [
  {
    exec_id: 5,
    exec_type: 'SYS',
    description: 'Verificación de base de datos relacional y storage',
    details: 'storage/database.sqlite conectado (Modo Node.js 22 Runtime Shim)',
    result: 'OK',
    created_at: new Date(Date.now() - 60000).toISOString(),
  },
  {
    exec_id: 4,
    exec_type: 'FS',
    description: 'Indexación de catálogo GameInfo',
    details: '1.872 archivos .entity verificados en catálogo',
    result: 'OK',
    created_at: new Date(Date.now() - 120000).toISOString(),
  },
  {
    exec_id: 3,
    exec_type: 'VFS',
    description: 'Auditoría de EnabledMods.txt',
    details: '3 mods activos, jerarquía canónica LAA verificada',
    result: 'OK',
    created_at: new Date(Date.now() - 180000).toISOString(),
  },
  {
    exec_id: 2,
    exec_type: 'STR',
    description: 'Inspección de diccionario local Spanish.str',
    details: '7.828 cadenas UTF-8 BOM detectadas',
    result: 'OK',
    created_at: new Date(Date.now() - 240000).toISOString(),
  },
  {
    exec_id: 1,
    exec_type: 'SYS',
    description: 'Arranque de entorno canónico y detección física de juego',
    details: 'C:/Games/Sins of a Solar Empire Rebellion',
    result: 'OK',
    created_at: new Date(Date.now() - 300000).toISOString(),
  },
];

export let activeMods = [
  '[ES] Spanish Translation Pack P999',
  'Enhanced 4X Rebellion Mod',
  'Sins Community Balance Patch',
];

export const availableMods = [
  { name: '[ES] Spanish Translation Pack P999', isMinimod: true, estimatedRamMb: 15 },
  { name: 'Enhanced 4X Rebellion Mod', isMinimod: false, estimatedRamMb: 380 },
  { name: 'Sins Community Balance Patch', isMinimod: false, estimatedRamMb: 190 },
  { name: 'Star Wars Interregnum', isMinimod: false, estimatedRamMb: 850 },
  { name: 'Armada III Star Trek', isMinimod: false, estimatedRamMb: 920 },
];

export function extractTokens(text: string): string[] {
  const regex = /\[VALUE\d*\]|%[0-9\.]*[sdf]|\{\d+\}/g;
  const found: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    found.push(m[0]);
  }
  return found;
}

const templates: [string, string, string][] = [
  ['IDS_MAIN_MENU_TITLE', 'Sins of a Solar Empire: Rebellion', 'Sins of a Solar Empire: Rebellion'],
  ['IDS_FLEET_STATUS', 'Fleet %s holding position with [VALUE] ships.', 'Flota %s manteniendo posición con [VALUE] naves.'],
  ['IDS_CAPITAL_SHIP_NAME', 'Kol Class Battleship', 'Acorazado Clase Kol'],
  ['IDS_TITAN_RAGNAROV', 'Ragnarov Titan armed with heavy magnetic railguns.', 'Titán Ragnarov armado con cañones electromagnéticos de riel.'],
  ['IDS_ABILITY_SNIPE', 'Snipe enemy capital ships dealing [VALUE] kinetic damage.', 'Francotirador contra naves capitales hostiles causando [VALUE] daño cinético.'],
  ['IDS_RESEARCH_ARMOR', 'Increases capital ship and cruiser armor rating by [VALUE]%.', 'Incrementa el blindaje de naves capitales y cruceros en un [VALUE]%.'],
  ['IDS_PLANET_DESERT', 'Arid and barren desert planet rich in metal veins.', 'Planeta desértico árido y yermo rico en vetas minerales.'],
  ['IDS_ABILITY_EMP_BLAST', 'Tactical EMP shockwave draining [VALUE] antimatter from target.', 'Pulso EMP táctico que drena [VALUE] de antimateria del navío hostil.'],
  ['IDS_PLANET_TEC_CAPITAL', 'Primary administrative world of the Trader Emergency Coalition.', 'Mundo administrativo primario de la Coalición de Emergencia Comercial.'],
  ['IDS_PLANET_VOLCANIC', 'Unstable volcanic world with active magma fissures.', 'Planeta volcánico inestable con fisuras de magma activas.'],
  ['IDS_FACTION_TEC', 'Trader Emergency Coalition', 'Coalición de Emergencia Comercial (TEC)'],
  ['IDS_FACTION_ADVENT', 'Advent Unity', 'La Unidad Advent'],
  ['IDS_FACTION_VASARI', 'Vasari Empire', 'El Imperio Vasari'],
  ['IDS_ABILITY_NANO_REPAIR', 'Nanite cloud restoring [VALUE] hull points per second.', 'Enjambre nanotecnológico restaurando [VALUE] puntos de casco por segundo.'],
  ['IDS_ABILITY_PURIFY', 'Purifying beam focusing [VALUE] celestial psi damage.', 'Haz purificador concentrando [VALUE] daño psiónico celestial.'],
  ['IDS_WEAPON_GAUSS_HEAVY', 'Heavy Gauss Autocannon Battery with high rate of fire.', 'Batería pesada de autocañones Gauss de alta cadencia de fuego.'],
  ['IDS_WEAPON_PHASE_PULSE', 'Phase Pulse Disruptors bypassing target shield arrays.', 'Disruptores de pulso de fase que ignoran matrices de escudos hostiles.'],
  ['IDS_UPGRADE_TRADE_PORT', 'Construct planetary trade port boosting credit revenue.', 'Construir puerto comercial planetario aumentando ingresos de créditos.']
];

export const TOTAL_STRINGS = 7828;
export const projectStrings: StringEntry[] = [];

for (let i = 0; i < TOTAL_STRINGS; i++) {
  const t = templates[i % templates.length]!;
  const key = i < templates.length ? t[0] : `${t[0]}_${i}`;
  const isTranslated = i % 3 !== 0; // ~66% translated
  projectStrings.push({
    id: key,
    key,
    original: t[1],
    translated: isTranslated ? t[2] : '',
    status: isTranslated ? 'TRANSLATED' : 'UNTRANSLATED',
    tokens: extractTokens(t[1]),
  });
}

export let projectsList: Project[] = [
  {
    project_id: 'sins-rebellion-core',
    name: 'Sins of a Solar Empire: Rebellion (Vanilla Base)',
    version: 'v1.85 Rebellion',
    base_file_path: 'Localizations/en/String/English.str',
    target_file_path: 'Localizations/es/String/Spanish.str',
    total_strings: TOTAL_STRINGS,
    translated_count: projectStrings.filter((s) => s.status === 'TRANSLATED').length,
    updated_at: new Date().toISOString(),
  },
];

export const entityCatalog = [
  {
    id: 'CAPITALSHIP_TECHBATTLESHIP',
    name: 'Acorazado Kol (TEC)',
    faction: 'TEC Loyalists / Rebels',
    factionCode: 'TEC',
    role: 'Nave Insignia de Combate Pesado',
    status: 'ACTIVE',
    isAvailable: true,
    shieldPoints: 1500.0,
    shieldRestore: 3.60,
    hullPoints: 3600.0,
    hullRestore: 1.80,
    antiMatter: 225.0,
    antiMatterRestore: 0.75,
    armorPoints: 6.0,
    maxMitigation: 0.65,
    buildTime: 75.0,
    slotCount: 50.0,
    credits: 3000.0,
    metal: 400.0,
    crystal: 250.0,
    filePath: 'GameInfo/CAPITALSHIP_TECHBATTLESHIP.entity',
    abilities: [
      { id: 'AbilityGaussBlast', name: 'Cañón Gauss Pesado', type: 'Ataque Focalizado', desc: 'Dispara un proyectil cinético masivo que perfora escudos y blindaje infligiendo 2400 de daño.' },
      { id: 'AbilityFlakBurst', name: 'Ráfaga Antiaérea (Flak)', type: 'Defensa de Punto', desc: 'Detonación esférica de metralla en 360° que aniquila escuadrones de cazas y bombarderos hostiles.' },
      { id: 'AbilityAdaptiveShield', name: 'Escudos Adaptativos', type: 'Mitigación Deflectora', desc: 'Reorienta generadores de pantalla incrementando la absorción y mitigación de daño un +15%.' },
      { id: 'AbilityLastStand', name: 'Momento Cumbre (Finest Hour)', type: 'Protocolo Épico TEC', desc: 'Sobrecarga los reactores de fusión, acelerando la recarga de armas un 60% y autorreparando casco.' },
    ],
    weapons: [
      { name: 'Batería de Haz Pesado', type: 'Beam / Energía', dps: 132.3, range: 5000, arc: 'Frontal (0°)' },
      { name: 'Cañones Automáticos Gauss (x4)', type: 'Cinético / Físico', dps: 166.0, range: 5000, arc: 'Frontal / Flancos / Popa' },
      { name: 'Láseres de Pulso de Fase (x2)', type: 'Energía Directa', dps: 84.0, range: 4500, arc: 'Flanco Babor / Estribor' },
    ],
  },
  {
    id: 'CAPITALSHIP_TECHSUPPORT',
    name: 'Crucero de Batalla Dunov (TEC)',
    faction: 'TEC Loyalists / Rebels',
    factionCode: 'TEC',
    role: 'Nave de Soporte Táctico y Drenaje de Escudos',
    status: 'ACTIVE',
    isAvailable: true,
    shieldPoints: 1293.75,
    shieldRestore: 3.45,
    hullPoints: 3220.0,
    hullRestore: 1.725,
    antiMatter: 322.0,
    antiMatterRestore: 1.15,
    armorPoints: 4.0,
    maxMitigation: 0.65,
    buildTime: 75.0,
    slotCount: 50.0,
    credits: 3000.0,
    metal: 400.0,
    crystal: 250.0,
    filePath: 'GameInfo/CAPITALSHIP_TECHSUPPORT.entity',
    abilities: [
      { id: 'AbilityShieldRestore', name: 'Restauración de Escudos', type: 'Soporte de Flota', desc: 'Sobrecarga de emergencia que recarga instantáneamente los escudos deflectores de un navío aliado.' },
      { id: 'AbilityEMPBlast', name: 'Pulso EMP Táctico', type: 'Disrupción Electromagnética', desc: 'Descarga que drena reservas de antimateria de objetivos e inhabilita sus sistemas de armamento.' },
      { id: 'AbilityMagnetize', name: 'Polarización Magnética', type: 'Control de Masas', desc: 'Atrae cazas enemigos hacia el casco del objetivo haciéndolos vulnerables al fuego de metralla.' },
      { id: 'AbilityLowCostAbilities', name: 'Campo de Flujo de Antimateria', type: 'Aura Pasiva TEC', desc: 'Campo de resonancia que optimiza reactores de la flota reduciendo costes de habilidad un 25%.' },
    ],
    weapons: [
      { name: 'Cañones Láser Pesados (x2)', type: 'Energía', dps: 58.0, range: 5000, arc: 'Frontal' },
      { name: 'Baterías de Autocañones (x2)', type: 'Cinético', dps: 42.0, range: 4500, arc: 'Flancos' },
    ],
  },
  {
    id: 'CAPITALSHIP_TECHSIEGE',
    name: 'Dreadnought Marza (TEC)',
    faction: 'TEC Loyalists / Rebels',
    factionCode: 'TEC',
    role: 'Nave de Asedio Planetario y Bombardeo',
    status: 'ACTIVE',
    isAvailable: true,
    shieldPoints: 1207.50,
    shieldRestore: 3.15,
    hullPoints: 3018.75,
    hullRestore: 1.575,
    antiMatter: 235.0,
    antiMatterRestore: 0.80,
    armorPoints: 4.25,
    maxMitigation: 0.65,
    buildTime: 75.0,
    slotCount: 50.0,
    credits: 3000.0,
    metal: 400.0,
    crystal: 250.0,
    filePath: 'GameInfo/CAPITALSHIP_TECHSIEGE.entity',
    abilities: [
      { id: 'AbilityRadiationBomb', name: 'Ojiva de Radiación', type: 'Asedio / Debilitamiento', desc: 'Detona carga radiológica que reduce drásticamente la armadura y la resistencia estructural.' },
      { id: 'AbilityRazePlanet', name: 'Bombardeo Incinerador', type: 'Asedio Planetario', desc: 'Protocolo de aniquilación de superficie que devasta infraestructuras y población enemiga.' },
      { id: 'AbilityIncendiaryShells', name: 'Proyectiles Incendiarios', type: 'Daño Térmico Continuo', desc: 'Municiones de termita pesada que calcinan el casco enemigo produciendo daño continuo residual.' },
      { id: 'AbilityMissileBarrage', name: 'Salva Masiva de Misiles', type: 'Bombardeo en Saturación', desc: 'Lanza una tormenta ininterrumpida de cientos de misiles guiados que satura todo el sector.' },
    ],
    weapons: [
      { name: 'Torretas de Asedio Gauss (x4)', type: 'Cinético Pesado', dps: 110.0, range: 5000, arc: 'Frontal / Flancos' },
      { name: 'Silos de Misiles de Crucero', type: 'Misiles Guiados', dps: 95.0, range: 6000, arc: '360° Omnidireccional' },
    ],
  },
  {
    id: 'CAPITALSHIP_PSIBATTLESHIP',
    name: 'Acorazado Radiance (Advent)',
    faction: 'Advent Unity',
    factionCode: 'ADV',
    role: 'Nave de Proyección Psiónica y Purificación',
    status: 'ACTIVE',
    isAvailable: true,
    shieldPoints: 2100.0,
    shieldRestore: 3.60,
    hullPoints: 2640.0,
    hullRestore: 1.80,
    antiMatter: 240.0,
    antiMatterRestore: 0.75,
    armorPoints: 5.4,
    maxMitigation: 0.65,
    buildTime: 75.0,
    slotCount: 50.0,
    credits: 3000.0,
    metal: 400.0,
    crystal: 250.0,
    filePath: 'GameInfo/CAPITALSHIP_PSIBATTLESHIP.entity',
    abilities: [
      { id: 'AbilityAntiMatterDetonate', name: 'Detonación de Antimateria', type: 'Ataque Psiónico', desc: 'Convierte las reservas de combustible del objetivo en una explosión que desgarra su propio blindaje.' },
      { id: 'AbilityTaunt', name: 'Animosidad Psiónica', type: 'Control Táctico', desc: 'Emisión telepática que compele a la flota hostil a redirigir todos sus cañones hacia el Radiance.' },
      { id: 'AbilityEnergyAbsorb', name: 'Absorción de Energía', type: 'Defensa Deflectora', desc: 'Matriz de escudos reflectora que absorbe descargas de armas energéticas recargando antimateria.' },
      { id: 'AbilityBeamBlast', name: 'Brillo Purificador (Cleansing)', type: 'Haz Solar Concentrado', desc: 'Columna colosal de plasma psi continuo que vaporiza naves en una trayectoria recta mortal.' },
    ],
    weapons: [
      { name: 'Haz Psiónico Continuo', type: 'Haz Psi', dps: 145.0, range: 5200, arc: 'Frontal (0°)' },
      { name: 'Proyectores de Plasma Psi (x4)', type: 'Plasma Energético', dps: 78.0, range: 4800, arc: 'Flancos Babor / Estribor' },
    ],
  },
  {
    id: 'CAPITALSHIP_PHASECARRIER',
    name: 'Portanaves Skirantra (Vasari)',
    faction: 'Vasari Empire',
    factionCode: 'VAS',
    role: 'Nave Nodo de Hangar Nanotecnológico',
    status: 'ACTIVE',
    isAvailable: true,
    shieldPoints: 1275.0,
    shieldRestore: 3.00,
    hullPoints: 2425.0,
    hullRestore: 1.50,
    antiMatter: 250.0,
    antiMatterRestore: 0.85,
    armorPoints: 4.0,
    maxMitigation: 0.65,
    buildTime: 75.0,
    slotCount: 50.0,
    credits: 3000.0,
    metal: 400.0,
    crystal: 250.0,
    filePath: 'GameInfo/CAPITALSHIP_PHASECARRIER.entity',
    abilities: [
      { id: 'AbilityNanoHullRepair', name: 'Enjambre Nanotecnológico', type: 'Autorreparación Celular', desc: 'Dispersa nubes de nanorobots que reconstruyen activamente el blindaje y casco de naves aliadas.' },
      { id: 'AbilitySpawnSquad', name: 'Replicación Rápida de Cazas', type: 'Hangar Nanotáctico', desc: 'Ensamblaje molecular instantáneo de un escuadrón completo de interceptores Vasari en pleno combate.' },
      { id: 'AbilityFighterBlink', name: 'Salto de Fase de Escuadrones', type: 'Teletransportación', desc: 'Desfasa escuadrones a través del espacio hiperbólico colocándolos al instante sobre la retaguardia enemiga.' },
      { id: 'AbilityCloneFrigate', name: 'Desfase Inmaterial (Phase Out)', type: 'Inmunidad de Fase', desc: 'Desplaza temporalmente el navío a una dimensión no física, volviéndolo inmune a todo daño entrante.' },
    ],
    weapons: [
      { name: 'Bahías de Hangares Vasari (x4)', type: 'Lanzadera de Cazas', dps: 120.0, range: 8000, arc: 'Proyección Táctica Global' },
      { name: 'Cañones de Pulso de Fase (x2)', type: 'Pulso de Fase', dps: 64.0, range: 4500, arc: 'Flancos Babor / Estribor' },
    ],
  },
];

export function getDetailedMods() {
  let priority = 999;
  return activeMods.map((modName) => {
    const isMinimod = modName.startsWith('[ES]') || modName.toLowerCase().includes('traduccion');
    const p = priority;
    priority -= 10;
    return {
      name: modName,
      exists: true,
      hasContent: true,
      state: 'OK',
      isMinimod,
      priority: p,
      ramMb: isMinimod ? 15 : 250,
    };
  });
}

export function updateActiveMods(mods: string[]) {
  activeMods.splice(0, activeMods.length, ...mods);
}

export function addExecution(item: Omit<ExecutionItem, 'exec_id' | 'created_at'>) {
  const newItem: ExecutionItem = {
    ...item,
    exec_id: nextExecId++,
    created_at: new Date().toISOString(),
  };
  executions.unshift(newItem);
  return newItem;
}
