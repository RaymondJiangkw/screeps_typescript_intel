## Declaration
### `global` Declaration
```typescript
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
```
`Memory` is used to store `WareHouse`, a mapping from `taskId` to `task` instance, `Roll`, a mapping from `taskId` to `creeps` receiving this `task` and `IdleCreeps`, a `Tree` instance bearing the structure *roomName->role->`Array<Creep | PowerCreep>`*, which is used to manage *idle* creeps.

`Processor` is an instance of `CTaskCoreUnit` *class*.

`Controller` is an instance of `CTaskControlUnit` *class*.

`Loader` is an instance of `CTaskLoadUnit` *class*.

### `Const` Declaration
#### Task Return Code
```typescript
declare const TASK_DELETE: 15;
declare const TASK_FINISH: 7;
declare const TASK_RENEW: 3;
type TASK_CODE = 0 | 3 | 7 | 15;
```

- `TASK_DELETE`: After executing task for `creeps` receiving it, this task code means:
	- This `Creep` does not need to run it any more.
	- This `task` is invalid, thus it shouldn't be received any more despite potential left positions to be received.
	- However, for those safely running this task `creeps`, this `task` shouldn't be recycled too early until no more `creeps` are running it.
- `TASK_FINISH`: After executing task for `creeps` receiving it, this task code means:
	- This `Creep` has finished this `task`.
	- This `task` does not need to be received by this `role` one more expect for current left positions.
- `TASK_RENEW`: After executing task for `creeps` receiving it, this task code means:
	- This `Creep` has not finished this `task`, but it puts it down temporarily and switchs to new `task`.
	- This `task` still needs to be received by this `role` one more besides current left positions.
- `OK`: This task runs normally for this `creep`.

### `Task` Declaration
#### `Task` Prototype
```typescript
declare abstract class CTaskBase {
	readonly id: string;
	readonly identity: TBasicTaskType | TMediumTaskType;
	readonly taskCallback?: TTaskCallback;
	readonly taskEarlyTerminate?: (subject: Creep | PowerCreep, attachedRoom: string) => boolean;
	data: { [propName: string]: any };
	settings: {
		received: {
			max: receivedInformation;
			current: receivedInformation;
			left: receivedInformation;
		}
	};
	options?: { [propName: string]: any };
	run: (creeps?: Array<Creep | PowerCreep>) => TASK_CODE[];
	targetRoom: string;
}
```

- `id`: fingerprint for a specific `task`, computed by its `data`.
- `identity`: instances of generic interface `ITaskTypeAttached` and `ITaskTypeAcross`.
	- Original Interfaces:
		```typescript
		interface ITaskType<TtaskType, TsubTaskType> {
			readonly taskType: TtaskType;
			readonly subTaskType: TsubTaskType;
			readonly taskLevel?: "low" | "medium" | "high";
		}
		interface ITaskTypeAttached<TtaskType, TsubTaskType> extends ITaskType<TtaskType, TsubTaskType> {
			readonly home: string;
		}
		interface ITaskTypeAcross<TtaskType, TsubTaskType> extends ITaskType<TtaskType, TsubTaskType> {
			readonly targetRoom: string;
			maxRange: number;
			maxReceivedRooms: number;
		}
		```
	- Explanations:
		- `ITaskType`, including `type` and `subType` and `level`*(optional)* to define `task`.
		- `ITaskTypeAttached`, assuming this `task` is issued to be received by a definite `room`, thus having `home` property.
		- `ITaskTypeAcross`, assuming this `task` is issued to be received by a group of `rooms` near one specific `room`, given constraint of *numbers* and *range*, thus having `targetRoom`, `maxRange` and `maxReceivedRooms` properties.
- `taskCallback`, a callback function *(optional)* to be called during `adding` this task to issue triggered `tasks`.
- `taskEarlyTerminate`, a callback function *(optional)* to be called after executing the *running logic* of this `task` for each `creep` to determine whether early terminates this `task` for a specific `creep`. The `creep`, which is early terminated by this function will never receive `task` with same `taskType` and `subTaskType` unless being renewed by `spawns`.
- `data`, `data` of this `task`.
- `settings`, guiding things about **headlines**, including:
	- `received`, the receiving status of this `task`.
		- Original Interfaces:
			```typescript
			interface receivedInformation {
				"any": number;
				[role: string]: number;
			}
			```
		- Explanations:
			- `receivedInformation`, featuring *role* as key, and storing its corresponding number. `any` is a special key word, meaning this `task` can be received by any *role*.
			- `left`, left positions to be received; `current`, current receiving status; `max`, original/maximum positions to be received.
- `options`, guiding things about **execution**.
- `run`, running logic of this `task` instance. It is required to be passed into all `creeps` receiving this `task`, and returns **TASK_CODE** for each such `creep`.
- `targetRoom`, `home` of `ITaskTypeAttached` and `targetRoom` of `ITaskTypeAcross`.

### `Units` Declaration
#### `Processor.storage` *Unit*
```typescript
declare class CTaskStorageUnit {
	_taskPool: {
		basic: taskIdTree,
		medium: taskIdTree,
	};
	addTaskId: (category: TTaskCategory, taskId: taskId, path: Array<string>) => boolean;
	addBasicTaskId: (taskId: taskId, home: string) => boolean;
	popTaskId: (category: TTaskCategory, path: Array<string>, role: CreepRole) => taskId | undefined;
	popAnyTaskId: (category: TTaskCategory, path: Array<string>, role: CreepRole) => taskId | undefined;
	clearTaskIds: (category: TTaskCategory, path: Array<string>) => boolean;
	clearBasicTaskIds: (home: string, taskType: BasicTaskType, subTaskType?: string | undefined) => boolean;
}
```
- `_taskPool`, containing all *waiting-to-be-received* `ids` of `tasks` in the `Tree`, bearing the structure *roomName->taskType->subTaskType*, grouped by `task` category.
- `addTaskId`, adding `id` of `task` to `_taskPool`.
- `addBasicTaskId`, shortcut for adding `basic` `task`.
- `popTaskId`, poping a `id` of `task`, given the `path`.
- `popAnyTaskId`, poping any `id` of `task`, given the father node defined by `path`.
- `clearTaskIds`, clearing all `ids` of `tasks`, given the `path`.
- `clearBasicTaskIds`, shortcut for clearing `basic` `tasks`.

#### `Processor.run` *Unit*
```typescript
declare class CTaskRunUnit {
	_registeredTasks: {
		basic: registeredTaskIdTree,
		medium: registeredTaskIdTree,
	};
	addRegTaskId: (category: TTaskCategory, taskId: taskId, path: Array<string>) => boolean;
	addRegBasicTaskId: (taskId: taskId, home: string) => boolean;
	assignRegTaskIds: (category: TTaskCategory, taskIds: taskId[], path: Array<string>) => boolean
	runTasks: (category: TTaskCategory, path: Array<string>, settings?: { runAll: boolean }) => { taskId: taskId, ret: TASK_CODE[] }[];
	runBasicTasks: (home: string, taskType: BasicTaskType, subTaskType?: string | undefined) => { taskId: taskId, ret: TASK_CODE[] }[];
	clearTasks: (category: TTaskCategory, path: Array<string>, settings?: { clearAll: boolean }) => boolean;
}
```
- `_registeredTasks`, containing all *having-been-received-by-any* `ids` of `tasks` in the `Tree`, bearing the structure *roomName->taskType->subTaskType*, grouped by `task` category.
- `addRegTaskId`, adding `id` of `task` to `_registeredTasks`, or `register` a `task`.
- `addRegBasicTaskId`, shortcut for registering `basic` `task`.
- `assignRegTaskIds`, assigning an array of `ids` of `tasks` to a `path`.
- `runTasks`, running all the `tasks`, given `path` or `node`.
- `runBasicTasks`, shortcut for running all `basic` `tasks`.
- `clearTasks`, clearing `tasks` in `_registeredTasks`, given `path` or `node`.

#### `Processor` *Unit*
```typescript
declare class CTaskCoreUnit {
	storage: CTaskStorageUnit;
	run: CTaskRunUnit;
	instructions: {
		checkTaskExistence: (taskId: taskId) => boolean;
		addTask: (checkedExistence: true, task: CTaskBase, settings?: { silence: boolean }) => boolean;
		assignTask: (excludeFromIdle: true, subject_s: Array<Creep | PowerCreep>, taskId: string) => boolean;
		clearTasks: { (category: TTaskCategory, path: string[]): boolean; (home: string, taskType: BasicTaskType, subTaskType?: string | undefined): boolean; };
		getTask: (notInIdle: true, subject: Creep | PowerCreep) => boolean;
		runTasks: { (category: TTaskCategory, path: string[], settings?: { runAll: boolean; }): boolean; (home: string, taskType: BasicTaskType, subTaskType?: string | undefined): boolean; };
	}
}
```
- `storage`, an instance of `CTaskStorageUnit`.
- `run`, an instance of `CTaskRunUnit`.
- `instructions`, a group of functions to be called externally:
	- `checkTaskExistence`, checking whether this `task` exists by comparing its `id`.
	- `addTask`, adding `task` to `storage`. During this process,
		- It does not check whether it is duplicate.
		- It distributes `task`, which is of `ITaskTypeAcross`, to be received by specific `rooms`.
	- `assignTask`, assigning specific `task` to `creeps`. During this process,
		- It does not check whether `creeps` are still in the `Idle` List.
	- `clearTasks`, clearing `tasks` in `storage` unit, given `path` or shortcut for `basic`.
	- `getTask`, getting `task` for `creeps`. During the process,
		- It will not check whether `creep` is still in `Idle` `Tree`.
		- It will check whether `creep` has `taskId` in its `Memory`.
		- It will get its accepted `[category, taskType, subTaskType]` from `Creep.acceptTasks` and search for them from `storage` unit.
		- It will rethrust back `task` into `storage` unit, if it still has room for being received.
		- It will register received `task` into `run` unit, if it is the 'first' time being received *(not literally the first time)*.
	- `runTasks`, running all the tasks, given `[category, path]` or shortcut for `basic` `tasks`. During the process,
		- It will pass all receiving this specific task `creeps` into `run` unit.
		- It will deal with the returned `TASK_CODE` for each `creep` properly, checking *earlyTerminate* and adjusting `creep` into *idle* state. In proper occasion, it will `delete` the `task`, rethrusting back `task` into `run` unit, or rethrusting back `task` into `storage` unit.

#### `Control` *Unit*
```typescript
declare class CTaskControlUnit {
	Record: {
		data: {
			[index: string]: TreeObject<any>;
		}
		settings: {
			record_interval: number;
			last_record_tick: number;
		}
		instructions: {
			addRecord: (index: string, path: Array<string>, key: string, record: any) => boolean;
			getRecord: (index: string, path: Array<string>, key: string) => any | undefined;
			delRecord: (index: string, path: Array<string>, key: string) => boolean;
		}
	}
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
			addToTimer: (tick: number, func: (...args: any[]) => any, params: Array<any>) => boolean;
			addToList: (item: CTaskIssueListPiece<Room | Structure | Source | Mineral | Flag>) => boolean;
			addToWatcher: (event: EventConstant, func: (roomName: string, event: EventItem) => any) => boolean;
		}
	}
	Run: {
		data: {
			scheduler: { [interval: number]: Array<TAdvancedTaskType> };
		}
		settings: {
			switch: {
				scheduler: boolean;
			}
			level: {
				current: TreeLevel;
				statistic: TreeLevel;
			}
		}
		instructions: {
			run: () => boolean;
			addToScheduler: (item: TAdvancedTaskType) => boolean;
		}
	}
	run: () => boolean;
}
```
- `Record`, used to help record information for further usage.
	- `data`, stored data, accessed by *key*.
	- `settings`
		- `record_interval`, the period of recording. After a period, all preceding data will be wiped out.
		- `last_record_tick`, used to realize preceding function.
	- `instructions`, a group of functions for external usage:
		- `addRecord`, `delRecord` and `getRecord`.
- `Adjust`, used to adjust the `settings` of other units.
	- `data`, storing an array of function to adjust the level `Tree` for each room.
	- `settings`
		- `adjust_interval`, `Adjust` runs per this interval.
		- `last_adjust_tick`, used to realize preceding function.
	- `instructions`, a group of functions for external usage:
		- `run`, run the whole `Adjust` process, including `analyseRecord`, `adjustLevel` and `adjustSwitch`.
		- `analyseRecord`, processing some data stored in `Record` and yielding *analysed* data which is still stored in `Record`.
		- `adjustSwitch`, adjusting the switches in `Issue` or `Run`.
		- `adjustLevel`, adjusting the levels for each `room`.
- `Issue`, used to issue tasks.
	- `data`
		- `timer`, issuing tasks at specific tick.
		- `list`, issuing tasks at every tick.
		- `watcher`, issuing tasks if specific events occur.
	- `settings`
		- `switch`, whether to open `timer`, `list` or `watcher`.
	- `instructions`
		- `run`, run the whole `Issue` process, namely running `list`, `timer` and `watcher` if properly.
		- `addToTimer`, `addToList`, `addToWatcher`, adding things to `list`, `timer` or `watcher`.
- `Run`, used to run received tasks.
	- `data`
		- `scheduler`, running sheduled *high-level* tasks, which are used to make decision after some intervals.
	- `settings`
		- `switch`, whether to open `sheduler`.
		- `level`, the level situation for each room and statistic one. The Running of Tasks of each room will based on it.
	- `instructions`
		- `run`, run the sheduled *high-level* tasks and received tasks for each room based on the *level*.
		- `addToScheduler`, adding *high-level* task to *scheduler*.
- `run`, running the whole `control` Unit.

#### `Loader` *Unit*
```typescript
declare class CTaskLoadUnit {
	instructions: {
		registerCreep: (subject: Creep | PowerCreep) => boolean;
		unRegisterCreep: (memory: CreepMemory) => boolean;
	}
	run: () => boolean;
}
```
- `instructions`, a group of functions to be called externally
	- `registerCreep`, it will register `creep` into the `Idle` `Tree`, regardless of whether it has `taskId` in `Memory`.
	- `unRegisterCreep`, it will try to delete `creep` from `Roll` and adjust receiving status of received `task`, if having valid `taskId`.
- `run`, running the whole `Loader` process.

## Running
0. Outside the `main_loop`, prepare the statistic `taskLevel` `Tree` and call `Controller.Adjust.instructions.addToAdjustLevelFuncs` to add all functions to adjust level of room, `addToTimer`, `addToList` and `addToWatcher` of `Controller.Issue.instructions` to add logic of adding tasks, and `Controller.Run.instructions.addToScheduler` to add scheduled *high-level* tasks.
1. `main_loop` calls `global.taskSystem.Controller.run()`.
2. `Controller` calls
	- `Adjust.instructions.run`.
	- `Issue.instructions.run`.
	- `global.taskSystem.Loader.run`
		- Iterate over all available rooms
			- Iterate over all available roles
				- For each `creep`, `delete` if invalid; Add to `roll` if has valid `taskId`; Try to get `task`, otherwise.
	- `Run.instructions.run`.
3. `Return`.
