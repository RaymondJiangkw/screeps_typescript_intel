/// <reference path="taskSystem.d.ts"/>
// <reference path="infoSystem.d.ts" />
/**
 * 本项目中出现的颜色常量
 * @author HoPGoldy
 */

type Colors = 'green' | 'blue' | 'yellow' | 'red'
// prototype extension
interface Creep {
	/**
	 * @todo
	 * @returns ([taskCategory,taskType] | [taskCategory,taskType,[subTaskType_1,subTaskType_2...]])[]
	 */
	acceptTasks: () => Array<[TTaskCategory, BasicTaskType | MediumTaskType] | [TTaskCategory, BasicTaskType | MediumTaskType, string[]]>;
}
interface PowerCreep {
	/**
	 * @todo
	 * @returns ([taskCategory,taskType] | [taskCategory,taskType,[subTaskType_1,subTaskType_2...]])[]
	 */
	acceptTasks: () => Array<[TTaskCategory, BasicTaskType | MediumTaskType] | [TTaskCategory, BasicTaskType | MediumTaskType, string[]]>;
}

// memory extension
interface CreepMemory {
	taskId: taskId | null;
	role: string;
	home: string;
	working: boolean;
	/** Whenever creep is renewed, this array should be cleared. */
	earlyTerminateTasks: Array<[BasicTaskType | MediumTaskType, string]>;
}
interface PowerCreepMemory {
	taskId: taskId | null;
	role: string;
	home: string;
	working: boolean;
	/** Whenever powerCreep is renewed, this array should be cleared. */
	earlyTerminateTasks: Array<[BasicTaskType | MediumTaskType, string]>;
}
interface Memory {

}

// `global` extension
declare namespace NodeJS {
	interface Global {
		taskSystem: {
			Memory: {
				WareHouse: { [taskId: string]: CTaskBase };
				Roll: { [taskId: string]: Array<Creep | PowerCreep> };
				IdleCreeps: TreeArray<Creep | PowerCreep>;
			}
			Processor: CTaskCoreUnit;
			Controller: CTaskControlUnit;
			Loader: CTaskLoadUnit;
		}
		infoSystem: {
			Portals: {
				/** Example shard2 -> W20N20 -> shard3 -> W20N20 -> PortalA, in which PortalA lying in shard3-W20N20, connects shard3-W20N20 to shard2-W20N20 */
				[shard: string]: { [roomName: string]: { [shard: string]: { [from: string]: Set<StructurePortal> } } }
			}
			Rooms: {
				[roomName: string]: controlledRoom | unownedRoom | observedRoom | neutralRoom | hostileRoom;
			}
			instructions: {
				addToPortal: (toShard: string, toRoom: string, fromShard: string, fromRoom: string, portal: StructurePortal) => boolean;
				refresh: () => void;
			}
		}
	}
}
