/**
 * Declaration of Task System.
 * Task System is composed of "Processor", including "Storage" Unit, "Run" Unit and "Core" Unit and "Controller".
 * Date: 2020/06/26.
 * Version: Alpha 0.1.
 *
 * "Processor":
 * "Storage" Unit: This unit is responsible for managing the tasks, including "add", "del", "clean" and "get".
 * 				   All the tasks which are waiting for being received are stored here.
 * 				   It has a subunit, "taskPool".
 * "Run" Unit:	   This unit is responsible for running the tasks, which are designated by passing filter-restriction.
 * 				   All the tasks which are received will be registered here.
 * 				   It has a subunit, "registeredTasks".
 * "Core" Unit:	   This unit is responsible for controlling the exchange of information between "Storage" Unit and "Run" Unit.
 * 				   It directly controls all the Creeps and PowerCreeps and has access to the other units.
 * 				   The only way to create out-of-plan task dynamically during the loop is to call the instructions inside this unit.
 *
 * "Controller":
 * "Record" Unit:  This unit is used to record some information about the running of task system. The stored data will be used to
 * 				   adjust the settings of other units.
 * "Adjust" Unit:  This unit directly adjusts the settings of "Issue" and "Run" Unit.
 * "Issue" Unit:   Unit which statistically issue the task. It has:
 * 				   		List: Scan at every tick. Issue the task if some conditions acting upon some subjects are satisfied.
 * 						Timer: Happen at specific tick. Call the function and Do something.
 * 						Scheduler: Scheduled peroidic task. Check something and issue the task if properly(Specifically, used to run "Advanced" Task).
 * 						Watcher: Do something if watching some events happen.
 * "Run" Unit:	   Dicide to run some tasks, and not to run some tasks.
 */

/// <reference path="dataStructure.d.ts"/>

type objectId = string;
type creepId = string;
type powerCreepId = string;
type taskId = string;

type TtargetGetter<T> = () => T | null;

declare const TASK_DELETE: 15;
declare const TASK_FINISH: 7;
declare const TASK_RENEW: 3;
type TASK_CODE = 3 | 7 | 15;

/**
 * Function to issue triggered tasks.
 */
type TTaskCallback = () => boolean;
/**
 * Function to check whether terminate the task.
 */
type TTaskTerminate = () => boolean;
/**
 * @interface ITaskType Origin Interface for taskType.
 */
interface ITaskType<TtaskType, TsubTaskType> {
	readonly taskType: TtaskType;
	readonly subTaskType: TsubTaskType;
	readonly taskLevel?: "low" | "medium" | "high";
}
/**
 * @interface ITaskTypeAttached Interface for taskType attached to a specific home.
 * @extends ITaskType
 */
interface ITaskTypeAttached<TtaskType, TsubTaskType> extends ITaskType<TtaskType, TsubTaskType> {
	readonly home: string;
}
/**
 * @interface ITaskTypeAcross Interface for taskType which can be received by any room.
 * @extends ITaskType
 */
interface ITaskTypeAcross<TtaskType, TsubTaskType> extends ITaskType<TtaskType, TsubTaskType> {
	readonly targetRoom: string;
	/**
	 * Maximum Range between the received Room and the target Room.
	 */
	maxRange?: number;
	/**
	 * Maximum Number of Rooms which receive the Task.
	 */
	maxReceivedRooms?: number;
}
/**
 * @interface ITaskTypeDecision Interface for taskType which makes decision.
 * @extends ITaskType
 */
interface ITaskTypeDecision<TtaskType, TsubTaskType, Tinterval> extends ITaskType<TtaskType, TsubTaskType> {
	/**
	 * Interval of Making Decision or Reevaluating Decision.
	 */
	interval: Tinterval;
}

type TTaskCategory = "basic" | "medium";

/**
 * Basic(Low-Level) taskType Declarations.
 * Execution Layer.
 * These tasks act directly on single Creep.
 */
type BasicTaskType = "attack" | "build" | "claim" | "defend" | "harvest" | "other" | "repair" | "transfer" | "upgrade";
type TBasicTaskType =
	ITaskTypeAcross<"attack", "power" | "heal"> |
	ITaskTypeAttached<"build", "local"> | ITaskTypeAcross<"build", "remote"> |
	ITaskTypeAcross<"claim", "reserve" | "claim" | "attack"> | //attackController
	ITaskTypeAcross<"defend", "my" | "guard"> |
	ITaskTypeAttached<"harvest", "local"> | ITaskTypeAcross<"harvest", "remote"> |
	ITaskTypeAttached<"other", "generate_safe_mode"> |
	ITaskTypeAttached<"repair", "local" | "wall" | "rampart"> | ITaskTypeAcross<"repair", "remote"> |
	// Integrate 'Pickup' into 'Transfer'.
	ITaskTypeAttached<"transfer", "core" | "defense" | "advanced" | "center" | "collect"> | ITaskTypeAcross<"transfer", "remote"> |
	ITaskTypeAcross<"travel", "remote"> |
	ITaskTypeAttached<"upgrade", "local"> | ITaskTypeAcross<"upgrade", "remote">;
/**
 * Group(Medium-Level) taskType Declarations.
 * Management Layer.
 * These tasks act directly on a group of Creeps.
 * Medium-Level tasks are able to issue Low-Level tasks.
 */
type MediumTaskType = "Attack" | "Defend" | "Transfer";
type TMediumTaskType =
	ITaskTypeAcross<"Attack", "Exhaust" | "Dismantle" | "Pair" | "Quad" | "Disrupt" | "Downgrade" | "Nuke"> |
	ITaskTypeAcross<"Defend", "My" | "Defend_Nuke" | "Transfer_Asset"> |
	ITaskTypeAttached<"Transfer", "Lab" | "Factory">;
/**
 * Advanced(High-Level) taskType Declarations.
 * Decision-Making Layer.
 * These tasks do not have specific objects to be acted upon.
 * High-Level tasks are able to issue Medium-Level or Low-Level tasks.
 */
type AdvancedTaskType = "EXpand" | "ATtack" | "DEfend" | "BEnifit" | "PRocess" | "MArket";
type TAdvancedTaskType =
	ITaskTypeDecision<"EXpand", "Next_Room" | "Plan_Room", 10000 | 50000 | 100000> |
	ITaskTypeDecision<"ATtack", "Attack_Room" | "Attack_Invader_Core", 1000 | 5000 | 10000> |
	ITaskTypeDecision<"DEfend", "Potential_Risk" | "Actual_Risk", 100 | 500 | 1000> |
	ITaskTypeDecision<"BEnifit", "Cpu_Recover" | "Pixel_Generate" | "Resource_Steal", 1000 | 5000 | 10000> |
	ITaskTypeDecision<"PRocess", "Upgrade_Heavily" | "Lab_Heavily" | "Factory_Heavily" | "Power_Heavily", 1500> |
	ITaskTypeDecision<"MArket", "Unlock_Buy" | "Pixel_Buy" | "Pixel_Sell" | "Key_Buy", 10000 | 50000 | 100000>;

declare abstract class CTaskBase {
	/**
	 * Salt. The reason behind setting this parameter is that sometimes I need to issue
	 * multiple identical tasks. But I calculate an unique fingerprint for each task in
	 * order to avoid potential unexpected redundant duplicate tasks. So, in order to keep
	 * redundant-avoid mechanism working and preserve the ability to issue identical task,
	 * I introduce the "salt", which will be added when computing to generate different
	 * fingerprint for identical task. Just like adding "Salt" to the "Soup".
	 *
	 * The Inspiration is from the Theory of Cryptography.
	 */
	private readonly _salt: number;
	readonly id: taskId;
	readonly identity: TBasicTaskType | TMediumTaskType;
	/**
	 * The priority to be received, the lower, the more urgent.
	 * This function will be executed at some intervals in order to adjust the priority queue for receiving task.
	 *
	 * Based on the fact that there are at most 10 tasks usually for a specific taskType, and a specific subTaskType.
	 * So, the time to adjust is about 10log10 ~ 30. In order to achieve "linearity" by amortizing the cost, doing the
	 * adjustment per 3~5 ticks will be a good choice.
	 */
	readonly getPriority: () => number;
	/**
	 * Cache the result of getPriority().
	 * The adjustment(add / delete) of priority queue will be executed based on this value, since dynamic result geenrated by getPriority() may
	 * not sustain the structure of Priority Queue.
	 */
	priority: number;
	/**
 	 * Function to issue triggered tasks.
	 * It will be executed whenever be received.
	 *
	 * Notice, though, the mechanism of redundant-avoid will somehow make the usage of this function more flexible.
 	 */
	readonly taskCallback?: TTaskCallback;
	/**
	 * Function to check whether terminate the task.
	 * It will be executed by some tasks, including "Transfer Power", "Attack", "Defend" and etc., to check whether
	 * terminate the task if creeps are idle.
	 */
	readonly taskTerminate?: TTaskTerminate;
	/**
	 * Data, which should be inherited and modified.
	 */
	data: object;
	/**
	 * Settings of Task, guiding headlines, such as "Issue", "Receive" and etc.
	 */
	settings: {
		/**
		 * The Received Status of Task.
		 * Issue a task with expected receiving Creeps' Group Number is equivalent to issue duplicate tasks.
		 */
		received: {
			/**
			 * Expected Maximum Receiving Creeps' Group Number.
			 */
			max: number;
			/**
			 * Current Receiving Creeps' Group Number.
			 */
			current: number;
			/**
			 * Left Receiving Creeps' Group Number.
			 */
			left: number;
		}
	};
	/**
	 * Options of Task, guiding execution.
	 */
	options?: object;
	/**
	 * Run Program of Task.
	 * Potential Creeps will be passed into this function in the form of Array.
	 * In the case of "High-Level" task, no parameters will be passed.
	 */
	run: (creeps?: Creep[]) => boolean;
}

// Transfer Declaration.
type TamountCheck = () => boolean;

declare class CTaskTransfer extends CTaskBase {
	/**
	 * @param callback This function will act on each target to see whether it satisfies the requirements.
	 * This function will return a target as soon as it meets one of which the callback is true from head or tail or undefined if it does not meet any.
	 */
	static baseTargetGetter: <T>(targets: T | T[], callback: (target: T) => boolean) => T | undefined;
	data: {
		from: {
			roomName: string;
			target: TtargetGetter<Structure<STRUCTURE_STORAGE | STRUCTURE_TERMINAL | STRUCTURE_FACTORY>> |
			TtargetGetter<Creep> | TtargetGetter<Resource> | TtargetGetter<Ruin>;
		},
		to: {
			roomName: string;
			target: TtargetGetter<Structure<STRUCTURE_STORAGE | STRUCTURE_TERMINAL | STRUCTURE_FACTORY | STRUCTURE_POWER_SPAWN | STRUCTURE_NUKER>> |
			TtargetGetter<Structure<STRUCTURE_SPAWN | STRUCTURE_EXTENSION | STRUCTURE_TOWER | STRUCTURE_LAB | STRUCTURE_CONTAINER>>;
		}
		resourceType: ResourceConstant;
		amount: TamountCheck;
	}
}

// Work Declaration.

declare class CTaskWork<T> extends CTaskBase {
	data: {
		target: TtargetGetter<T>,
		roomName: string;
	}
}

type CTaskRepair = CTaskWork<Structure>;
type CTaskBuild = CTaskWork<ConstructionSite>;
type CTaskUpgrade = CTaskWork<StructureController>;

// Harvest Declaration.

declare class CTaskHarvest extends CTaskBase {
	data: {
		target: TtargetGetter<Source | Deposit | Mineral>,
		roomName: string,
		/**
		 * Link will be checked once only when the Creep is full at the first time.
		 * Then the result will be written into the Memory of Creep.
		 */
		link: TtargetGetter<StructureLink>,
		/**
		 * Container will be checked once only when the Creep is full at the first time.
		 * Then the result will be written into the Memory of Creep.
		 */
		container: TtargetGetter<StructureContainer>
	}
}

// Travel Declaration.

declare class CTaskTravel extends CTaskBase {
	data: {
		target: () => string;
		roomList: Array<string>;
	}
}

// Attack Declaration.
// Basic Level Attack Task.

declare class CTaskAttack extends CTaskBase {
	data: {
		target: TtargetGetter<StructurePowerBank | Creep>,
		roomName?: string,
	}
}

// Claim Declaration.
// Basic Level Claim Task.

declare class CTaskClaim extends CTaskBase {
	data: {
		roomName: string
	}
}

// Defend Declaration.
// Basic Level Defend Task.

declare class CTaskDefend extends CTaskBase {
	data: {
		roomName: string
	}
}

// Other Declaration.

declare class CTaskOther extends CTaskBase {
	data: {
		/**
		 * This function will judge whether the Creep is suitable for this task.
		 * For example, the standard for a creep to take "generate_safe_mode" task is that it should have at least 1000 storing Capacity.
		 */
		isSuitable?: (creeps: Creep[]) => boolean;
	}
}

/**
 * Declaration of Units.
 */

declare class taskIdQueue extends PriorityQueue<taskId> {
	static _refresh_interval: number;
	private _last_refresh_tick: number;
	private _refreshPriority: () => boolean;
	private _callBefore: () => boolean;
	protected _priority: (index: number) => number;
}

declare class taskIdTree extends TreePriorityQueue<taskId, taskIdQueue> {
	/**
	 * This function will get one task under specified node.
	 * It is often used to get a task with specific "taskType" regardless of "subTaskType".
	 */
	getAnyFromNode: (path: Array<string>) => taskId | undefined;
}

declare class registeredTaskIdTree extends TreeArray<taskId> {
	/**
	 * When it comes to the running of task, we need to get all the tasks registered under one node.
	 * Thus, original "add->get->pop" Stack Model does not satisfy our needs.
	 */
	getAllFromNode: (path: Array<string>) => Array<taskId>;
}

type TaskIdPool = taskIdTree;
type TaskIdRegistered = registeredTaskIdTree;

/**
 * The Storage Unit of Task System.
 * Its main function is to manipulate the "add", "del", "get", "refresh"(automatic when get) behaviors of task pieces.
 * It acts upon the level of TaskPiece.
 */
declare class CTaskStorageUnit {
	/**
	 * For Basic Tasks, the structure of Pool is [roomName][taskType][subTaskType].
	 */
	protected _taskPool: {
		basic: TaskIdPool,
		medium: TaskIdPool,
	};
	addTask: (category: TTaskCategory, task: CTaskBase, path: Array<string>) => boolean;
	/**
	 * Special Auxiliary Function.
	 * Since it is often used.
	 */
	addBasicTask: (task: CTaskBase, home: string) => boolean;
	getTaskId: (category: TTaskCategory, path: Array<string>) => taskId | undefined;
	/**
	 * "getBasicTaskId" allows "subTaskType"-the third filter key- to be undefined, which means that
	 * all the leaves under the node "taskType" are acceptable, even though it requires calling function to
	 * provide specific task path when deals with "getTaskId".
	 */
	getBasicTaskId: (home: string, taskType: BasicTaskType, subTaskType?: string | undefined) => taskId | undefined;
	delTasks: (category: TTaskCategory, criterion: (value: taskId) => boolean, path: Array<string>) => boolean;
	/**
	 * The setting of "subTaskType" parameter is the same with "getBasicTaskId".
	 * But notice that if the calling function lets "subTaskType" to be undefined, it will usually be very time-consuming.
	 */
	delBasicTasks: (criterion: (value: taskId) => boolean, home: string, taskType: BasicTaskType, subTaskType?: string | undefined) => boolean;
}
/**
 * The Run Unit of Task System.
 * Its main function is to run tasks, which means that it does not care about the time. You give the order and it runs.
 */
declare class CTaskRunUnit {
	protected _registeredTasks: {
		basic: TaskIdRegistered,
		medium: TaskIdRegistered,
	};
	addRegTaskId: (category: TTaskCategory, taskId: taskId, path: Array<string>) => boolean;
	addRegBasicTaskId: (taskId: taskId, home: string) => boolean;
	/**
	 * This function will return those tasks which do not return OK.
	 */
	runTasks: (category: TTaskCategory, path: Array<string>) => { taskId: taskId, ret: TASK_CODE }[];
	runBasicTasks: (home: string, taskType: BasicTaskType, subTaskType?: string | undefined) => { taskId: taskId, ret: TASK_CODE }[];
}
/**
 * The Core Unit of Task System.
 * Directly control all the Creeps and PowerCreeps and Responsible for the exchange of information between "Storage" and "Run" Unit.
 */

declare class CTaskCoreUnit {
	storage: CTaskStorageUnit;
	run: CTaskRunUnit;
	/** These instructions belong to "simple" ones. */
	instruction: {
		/** Some Advanced Tasks will be issued through this method dynamically. */
		addTask: (task: CTaskBase, settings?: { silence: boolean }) => boolean;
		/**
		 * Assigning Task to Creeps | PowerCreeps will not change the "received" status of task.
		 * The idea behind it is that this is a kind of "violent intervention" behavior.
		 */
		assignTask: (subject: Creep | PowerCreep, taskId: string) => boolean;
		/**
		 * Delete Task should accept parameters of "delTasks" | "delBasicTasks" of the Storage Unit.
		 */
		delTask: () => boolean;
		getTask: (subject: Creep | PowerCreep) => boolean;
		/**
		 * Run Task should accept parameters of "runTasks" | "runBasicTasks" of the Run Unit.
		 */
		runTask: () => boolean;
	}
}

/**
 * The Control Unit.
 * Its main task is to issue tasks and control the running of tasks.
 * Instruction of Control Unit consists of "run()", called during the loop, and other methods, called during the compilation.
 */

declare class TreeLevel extends TreeObject<number> {
	getLastFromPath: (path: Array<string>) => number | undefined;
}

/** Calling Order: Adjust -> Issue -> Run(Record). */
declare class CTaskControlUnit {
	/** Record will be called while executing other units. */
	Record: {
		/** Here should include all the Indexs. */
		data: {
			[index: string]: TreeObject<any>;
		}
		setting: {
			/** After Such Interval, all the Data will be wiped out. */
			record_interval: number;
			last_record_tick: number;
		}
		instruction: {
			addRecord: (index: string, path: Array<string>, key: string, record: any) => boolean;
			getRecord: (index: string, path: Array<string>, key: string) => any | undefined;
		}
	}
	/**
	 * Adjust directly acts upon the 'setting' of other units.
	 */
	Adjust: {
		setting: {
			adjust_interval: number;
			last_adjust_tick: number;
		}
		instruction: {
			run: () => boolean;
			adjustSwitch: () => boolean;
			adjustLevel: () => boolean;
		}
	}
	Issue: {
		data: {
			timer: { [tick: number]: { func: () => any; params: Array<any>; }; }
			/** This is only intended for Basic Task, which should be scanned at every tick and never be stopped. */
			list: Array<CTaskIssueListPiece<Room | Structure | Source | Mineral | Flag>>;
			watcher: { [event: string]: () => any; };
		}
		setting: {
			switch: {
				timer: boolean;
				list: boolean;
				watcher: boolean;
			}
		}
		instruction: {
			run: () => boolean;
			/** These instructions are called outside the loop. */
			addToTimer: (tick: number, func: () => any, params: Array<any>) => boolean;
			addToList: <T>(item: CTaskIssueListPiece<T>) => boolean;
			addToWatcher: (event: EventConstant, func: () => any) => boolean;
		}
	}
	Run: {
		data: {
			/** While running the scheduled task, it should also be noticed that it could be stopped by level. */
			scheduler: { [interval: number]: Array<TAdvancedTaskType | TMediumTaskType> };
		}
		setting: {
			switch: {
				scheduler: boolean;
			}
			level: {
				current: TreeLevel;
				statistic: TreeLevel;
			}
		}
		instruction: {
			/** Run the Scheduler and All registered Tasks based on the situation of Level. */
			run: () => boolean;
			/** These instructions are called outside the loop. */
			addToScheduler: (item: TAdvancedTaskType | TMediumTaskType) => boolean;
		}
	}
	run: () => boolean;
}

declare class CTaskIssueListPiece<T>{
	subjects: Array<T> | { [propName: string]: T };
	condition: (subject: T) => boolean;
	triggered: (subject: T) => boolean;
}

type CreepTree = TreeArray<Creep | PowerCreep>;

declare namespace NodeJS {
	interface Global {
		taskSystem: {
			Memory: {
				WareHouse: { [taskId: string]: CTaskBase };
				Roll: { [taskId: string]: Array<Creep | PowerCreep> };
				IdleCreeps: CreepTree;
			}
			Processor: CTaskCoreUnit;
			Controller: CTaskControlUnit;
		}
	}
}
