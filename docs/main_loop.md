## Procedures
### Initialization
> This line of code will call the `Processor` of `infoSystem` to collect information about `Room`.
```javascript
	global.infoSystem.Processor.run();
```
> This line of code will call the `Processor` of `spawnSystem` to collect information about `Creep`.
```javascript
	global.spawnSystem.Processor.run();
```
> These lines of code will automatically delete `memory`of missing `creeps` and *unregister* them from `taskSystem`.
```javascript
	for (const name in Memory.creeps) {
		if (!(name in Game.creeps)) {
			global.taskSystem.Loader.instructions.unRegisterCreep(Memory.creeps[name]);
			delete Memory.creeps[name];
		}
	};
```

### Run
> This line of code will call the `Controller` of `taskSystem` to run the main program.
```javascript
	global.taskSystem.Controller.run();
```
> (Leave the room for running of `Structures`)

> This line of code will call the `Processor` of `spawnSystem` to spawn the `creeps`.