import Unit from "../../unit";
import AbilityTarget from "./ability_target";

export enum AbilityIdentifier { Q, W, E, R, None }

export enum TargetType {
    None,       // passive or other
    Self,       // self-targeted
    Unit,       // targets a unit
    Location    // targets a specific point on the board
}

export abstract class BaseAbility {
    abstract identifier: AbilityIdentifier;
    abstract name: string;
    abstract targetType: TargetType;
    maxRange: number | null = null;
    caster: Unit;

    constructor(caster: Unit) {
        this.caster = caster;
    }

    get isUltimate() {
        return this.identifier === AbilityIdentifier.R;
    }

    _isValidWithTarget(target: AbilityTarget) {
        if (this.targetType === TargetType.None) {
            return target.hasNoTarget;
        }
        if (this.targetType === TargetType.Self) {
            return target.unit === this.caster;
        }
        if (this.targetType === TargetType.Unit) {
            return target.unit !== null;
        }
        if (this.targetType === TargetType.Location) {
            return target.location !== null;
        }
        return false;
    }

    abstract onCast(target: AbilityTarget): void;

    canAffect(unit: Unit, mask: AbilityEffectMask) {
        if (mask.allyChampions && unit.isChampion && unit.teamColor === this.caster.teamColor) {
            return true;
        }

        if (mask.enemyChampions && unit.isChampion && unit.teamColor !== this.caster.teamColor) {
            return true;
        }

        if (mask.allyMinions && !unit.isChampion && unit.teamColor === this.caster.teamColor) {
            return true;
        }

        if (mask.enemyMinions && !unit.isChampion && unit.teamColor !== this.caster.teamColor) {
            return true;
        }

        return false;
    }
}


class _NoAbility extends BaseAbility {
    name = "None";
    identifier = AbilityIdentifier.None;
    targetType = TargetType.None

    onCast(target: AbilityTarget) {

    }
}

export function NoAbility(caster: Unit) {
    return new _NoAbility(caster);
}

export class AbilityEffectMask {
    allyMinions = false;
    enemyMinions = false;
    
    allyChampions = false;
    enemyChampions = false;

    self = false;

    constructor() {

    }

    allowEnemyMinionTarget() {
        this.enemyMinions = true;
        return this;
    }

    allowEnemyChampionTarget() {
        this.enemyChampions = true;
        return this;
    }

    allowAllyMinionTarget() {
        this.allyMinions = true;
        return this;
    }

    allowAllyChampionTarget() {
        this.allyChampions = true;
        return this;
    }

    allowSelfTarget() {
        this.self = true;
        return this;
    }

    allowAll() {
        this.enemyChampions = true;
        this.enemyMinions = true;
        this.allyChampions = true;
        this.allyMinions = true;
        return this;
    }
}