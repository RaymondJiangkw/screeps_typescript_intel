## Procedures
### Initialization
> This line of code will call the `Processor` of `infoSystem` to collect information about `Room`.
```typescript
global.infoSystem.Processor.run();
```

> These lines of code will automatically delete `memory`of missing `creeps` and *unregister* them from `taskSystem`.
```typescript
for (const name in Memory.creeps) {
	if (!(name in Game.creeps)) {
		global.taskSystem.Loader.instructions.unRegisterCreep(Memory.creeps[name]);
		delete Memory.creeps[name];
	}
};
```

> These lines of code will register those newly spawned creep or powerCreep to `taskSystem`.
```typescript
for (const name of global.tmp.newSpawnedCreeps) {
	if (Game.creeps[name]) global.taskSystem.Loader.instructions.registerCreep(Game.creeps[name]);
	else if (Game.powerCreeps[name]) global.taskSystem.Loader.instructions.registerCreep(Game.powerCreeps[name]);
}
global.tmp.newSpawnedCreeps = [];
```

> This line of code will call the `Processor` of `spawnSystem` to collect information about `Creep`.
```typescript
global.spawnSystem.Processor.run();
```
### Run
> This line of code will call the `Controller` of `taskSystem` to run the main program.
```typescript
global.taskSystem.Controller.run();
```
> This line of code will call the `Processor` of `structureSystem` to run the `structures`.
```typescript
global.structureSystem.Processor.run();
```

> This line of code will call the `Processor` of `spawnSystem` to spawn the `creeps`.
```typescript
global.spawnSystem.Processor.spawn();
```
