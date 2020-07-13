/// <reference path="./mount/prototype.Room.Creeps.d.ts" />
import { spawnInterval } from "./utils/settings"
import { scaleBodyParts, log } from "./utils/utils"
/**
 * Notice that: every used roles should be registered!
 * Otherwise, it may lead to many errors.
 */
export class spawnProcessor {
	data: {
		bodyparts: { [role in CreepRole]?: (room: Room) => Array<BodyPartConstant> };
		/** True, indicates needing to spawn more. */
		numComparison: { [role in CreepRole]?: (expected: number, current: number, room: Room) => boolean };
	}
	instructions: {
		scanCurrentCreeps(room: Room): boolean;
		modifyExpectedCreeps(roomName: string, role: CreepRole, modify: number): boolean;
		getSpawnOrder(room: Room): Array<CreepRole>;
		getFromSpawn(roomName: string, role: CreepRole): Array<BodyPartConstant> | undefined;
		registerCreepRole(role: CreepRole, bodyparts: (room: Room) => Array<BodyPartConstant>, numComparison: (expected: number, current: number, room: Room) => boolean): boolean;
	}
	_registerCreepRole(role: CreepRole, bodyparts: (room: Room) => Array<BodyPartConstant>, numComparison: (expected: number, current: number, room: Room) => boolean): boolean {
		this.data.bodyparts[role] = bodyparts;
		this.data.numComparison[role] = numComparison;
		return true;
	}
	_modifyExpectedCreeps(roomName: string, role: CreepRole, modify: number): boolean {
		if (!global.spawnSystem.Memory.expected[roomName]) global.spawnSystem.Memory.expected[roomName] = {};
		global.spawnSystem.Memory.expected[roomName][role] = (global.spawnSystem.Memory.expected[roomName][role] || 0) + modify;
		return true;
	}
	_getFromSpawn(roomName: string, role: CreepRole): Array<BodyPartConstant> | undefined {
		/**
		 * Since 'current' and 'expected' of controlled room -- roomName must be initialized from {@link this.run()},
		 * it is safe to directly access {@link global.spawnSystem.Memory.expected/current[roomName]}
		 */
		const expectedNum: number = global.spawnSystem.Memory.expected[roomName][role] || 0;
		const currentNum: number = global.spawnSystem.Memory.current[roomName][role] || 0;
		if ((this.data.numComparison[role] as any)(expectedNum, currentNum, Game.rooms[roomName])) return (this.data.bodyparts[role] as any)(Game.rooms[roomName]);
		return undefined;
	}
	/** @todo */
	_getSpawnOrder(room: Room): Array<CreepRole> {
		return [];
	}
	_scanCurrentCreeps(room: Room): boolean {
		const modifyCurrentSpawn = (role: CreepRole, modify: number): boolean => {
			global.spawnSystem.Memory.current[room.name][role] = (global.spawnSystem.Memory.current[room.name][role] || 0) + modify;
			return true;
		}
		global.spawnSystem.Memory.current[room.name] = {};
		for (const creep of room.creeps) modifyCurrentSpawn(creep.memory.role, 1);
		return true;
	}
	_getBodyParts(roomName: string, role: CreepRole): Array<BodyPartConstant> {
		return (this.data.bodyparts[role] as any)(Game.rooms[roomName]);
	}
	run(): void {
		global.infoSystem.Memory.Rooms.my.forEach((roomName: string) => {
			this.instructions.scanCurrentCreeps(Game.rooms[roomName]);
			if (!global.spawnSystem.Memory.expected[roomName]) global.spawnSystem.Memory.expected[roomName] = {};
		});
	}
	spawn(): void {
		global.infoSystem.Memory.Rooms.my.forEach((roomName: string) => {
			const room = Game.rooms[roomName];
			const spawnOrder = this.instructions.getSpawnOrder(room);
			for (const role of spawnOrder) {
				let bodies = this.instructions.getFromSpawn(roomName, role);
				if (!bodies) continue;
				bodies = scaleBodyParts(bodies, room.energyAvailable);
				let spawnSuccessful = false;
				for (const spawn of Game.rooms[roomName].spawns) {
					if (spawn.spawning || (spawn.memory.lastSpawningTick && Game.time - spawn.memory.lastSpawningTick < spawnInterval)) continue;
					const ret = spawn.spawnCreep(bodies, `${Game.shard.name}_${roomName}_${role}_${Game.time}`, { memory: { role: role, taskId: null, home: roomName, working: false, earlyTerminateTasks: [] } });
					if (ret === OK) {
						spawnSuccessful = true;
						spawn.memory.lastSpawningTick = Game.time;
						break;
					} else log("Spawn Failure!", ["warning", roomName]);
				}
				if (spawnSuccessful) break;
			}
		});
	}
	constructor() {
		this.data = { bodyparts: {}, numComparison: {} };
		this.instructions = {
			getFromSpawn: this._getFromSpawn,
			getSpawnOrder: this._getSpawnOrder,
			modifyExpectedCreeps: this._modifyExpectedCreeps,
			scanCurrentCreeps: this._scanCurrentCreeps,
			registerCreepRole: this._registerCreepRole
		}
	}
}
