module.exports =
  {
    builder(creep) {
      if (creep.memory.building && creep.carry.energy == 0) {
        creep.memory.building = false
      }
      if (!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
        creep.memory.building = true
      }

      if (creep.memory.building) {
        var extensions = creep.room.find(FIND_CONSTRUCTION_SITES, {
          filter: (structure) => {
            return (structure.structureType == STRUCTURE_EXTENSION)
          }
        })
        var targets = creep.room.find(FIND_CONSTRUCTION_SITES)
        if (targets.length > 0) {
          if (extensions.length > 0) {
            if (creep.build(extensions[0]) == ERR_NOT_IN_RANGE) {
              creep.moveTo(extensions[0])
            }
          } else {
            if (creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
              creep.moveTo(targets[0])
            }
          }
        } else {
          if (creep.memory.role != 'harvester')
            this.harvester(creep)
          else
            this.repairer(creep)
        }
      } else {
        if (creep.memory.role != 'harvester')
          this.harvester(creep)
        else
          this.repairer(creep)
      }
    },
    harvester(creep) {
      var targets

      if (creep.room.controller && creep.room.controller.level >= 5) {
        targets = creep.room.find(FIND_STRUCTURES, {
          filter: (structure) => {
            return (structure.structureType == STRUCTURE_EXTENSION ||
            structure.structureType == STRUCTURE_SPAWN ||
            structure.structureType == STRUCTURE_TOWER ||
            structure.structureType == STRUCTURE_STORAGE
            ) && structure.energy < structure.energyCapacity
          }
        })
      } else {
        targets = creep.room.find(FIND_STRUCTURES, {
          filter: (structure) => {
            return (structure.structureType == STRUCTURE_EXTENSION ||
            structure.structureType == STRUCTURE_SPAWN ||
            structure.structureType == STRUCTURE_TOWER
            ) && structure.energy < structure.energyCapacity
          }
        })
      }

      if (targets.length > 0) {
        if (creep.memory.filled && creep.carry.energy == 0) {
          creep.memory.filled = false
        }

        if (!creep.memory.filled && creep.carry.energy == creep.carryCapacity) {
          creep.memory.filled = true
        }

        if (creep.memory.filled) {
          if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(targets[0])
          }
        } else {
          this.sendToHarvest(creep)
        }
      } else {
        if (creep.memory.role != 'builder' && creep.memory.role != 'claimer')
          this.builder(creep)
        else
          this.repairer(creep)
      }
    },
    repairer(creep) {
      var needsRepair
      var currentlyRepairing

      var allStructures = creep.room.find(FIND_STRUCTURES)

      for (var name in allStructures) {
        var current = allStructures[name]
        if (current.structureType == STRUCTURE_ROAD || current.structureType == STRUCTURE_TOWER) { /*current.structureType == STRUCTURE_WALL ||*/
          var percent = (current.hits * 1.0) / (current.hitsMax * 1.0)

          if (current.structureType == STRUCTURE_ROAD && percent <= 0.25 || current.structureType == STRUCTURE_TOWER && percent <= 0.25) { /*current.structureType == STRUCTURE_WALL && percent <= 0.01 ||*/
            needsRepair = current
          }

          if (current.pos.x == creep.memory.repairbuildingx && current.pos.y == creep.memory.repairbuildingy) {
            currentlyRepairing = current
          }
        }
      }

      if (currentlyRepairing) {
        if (currentlyRepairing.hits == currentlyRepairing.hitsMax) {
          console.log('Fully Repaired')
          delete creep.memory.repairbuildingx
          delete creep.memory.repairbuildingy
          console.log('Memory Deleted')
        }
        if (needsRepair) {
          if (currentlyRepairing.structureType == STRUCTURE_WALL && needsRepair.structureType == STRUCTURE_ROAD) {
            creep.memory.repairbuildingx = needsRepair.pos.x
            creep.memory.repairbuildingy = needsRepair.pos.y
            console.log('Road needs repair.')
          }
        }

      // console.log('Repairing Not Null')
      }

      if (creep.memory.repairbuildingx && creep.memory.repairbuildingy) {
        // console.log('Repairing Memory Not Null')

        if (creep.memory.repairing && creep.carry.energy == 0) {
          creep.memory.repairing = false
        }

        if (!creep.memory.repairing && creep.carry.energy == creep.carryCapacity) {
          creep.memory.repairing = true
        }

        if (creep.memory.repairing) {
          // console.log('Repairing : ' + currentlyRepairing.pos.x + ', ' + currentlyRepairing.pos.y);   
          if (creep.repair(currentlyRepairing) == ERR_NOT_IN_RANGE) {
            creep.moveTo(currentlyRepairing)
          // console.log('Moving to Repair')
          }
        } else {
          // console.log('Harvesting for repair')
          this.sendToHarvest(creep)
        }
      } else {
        if (needsRepair) {
          console.log('Structure set for repair : ' + needsRepair.pos.x + ', ' + needsRepair.pos.y)
          creep.memory.repairbuildingx = needsRepair.pos.x
          creep.memory.repairbuildingy = needsRepair.pos.y
        } else {
          // console.log('Couldn\'t find anything to repair.')
          this.upgrader(creep)
        }
      }
    },
    upgrader(creep) {
      if (creep.memory.upgrading && creep.carry.energy == 0) {
        creep.memory.upgrading = false
      }
      if (!creep.memory.upgrading && creep.carry.energy == creep.carryCapacity) {
        creep.memory.upgrading = true
      }

      if (!creep.memory.upgrading) {
        this.sendToHarvest(creep)
      } else {
        if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
          creep.moveTo(creep.room.controller)
        }
      }
    },
    claimer(creep) {
      if (Game.flags.ClaimTarget !== undefined) {
        if (creep.room != Game.flags.ClaimTarget.room) {
          creep.moveTo(Game.flags.ClaimTarget)
        } else {
          if (creep.room.controller) {
            if (!creep.room.controller.my) {
              if (creep.claimController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller)
              }
            } else {
              if (creep.getActiveBodyparts(CARRY) > 0 && creep.getActiveBodyparts(WORK) > 0) {
                this.builder(creep)
              }
            }
          }
        }
      }
    },
    attacker(creep) {
        
        //creep.moveTo(Game.flags.Target)
      if (Game.flags.Target !== undefined) {
        if (creep.room !== Game.flags.Target.room) {
          creep.moveTo(Game.flags.Target)
        } else { 
        
        var roomToAttack = creep.room;
        console.log(roomToAttack)
        
        if(roomToAttack != undefined)
        {
            var buildingsToAttack = roomToAttack.find(FIND_HOSTILE_STRUCTURES, { filter: (enemyBuilding) => (enemyBuilding.structureType == STRUCTURE_SPAWN)});
            if (buildingsToAttack.length > 0) {
              console.log(buildingsToAttack.length)
              if (creep.attack(buildingsToAttack[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(buildingsToAttack[0])
              }
            }
            else
            {
               var creepsToAttack = roomToAttack.find(FIND_HOSTILE_CREEPS);
            if (creepsToAttack.length > 0) {
              console.log(creepsToAttack.length)
              if (creep.attack(creepsToAttack[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creepsToAttack[0])
              }
            } 
            }
        }
        
        /*
          var creepsToAttack = Game.rooms[creep.room].find(FIND_CREEPS, { filter: (hostileCreep) => (hostileCreep.getActiveBodyparts(ATTACK) > 0 && !hostileCreep.my && hostileCreep.owner.username != 'beans') })
          var buildingsToAttack = Game.rooms[creep.room].find(FIND_STRUCTURES, { filter: (hostileBuiling) => ((hostileBuiling.structureType == STRUCTURE_TOWER || hostileBuiling.structureType == STRUCTURE_SPAWN || hostileBuiling.structureType == STRUCTURE_KEEPER_LAIR) && (!hostileBuiling.my)) })

          if (creepsToAttack.length > 0) {
            if (creep.attack(creepsToAttack[0]) == ERR_NOT_IN_RANGE) {
              creep.moveTo(creepsToAttack[0])
            }
          } else {
            if (buildingsToAttack.length > 0) {
              console.log(buildingsToAttack.length)
              if (creep.attack(buildingsToAttack[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(buildingsToAttack[0])
              }
            } else {
              var plaincreepsToAttack = Game.rooms[creep.room].find(FIND_CREEPS, { filter: (hostileCreep) => (!hostileCreep.my) })
              console.log(plaincreepsToAttack.length)
              if (plaincreepsToAttack.length > 0) {
                if (creep.attack(plaincreepsToAttack[0]) == ERR_NOT_IN_RANGE) {
                  creep.moveTo(plaincreepsToAttack[0])
                }
              } else {
                var plainbuildingsToAttack = Game.rooms[creep.room].find(FIND_STRUCTURES, { filter: (hostileBuiling) => (!hostileBuiling.my) })
                console.log(plainbuildingsToAttack.length)
                if (plainbuildingsToAttack.length > 0) {
                  if (creep.attack(plainbuildingsToAttack[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(plainbuildingsToAttack[0])
                  }
                }
              }
            }
          }*/
        }
      }
    },
    sendToHarvest(creep) {
      if (creep.memory.source != undefined) {
        var target = Game.getObjectById(creep.memory.source.id)
        var enemiesInRoom = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS)

        if (enemiesInRoom == null) {
          var droppedEnergy = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY)
          if (droppedEnergy != null)
            target = droppedEnergy
        }

        var harvestResult = creep.harvest(target)
        // console.log(harvestResult)
        if (harvestResult == ERR_NOT_IN_RANGE) {
          creep.moveTo(target)
        } else if (harvestResult == ERR_NOT_ENOUGH_RESOURCES) {
          creep.moveTo(target)
        }
        if (harvestResult == ERR_INVALID_TARGET) {
          var pickupResult = creep.pickup(target)
          if (pickupResult == ERR_NOT_IN_RANGE) {
            creep.moveTo(target)
          }
        }
      } else {
        var target = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY)
        if (target) {
          if (creep.pickup(target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target)
          }
        } else {
          var sources = creep.room.find(FIND_SOURCES)

          if (creep.memory.role == 'upgrader') {
            if (creep.harvest(sources[1]) == ERR_NOT_IN_RANGE) {
              creep.moveTo(sources[1])
            } else {
              if (creep.harvest(sources[1]) == ERR_NOT_ENOUGH_RESOURCES) {
                creep.moveTo(sources[1])
              }
            }
          } else {
            var errorcode = creep.harvest(sources[1])
            if (errorcode == ERR_NOT_IN_RANGE) {
              creep.moveTo(sources[1])
            } else {
              if (errorcode == ERR_NOT_ENOUGH_RESOURCES) {
                var errorcode2 = creep.harvest(sources[0])
                if (errorcode2 == ERR_NOT_IN_RANGE) {
                  creep.moveTo(sources[0])
                } else {
                  if (errorcode2 == ERR_NOT_ENOUGH_RESOURCES) {
                    creep.moveTo(sources[1])
                  }
                }
              }
            }
          }
        }
      }
    },
    spawnWorker(creepRole, spawner, src) {
      console.log('Room: ' + spawner.room)
      var SpawnerEnergy = spawner.room.energyAvailable
      console.log('Available: ' + SpawnerEnergy)
      var SpawnCapacity = spawner.room.energyCapacityAvailable
      console.log('Capacity: ' + SpawnCapacity)
      var creepMemory = { role: creepRole, homeroom: spawner.room, source: src }
      var averageCreepCost = SpawnCapacity / 2.0
      console.log('Average Creep Cost: ' + averageCreepCost)
      
      if(averageCreepCost > 1000)
        averageCreepCost = 1000;
      
      var newName

      var basicBody = [WORK, CARRY, MOVE]

      var all = spawner.room.find(FIND_CREEPS)
      if (all.length > 2 || SpawnerEnergy >= averageCreepCost) {
        var baseBody = [WORK, WORK, CARRY, CARRY, MOVE, MOVE]
        if (averageCreepCost <= SpawnerEnergy) {
          if (averageCreepCost < 200) {
              console.log('averageCreepCost < 200')
            newName = spawner.createCreep(basicBody, undefined, creepMemory)
          }
          else if (averageCreepCost < 300) {
              console.log('averageCreepCost < 300')
            newName = spawner.createCreep(baseBody, undefined, creepMemory)
          } else {
              console.log('averageCreepCost >= 300')
            var currentSize = 400
            var isMax = false

            while (!isMax) {
                baseBody.push(WORK)
                baseBody.push(CARRY)
                currentSize += 150
              if (currentSize + 150 > averageCreepCost) {
                  isMax = true
              }
                
            }

            newName = spawner.createCreep(baseBody, undefined, creepMemory)
          }
        }
      } else {
        newName = spawner.createCreep(basicBody, undefined, creepMemory)
      }

      if (newName == 0) {
        console.log('Spawning new ' + creepRole + ': ' + newName)
        spawner.memory.spawningRole = creepRole
      }
    },
    spawnAttacker(creepRole, spawner) {
      var newName = spawner.createCreep([TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK, ATTACK], undefined, { role: creepRole })

      if (newName == 0)
        console.log('Spawning new attacker-' + creepRole + ': ' + newName)
    },
    spawnClaimer(creepRole, spawner) {
      if (Game.flags.ClaimTarget !== undefined) {
        var newName
        if (Game.flags.ClaimTarget.room && Game.flags.ClaimTarget.room.controller.my)
          newName = spawner.createCreep([WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], undefined, { role: creepRole })
        else
          newName = spawner.createCreep([CLAIM, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], undefined, { role: creepRole })

        if (newName == 0)
          console.log('Spawning new attacker-' + creepRole + ': ' + newName)
      }
    }
}
