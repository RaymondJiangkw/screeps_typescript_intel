export function mountCreepExtensions() {
	_.assign(Creep.prototype, CreepExtension.prototype);
}

class CreepExtension extends Creep {
	/** This function will only exclude earlyTerminateTasks from those 3-length initial accepted tasks information. */
	public acceptTasks(): Array<[TTaskCategory, BasicTaskType | MediumTaskType] | [TTaskCategory, BasicTaskType | MediumTaskType, string[]]> {
		// Assume role must be registered.
		const ret: Array<[TTaskCategory, BasicTaskType | MediumTaskType] | [TTaskCategory, BasicTaskType | MediumTaskType, string[]]> = [];
		const _excludeTaskTypes: { [taskType in BasicTaskType | MediumTaskType]?: Array<string> } = {};
		for (const excludeItem of this.memory.earlyTerminateTasks) {
			if (!_excludeTaskTypes[excludeItem[0]]) _excludeTaskTypes[excludeItem[0]] = [];
			_excludeTaskTypes[excludeItem[0]]!.push(excludeItem[1]);
		}
		for (const item of global.spawnSystem.Processor.data.acceptedTasks[this.memory.role] as Array<[TTaskCategory, BasicTaskType | MediumTaskType] | [TTaskCategory, BasicTaskType | MediumTaskType, string[]]>) {
			if (item.length === 2 || !(item[1] in _excludeTaskTypes)) ret.push(item);
			else ret.push([item[0], item[1], _.filter(item[2], s => _excludeTaskTypes[item[1]]!.indexOf(s) < 0)]);
		}
		return ret;
	}
}
