// ============================================================
//  Labrador — App-level Types
// ============================================================

export type Terrain = 'orogenico' | 'planicie' | 'extremista' | 'anfibio'

export type LeaderTitle =
  | 'Presidente' | 'Monarca' | 'Rei' | 'Papa'
  | 'Primeiro Ministro' | 'Chefe Supremo'
  | 'Chanceler' | 'Imperador'

export type ArticleCategory =
  | 'Governança' | 'Política' | 'Economia' | 'Social'
  | 'Ambiental' | 'Moda' | 'Anúncio' | 'Humor' | 'Militar'

export type DiplomaticStatus = 'ally' | 'neutral' | 'war' | 'embargo' | 'sanction'

export type Resource = 'food' | 'gold' | 'iron' | 'oil' | 'wood' | 'uranium' | 'coal' | 'steel' | 'energy'

export type MilitaryUnit =
  | 'soldiers' | 'ammo' | 'tanks' | 'artillery'
  | 'aircraft' | 'helicopters' | 'drones'
  | 'ships' | 'submarines' | 'missiles' | 'warheads'

// Terrain → available resources mapping
export const TERRAIN_RESOURCES: Record<Terrain, Resource[]> = {
  orogenico:   ['gold', 'iron', 'uranium'],
  planicie:    ['wood', 'oil', 'steel'],
  extremista:  ['oil', 'uranium'],
  anfibio:     ['wood', 'gold', 'oil'],
}

// All building types
export type BuildingType =
  // Energy
  | 'wind_farm' | 'nuclear_plant' | 'hydro_plant' | 'coal_plant' | 'oil_plant'
  // Mining
  | 'gold_mine' | 'iron_mine' | 'coal_mine' | 'uranium_mine' | 'oil_well'
  // Industry
  | 'sawmill' | 'steel_mill' | 'weapons_factory' | 'ammunition'
  // Agriculture
  | 'farm'
  // Services
  | 'hospital' | 'school' | 'university' | 'police_station' | 'recycling_center'
  // Infrastructure
  | 'residence' | 'office' | 'subway' | 'train' | 'airport'
  | 'port' | 'terminal' | 'highways' | 'park'
  // Military
  | 'bombers_station' | 'barracks' | 'tank_depot' | 'artillery_base'
  | 'air_base' | 'helicopter_pad' | 'drone_base'
  | 'naval_base' | 'submarine_base' | 'missile_silo' | 'warhead_storage'
  // Commerce
  | 'supermarket' | 'shopping_mall'
  // Other
  | 'treatment_plant' | 'oil_station' | 'research_center'
