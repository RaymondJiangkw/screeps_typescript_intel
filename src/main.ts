import { ErrorMapper } from "utils/ErrorMapper";
// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
import mount from "./mount";
mount();
export const loop = ErrorMapper.wrapLoop(() => {
	// Collect Available Information
	global.infoSystem.Processor.run();
	// Collect Current Creep Info
	global.spawnSystem.Processor.run();
	// Automatically delete memory of missing creeps
	for (const name in Memory.creeps) {
		if (!(name in Game.creeps)) {
			global.taskSystem.Loader.instructions.unRegisterCreep(Memory.creeps[name]);
			delete Memory.creeps[name];
		}
	};
	// Run the Main Program
	global.taskSystem.Controller.run();
	// Spawn the Creeps
	global.spawnSystem.Processor.spawn();
	return true;
});
