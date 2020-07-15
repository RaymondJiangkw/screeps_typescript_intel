/// <reference path="types.d.ts" />
declare class structureProcessor {
	data: {
		structureRun: { [structure in StructureConstant]?: (_structure: Array<Structure> | Structure, _room: Room) => boolean; };
	}
	instructions: {
		registerStructure(structure: StructureConstant, information: { structureRun: (_structure: Array<Structure> | Structure, _room: Room) => boolean; }): boolean;
	}
	run(): void;
}
