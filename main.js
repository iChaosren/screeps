var rolelib = require('role')
var structurelib = require('structure')
const MaxHarvesterPerRoom = 2
const MaxBuilderPerRoom = 1
const MaxUpgraderPerRoom = 1
const MaxAttackerPerRoom = 0
const ClaimingRoom = 0

module.exports.loop = function () {
  for (var name in Game.rooms) {
    var currentRoom = Game.rooms[name]

    var allSources = currentRoom.find(FIND_SOURCES)
    var sourceUsage = []
    for (var src in allSources) {
      // if(allSources[src].pos.findInRange(FIND_HOSTILE_CREEPS, 5).length == 0)
      // {
      // console.log('Source added: ' + allSources[src].pos)
      sourceUsage.push({source: Game.getObjectById(allSources[src].id), used: 0})
    // }
    }

    var upgraders = []
    var nonupgraders = []
    var shortlived = []
    var harvesters = []
    var builders = []
    var attackers = []
    var claimers = []

    for (var creepname in Game.creeps) {
      var currentCreep = Game.creeps[creepname]

      if (currentCreep.room === currentRoom) {
        if (currentCreep.memory.role == 'harvester') {
          harvesters.push(currentCreep)
          rolelib.harvester(currentCreep)
        }

        if (currentCreep.memory.role == 'claimer') {
          claimers.push(currentCreep)
          rolelib.claimer(currentCreep)
        // currentCreep.say('I claim you for the mighty Spartan Empire!... and Friends.')
        }

        if (currentCreep.memory.role == 'attacker') {
          attackers.push(currentCreep)
          rolelib.attacker(currentCreep)
        // currentCreep.say('FOR SPARTAAAA!!!!')
        } else {
          // console.log(Game.getObjectById(currentCreep.memory.source.id.toString()))
          for (var src in sourceUsage) {
            if (currentCreep.memory.source !== undefined) {
              if (Game.getObjectById(currentCreep.memory.source.id.toString()) === sourceUsage[src]['source']) {
                sourceUsage[src]['used'] += 1
              }
            }
          }
        }

        if (currentCreep.memory.role == 'upgrader') {
          upgraders.push(currentCreep)
          rolelib.upgrader(currentCreep)
        } else {
          nonupgraders.push(currentCreep)
          if (currentCreep.ticksToLive <= 100)
            shortlived.push(currentCreep)
        }

        if (currentCreep.memory.role == 'builder') {
          builders.push(currentCreep)
          rolelib.builder(currentCreep)
        }
      }
    }

    var currentSpawns = []
    // var currentRoomEnergy = room.energyAvailable

    for (var buildingname in Game.structures) {
      var building = Game.structures[buildingname]

      if (currentRoom === building.room) {
        if (building.structureType == STRUCTURE_TOWER) {
          structurelib.controlTower(building)
        }

        if (building.structureType == STRUCTURE_SPAWN) {
          currentSpawns.push(building)

          if (building.spawning !== undefined && building.spawning !== null) {
            var creepRole = building.memory.spawningRole
            switch (creepRole) {
              case 'harvester':
                harvesters.push(building.spawning)
                break
              case 'builder':
                builders.push(building.spawning)
                break
              case 'upgrader':
                upgraders.push(building.spawning)
                break
              case 'attacker':
                attackers.push(building.spawning)
              case 'claimer':
                claimers.push(building.spawning)
                break
            }

            if (creepRole !== 'upgrader') {
              nonupgraders.push(building.spawning)
            }
          } else {
            var isSpawning = false

            var leastUsed = undefined

            for (var src in sourceUsage) {
              if (leastUsed === undefined) {
                leastUsed = sourceUsage[src]
              } else {
                // console.log(leastUsed['used'] + ' > ' + sourceUsage[src]['used'])
                if (leastUsed['used'] > sourceUsage[src]['used']) {
                  leastUsed = sourceUsage[src]
                }
              }
            }

            if (leastUsed === undefined) {
              isSpawning == true
            }

            if (building.spawning === undefined || building.spawning === null) {
              isSpawning = false
              delete building.memory.spawningRole
            }
            else
              isSpawning = true

            if (harvesters.length < MaxHarvesterPerRoom) {
              if (!isSpawning) {
                leastUsed['used'] += 1
                rolelib.spawnWorker('harvester', building, leastUsed['source'])
              }

              isSpawning = true
            }

            if (builders.length < MaxBuilderPerRoom) {
              if (!isSpawning) {
                leastUsed['used'] += 1
                rolelib.spawnWorker('builder', building, leastUsed['source'])
              }

              isSpawning = true
            }

            if (upgraders.length < MaxUpgraderPerRoom && shortlived.length == 0 && nonupgraders.length > 0) {
              if (!isSpawning) {
                leastUsed['used'] += 1
                rolelib.spawnWorker('upgrader', building, leastUsed['source'])
              }

              isSpawning = true
            }

            if (attackers.length < MaxAttackerPerRoom) {
              if (!isSpawning)
                rolelib.spawnAttacker('attacker', building)

              isSpawning = true
            }

            if (claimers.length < ClaimingRoom) {
              if (!isSpawning)
                rolelib.spawnClaimer('claimer', building)

              isSpawning = true
            }
          }
        }
      }
    }
  }

  for (var name in Memory.creeps) {
    if (!Game.creeps[name]) {
      if (!Memory.creeps[name].spawned) {
        Memory.creeps[name].spawned = true
      } else {
        console.log('Deleting creep from Memory : ' + name)
        delete Memory.creeps[name]
      }
    }
  }
}
