## Declaration
### `global` Declaration
```typescript
structureSystem: {
	Processor: structureProcessor
}
```

`Processor` is an instance of `structureProcessor` *class*.

### `Processor` Declaration
```typescript
declare class structureProcessor {
	data: {
		structureRun: { [structure in StructureConstant]?: (_structure: Array<Structure> | Structure, _room: Room) => boolean; };
	}
	instructions: {
		registerStructure(structure: StructureConstant, information: { structureRun: (_structure: Array<Structure> | Structure, _room: Room) => boolean; }): boolean;
	}
	run(): void;
}
```
- `data`, used to store `functions` to run `structures`.
- `instructions`, a group of functions to be called externally
	- `registerStructure`, used to register `structures` along with their running functions.
- `run`, function to be called by [`main_loop`](main_loop) to run the whole `structureSystem`.

## Running
0. Outside the `main_loop`, all `structures` are `registered` through `Processor.instructions.registerStructure`.
1. `main_loop` calls `global.structureSystem.Processor.run()`.
2. `Processor` iterates all controlled `roomNames` stored in `global.structureSystem.Memory.Rooms.my`, and iterates all types of `structures` in that room to `run` them, if have been registered.
3. `Return`.
