/// <reference path="types.d.ts" />
declare class spawnProcessor {
	data: {
		bodyparts: { [role in CreepRole]?: (room: Room) => Array<BodyPartConstant> };
		/** True, indicates needing to spawn more. */
		numComparison: { [role in CreepRole]?: (expected: number, current: number, room: Room) => boolean };
		acceptedTasks: { [role in CreepRole]?: Array<[TTaskCategory, BasicTaskType | MediumTaskType] | [TTaskCategory, BasicTaskType | MediumTaskType, string[]]> };
	}
	instructions: {
		scanCurrentCreeps(room: Room): boolean;
		modifyExpectedCreeps(roomName: string, role: CreepRole, modify: number): boolean;
		getSpawnOrder(room: Room): Array<CreepRole>;
		getFromSpawn(roomName: string, role: CreepRole): Array<BodyPartConstant> | undefined;
		registerCreepRole(role: CreepRole, acceptedTasks: Array<[TTaskCategory, BasicTaskType | MediumTaskType] | [TTaskCategory, BasicTaskType | MediumTaskType, string[]]>, bodyparts: (room: Room) => Array<BodyPartConstant>, numComparison: (expected: number, current: number, room: Room) => boolean): boolean;
	}
	_getBodyParts(roomName: string, role: CreepRole): Array<BodyPartConstant>;
	run(): void;
	spawn(): void;
}
