/// <reference path="taskSystem.d.ts"/>

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
	}
}
