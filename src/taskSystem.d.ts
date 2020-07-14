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
/// <reference path="types.d.ts" />
type objectId = string;
type creepId = string;
type powerCreepId = string;
type taskId = string;

type TtargetGetter<T> = () => T | null;

declare const TASK_DELETE: 15;
declare const TASK_FINISH: 7;
declare const TASK_RENEW: 3;
type TASK_CODE = 0 | 3 | 7 | 15;

/**
 * Function to issue triggered tasks.
 */
type TTaskCallback = () => { tasks: CTaskBase[], silences: boolean[], checkedDuplicate: true };
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
	maxRange: number;
	/**
	 * Maximum Number of Rooms which receive the Task.
	 */
	maxReceivedRooms: number;
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
	run: () => boolean;
}

interface receivedInformation {
	/** "any" here represents ANY OTHER, excluding those in {@link [role:string]:number} */
	"any": number;
	[role: string]: number;
}

type TTaskCategory = "basic" | "medium";

/**
 * Basic(Low-Level) taskType Declarations.
 * Execution Layer.
 * These tasks act directly on single Creep.
 */
type BasicTaskType = "attack" | "build" | "claim" | "defend" | "harvest" | "other" | "repair" | "transfer" | "upgrade" | "travel";
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
	readonly id: string;
	readonly identity: TBasicTaskType | TMediumTaskType;
	/**
	  * Function to issue triggered tasks.
	  * It will be executed whenever be added.
	  */
	readonly taskCallback?: TTaskCallback;
	/**
	 * Function to check whether needs to early terminate the task for one specific subject.
	 * It will be executed after running the task.
	 */
	readonly taskEarlyTerminate?: (subject: Creep | PowerCreep, attachedRoom: string) => boolean;
	/**
	 * Data, which should be inherited and modified.
	 */
	data: { [propName: string]: any };
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
			max: receivedInformation;
			/**
			 * Current Receiving Creeps' Group Number.
			 */
			current: receivedInformation;
			/**
			 * Left Receiving Creeps' Group Number.
			 */
			left: receivedInformation;
		}
	};
	/**
	 * Options of Task, guiding execution.
	 */
	options?: { [propName: string]: any };
	/**
	 * Run Program of Task.
	 * Potential Creeps will be passed into this function in the form of Array.
	 * In the case of "High-Level" task, no parameters will be passed.
	 * @returns An array of TASK_CODE, indicating situations for every Creep | PowerCreep in {@param creeps}.
	 */
	run: (creeps?: Array<Creep | PowerCreep>) => TASK_CODE[];
	/**
	 * Because of different declarations of identity(home/targetRoom), this property
	 * provides uniform port for getting the information about which room this task
	 * should be performed 'TO'.
	*/
	targetRoom: string;
}

// Transfer Declaration.
type TamountCheck = () => boolean;

declare class CTaskTransfer extends CTaskBase {
	get priority(): number;
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
	get priority(): number;
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
	get priority(): number;
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
	get priority(): number;
	data: {
		target: () => string;
		roomList: Array<string>;
	}
}

// Attack Declaration.
// Basic Level Attack Task.

declare class CTaskAttack extends CTaskBase {
	get priority(): number;
	data: {
		target: TtargetGetter<StructurePowerBank | Creep>,
		roomName?: string,
	}
}

// Claim Declaration.
// Basic Level Claim Task.

declare class CTaskClaim extends CTaskBase {
	get priority(): number;
	data: {
		roomName: string
	}
}

// Defend Declaration.
// Basic Level Defend Task.

declare class CTaskDefend extends CTaskBase {
	get priority(): number;
	data: {
		roomName: string
	}
}

// Other Declaration.

declare class CTaskOther extends CTaskBase {
	get priority(): number;
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

declare class taskIdTree extends TreeArray<taskId> {
	/** This function does filter out those received tasks in fact. */
	_popOneFromArray: (taskIds: Array<taskId>, role: CreepRole) => taskId | undefined;
	/**
	 * This function will get one task under specified node.
	 * It is often used to get a task with specific "taskType" regardless of "subTaskType".
	 */
	popAnyFromNode: (path: Array<string>, role: CreepRole) => taskId | undefined;
	popOneFromLeaf: (path: Array<string>, role: CreepRole) => taskId | undefined;
	clearAllFromNode: (path: Array<string>) => boolean;
}

declare class registeredTaskIdTree extends TreeArray<taskId> {
	/**
	 * When it comes to the running of task, we need to get all the tasks registered under one node.
	 * Thus, original "add->get->pop" Stack Model does not satisfy our needs.
	 */
	getAllFromNode: (path: Array<string>) => Array<taskId>;
}

/**
 * Due to some very weired reasons of TypeScript, these harmless equivalent type declarations will
 * make the compiler give the error:
 * 	"Tree<N,P>" is not inherited from "Tree<N,P>".
 * 	"taskIdTree" is unrelated to "taskIdTree".
 * 	"_mount" is , ... .
 */
// type TaskIdPool = taskIdTree;
// type TaskIdRegistered = registeredTaskIdTree;

/**
 * The Storage Unit of Task System.
 * Its main function is to manipulate the "add", "del", "get", "refresh"(automatic when get) behaviors of task pieces.
 * It acts upon the level of TaskPiece.
 */
declare class CTaskStorageUnit {
	/**
	 * For Basic Tasks, the structure of Pool is [roomName][taskType][subTaskType].
	 * Since in this way, we could easily manipulate the execulation and restriction of tasks based on the situation of one specific room.
	 * For Medium Tasks, the structure of Pool is [roomName][taskType][subTaskType].
	 *
	 * For example, we may have a room, whose energy is much more than enough, and another room, whose energy is in the edge of exhaustion.
	 * In the former room, transfer->advanced should be executed, since otherwise there would be nothing to do. However, in the latter room,
	 * transfer->advanced should be delayed, and give much higher priority to transfer-> core to fill up the energy.
	 */
	_taskPool: {
		basic: taskIdTree,
		medium: taskIdTree,
	};
	addTaskId: (category: TTaskCategory, taskId: taskId, path: Array<string>) => boolean;
	/** This code provides convenience, but consumes extra time. */
	addBasicTaskId: (taskId: taskId, home: string) => boolean;
	popTaskId: (category: TTaskCategory, path: Array<string>, role: CreepRole) => taskId | undefined;
	popAnyTaskId: (category: TTaskCategory, path: Array<string>, role: CreepRole) => taskId | undefined;
	clearTaskIds: (category: TTaskCategory, path: Array<string>) => boolean;
	clearBasicTaskIds: (home: string, taskType: BasicTaskType, subTaskType?: string | undefined) => boolean;
}
/**
 * The Run Unit of Task System.
 * Its main function is to run tasks, which means that it does not care about the time. You give the order and it runs.
 */
declare class CTaskRunUnit {
	/**
	 * For Basic Tasks, the structure of Pool is [roomName][taskType][subTaskType].
	 * Since in this way, we could easily manipulate the execulation and restriction of tasks based on the situation of one specific room.
	 * For Medium Tasks, the structure of Pool is [roomName][taskType][subTaskType].
	 *
	 * For example, we may have a room, whose energy is much more than enough, and another room, whose energy is in the edge of exhaustion.
	 * In the former room, transfer->advanced should be executed, since otherwise there would be nothing to do. However, in the latter room,
	 * transfer->advanced should be delayed, and give much higher priority to transfer-> core to fill up the energy.
	 */
	_registeredTasks: {
		basic: registeredTaskIdTree,
		medium: registeredTaskIdTree,
	};
	addRegTaskId: (category: TTaskCategory, taskId: taskId, path: Array<string>) => boolean;
	/** This code provides convenience, but consumes extra time. */
	addRegBasicTaskId: (taskId: taskId, home: string) => boolean;
	assignRegTaskIds: (category: TTaskCategory, taskIds: taskId[], path: Array<string>) => boolean
	/**
	 * @param settings.runAll Whether to run all the tasks under this node.
	 * @returns For each task, return its id and corresponding returned TASK_CODE for each creep.
	 */
	runTasks: (category: TTaskCategory, path: Array<string>, settings?: { runAll: boolean }) => { taskId: taskId, ret: TASK_CODE[] }[];
	/**
	 * "runBasicTasks" allows "subTaskType"-the third filter key- to be undefined, which means that
	 * all the tasks of leaves under the node "taskType" will be executed.
	 */
	runBasicTasks: (home: string, taskType: BasicTaskType, subTaskType?: string | undefined) => { taskId: taskId, ret: TASK_CODE[] }[];
	clearTasks: (category: TTaskCategory, path: Array<string>, settings?: { clearAll: boolean }) => boolean;
}
/**
 * The Core Unit of Task System.
 * Directly control all the Creeps and PowerCreeps and Responsible for the exchange of information between "Storage" and "Run" Unit.
 */

declare class CTaskCoreUnit {
	storage: CTaskStorageUnit;
	run: CTaskRunUnit;
	/** These instructions belong to "simple" ones. */
	instructions: {
		/** When adding Task, the first step is to check the existence of task by using Id.*/
		checkTaskExistence: (taskId: taskId) => boolean;
		/**
		 * Some Advanced Tasks will be issued through this method dynamically.
		 * Add Task here also has the responsibility of distributing tasks whose identities are expected to be ITaskTypeAcross.
		 * The motivation of this mechanism is that, when constructing these tasks(something like new CTaskBase()), the information
		 * should be compact, which saves duplicate labour and is exactly the purpose of design, especially interface {@link ITaskTypeAcross}.
		 *
		 * For example, assume I have a task, harvesting deposite at some room, to be received by 3 rooms, if these receiving rooms
		 * are supposed to be defined at constructing tasks, at _addTask, the program needs to call _addTask three times, namely:
		 * _addTask(true,task,home_1); _addTask(true,task,home_2); _addTask(true,task,home_3), which is ugly and the information stored
		 * in ITaskTypeAcross will be meaningless!
		 * However, if _addTask bears this responsibility, _addTask will be called only once and the information of ITaskTypeAcross will
		 * be useful.
		 * Even though this adds some couple to working, it helps clean the code much and represents my idea of design: abstract -> concrete.
		 *
		 * @param checkedExistence This parameter is useless in running program, but its only purpose is to remind programmer to check
		 * the existence of task before adding.
		 */
		addTask: (checkedExistence: true, task: CTaskBase, settings?: { silence: boolean }) => boolean;
		/**
		 * Assigning Task to Creeps | PowerCreeps require they do not have any task in hand.
		 * @param excludeFromIdle Remind programmer to first exclude these subjects from IdleCreepTree.
		 * @returns true, all successful | false, something goes wrong.
		 */
		assignTask: (excludeFromIdle: true, subject_s: Array<Creep | PowerCreep>, taskId: string) => boolean;
		/**
		 * Clear Task should accept parameters of "clearTasks" | "clearBasicTasks" of the Storage Unit.
		 */
		clearTasks: { (category: TTaskCategory, path: string[]): boolean; (home: string, taskType: BasicTaskType, subTaskType?: string | undefined): boolean; };
		/** This requires the subject does not have task in hand. */
		getTask: (notInIdle: true, subject: Creep | PowerCreep) => boolean;
		/**
		 * Run Task should accept parameters of "runTasks" | "runBasicTasks" of the Run Unit.
		 * @param path The first parameter must be home.
		 */
		runTasks: { (category: TTaskCategory, path: string[], settings?: { runAll: boolean; }): boolean; (home: string, taskType: BasicTaskType, subTaskType?: string | undefined): boolean; };
	}
	_checkTaskExistence: (taskId: taskId) => boolean;
	_addTask: (checkedExistence: true, task: CTaskBase, settings?: { silence: boolean }) => boolean;
	_assignTask: (excludeFromIdle: true, subject_s: Array<Creep | PowerCreep>, taskId: string) => boolean;
	_clearTasks: { (category: TTaskCategory, path: string[]): boolean; (home: string, taskType: BasicTaskType, subTaskType?: string | undefined): boolean; };
	_reThrustTask: (subject: Creep | PowerCreep, task: CTaskBase) => boolean;
	_getTask: (notInIdle: true, subject: Creep | PowerCreep) => boolean;
	_runTasks: { (category: TTaskCategory, path: string[], settings?: { runAll: boolean; }): boolean; (home: string, taskType: BasicTaskType, subTaskType?: string | undefined): boolean; };
}

/**
 * The Control Unit.
 * Its main task is to issue tasks and control the running of tasks.
 * Instruction of Control Unit consists of "run()", called during the loop, and other methods, called during the compilation.
 */

/** TreeLevel should be descending. Its structure should bear the feature: subNode must be a key of parent node. */
declare class TreeLevel extends TreeObject<number> {
	getLastFromPath: (path: Array<string>) => number | undefined;
	accumulateThroughPath: (path: Array<string>) => number | undefined;
}

/**
 * Calling Order: Adjust -> Issue -> Run(Record).
 */
declare class CTaskControlUnit {
	/**
	 * Record will be called while executing other units.
	 *
	 * Current Optimization:
	 * - Prevent Tasks Prevented from Execution from being Issued.
	 *   Record for each room, for each taskType(->subTaskType), their call times, including success(+1) and failure(-1).
	 *   Based on this information, it records at some interval for each room->taskType(->subTaskType) the times that they are lower than one(+1)
	 *   (greater than one will compensate for it(-1), but will not make the total times lower than 0).
	 *   Based on this information, the {@link Controller.Issue} will cut the issue of tasks, which were prevented from execution for many times to
	 *   save extra CPU consumption.
	 */
	Record: {
		/** Here should include all the Indexs. */
		data: {
			[index: string]: TreeObject<any>;
		}
		settings: {
			/** After Such Interval, all the Data will be wiped out. */
			record_interval: number;
			last_record_tick: number;
		}
		instructions: {
			addRecord: (index: string, path: Array<string>, key: string, record: any) => boolean;
			getRecord: (index: string, path: Array<string>, key: string) => any | undefined;
			delRecord: (index: string, path: Array<string>, key: string) => boolean;
		}
	}
	/**
	 * Adjust directly acts upon the 'setting' of other units.
	 */
	Adjust: {
		data: {
			adjustLevelFuncs: Array<(roomName: string, current: TreeLevel) => boolean>;
		}
		settings: {
			adjust_interval: number;
			last_adjust_tick: number;
		}
		instructions: {
			run: () => boolean;
			analyseRecord: () => boolean;
			adjustSwitch: () => boolean;
			adjustLevel: () => boolean;
			addToAdjustLevelFuncs: (func: (roomName: string, current: TreeLevel) => boolean) => boolean;
		}
	}
	Issue: {
		data: {
			timer: { [tick: number]: { func: (...args: any[]) => any; params: Array<any>; }[]; }
			/** This is only intended for Basic Task, which should be scanned at every tick and never be stopped. */
			list: Array<CTaskIssueListPiece<Room | Structure | Source | Mineral | Flag>>;
			watcher: { [event: string]: Array<(roomName: string, event: EventItem) => any>; };
		}
		settings: {
			switch: {
				timer: boolean;
				list: boolean;
				watcher: boolean;
			}
		}
		instructions: {
			run: () => boolean;
			/** These instructions are called outside the loop. */
			addToTimer: (tick: number, func: (...args: any[]) => any, params: Array<any>) => boolean;
			addToList: (item: CTaskIssueListPiece<Room | Structure | Source | Mineral | Flag>) => boolean;
			addToWatcher: (event: EventConstant, func: (roomName: string, event: EventItem) => any) => boolean;
		}
	}
	Run: {
		data: {
			/** While running the scheduled task, it should also be noticed that it could be stopped by level. */
			scheduler: { [interval: number]: Array<TAdvancedTaskType> };
		}
		settings: {
			switch: {
				scheduler: boolean;
			}
			level: {
				/**
				 * current Should be dynamic standard for running for different room, having the structure [roomName][taskType][subTaskType].
				 * Structure:
				 * path		  -> path		-> key
				 * roomName_1 -> taskType_1 -> subTaskType_1
				 * 							-> subTaskType_2
				 * 							-> ...
				 * 			  -> taskType_2 -> subTaskType_1
				 * 							-> ...
				 * 			  -> ...
				 * roomName_2 -> ...
				 * ...
				 *
				 * Value at roomName displays its current Maximum Priority.
				 * Value at other nodes displays the modification.
				 */
				current: TreeLevel;
				/**
				 * statistic Should be a universal standard for running, having the structure [taskType][subTaskType].
				 * Structure:
				 * path		  -> key
				 * taskType_1 -> subTaskType_1
				 * 			  -> subTaskType_2
				 * 			  -> ...
				 * taskType_2 -> ...
				 * ...
				 *
				 * Value at taskType displays the priority of this kind of task.
				 * Value at subTaskType displays the modification of priority of this kind of task.
				 */
				statistic: TreeLevel;
			}
		}
		instructions: {
			/** Run the Scheduler and All registered Tasks based on the situation of Level. */
			run: () => boolean;
			/** These instructions are called outside the loop. */
			addToScheduler: (item: TAdvancedTaskType) => boolean;
		}
	}
	run: () => boolean;
	_RecordPreCheck: () => boolean;
	_RecordAddRecord: (index: string, path: Array<string>, key: string, record: any) => boolean;
	_RecordGetRecord: (index: string, path: Array<string>, key: string) => any | undefined;
	_RecordDelRecord: (index: string, path: Array<string>, key: string) => boolean;
	_IssueAddToTimer: (tick: number, func: (...args: any[]) => any, params: Array<any>) => boolean;
	_IssueAddToList: (item: CTaskIssueListPiece<Room | Structure | Source | Mineral | Flag>) => boolean;
	_IssueAddToWatcher: (event: EventConstant, func: (roomName: string, event: EventItem) => any) => boolean;
	_RunAddToScheduler: (item: TAdvancedTaskType) => boolean;
	/** @param criterion only will preNumber satisfying this criterion be modified. */
	_RecordNumberModify: (index: string, path: string[], key: string, modify: number, criterion?: (preNumber: number) => boolean) => boolean;
	_RunRun: () => boolean;
	_IssueRun: () => boolean;
	_AdjustRun: () => boolean;
	/** @todo */
	_AdjustSwitch: () => boolean;
	_AdjustLevel: () => boolean;
	_AdjustAnalyseRecord: () => boolean;
	_AdjustAddToAdjustLevelFuncs: (func: (roomName: string, current: TreeLevel) => boolean) => boolean;
}

interface CTaskIssueListPiece<T> {
	/** Information about what kind of task it is going to issue. It will be used to prevent some useless tasks. */
	identity: {
		taskType: BasicTaskType | MediumTaskType;
		subTaskType: string;
		triggerToOrigin: boolean;
	}
	subjects: Array<T> | { [propName: string]: T };
	condition: (subject: T) => boolean;
	/**
	 * @returns "duplicate" indicates task exists.
	 */
	triggered: (subject: T) => { tasks: CTaskBase[], silences: boolean[], checkedDuplicate: true };
}

declare class CTaskLoadUnit {
	instructions: {
		registerCreep: (subject: Creep | PowerCreep) => boolean;
		unRegisterCreep: (memory: CreepMemory) => boolean;
	}
	_registerCreep: (subject: Creep | PowerCreep) => boolean;
	_unRegisterCreep: (memory: CreepMemory) => boolean;
	/** Run should be called after issuing task. Register all the creeps and Try to get the task. */
	run: () => boolean;
}
