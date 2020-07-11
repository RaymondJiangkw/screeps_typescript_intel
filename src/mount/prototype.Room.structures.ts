/**
Module: prototype.Room.structures v1.7
Author: SemperRabbit
Date:   20180309-13,0411
Usage:  require('prototype.Room.structures');

This module will provide structure caching and extends the Room
  class' prototype to provide `room.controller`-like properties
  for all structure types. It will cache the object IDs of a
  room.find() grouped by type as IDs in global. Once the property
  is requested, it will chech the cache (and refresh if required),
  then return the appropriate objects by maping the cache's IDs
  into game objects for that tick.

Changelog:
1.0: Initial publish
1.1: Changed structureMultipleList empty results from `null` to `[]`
     Bugfix: changed structureSingleList returns from arrays to single objects or undefined
1.2: Added intra-tick caching in addition to inter-tick caching
1.3: Multiple bugfixes
1.4: Moved STRUCTURE_POWER_BANK to `structureMultipleList` due to proof of *possibility* of multiple
        in same room.
1.5: Added CPU Profiling information for Room.prototype._checkRoomCache() starting on line 47
1.6: Added tick check for per-tick caching, in preperation for the potential "persistent Game
        object" update. Edits on lines 73, 77-83, 95, 99-105
1.7; Added Factory support (line 46)
*/

/// <reference path="prototype.Room.structures.d.ts" />

import { getCacheExpiration } from "../utils/utils";

var roomStructures: { [roomName: string]: { [structureName: string]: Array<string> } } = {};
var roomStructuresExpiration: { [roomName: string]: number } = {};

var roomRepairs: { [roomName: string]: [Array<string>, Array<string>] } = {};
var roomRepairsExpiration: { [roomName: string]: number } = {};

var roomBuilds: { [roomName: string]: Array<string> } = {};
var roomBuildsExpiration: { [roomName: string]: number } = {};

var roomRuins: { [roomName: string]: Array<string> } = {};
var roomRuinsExpiration: { [roomName: string]: number } = {};

var roomHostileStructures: { [roomName: string]: Array<string> } = {};
var roomHostileStructuresExpiration: { [roomName: string]: number } = {};

const structureMultipleList = [
	STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_ROAD, STRUCTURE_WALL,
	STRUCTURE_RAMPART, STRUCTURE_KEEPER_LAIR, STRUCTURE_PORTAL, STRUCTURE_LINK,
	STRUCTURE_TOWER, STRUCTURE_LAB, STRUCTURE_CONTAINER, STRUCTURE_POWER_BANK,
];

const structureSingleList = [
	STRUCTURE_OBSERVER, STRUCTURE_POWER_SPAWN, STRUCTURE_EXTRACTOR, STRUCTURE_NUKER,
	STRUCTURE_CONTROLLER, STRUCTURE_FACTORY, // STRUCTURE_STORAGE, STRUCTURE_TERMINAL,
];

/********* CPU Profiling stats for Room.prototype._checkRoomCache **********
calls         time      avg        function
550106        5581.762  0.01015    Room._checkRoomCache

calls with cache reset: 4085
avg for cache reset:    0.137165
calls without reset:    270968
avg without reset:      0.003262
****************************************************************************/
export function mountRoomStructures() {
	Room.prototype._checkRoomCache = function _checkRoomCache() {
		// if cache is expired or doesn't exist
		if (!roomStructuresExpiration[this.name] || !roomStructures[this.name] || roomStructuresExpiration[this.name] < Game.time) {
			roomStructuresExpiration[this.name] = Game.time + getCacheExpiration();
			roomStructures[this.name] = _.groupBy(this.find(FIND_STRUCTURES), s => s.structureType) as any;
			var i;
			for (i in roomStructures[this.name]) {
				roomStructures[this.name][i] = _.map(roomStructures[this.name][i], s => (s as unknown as Structure).id);
			}
		}
	}

	Room.prototype._checkRuinCache = function _checkRuinCache() {
		if (!roomRuinsExpiration[this.name] || !roomRuins[this.name] || roomRuinsExpiration[this.name] < Game.time) {
			roomRuinsExpiration[this.name] = Game.time + getCacheExpiration();
			roomRuins[this.name] = this.find(FIND_RUINS) as any;
			roomRuins[this.name] = _.map(roomRuins[this.name], (r) => (r as unknown as Ruin).id);
		}
	}

	Room.prototype._checkBuildCache = function _checkBuildCache() {
		if (!roomBuildsExpiration[this.name] || !roomBuilds[this.name] || roomBuildsExpiration[this.name] < Game.time) {
			roomBuildsExpiration[this.name] = Game.time + getCacheExpiration();
			roomBuilds[this.name] = this.find(FIND_CONSTRUCTION_SITES) as any;
			roomBuilds[this.name] = _.map(roomBuilds[this.name], s => (s as unknown as ConstructionSite).id);
		}
	}

	Room.prototype._checkHostileStructureCache = function _checkHostileStructureCache() {
		if (!roomHostileStructuresExpiration[this.name] || !roomHostileStructures[this.name] || roomHostileStructuresExpiration[this.name] < Game.time) {
			roomHostileStructuresExpiration[this.name] = Game.time + getCacheExpiration();
			roomHostileStructures[this.name] = this.find(FIND_HOSTILE_STRUCTURES) as any;
			roomHostileStructures[this.name] = _.map(roomHostileStructures[this.name], s => (s as unknown as Structure).id);
		}
	}

	Room.prototype._checkRepairCache = function _checkRepairCache() {
		if (!roomRepairsExpiration[this.name] || !roomRepairs[this.name] || roomRepairsExpiration[this.name] < Game.time) {
			roomRepairsExpiration[this.name] = Game.time + getCacheExpiration();
			const hitsCmp = (a: Structure, b: Structure) => a.hits / a.hitsMax - b.hits / b.hitsMax;
			var cores: Array<string> =
				([] as Array<any>).concat(this.spawns, this.powerSpawn, this.extensions, this.towers, this.storage, this.terminal, this.factory, this.labs, this.extractor, this.observer, this.links)
					.filter(s => s)
					.sort(hitsCmp)
					.map(s => s.id);
			var commons =
				([] as Array<any>).concat(this.roads, this.containers)
					.filter(s => s)
					.sort(hitsCmp)
					.map(s => s.id);
			roomRepairs[this.name] = [cores, commons];
		}
	}

	structureMultipleList.forEach(function (type) {
		Object.defineProperty(Room.prototype, type + 's', {
			get: function () {
				if (this['_' + type + 's'] && this['_' + type + 's_ts'] === Game.time) {
					return this['_' + type + 's'];
				} else {
					this._checkRoomCache();
					if (roomStructures[this.name][type]) {
						this['_' + type + 's_ts'] = Game.time;
						return this['_' + type + 's'] = _.filter(roomStructures[this.name][type].map(Game.getObjectById), s => s);
					} else {
						this['_' + type + 's_ts'] = Game.time;
						return this['_' + type + 's'] = [];
					}
				}
			},
			set: function () { },
			enumerable: false,
			configurable: true,
		});
	});

	structureSingleList.forEach(function (type) {
		Object.defineProperty(Room.prototype, type, {
			get: function () {
				if (this['_' + type] && this['_' + type + '_ts'] === Game.time) {
					return this['_' + type];
				} else {
					this._checkRoomCache();
					if (roomStructures[this.name][type]) {
						this['_' + type + '_ts'] = Game.time;
						return this['_' + type] = Game.getObjectById(roomStructures[this.name][type][0]);
					} else {
						this['_' + type + '_ts'] = Game.time;
						return this['_' + type] = null;
					}
				}
			},
			set: function () { },
			enumerable: false,
			configurable: true,
		});
	});

	Object.defineProperty(Room.prototype, "buildTargets", {
		get: function () {
			if (this["_buildTargets"] && this["_buildTargets_ts"] === Game.time) {
				return this["_buildTargets"];
			} else {
				this._checkBuildCache();
				if (roomBuilds[this.name]) {
					this["_buildTargets_ts"] = Game.time;
					return this["_buildTargets"] = _.filter(roomBuilds[this.name].map(Game.getObjectById), s => s);
				} else {
					this["_buildTargets_ts"] = Game.time;
					return this["_buildTargets"] = [];
				}
			}
		},
		set: function () { },
		enumerable: false,
		configurable: true
	})

	Object.defineProperty(Room.prototype, "repairTargets", {
		get: function () {
			if (this["_repairTargets"] && this["_repairTargets_ts"] === Game.time) {
				return this["_repairTargets"];
			} else {
				this._checkRepairCache();
				var _ret: Array<string> = [];
				for (var i = 0; i < roomRepairs[this.name].length; i++) {
					roomRepairs[this.name][i] = _.filter(roomRepairs[this.name][i], s => Game.getObjectById(s));
					_ret = _ret.concat(roomRepairs[this.name][i]);
				}
				if (_ret.length > 0) {
					this["_repairTargets_ts"] = Game.time;
					return this["_repairTargets"] = _.filter(_ret.map(Game.getObjectById), s => (s as Structure).hits < (s as Structure).hitsMax);
				} else {
					this["_repairTargets_ts"] = Game.time;
					return this["_repairTargets"] = [];
				}
			}
		},
		set: function () { },
		enumerable: false,
		configurable: true
	})

	Object.defineProperty(Room.prototype, "ruins", {
		get: function () {
			if (this["_ruins"] && this["_ruins_ts"] === Game.time) {
				return this["_ruins"];
			} else {
				this._checkRuinCache();
				if (roomRuins[this.name]) {
					this["_ruins_ts"] = Game.time;
					return this["_ruins"] = _.filter(roomRuins[this.name].map(Game.getObjectById), s => s);
				} else {
					this["_ruins_ts"] = Game.time;
					return this["_ruins"] = [];
				}
			}
		},
		set: function () { },
		enumerable: false,
		configurable: true
	})

	Object.defineProperty(Room.prototype, "hostileStructures", {
		get: function () {
			if (this["_hostileStructures"] && this["_hostileStructures_ts"] === Game.time) {
				return this["_hostileStructures"];
			} else {
				this._checkHostileStructureCache();
				if (roomHostileStructures[this.name]) {
					this["_hostileStructures_ts"] = Game.time;
					return this["_hostileStructures"] = _.filter(roomHostileStructures[this.name].map(Game.getObjectById), s => s);
				} else {
					this["_hostileStructures_ts"] = Game.time;
					return this["_hostileStructures"] = [];
				}
			}
		},
		set: function () { },
		enumerable: false,
		configurable: true,
	})
}
