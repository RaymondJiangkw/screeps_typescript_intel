## Declaration
### `global` Declaration
```typescript
	infoSystem: {
			Memory: {
				Portals: {[shard: string]: { [roomName: string]: { [shard: string]: { [from: string]: Set<StructurePortal> } } }
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
```
`Memory` is used to store the data of `Portals` in all visible or visible-in-the-past `rooms` and `information` of every visible or visible-in-the-past `room` as *key(roomName)-value(RoomInfo)* pair in `Memory.Rooms`. `Rooms.my`, `Rooms.hostile` and etc. contain a list of such *roomNames*, which belong to its specific type.

`Portals` bears the structure of *toRoom* -> *fromRoom*, indicated as *to{shard,roomName}->from{shard,roomName,`portal`}*.

`Processor` is an instance of `InfoProcessor` *class*.

### `Information` Declaration
#### CResourceInfo *Class*
```typescript
		resources: {
			[propName: string]: {
				[STRUCTURE_STORAGE]?: number;
				[STRUCTURE_TERMINAL]?: number;
				[STRUCTURE_FACTORY]?: number;
				[STRUCTURE_CONTAINER]?: number;
				[STRUCTURE_LAB]?: number;
			};
		};
		_collectResourceInfo(room: Room): boolean;
		_refreshResourceInfo(room: Room): boolean;
```
Data:
- `resources` is used to store the data of `quantity` of  every available`resources` in the specific `room`.

Export Function:
- `_collectResourceInfo` is used to collect the resource information of `room` and put them into `resources`.
- `_refreshResourceInfo` is used to check whether needs to update the *outdated* resource information. This is done by calling `_collectResourceInfo` after some interval specified by `roomInfoRefreshInterval` in `settings.ts`.
The following `Information` *Classes* basically follow the same strategy.

#### CEconomyInfo *Class*
```typescript
		economy: {
			[RESOURCE_ENERGY]: {
				"available": {
					"current": number;
					"total": number;
				};
				/**
				 * Total Energy Stored / energyAvailableCapacity.
				 * Number of times to fill in completely.
				 */
				"storage": {
					[STRUCTURE_STORAGE]?: number;
					[STRUCTURE_TERMINAL]?: number;
					[STRUCTURE_FACTORY]?: number;
				};
			};
		};
		_collectEconomyInfo(room: Room): boolean;
		_refreshEconomyInfo(room: Room): boolean;
```
#### CStructureProdInfo *Class*
```typescript
		structures!: {
			[STRUCTURE_CONTAINER]: {
				"input": Array<StructureContainer>,
				"output": Array<StructureContainer>,
				"map": { [id: string]: Structure },
				/** Could be used as 'input' or 'output' */
				"central": Array<StructureContainer>
			},
			[STRUCTURE_LINK]: {
				"input": Array<StructureLink>,
				"output": Array<StructureLink>,
				"map": { [id: string]: Structure },
				/** Could be used as 'input' or 'output' */
				"central": Array<StructureLink>
			},
			[STRUCTURE_LAB]: {
				"input": Array<StructureLab>,
				"output": Array<StructureLab>,
			},
		}
		_collectStructureProdInfo(room: Room): boolean;
		_refreshStructureProdInfo(room: Room): boolean;
```
**Notice**:
- Container
    - Near `energy` or `mineral` will be perceived as *input*.
    - Near `terminal` or `storage` will be perceived as *central*.
    - Otherwise will be perceived as *output*, which will be used when search for *resource*.
    - `map` stores the injection from the `id` of identified *object*, namely `Source`, `Mineral` and etc, to `container`.
- Link
	- Near *input container* will be perceived as *input*.
	- Near `terminal` or `storage` will be perceived as *central*.
	- Otherwise will be perceived as *output*, which will be used when search for *energy*.
	- `map` stores the injection from the `id` of identified *object*, namely *input container* and etc, to `link`.
- Lab
	- *input* `labs` are identified as `labs`, which are in the range of any other. They contain `2` and only `2` such `labs`. *output* `labs` are identified otherwise.
	- *input* `labs` are used to place *raw material* for *reaction* or *reversereaction*, whose products are placed in *output* `labs`.

#### CDefenseInfo *Class*
```typescript
	defense!: {
			[STRUCTURE_TOWER]: {
				status: "repair" | "attack" | "heal" | "idle",
				refillTowers: Array<StructureTower>
			}
		}
		_collectDefenseInfo(room: Room): boolean;
		_refreshDefenseInfo(room: Room): boolean;
```
**Notice**:
- `refillTowers` are those whose `energy/capacity` is lower than a ratio defined as `0.5`.
#### CPortalnfo *Class*
```typescript
		portals: Array<{ portal: StructurePortal, desti: RoomPosition | { shard: string, room: string } }>
		_collectPortalInfo(room: Room): boolean;
		_refreshPortalInfo(room: Room): boolean;
```
#### CControllerInfo *Class*
```typescript
		controller!: {
			level: number,
			downgradeTick: number | null,
			reservedTick: number | null,
		}
		_collectControllerInfo(room: Room): boolean;
		_refreshControllerInfo(room: Room): boolean;
```
#### CCreepInfo *Class*
```typescript
		creeps: {
			live: Array<creepEvaluation>,
			spawning?: Array<creepEvaluation>
		}
		_collectCreepInfo(room: Room): boolean;
		_refreshCreepInfo(room: Room): boolean;
```
**Notice**:
- *spawning* information is currently unable to get due to the restriction of `API`.

### `Room` Declaration
#### RoomBase *class*
```typescript
	room: Room;
	_callInternalMethod(key: string): boolean;
	constructor(room: Room);
	refresh();
```
- *constructor* will mount *room* to *this.room* for easy and integrated access and call all the *collect* member functions, such as *_collectCreepInfo*.
- *refresh* will call all the *refresh* member functions such as *_refreshCreepInfo*.
- `_callInternalMethod` is an auxiliary function which is used to call all the member functions whose name starts with `key:string`.
#### ControlledRoom *class* extends *RoomBase*
It extends *CResourceInfo, CEconomyInfo, CDefenseInfo, CStructureProdInfo, CControllerInfo*.
#### UnownedRoom *class* extends *RoomBase*
It extends *CControllerInfo, CStructureProdInfo, CCreepInfo*.
#### ObservedRoom *class* extends *RoomBase*
It extends *CStructureProdInfo, CCreepInfo, CPortalInfo*.
#### NeutralRoom *class* extends *RoomBase*
It extends *CCreepInfo*.
#### HostileRoom *class* extends *RoomBase*
It extends *CResourceInfo, CEconomyInfo, CControllerInfo, CCreepInfo*.
### `Processor` Declaration
```typescript
	instructions: {
		addToPortal: (toShard: string, toRoom: string, fromShard: string, fromRoom: string, portal: StructurePortal) => boolean;
		refreshRoom: () => void;
	}
	run(): boolean;
```
- `instructions` is a set of functions for external calling.
    - `addToPortal`, adding information of *Portal* to the `global.infoSystem`.
    - `refreshRoom`, scanning all currently visible `Room`. Add it to `Memory.Rooms` if first scanned, or Call `refresh` function of `RoomInfo` to check whether needs to update some of its information.
- `run`, function to be called by [`main_loop`](main_loop) to run the whole `infoSystem`.
## Running
1. `main_loop` calls `global.infoSystem.Processor.run()`.
2. `Processor` calls `instructions.refreshRoom()`.
	- `refreshRoom` iterates over each currently visible `room`.
		- If first scanned, calling `utils.RoomState` to decides its type, *controlled*, *hostile* and etc. and adding it to `Memory.Rooms` by creating an instance of corresponding `Room` *Class*. Its information will be gathered first time in *constructor* by calling all its member functions whose name starts with *_collect*.
		- If has been scanned, calling its `refresh` to trigger potential *updating-information* behaviors.
			- `refresh` of each `Room` *Class* instance calls all its member functions whose name starts with *_refresh*.
				- `_refresh` of each `Room` *Class* instance will check whether `Game.time % interval === 0` and call its corresponding `_collect` if `True`.
3. `Return`.
