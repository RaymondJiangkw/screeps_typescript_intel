import { hashObj, alphaLowerUpper, adjacentRooms, accumulateObj } from "utils/utils"
import { TreeArray, TreeObject, TREE_VALUE_VARIABLE_NAME } from "dataStructure"
/**
 *
 * @param salt The reason behind setting this parameter is that sometimes I need to issue
 * multiple identical tasks. But I calculate an unique fingerprint for each task in
 * order to avoid potential unexpected redundant duplicate tasks. So, in order to keep
 * redundant-avoid mechanism working and preserve the ability to issue identical task,
 * I introduce the "salt", which will be added when computing to generate different
 * fingerprint for identical task. Just like adding "Salt" to the "Soup".
 *
 * The Inspiration is from the Theory of Cryptography.
 * @param omit_hash This list contains the names of properties which should not be calculated while hashing, no matter what kind of object it is in.
 */
export function getTaskId(salt: number, data: { [propName: string]: any }, omit_hash: string[]) {
	return hashObj(salt, data, omit_hash);
}
function getTaskCategory(task: CTaskBase): TTaskCategory;
function getTaskCategory(taskType: BasicTaskType | MediumTaskType): TTaskCategory;
function getTaskCategory(task_or_taskType: CTaskBase | (BasicTaskType | MediumTaskType)): TTaskCategory {
	if (typeof (task_or_taskType) === "string") return alphaLowerUpper(task_or_taskType, 0) === "lower" ? "basic" : "medium";
	else return alphaLowerUpper(task_or_taskType.identity.taskType, 0) === "lower" ? "basic" : "medium";
}
/**
 * This function will only check whether the result of modification makes the number less than 0, excluding bigger than maximum, which is promised by the logic.
 */
function adjustReceivedStatus(receivedStatus: receivedInformation, role: CreepRole, modify: number): boolean {
	if (receivedStatus[role]) {
		if (receivedStatus[role] + modify >= 0) {
			receivedStatus[role] += modify;
			return true;
		} else return false;
	} else {
		if (receivedStatus["any"] + modify >= 0) {
			receivedStatus["any"] += modify;
			return true;
		} else return false;
	}
}

function isReceivedValid(leftReceived: receivedInformation, role: CreepRole): boolean {
	if (leftReceived[role]) return leftReceived[role] > 0;
	else return leftReceived["any"] > 0;
}

function constructReceivedInformation(receivedInfo: receivedInformation, fillUp?: number) {
	const ret: receivedInformation = { "any": 0 };
	for (const role in receivedInfo) ret[role] = fillUp ? fillUp : receivedInfo[role];
	return ret;
}

function collectReceivedInformation(receivedInfo: receivedInformation, roomName: string) {
	for (const role in receivedInfo) {
		if (role === "any") continue;
		global.spawnSystem.Processor.instructions.modifyExpectedCreeps(roomName, role as CreepRole, receivedInfo[role]);
	}
}

/**
 * The priority of task to run will be evaluated by {@link CTaskControlUnit}. The priority of task to be received will
 * be evaluated by {@link Creep.acceptTasks}.
 */
export abstract class CTaskBase {
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
	constructor(id: string, identity: TBasicTaskType | TMediumTaskType, data: { [propName: string]: any }, funcs: { run: (creeps?: Array<Creep | PowerCreep>) => TASK_CODE[], taskCallback?: TTaskCallback, taskEarlyTerminate?: (subject: Creep | PowerCreep, attachedRoom: string) => boolean }, settings = { maxReceived: { "any": 1 } }, options = {}) {
		_.defaults(settings, { maxReceived: { "any": 1 } });
		this.id = id;
		this.identity = identity;
		this.data = data;
		this.settings = {
			received: {
				max: constructReceivedInformation(settings.maxReceived),
				current: constructReceivedInformation(settings.maxReceived, 0),
				left: settings.maxReceived
			}
		}
		this.options = options;
		this.run = funcs.run;
		this.taskCallback = funcs.taskCallback;
		this.taskEarlyTerminate = funcs.taskEarlyTerminate;
		this.targetRoom = (this.identity as ITaskTypeAttached<any, any>).home ? (this.identity as ITaskTypeAttached<any, any>).home : (this.identity as ITaskTypeAcross<any, any>).targetRoom;
	}
}

class taskIdTree extends TreeArray<taskId> {
	/** This function does filter out those received tasks in fact. */
	_popOneFromArray(taskIds: Array<taskId>, role: CreepRole): taskId | undefined {
		for (let i = taskIds.length - 1; i >= 0; i--) {
			if (isReceivedValid(global.taskSystem.Memory.WareHouse[taskIds[i]].settings.received.left, role)) {
				if (i === taskIds.length - 1) return taskIds.pop();
				else return taskIds.splice(i, 1)[0];
			}
		}
		return undefined;
	}
	/**
	 * This function will get one task under specified node.
	 * It is often used to get a task with specific "taskType" regardless of "subTaskType".
	 */
	popAnyFromNode(path: Array<string>, role: CreepRole): taskId | undefined {
		let node = this._extractNode(path);
		if (node === undefined) return undefined;
		const extractOne = (n: ITreeStructure<Array<taskId>>): taskId | undefined => {
			if (n["mount_value_of_node"]) {
				let taskId = this._popOneFromArray(n['mount_value_of_node'], role);
				if (taskId) return taskId;
			}
			let subNodes = this._nextNodes(n);
			if (!subNodes) return undefined;
			for (let subNode of subNodes) {
				let ret = extractOne(subNode);
				if (ret) return ret;
			}
			return undefined;
		};
		return extractOne(node);
	}
	popOneFromLeaf(path: Array<string>, role: CreepRole): taskId | undefined {
		let taskIds = this.getAllFromLeaf(path);
		return this._popOneFromArray(taskIds, role);
	}
	clearAllFromNode(path: Array<string>): boolean {
		let node = this._extractNode(path);
		if (node === undefined) return false;
		// In this process, "mount_value_of_node" is also deleted, even though the name of interator variable is "subNode".
		for (let subNode in node) delete node[subNode];
		return true;
	}
}
class registeredTaskIdTree extends TreeArray<taskId> {
	/**
	 * When it comes to the running of task, we need to get all the tasks registered under one node.
	 * Thus, original "add->get->pop" Stack Model does not satisfy our needs.
	 */
	getAllFromNode(path: Array<string>): Array<taskId> {
		let node = this._extractNode(path);
		if (node === undefined) return [];
		let ret: Array<taskId> = [];
		const extractAll = (n: ITreeStructure<Array<taskId>>): void => {
			if (n["mount_value_of_node"]) ret = ret.concat(n["mount_value_of_node"]);
			let subNodes = this._nextNodes(n);
			if (!subNodes) return;
			for (let subNode of subNodes) extractAll(subNode);
			return;
		};
		extractAll(node);
		return ret;
	}
}

/**
 * The Storage Unit of Task System.
 * Its main function is to manipulate the "add", "del", "get", "refresh"(automatic when get) behaviors of task pieces.
 * It acts upon the level of TaskPiece.
 */
class CTaskStorageUnit {
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
	addTaskId(category: TTaskCategory, taskId: taskId, path: Array<string>): boolean {
		return this._taskPool[category].pushToLeaf(taskId, path);
	}
	/** This code provides convenience, but consumes extra time. */
	addBasicTaskId(taskId: taskId, home: string): boolean {
		const task = global.taskSystem.Memory.WareHouse[taskId];
		return this.addTaskId("basic", taskId, [home, task.identity.taskType, task.identity.subTaskType]);
	}
	popTaskId(category: TTaskCategory, path: Array<string>, role: CreepRole): taskId | undefined {
		return this._taskPool[category].popOneFromLeaf(path, role);
	}
	popAnyTaskId(category: TTaskCategory, path: Array<string>, role: CreepRole): taskId | undefined {
		return this._taskPool[category].popAnyFromNode(path, role);
	}
	clearTaskIds(category: TTaskCategory, path: Array<string>): boolean {
		return this._taskPool[category].clearLeaf(path);
	}
	clearBasicTaskIds(home: string, taskType: BasicTaskType, subTaskType?: string | undefined): boolean {
		if (subTaskType === undefined) return this._taskPool["basic"].clearAllFromNode([home, taskType]);
		else return this._taskPool["basic"].clearAllFromNode([home, taskType, subTaskType]);
	}
	constructor() {
		this._taskPool = {
			basic: new taskIdTree(),
			medium: new taskIdTree()
		}
	}
}

/**
 * The Run Unit of Task System.
 * Its main function is to run tasks, which means that it does not care about the time. You give the order and it runs.
 */
class CTaskRunUnit {
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
	addRegTaskId(category: TTaskCategory, taskId: taskId, path: Array<string>): boolean {
		return this._registeredTasks[category].pushToLeaf(taskId, path);
	}
	/** This code provides convenience, but consumes extra time. */
	addRegBasicTaskId(taskId: taskId, home: string): boolean {
		const task = global.taskSystem.Memory.WareHouse[taskId];
		return this._registeredTasks["basic"].pushToLeaf(taskId, [home, task.identity.taskType, task.identity.subTaskType]);
	}
	assignRegTaskIds(category: TTaskCategory, taskIds: taskId[], path: Array<string>): boolean {
		return this._registeredTasks[category].assignToLeaf(taskIds, path);
	}
	/**
	 * @param settings.runAll Whether to run all the tasks under this node.
	 * @returns For each task, return its id and corresponding returned TASK_CODE for each creep.
	 */
	runTasks(category: TTaskCategory, path: Array<string>, settings = { runAll: false }): { taskId: taskId, ret: TASK_CODE[] }[] {
		_.defaults(settings, { runAll: false });
		const taskArray = settings.runAll === true ? this._registeredTasks[category].getAllFromNode(path) : this._registeredTasks[category].getAllFromLeaf(path);
		if (!taskArray) return [];
		let ret: { taskId: taskId, ret: TASK_CODE[] }[] = [];
		taskArray.forEach((taskId: taskId) => {
			const task = global.taskSystem.Memory.WareHouse[taskId];
			const workers = global.taskSystem.Memory.Roll[taskId];
			const ret_task_code = task.run(workers);
			ret.push({ taskId: taskId, ret: ret_task_code });
		});
		return ret;
	}
	/**
	 * "runBasicTasks" allows "subTaskType"-the third filter key- to be undefined, which means that
	 * all the tasks of leaves under the node "taskType" will be executed.
	 */
	runBasicTasks(home: string, taskType: BasicTaskType, subTaskType?: string | undefined): { taskId: taskId, ret: TASK_CODE[] }[] {
		if (subTaskType === undefined) return this.runTasks("basic", [home, taskType], { runAll: true });
		else return this.runTasks("basic", [home, taskType, subTaskType]);
	}
	clearTasks(category: TTaskCategory, path: Array<string>, settings = { clearAll: false }): boolean {
		_.defaults(settings, { clearAll: false });
		return this._registeredTasks[category].clearLeaf(path, settings);
	}
	constructor() {
		this._registeredTasks = {
			basic: new registeredTaskIdTree(),
			medium: new registeredTaskIdTree()
		}
	}
}

/**
 * The Core Unit of Task System.
 * Directly control all the Creeps and PowerCreeps and Responsible for the exchange of information between "Storage" and "Run" Unit.
 */

export class CTaskCoreUnit {
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
		 * Also, notice that whenever maxReceivedNum is reached, 'Assign' will fail.
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
	_checkTaskExistence(taskId: taskId): boolean {
		if (global.taskSystem.Memory.WareHouse[taskId]) return true;
		else return false;
	}
	/**
	 * @param settings.silence This will make task not added to the taskPool and its requiring creep roles will not be collected.
	 */
	_addTask(checkedExistence: true, task: CTaskBase, settings = { silence: false }): boolean {
		_.defaults(settings, { silence: false });
		global.taskSystem.Memory.WareHouse[task.id] = task;
		if (!settings.silence) {
			const category: TTaskCategory = getTaskCategory(task);
			// Since 'task' belongs to CTaskBase, which only accepts "basic" or "medium" tasks that have specific
			// room to mount, the structure of storing these tasks must have node "roomName".
			if ((task.identity as ITaskTypeAttached<any, any>).home) {
				this.storage.addTaskId(category, task.id, [(task.identity as ITaskTypeAttached<any, any>).home, task.identity.taskType, task.identity.subTaskType]);
				collectReceivedInformation(task.settings.received.max, (task.identity as ITaskTypeAttached<any, any>).home);
			} else if ((task.identity as ITaskTypeAcross<any, any>).targetRoom) {
				const identity = task.identity as ITaskTypeAcross<any, any>;
				const receivingRooms = adjacentRooms(identity.targetRoom, identity.maxRange, identity.maxReceivedRooms);
				for (let roomName of receivingRooms) {
					this.storage.addTaskId(category, task.id, [roomName, task.identity.taskType, task.identity.subTaskType]);
					collectReceivedInformation(task.settings.received.max, roomName);
				}
			}
		}
		if (task.taskCallback) {
			const rets = task.taskCallback();
			for (let i = 0; i < rets.tasks.length; i++) this._addTask(true, rets.tasks[i], { silence: rets.silences[i] });
		}
		return true;
	}
	/** This function will make some data redundant, thus affecting the efficiency. */
	_assignTask(excludeFromIdle: true, subject_s: Array<Creep | PowerCreep>, taskId: string): boolean {
		let ret = true;
		if (!global.taskSystem.Memory.Roll[taskId]) global.taskSystem.Memory.Roll[taskId] = [];
		const task = global.taskSystem.Memory.WareHouse[taskId];
		for (let subject of subject_s) {
			if (accumulateObj(task.settings.received.left) === 0) break;
			if (!subject.memory.taskId) {
				if (adjustReceivedStatus(task.settings.received.left, subject.memory.role, -1)) {
					subject.memory.taskId = taskId;
					global.taskSystem.Memory.Roll[taskId].push(subject);
					adjustReceivedStatus(task.settings.received.current, subject.memory.role, 1);
				} else ret = false;
			} else ret = false;
		}
		return ret;
	}
	_clearTasks(category: TTaskCategory, path: Array<string>): boolean;
	_clearTasks(home: string, taskType: BasicTaskType, subTaskType?: string | undefined): boolean;
	_clearTasks(category_or_home: TTaskCategory | string, path_or_taskType: Array<string> | BasicTaskType, subTaskType?: string | undefined): boolean {
		if (Array.isArray(path_or_taskType)) { // Overload 1
			return this.storage.clearTaskIds(category_or_home as TTaskCategory, path_or_taskType);
		} else { // Overload 2
			return this.storage.clearBasicTaskIds(category_or_home as string, path_or_taskType as BasicTaskType, subTaskType);
		}
	}
	_reThrustTask(subject: Creep | PowerCreep, task: CTaskBase): boolean {
		const category = getTaskCategory(task);
		this.storage.addTaskId(category, task.id, [subject.memory.home, task.identity.taskType, task.identity.subTaskType]);
		return true;
	}
	_getTask(notInIdle: true, subject: Creep | PowerCreep): boolean {
		if (subject.memory.taskId) return false;
		const taskType_subTaskTypes = subject.acceptTasks();
		let taskId: taskId | undefined;
		for (let taskType_subTaskType of taskType_subTaskTypes) {
			if (taskType_subTaskType.length === 2) { // category, taskType.
				taskId = this.storage.popAnyTaskId(taskType_subTaskType[0], [subject.memory.home, taskType_subTaskType[1]], subject.memory.role);
			} else { // category, taskType, subTaskType[]
				for (let subTaskType of taskType_subTaskType[2]) {
					taskId = this.storage.popTaskId(taskType_subTaskType[0], [subject.memory.home, taskType_subTaskType[1], subTaskType], subject.memory.role);
					// Find first appropriate.
					if (taskId) break;
				}
			}
			// Find first appropriate.
			if (taskId) break;
		}
		if (taskId) {
			// Adjust Creep
			subject.memory.taskId = taskId;

			const task = global.taskSystem.Memory.WareHouse[taskId];
			const pre_current = accumulateObj(task.settings.received.current);
			// Adjust Task
			// register creep
			if (!global.taskSystem.Memory.Roll[taskId]) global.taskSystem.Memory.Roll[taskId] = [];
			global.taskSystem.Memory.Roll[taskId].push(subject);
			// change received status
			adjustReceivedStatus(task.settings.received.left, subject.memory.role, -1);
			adjustReceivedStatus(task.settings.received.current, subject.memory.role, 1);
			// this.storage
			if (accumulateObj(task.settings.received.left) > 0) this._reThrustTask(subject, task);
			// this.run
			if (pre_current === 0) this.run.addRegTaskId(getTaskCategory(task), task.id, [subject.memory.home, task.identity.taskType, task.identity.subTaskType]);
			return true;
		}
		return false;
	}
	_runTasks(category: TTaskCategory, path: Array<string>, settings?: { runAll: boolean }): boolean;
	_runTasks(home: string, taskType: BasicTaskType, subTaskType?: string | undefined): boolean;
	_runTasks(category_or_home: TTaskCategory | string, path_or_taskType: Array<string> | BasicTaskType, settings_subTaskType?: { runAll: boolean } | string | undefined): boolean {
		let ret: { taskId: taskId, ret: TASK_CODE[] }[] | undefined;
		let home: string | undefined;
		// Run the tasks and Receive feedback
		if (Array.isArray(path_or_taskType)) { // Road 1
			if (!path_or_taskType[0]) return false;
			home = path_or_taskType[0];
			_.defaults(settings_subTaskType as { runAll: boolean }, { runAll: false });
			ret = this.run.runTasks(category_or_home as TTaskCategory, path_or_taskType as string[], settings_subTaskType as { runAll: boolean });
			this.run.clearTasks(category_or_home as TTaskCategory, path_or_taskType as Array<string>, { clearAll: (settings_subTaskType as { runAll: boolean }).runAll });
		} else { // Road 2
			home = category_or_home as string;
			ret = this.run.runBasicTasks(category_or_home as string, path_or_taskType as BasicTaskType, settings_subTaskType as string | undefined);
			if (settings_subTaskType) this.run.clearTasks("basic", [category_or_home as string, path_or_taskType as BasicTaskType, settings_subTaskType as string]);
			else this.run.clearTasks("basic", [category_or_home as string, path_or_taskType as BasicTaskType], { clearAll: true });
		}
		// Deal with response of each task
		for (let retInfo of ret) {
			const creeps = global.taskSystem.Memory.Roll[retInfo.taskId]; // Creeps, which have just run the task.
			const task = global.taskSystem.Memory.WareHouse[retInfo.taskId]; // Task.
			const rest_creeps: Array<Creep | PowerCreep> = []; // Still working Creeps, valid in this task.
			const pre_left: number = accumulateObj(task.settings.received.left); // Original left number, used for rethrusting.
			let hasDelete: boolean = false;
			for (let i = 0; i < retInfo.ret.length; i++) {
				let retCode = retInfo.ret[i]; // Return Code for creeps[i] of this task.
				if (task.taskEarlyTerminate && task.taskEarlyTerminate(creeps[i], home)) {
					creeps[i].memory.earlyTerminateTasks.push([task.identity.taskType, task.identity.subTaskType]);
					if (retCode === OK) retCode = TASK_RENEW;
				}
				switch (retCode) {
					case OK: // In this case, Creep should still be in the Roll.
						rest_creeps.push(creeps[i]);
						break;
					default: // Not OK, Clear Creep's Memory, and Push Creep back to Idle Tree for future receiving.
						creeps[i].memory.taskId = null;
						creeps[i].memory.working = false;
						global.taskSystem.Loader.instructions.registerCreep(creeps[i]);
					case TASK_DELETE: // If there is one TASK_DELETE in responses, this task will never be rethrusted into 'storage' unit.
						hasDelete = true;
					case TASK_FINISH: // 'left' remains still, while 'current' changes.
						adjustReceivedStatus(task.settings.received.current, creeps[i].memory.role, -1);
						break;
					case TASK_RENEW: // 'left' and 'current' change.
						adjustReceivedStatus(task.settings.received.current, creeps[i].memory.role, -1);
						adjustReceivedStatus(task.settings.received.left, creeps[i].memory.role, 1);
						break;
				}
			}
			/** @debug */
			// assert(rest_creeps.length === accumulateObj(task.settings.received.current));

			// global.taskSystem.Memory.WareHouse
			// Potential Change: Delete (condition: not useful: no creeps working and no potential creeps to work)
			if (rest_creeps.length === 0 && accumulateObj(task.settings.received.left) === 0) delete global.taskSystem.Memory.WareHouse[task.id];
			// global.taskSystem.Memory.Roll
			// Potential Change: Update working creeps list
			if (rest_creeps.length === 0) delete global.taskSystem.Memory.Roll[task.id];
			else global.taskSystem.Memory.Roll[task.id] = rest_creeps;
			// this.run
			// Potential Change: If there are still creeps working, this task should still be registered.
			if (rest_creeps.length > 0) this.run.addRegTaskId(getTaskCategory(task), task.id, [home, task.identity.taskType, task.identity.subTaskType]);
			// this.storage
			// Potential Change: Original completely received tasks could have room for being received after operation.
			if (!hasDelete) {
				if (pre_left === 0 && accumulateObj(task.settings.received.left) > 0) this.storage.addTaskId(getTaskCategory(task), task.id, [home, task.identity.taskType, task.identity.subTaskType]);
			}
		}
		return true;
	}
	constructor() {
		this.storage = new CTaskStorageUnit();
		this.run = new CTaskRunUnit();
		this.instructions = {
			checkTaskExistence: this._checkTaskExistence,
			addTask: this._addTask,
			assignTask: this._assignTask,
			clearTasks: this._clearTasks,
			getTask: this._getTask,
			runTasks: this._runTasks
		}
	}
}

/** TreeLevel should be descending. Its structure should bear the feature: subNode must be a key of parent node. */
export class TreeLevel extends TreeObject<number> {
	getLastFromPath(path: Array<string>): number | undefined {
		let node: ITreeStructure<{ [propName: string]: number | undefined }> = this._tree;
		let value_in_path: Array<number> = [];
		for (let key of path) {
			if (key === TREE_VALUE_VARIABLE_NAME) return undefined;
			if (node["mount_value_of_node"] && node["mount_value_of_node"][key]) value_in_path.push(node["mount_value_of_node"][key] as number);
			if (!node[key]) break;
			node = node[key] as ITreeStructure<{ [propName: string]: number | undefined }>;
		}
		return value_in_path[value_in_path.length - 1];
	}
	accumulateThroughPath(path: Array<string>): number | undefined {
		let node: ITreeStructure<{ [propName: string]: number | undefined }> = this._tree;
		let value_in_path: Array<number> = [];
		for (let key of path) {
			if (key === TREE_VALUE_VARIABLE_NAME) return undefined;
			if (node["mount_value_of_node"] && node["mount_value_of_node"][key]) value_in_path.push(node["mount_value_of_node"][key] as number);
			if (!node[key]) break;
			node = node[key] as ITreeStructure<{ [propName: string]: number | undefined }>;
		}
		return _.sum(value_in_path);
	}
}

/** Calling Order: Adjust -> Issue -> Run(Record). */
export class CTaskControlUnit {
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
			/** These instructions should be called outside the loop. */
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
			/** Iterate Idle Creeps to get Task and Run the Scheduler and All registered Tasks based on the situation of Level. */
			run: () => boolean;
			/** These instructions are called outside the loop. */
			addToScheduler: (item: TAdvancedTaskType) => boolean;
		}
	}
	run(): boolean {
		this.Adjust.instructions.run();
		this.Issue.instructions.run();
		global.taskSystem.Loader.run();
		this.Run.instructions.run();
		return true;
	}
	_RecordPreCheck(): boolean {
		if (Game.time - this.Record.settings.last_record_tick >= this.Record.settings.record_interval) {
			this.Record.settings.last_record_tick = Game.time;
			for (const index in this.Record.data) delete this.Record.data[index];
			return true;
		}
		return false;
	}
	_RecordAddRecord(index: string, path: Array<string>, key: string, record: any): boolean {
		this._RecordPreCheck();
		if (!this.Record.data[index]) this.Record.data[index] = new TreeObject<any>();
		return this.Record.data[index].addToLeaf(record, path, key);
	}
	_RecordGetRecord(index: string, path: Array<string>, key: string): any | undefined {
		this._RecordPreCheck();
		if (!this.Record.data[index]) return undefined;
		return this.Record.data[index].getFromLeaf(path, key);
	}
	_RecordDelRecord(index: string, path: Array<string>, key: string): boolean {
		this._RecordPreCheck();
		if (!this.Record.data[index]) return false;
		return this.Record.data[index].delFromLeaf(path, key);
	}
	_IssueAddToTimer(tick: number, func: (...args: any[]) => any, params: Array<any>): boolean {
		if (tick <= Game.time) return false;
		if (!this.Issue.data.timer[tick]) this.Issue.data.timer[tick] = [];
		this.Issue.data.timer[tick].push({ "func": func, "params": params });
		return true;
	}
	_IssueAddToList(item: CTaskIssueListPiece<Room | Structure | Source | Mineral | Flag>): boolean {
		this.Issue.data.list.push(item);
		return true;
	}
	_IssueAddToWatcher(event: EventConstant, func: (roomName: string, event: EventItem) => any): boolean {
		if (!this.Issue.data.watcher[event]) this.Issue.data.watcher[event] = [];
		this.Issue.data.watcher[event].push(func);
		return true;
	}
	_RunAddToScheduler(item: TAdvancedTaskType): boolean {
		if (!this.Run.data.scheduler[item.interval]) this.Run.data.scheduler[item.interval] = [];
		this.Run.data.scheduler[item.interval].push(item);
		return true;
	}
	/** @param criterion only will preNumber satisfying this criterion be modified. */
	_RecordNumberModify(index: string, path: string[], key: string, modify: number, criterion?: (preNumber: number) => boolean): boolean {
		const preNumber = this.Record.instructions.getRecord(index, path, key) as number | undefined || 0;
		if (criterion && !criterion(preNumber)) return false;
		this.Record.instructions.addRecord(index, path, key, preNumber + modify);
		return true;
	}
	_RunRun(): boolean {
		const Processor = global.taskSystem.Processor;
		const controlledRooms = global.infoSystem.Memory.Rooms.my;
		const staticLevel = this.Run.settings.level.statistic;
		const roomLevel = this.Run.settings.level.current;
		// Get available taskType and its corresponding subTaskType from staticLevel.
		const taskTypes: (BasicTaskType | MediumTaskType)[] = staticLevel.keys([]) as (BasicTaskType | MediumTaskType)[];
		const subTaskTypes: { [propName: string]: string[] } = {};
		_.forEach(taskTypes, (taskType: BasicTaskType | MediumTaskType) => subTaskTypes[taskType] = staticLevel.keys([taskType]));
		// Room -> taskType -> subTaskType
		for (const roomName of controlledRooms) {
			const maximum_priority: number = roomLevel.getFromLeaf([], roomName) || Infinity;
			for (const taskType of taskTypes) {
				const priority = staticLevel.getFromLeaf([], taskType) as number + (roomLevel.getFromLeaf([roomName], taskType) ? roomLevel.getFromLeaf([roomName], taskType) as number : 0);
				if (maximum_priority >= priority) {
					Processor.instructions.runTasks(getTaskCategory(taskType), [roomName, taskType], { runAll: true });
					// Add Record
					this._RecordNumberModify("call", [roomName], taskType, 1);
				} else {
					this._RecordNumberModify("call", [roomName], taskType, -1);
					for (const subTaskType of subTaskTypes[taskType]) {
						const sub_priority = priority + (staticLevel.getFromLeaf([taskType], subTaskType) as number) + (roomLevel.getFromLeaf([roomName, taskType], subTaskType) ? roomLevel.getFromLeaf([roomName, taskType], subTaskType) as number : 0);
						if (maximum_priority >= sub_priority) {
							Processor.instructions.runTasks(getTaskCategory(taskType), [roomName, taskType, subTaskType], { runAll: false });
							this._RecordNumberModify("call", [roomName, taskType], subTaskType, 1);
						} else {
							this._RecordNumberModify("call", [roomName, taskType], subTaskType, -1);
						}
					}
				}
			}
		}
		return true;
	}
	_IssueRun(): boolean {
		/**
		 * Every Tick Scan List
		 *
		 * Current Optimization:
		 * - Use the "invalid_call" information in Record */
		if (this.Issue.settings.switch.list) {
			for (let _ of this.Issue.data.list) {
				const genericCall = (subject: Room | Structure<StructureConstant> | Source | Mineral<MineralConstant> | Flag) => {
					// Consider the case that sometimes, the tasks issued are not going to be
					// received by the room where they are, namely ITaskAcross or home is specified
					// into targetRoom in ITaskAttached, the "invalid_call" information of the original
					// room should not be applied to other rooms. Thus, triggerToOrigin is used.
					if (_.identity.triggerToOrigin) {
						// Prevent specific tasks from being issued.
						let roomName: string | undefined;
						if ((subject as Room).name) roomName = (subject as Room).name;
						else roomName = (subject as Structure<StructureConstant> | Source | Mineral<MineralConstant> | Flag).pos.roomName;
						const preventTimes: number = this.Record.instructions.getRecord("invalid_call", [roomName], _.identity.taskType) || 0 + this.Record.instructions.getRecord("invalid_call", [roomName, _.identity.taskType], _.identity.subTaskType) || 0;
						if (preventTimes > 0) return;
					}
					if (_.condition(subject)) {
						const ret = _.triggered(subject);
						for (let i = 0; i < ret.tasks.length; i++) global.taskSystem.Processor.instructions.addTask(true, ret.tasks[i], { silence: ret.silences[i] });
					}
					return;
				}
				if (Array.isArray(_.subjects)) for (const subject of _.subjects) genericCall(subject);
				else for (const key in _.subjects) genericCall(_.subjects[key]);
			}
		}
		// Check Timer
		if (this.Issue.settings.switch.timer) {
			if (this.Issue.data.timer[Game.time]) {
				for (let _ of this.Issue.data.timer[Game.time]) {
					_.func.apply(_.func, _.params);
				}
				delete this.Issue.data.timer[Game.time];
			}
		}
		// Check Watcher
		if (this.Issue.settings.switch.watcher) {
			_.forEach(Game.rooms, room => {
				let eventLog = room.getEventLog();
				for (let event of eventLog) {
					if (this.Issue.data.watcher[event.event]) {
						for (let func of this.Issue.data.watcher[event.event]) func(room.name, event);
					}
				}
			});
		}
		return true;
	}
	_AdjustRun(): boolean {
		let ret: boolean = true;
		ret = ret && this.Adjust.instructions.analyseRecord();
		if (Game.time - this.Adjust.settings.last_adjust_tick >= this.Adjust.settings.adjust_interval) {
			this.Adjust.settings.last_adjust_tick = Game.time;
			ret = ret && this.Adjust.instructions.adjustLevel();
			ret = ret && this.Adjust.instructions.adjustSwitch();
		}
		return ret;
	}
	/** @todo */
	_AdjustSwitch(): boolean {
		return true;
	}
	_AdjustLevel(): boolean {
		const controlledRooms = global.infoSystem.Memory.Rooms.my;
		controlledRooms.forEach((roomName: string) => {
			for (const func of this.Adjust.data.adjustLevelFuncs) func(roomName, this.Run.settings.level.current);
		});
		return true;
	}
	_AdjustAnalyseRecord(): boolean {
		const call = this.Record.data["call"];
		if (call) {
			const recordInvalidCallsForEachRoom = (path: string[]) => {
				const keys = call.keys(path);
				for (const key of keys) {
					const callTimes = call.getFromLeaf(path, key);
					if (callTimes > 0) this._RecordNumberModify('invalid_call', path, key, -1, (n: number) => n > 0);
					else if (callTimes < 0) this._RecordNumberModify("invalid_call", path, key, 1);
					recordInvalidCallsForEachRoom(path.concat(key));
				}
			}
			const roomNames = call.keys([]);
			roomNames.forEach((roomName: string) => recordInvalidCallsForEachRoom([roomName]));
		}
		return true;
	}
	_AdjustAddToAdjustLevelFuncs(func: (roomName: string, current: TreeLevel) => boolean): boolean {
		this.Adjust.data.adjustLevelFuncs.push(func);
		return true;
	}
	constructor(statisticTaskLevel: TreeLevel, parameters = { recordInterval: 1500, adjustInterval: 500, issueSwitch: { timer: true, list: true, watcher: false }, runSwitch: { scheduler: true } }) {
		_.defaults(parameters, { recordInterval: 1500, adjustInterval: 500, issueSwitch: { timer: true, list: true, watcher: false }, runSwitch: { scheduler: true } });
		this.Record = {
			data: {},
			settings: {
				record_interval: parameters.recordInterval,
				last_record_tick: Game.time
			},
			instructions: {
				addRecord: this._RecordAddRecord,
				getRecord: this._RecordGetRecord,
				delRecord: this._RecordDelRecord
			}
		};
		this.Issue = {
			data: {
				timer: {},
				list: [],
				watcher: {}
			},
			settings: {
				switch: {
					timer: parameters.issueSwitch.timer,
					list: parameters.issueSwitch.list,
					watcher: parameters.issueSwitch.watcher
				}
			},
			instructions: {
				addToTimer: this._IssueAddToTimer,
				addToList: this._IssueAddToList,
				addToWatcher: this._IssueAddToWatcher,
				run: this._IssueRun
			}
		};
		this.Run = {
			data: {
				scheduler: {}
			},
			settings: {
				switch: {
					scheduler: parameters.runSwitch.scheduler
				},
				level: {
					current: new TreeLevel(),
					statistic: statisticTaskLevel
				}
			},
			instructions: {
				addToScheduler: this._RunAddToScheduler,
				run: this._RunRun
			}
		}
		this.Adjust = {
			data: {
				adjustLevelFuncs: []
			},
			settings: {
				adjust_interval: parameters.adjustInterval,
				last_adjust_tick: Game.time
			},
			instructions: {
				run: this._AdjustRun,
				adjustSwitch: this._AdjustSwitch,
				adjustLevel: this._AdjustLevel,
				analyseRecord: this._AdjustAnalyseRecord,
				addToAdjustLevelFuncs: this._AdjustAddToAdjustLevelFuncs
			}
		}
	}
}

export class CTaskLoadUnit {
	instructions: {
		registerCreep: (subject: Creep | PowerCreep) => boolean;
		unRegisterCreep: (memory: CreepMemory) => boolean;
	}
	run(): boolean {
		const taskSystemMemory = global.taskSystem.Memory;
		const roomNames = taskSystemMemory.IdleCreeps.subNodes([]);
		for (const roomName of roomNames) {
			const roles = taskSystemMemory.IdleCreeps.subNodes([roomName]);
			for (const role of roles) {
				const idleCreeps = taskSystemMemory.IdleCreeps.getAllFromLeaf([roomName, role]);
				const stillIdleCreeps = [];
				for (const creep of idleCreeps) {
					// Automatically Delete dead Creep from the List
					if (!creep) continue;
					if (creep.memory.taskId && taskSystemMemory.WareHouse[creep.memory.taskId]) {
						if (!taskSystemMemory.Roll[creep.memory.taskId]) taskSystemMemory.Roll[creep.memory.taskId] = [];
						taskSystemMemory.Roll[creep.memory.taskId].push(creep);
					} else creep.memory.taskId = null;
					if (!creep.memory.taskId) {
						if (!global.taskSystem.Processor.instructions.getTask(true, creep)) stillIdleCreeps.push(creep);
					}
				}
				taskSystemMemory.IdleCreeps.assignToLeaf(stillIdleCreeps, [roomName, role]);
			}
		}
		return true;
	}
	_registerCreep(subject: Creep | PowerCreep): boolean {
		return global.taskSystem.Memory.IdleCreeps.pushToLeaf(subject, [subject.memory.home, subject.memory.role]);
	}
	_unRegisterCreep(memory: CreepMemory): boolean {
		if (!memory.taskId) return false;
		if (global.taskSystem.Memory.Roll[memory.taskId]) global.taskSystem.Memory.Roll[memory.taskId] = _.filter(global.taskSystem.Memory.Roll[memory.taskId], c => c);
		if (global.taskSystem.Memory.WareHouse[memory.taskId]) {
			adjustReceivedStatus(global.taskSystem.Memory.WareHouse[memory.taskId].settings.received.left, memory.role, 1);
			adjustReceivedStatus(global.taskSystem.Memory.WareHouse[memory.taskId].settings.received.current, memory.role, -1);
		}
		return true;
	}
	constructor() {
		this.instructions = {
			registerCreep: this._registerCreep,
			unRegisterCreep: this._unRegisterCreep
		};
		for (const creep in Game.creeps) this._registerCreep(Game.creeps[creep]);
		for (const powerCreep in Game.powerCreeps) this._registerCreep(Game.powerCreeps[powerCreep]);
	}
}

export const statisticTaskLevel = new TreeLevel();
