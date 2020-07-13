/// <reference path="taskSystem.d.ts"/>
/// <reference path="infoSystem.d.ts" />
/// <reference path="spawnSystem.d.ts" />


// <reference path="infoSystem.d.ts" />
/**
 * 本项目中出现的颜色常量
 * @author HoPGoldy
 */

type Colors = 'green' | 'blue' | 'yellow' | 'red';

/**
 * 本项目中出现的信息类型
 * {@link settings.typeInfo}
 */
type infoType = "debug" | "warning" | "notice";

/** The Role of Creeps */
type CreepRole = "harvester" | "upgrader" | "transferer" | "weak_transferer" | // This is the 'transferer' which only takes the job of central transfering
	"worker" | "repairer";

// prototype extension
interface Creep {
	/**
	 * @todo This should take account of {@link CreepMemory.earlyTerminateTasks}
	 * @returns ([taskCategory,taskType] | [taskCategory,taskType,[subTaskType_1,subTaskType_2...]])[]
	 */
	acceptTasks: () => Array<[TTaskCategory, BasicTaskType | MediumTaskType] | [TTaskCategory, BasicTaskType | MediumTaskType, string[]]>;
}
interface PowerCreep {
	/**
	 * @todo This should take account of {@link PowerCreepMemory.earlyTerminateTasks}
	 * @returns ([taskCategory,taskType] | [taskCategory,taskType,[subTaskType_1,subTaskType_2...]])[]
	 */
	acceptTasks: () => Array<[TTaskCategory, BasicTaskType | MediumTaskType] | [TTaskCategory, BasicTaskType | MediumTaskType, string[]]>;
}

// memory extension
interface CreepMemory {
	taskId: taskId | null;
	role: CreepRole;
	home: string;
	working: boolean;
	/** Whenever creep is renewed, this array should be cleared. */
	earlyTerminateTasks: Array<[BasicTaskType | MediumTaskType, string]>;
}
interface PowerCreepMemory {
	taskId: taskId | null;
	role: CreepRole;
	home: string;
	working: boolean;
	/** Whenever powerCreep is renewed, this array should be cleared. */
	earlyTerminateTasks: Array<[BasicTaskType | MediumTaskType, string]>;
}
interface SpawnMemory {
	lastSpawningTick: number;
}
interface Memory {
	settings: {
		logLevel: number
	}
}


type RoomInfo = controlledRoom | unownedRoom | observedRoom | neutralRoom | hostileRoom;

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
			Memory: {
				Portals: {
					/** Example shard2 -> W20N20 -> shard3 -> W20N20 -> PortalA, in which PortalA lying in shard3-W20N20, connects shard3-W20N20 to shard2-W20N20 */
					[shard: string]: { [roomName: string]: { [shard: string]: { [from: string]: Set<StructurePortal> } } }
				}
				Rooms: {
					my: string[],
					hostile: string[],
					observed: string[],
					neutral: string[],
					unowned: string[],
					[roomName: string]: RoomInfo | string[];
				}
			}
			Processor: InfoProcessor
		}
		spawnSystem: {
			Memory: {
				expected: {
					[roomName: string]: { [role in CreepRole]?: number }
				}
				current: {
					[roomName: string]: { [role in CreepRole]?: number }
				}
			}
			Processor: spawnProcessor
		}
	}
}
