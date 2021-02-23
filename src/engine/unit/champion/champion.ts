import Unit from "../unit";
import UnitAttributes from "../unit_attributes";
import AbilityTarget from "./ability/ability_target";
import { AbilityIdentifier, BaseAbility, NoAbility } from "./ability/base_ability";

export default class Champion extends Unit {
    abilityQ: BaseAbility = NoAbility(this);
    abilityW: BaseAbility = NoAbility(this);
    abilityE: BaseAbility = NoAbility(this);
    ultimate: BaseAbility = NoAbility(this);

    constructor(attributes: UnitAttributes) {
        super(attributes);
        this.isChampion = true;
    }

    getAbilityByIdentifier(identifier: AbilityIdentifier) {
        return {
            [AbilityIdentifier.Q]: this.abilityQ,
            [AbilityIdentifier.W]: this.abilityW,
            [AbilityIdentifier.E]: this.abilityE,
            [AbilityIdentifier.R]: this.ultimate,
            [AbilityIdentifier.None]: (()=>{throw new Error("cannot lookup ability with identifier None")})()
        }[identifier];
    }

    castAbility(which: AbilityIdentifier, target: AbilityTarget) {
        let ability = this.getAbilityByIdentifier(which);

        if (!ability.isValidWithTarget(target)) {
            throw new Error("cannot cast ability onto target of type "+target.targetType);
        }

        ability._cast(target);
    }
}