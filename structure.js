module.exports = {
	controlTower(tower) {	    
        var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => (((structure.hits * 1.0) / (structure.hitsMax * 1.0)) < 0.25) && structure.structureType != STRUCTURE_WALL
        });
        var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        

        
        if(closestHostile) {
            if(tower.attack(closestHostile) == 0)
            {
                    console.log('Tower is Attacking: ' + closestHostile.owner.username);
            }
        }
        else
        {
            if(closestDamagedStructure) {
                if(tower.repair(closestDamagedStructure) == 0)
                {
                    console.log('Tower is Repairing: ' + closestDamagedStructure);
                }
            }
        }
	}
}