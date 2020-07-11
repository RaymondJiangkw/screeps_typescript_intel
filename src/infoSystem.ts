/// <reference path="./mount/prototype.Room.structures.d.ts" />
/// <reference path="./mount/prototype.Room.resources.d.ts" />
/// <reference path="./mount/prototype.Room.Creeps.d.ts" />
/// <reference path="./infoSystem.d.ts" />
import { evaluateCreepCapacity, mixinFactory, RoomState } from "./utils/utils"
import { isFunction } from "lodash";
import { roomInfoRefreshInterval } from "./utils/settings"

export class InfoProcessor {
	instructions: {
		addToPortal: (toShard: string, toRoom: string, fromShard: string, fromRoom: string, portal: StructurePortal) => boolean;
		refreshRoom: () => void;
	}
	_addToPortal(toShard: string, toRoom: string, fromShard: string, fromRoom: string, portal: StructurePortal): boolean {
		const Portals = global.infoSystem.Memory.Portals;
		if (!Portals[toShard]) Portals[toShard] = {};
		if (!Portals[toShard][toRoom]) Portals[toShard][toRoom] = {};
		if (!Portals[toShard][toRoom][fromShard]) Portals[toShard][toRoom][fromShard] = {};
		if (!Portals[toShard][toRoom][fromShard][fromRoom]) Portals[toShard][toRoom][fromShard][fromRoom] = new Set();
		global.infoSystem.Memory.Portals[toShard][toRoom][fromShard][fromRoom].add(portal);
		return true;
	}
	_refreshInfoSystem() {
		for (const key in Game.rooms) {
			const room = Game.rooms[key];
			if (!(room.name in global.infoSystem.Memory.Rooms)) {
				const state = RoomState(room);
				switch (state) {
					case "controlled":
						global.infoSystem.Memory.Rooms[room.name] = new controlledRoom(room) as controlledRoom;
						global.infoSystem.Memory.Rooms.my.push(room.name);
						break;
					case "hostile":
						global.infoSystem.Memory.Rooms[room.name] = new hostileRoom(room) as hostileRoom;
						global.infoSystem.Memory.Rooms.hostile.push(room.name);
						break;
					case "neutral":
						global.infoSystem.Memory.Rooms[room.name] = new neutralRoom(room) as neutralRoom;
						global.infoSystem.Memory.Rooms.neutral.push(room.name);
						break;
					case "observed":
						global.infoSystem.Memory.Rooms[room.name] = new observedRoom(room) as observedRoom;
						global.infoSystem.Memory.Rooms.observed.push(room.name);
						break;
					case "unowned":
						global.infoSystem.Memory.Rooms[room.name] = new unownedRoom(room) as unownedRoom;
						global.infoSystem.Memory.Rooms.unowned.push(room.name);
						break;
					default:
						break;
				}
			} else (global.infoSystem.Memory.Rooms[room.name] as RoomInfo).refresh();
		}
	}
	run(): boolean {
		this.instructions.refreshRoom();
		return true;
	}
	constructor() {
		this.instructions = {
			addToPortal: this._addToPortal,
			refreshRoom: this._refreshInfoSystem
		}
	}
}

function CResourceInfo<T extends Constructor>(Base: T) {
	return class extends Base {
		resources!: {
			[propName: string]: {
				[STRUCTURE_STORAGE]?: number;
				[STRUCTURE_TERMINAL]?: number;
				[STRUCTURE_FACTORY]?: number;
				[STRUCTURE_CONTAINER]?: number;
				[STRUCTURE_LAB]?: number;
			};
		};
		_collectResourceInfo(room: Room): boolean {
			const roomName = room.name;
			const addToResources = (resourceType: ResourceConstant, structureType: STRUCTURE_STORAGE | STRUCTURE_TERMINAL | STRUCTURE_FACTORY | STRUCTURE_CONTAINER | STRUCTURE_LAB, amount: number) => {
				if (!this.resources[resourceType]) this.resources[resourceType] = {};
				this.resources[resourceType][structureType] = amount;
			};
			const addStructure = (structure: StructureStorage | StructureTerminal | StructureFactory | StructureContainer | StructureLab | null | undefined) => {
				if (!structure) return;
				for (const resourceType in structure.store) addToResources(resourceType as ResourceConstant, structure.structureType, structure.store[resourceType as ResourceConstant]);
			}
			const storeSingleStructures: Array<"storage" | "terminal" | "factory"> = ["storage", "terminal", "factory"];
			const storeMultipleStructures: Array<"labs" | "containers"> = ["labs", "containers"];
			for (const structure of storeSingleStructures) addStructure(room[structure]);
			for (const structures of storeMultipleStructures) for (const structure of room[structures]) addStructure(structure);
			return true;
		};
		_refreshResourceInfo(room: Room): boolean {
			if (Game.time % roomInfoRefreshInterval.resource) this._collectResourceInfo(room);
			return true;
		}
	}
}
function CEconomyInfo<T extends Constructor>(Base: T) {
	return class extends Base {
		economy!: {
			[RESOURCE_ENERGY]: {
				"available": {
					"current": number;
					"total": number;
				};
				/**
				 * Total Energy Stored / energyAvailableCapacity.
				 * Number of times to fill in completely.
				 */
				"storage": {
					[STRUCTURE_STORAGE]?: number;
					[STRUCTURE_TERMINAL]?: number;
					[STRUCTURE_FACTORY]?: number;
				};
			};
		};
		_collectEconomyInfo(room: Room): boolean {
			this.economy = {
				[RESOURCE_ENERGY]: {
					"available": {
						"current": room.energyAvailable,
						"total": room.energyCapacityAvailable
					},
					"storage": {
						[STRUCTURE_STORAGE]: room.storage ? room.storage.store[RESOURCE_ENERGY] : 0,
						[STRUCTURE_TERMINAL]: room.terminal ? room.terminal.store[RESOURCE_ENERGY] : 0,
						[STRUCTURE_FACTORY]: room.factory ? room.factory.store[RESOURCE_ENERGY] : 0
					}
				}
			};
			return true;
		};
		_refreshEconomyInfo(room: Room): boolean {
			if (Game.time % roomInfoRefreshInterval.economy) this._collectEconomyInfo(room);
			return true;
		}
	}
}
function CStructureProdInfo<T extends Constructor>(Base: T) {
	return class extends Base {
		structures!: {
			[STRUCTURE_CONTAINER]: {
				"input": Array<StructureContainer>,
				"output": Array<StructureContainer>,
				"map": { [id: string]: Structure },
				/** Could be used as 'input' or 'output' */
				"central": Array<StructureContainer>
			},
			[STRUCTURE_LINK]: {
				"input": Array<StructureLink>,
				"output": Array<StructureLink>,
				"map": { [id: string]: Structure },
				/** Could be used as 'input' or 'output' */
				"central": Array<StructureLink>
			},
			[STRUCTURE_LAB]: {
				"input": Array<StructureLab>,
				"output": Array<StructureLab>,
			},
		}
		_collectStructureProdInfo(room: Room): boolean {
			this.structures = {
				[STRUCTURE_CONTAINER]: {
					"input": [],
					"output": [],
					"map": {},
					"central": []
				},
				[STRUCTURE_LINK]: {
					"input": [],
					"output": [],
					"map": {},
					"central": []
				},
				[STRUCTURE_LAB]: {
					"input": [],
					"output": []
				}
			}
			const adj = (structure: StructureContainer | StructureLink, targets: Array<Structure | Source | Mineral | null | undefined>, range: number = 1) => {
				for (const target of targets) if (target) if (structure.pos.inRangeTo(target, range)) return target;
				return null;
			}
			const IOCcondition = (category: "input" | "output" | "central", targets: Array<Structure | Source | Mineral | null | undefined>, range = 1) => {
				return (structure: StructureContainer | StructureLink): boolean => {
					const ret = adj(structure, targets, range);
					if (ret) {
						this.structures[structure.structureType][category].push(ret as any);
						this.structures[structure.structureType]["map"][ret.id] = structure;
						return true;
					}
					return false;
				}
			}
			const containerInputCond = IOCcondition("input", ([] as any).concat(room["energys"], room.mineral));
			const containerCentralCond = IOCcondition("central", ([] as any).concat(room.storage, room.terminal), 2);
			for (const container of room["containers"]) {
				if (!containerInputCond(container) && !containerCentralCond(container)) {
					this.structures["container"]["output"].push(container);
				}
			}
			const linkInputCond = IOCcondition("input", room["energys"], 2);
			/**
			 * This condition is used to solve this situation.
			 *
			 * L _ _ _
			 * W C _ _
			 * W S _ _
			 * W W U L
			 *
			 * L: Link
			 * W: Wall
			 * C: Container
			 * S: Source
			 * U: Controller
			 */
			const linkUpgradeCond = IOCcondition("output", [room.controller]);
			const linkCentralCond = IOCcondition("central", ([] as any).concat(room.storage, room.terminal), 2);
			for (const link of room["links"]) {
				if (linkUpgradeCond && !linkInputCond(link) && !linkCentralCond(link)) {
					this.structures["link"]["output"].push(link);
				}
			}
			if (room["labs"].length >= 3) {
				for (const lab of room["labs"]) {
					if (this.structures["lab"].input.length < 2) {
						let reachAll = true;
						for (const _lab of room["labs"]) {
							if (!lab.pos.inRangeTo(_lab, 2)) {
								reachAll = false;
								break;
							}
						}
						if (reachAll) this.structures["lab"].input.push(lab);
						else this.structures["lab"].output.push(lab);
					} else this.structures["lab"].output.push(lab);
				}
			}
			return true;
		};
		_refreshStructureProdInfo(room: Room): boolean {
			if (Game.time % roomInfoRefreshInterval.structure) this._collectStructureProdInfo(room);
			return true;
		}
	}
}
function CDefenseInfo<T extends Constructor>(Base: T) {
	return class extends Base {
		defense!: {
			[STRUCTURE_TOWER]: {
				status: "repair" | "attack" | "heal" | "idle",
				refillTowers: Array<StructureTower>
			}
		}
		_collectDefenseInfo(room: Room): boolean {
			if (!this.defense) {
				this.defense = {
					"tower": {
						status: "idle",
						refillTowers: []
					}
				}
			}
			/**
			 * Flexible Adjust the Ratio
			 * In order to fill the tower completely while attacking/healing.
			 */
			let ratio = 0.5;
			if (this.defense[STRUCTURE_TOWER].status === "attack" || this.defense[STRUCTURE_TOWER].status === "heal") ratio = 1;
			this.defense.tower.refillTowers = _.filter(room["towers"], t => t.store.getUsedCapacity(RESOURCE_ENERGY) / t.store.getCapacity(RESOURCE_ENERGY) < ratio);
			return true;
		}
		_refreshDefenseInfo(room: Room): boolean {
			if (Game.time % roomInfoRefreshInterval.defense) this._collectDefenseInfo(room);
			return true;
		}
	}
}
function CPortalInfo<T extends Constructor>(Base: T) {
	return class extends Base {
		portals!: Array<{ portal: StructurePortal, desti: RoomPosition | { shard: string, room: string } }>
		_collectPortalInfo(room: Room): boolean {
			this.portals = [];
			for (const portal of room["portals"]) {
				this.portals.push({ portal: portal, desti: portal.destination });
				// Register to `global` extension
				let toShard = (portal.destination as { shard: string, room: string }).shard || Game.shard.name;
				let toRoom = (portal.destination as RoomPosition).roomName || (portal.destination as { shard: string, room: string }).room;
				global.infoSystem.Processor.instructions.addToPortal(toShard, toRoom, Game.shard.name, room.name, portal);
			}
			return true;
		}
		_refreshPortalInfo(room: Room): boolean {
			if (Game.time % roomInfoRefreshInterval.portal) this._collectPortalInfo(room);
			return true;
		}
	}
}
function CControllerInfo<T extends Constructor>(Base: T) {
	return class extends Base {
		controller!: {
			level: number,
			downgradeTick: number | null,
			reservedTick: number | null,
		}
		_collectControllerInfo(room: Room): boolean {
			const controller = room.controller as StructureController;
			this.controller = {
				level: controller.level,
				downgradeTick: controller.ticksToDowngrade,
				reservedTick: controller.reservation ? controller.reservation.ticksToEnd : null
			}
			return true;
		}
		_refreshControllerInfo(room: Room): boolean {
			if (Game.time % roomInfoRefreshInterval.controller) this._collectControllerInfo(room);
			return true;
		}
	}
}
function CCreepInfo<T extends Constructor>(Base: T) {
	return class extends Base {
		creeps!: {
			live: Array<creepEvaluation>,
			spawning?: Array<creepEvaluation>
		}
		_collectCreepInfo(room: Room): boolean {
			const creeps = room.find(FIND_CREEPS);
			const nonZeros = (o: { [propName: string]: number | number[] }): number => {
				let count = 0;
				for (const key in o) {
					if (typeof (o[key]) == "number" && o[key] > 0) count++;
					else if ((o[key] as number[])[0] > 0) count++;
				}
				return count;
			}
			for (const creep of creeps) {
				const capacity = evaluateCreepCapacity(creep);
				const info = {
					pos: creep.pos,
					danger: 0,
					creep: creep,
					capacity: {
						dismantle: capacity.work["dismantle"] as number,
						attack: capacity.attack["attack"] as number,
						rangedAttack: capacity.ranged_attack["rangedAttack"] as number,
						rangedMassAttack: capacity.ranged_attack["rangedMassAttack"] as number[],
						heal: capacity.heal["heal"] as number,
						rangedHeal: capacity.heal["rangedHeal"] as number
					}
				};
				info.danger = nonZeros(info.capacity);
				this.creeps.live.push(info);
			}
			return true;
		}
		_refreshCreepInfo(room: Room): boolean {
			if (Game.time % roomInfoRefreshInterval.creep) this._collectCreepInfo(room);
			return true;
		}
	}
}

class RoomBase {
	room: Room;
	_callInternalMethod(key: string): boolean {
		for (const method of Object.getOwnPropertyNames(Object.getPrototypeOf(this))) {
			if (!isFunction((this as { [propName: string]: any })[method]) || method.substr(0, key.length) !== key) continue;
			(this as { [propName: string]: any })[method](this.room);
		}
		return true;
	}
	constructor(room: Room) {
		this.room = room;
		this._callInternalMethod("_collect");
	}
	refresh() {
		this._callInternalMethod("_refresh");
		return true;
	}
}


const controlledRoomImplements = [CResourceInfo, CEconomyInfo, CDefenseInfo, CStructureProdInfo, CControllerInfo];
export const controlledRoom = mixinFactory(RoomBase, controlledRoomImplements);

const unownedRoomImplements = [CControllerInfo, CStructureProdInfo, CCreepInfo]
export const unownedRoom = mixinFactory(RoomBase, unownedRoomImplements);

const observedRoomImplements = [CStructureProdInfo, CCreepInfo, CPortalInfo];
export const observedRoom = mixinFactory(RoomBase, observedRoomImplements);

const neutralRoomImplements = [CCreepInfo];
export const neutralRoom = mixinFactory(RoomBase, neutralRoomImplements);

const hostileRoomImplements = [CResourceInfo, CEconomyInfo, CControllerInfo, CCreepInfo];
export const hostileRoom = mixinFactory(RoomBase, hostileRoomImplements);
