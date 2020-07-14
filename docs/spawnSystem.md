## Design
In order to dynamically control the *bodyparts* and *number* of `creeps`, I introduce the **register** mechanism. Namely, for every *role*, *spawnSystem* requires the programmer to provide a function to `return` *bodyparts*, given `Room` and a function to decide whether needs to spawn more, given `expected` *creepsNum*, `current` *creepsNum* and `Room`.

**Notice**:
- `current` does reflect the **real** number of each *role* in one specific room.
- `expected` only sums the `settings.received.max` for each role of each task when added. The meaning of its amount is that in order for each task to be assigned enough creeps simultaneous, how much creeps of this role are required. However, it is worth noticing that some tasks can be delayed, and one creep can take multiple tasks one by one.

## Declaration
### `global` Declaration
```typescript
global.spawnSystem = {
	Memory: {
		expected: {},
		current: {}
	},
	Processor: new spawnProcessor()
};
```
`Memory` is used to store the data of `expected` and `current` *creepsNum* of a specific *role* in a specific `Room`.

They bears the structure of *roomName->role->`number`*.

`Processor` is an instance of `spawnProcessor` *class*.

### `Processor` Declaration
```typescript
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
_getBodyParts(roomName: string, role: CreepRole): Array<BodyPartConstant>;
run(): void;
spawn(): void;
```
- `instruction` is a set of functions for external calling.
	- `scanCurrentCreeps`, scanning the **number** of all the creeps belonging to one specific room, decided by `CreepMemory.home` and grouped by `CreepMemory.role`, and store the data in `global.spawnSystem.Memory.current`.
	- `modifyExpectedCreeps`, modifying the data stored in `global.spawnSystem.Memory.expected` by `modify`, given `roomName` and `role`.
	- `getSpawnOrder`, giving the spawning order of roles of one specific room. This function helps dynamically change the spawning order based on the status of room.
	- `getFromSpawn`, giving the bodyparts of a `role` in one specific room.
	- `registerCreepRole`, registering a role by storing its *bodypart-deciding* function and *expected-current-comparison* function for further usage.
- `data` stores the *bodypart-deciding* function and *expected-current-comparison* function of all the registered roles.
- `run`, function to be called by [`main_loop`](main_loop) to refresh/gather `current` *creepsNum* information of all *controlled room*.
- `spawn`, function to be called by [`main_loop`](main_loop) to iterate over every controlled room to check whether there is a need to spawn creep. And if so, spawn it and add its name to `global.tmp.newSpawnedCreeps` for being registered at next tick. However, there are two small mechanisms here:
	- For each `spawn`, there is a lock time or *interval* between two *spawning* intentions, specified by `settings.spawnInterval`. The reason behind it is to consider the time for `transferers` to refill `spawns` and `extensions` with `energy`. However, this can be a lag in certain situations, such as *spawning soldiers for war* or *using `PWR_OPERATE_SPAWN`*. This can be solved by designing the layout for `room` cleverly and setting `spawnInterval` in `settings` as `0`.
	- Considering that sometimes `availableEnergy` is not enough to spawn the `creep` fully, there is a `ratio-reduction` mechanism to scale the *bodyparts* to meet current `availableEnergy`. The reason behind it is to reduce the burden for *bodypart-deciding* function, so that they do not need to worry whether `availableEnergy` is enough to spawn. For example, when `spawning` *upgrader*, `bodypart-deciding` function only needs to consider whether the `energy` stored in `storage` and etc. is enough.
## Running
0. Outside the `main_loop`, all `roles` are `registered` through `Processor.instructions.registerCreepRole`. *(TODO: During `register`, modify corresponding `spawnOrder`)*
1. `main_loop` calls `global.spawnSystem.Processor.run()`.
2. `Processor` iterates all controlled `roomNames` stored in `global.infoSystem.Memory.Rooms.my` to call `instructions.scanCurrentCreeps` and initialize `global.spawnSystem.Memory.expected[roomName]` as `{}`, if not exists.
	- `scanCurrentCreeps` sets `global.spawnSystem.Memory.current[room.name]` as `{}` to be empty. Then iterate over all `creeps` belonging to this room by `room.creeps` to record *real number* of `creeps` for all *available* roles.
3. `Return`.
4. `taskSystem` calls `global.spawnSystem.Processor.modifyExpectedCreeps` for all newly added tasks.
5. `main_loop` calls `global.spawnSystem.Processor.spawn()`.
6. `Processor` iterates all controlled `roomNames` stored in `global.infoSystem.Memory.Rooms.my`, and
	- Get `spawnOrder` from `instructions.getSpawnOrder`.
	- Iterate `role` in `spawnOrder`*(this contains a full list of roles, even though some of them do not need to be spawned at that moment)* by order, and
		- Call `instructions.getFromSpawn` for this `role`. It will check whether needs to spawn one more `creep` of this `role`, and return its *bodyparts* if so, `undefined` otherwise.
		- After getting *bodyparts* for a **needed** role, it is passed into `utils.scaleBodyParts` to increase the probability that this creep could be spawned.
		- Iterate `spawn` in this `room`, and
			- Check whether this `spawn` is spawning or in the cooldown.
			- If not, spawn the `creep`. If successful, refresh cooldown of this `spawn` and `break` the whole process so that `Processor` begins to process the next `room`.
7. `Return`.
