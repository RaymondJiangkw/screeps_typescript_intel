import { ErrorMapper } from "utils/ErrorMapper";
// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
import mount from "./mount"
mount();
export const loop = ErrorMapper.wrapLoop(() => {
	// Automatically delete memory of missing creeps
	for (const name in Memory.creeps) {
		if (!(name in Game.creeps)) {
			global.taskSystem.Loader.instructions.unRegisterCreep(Memory.creeps[name]);
			delete Memory.creeps[name];
		}
	};
	global.taskSystem.Controller.run();
});
