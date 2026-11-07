import { BLAST_RADIUS, DAMAGE_RADIUS, type Weapon } from './model';

export type { Weapon } from './model';

export function weaponEffects(weapon: Weapon = 'standard') {
  return weapon === 'heavy'
    ? { blastRadius: 64, damageRadius: 50 }
    : { blastRadius: BLAST_RADIUS, damageRadius: DAMAGE_RADIUS };
}
