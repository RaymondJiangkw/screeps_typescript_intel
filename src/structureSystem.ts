/// <reference path="types.d.ts" />
/// <reference path="./mount/prototype.Room.structures.d.ts" />
import { structureSingleList, structureMultipleList } from "./utils/settings"
export class structureProcessor {
	data: {
		structureRun: { [structure in StructureConstant]?: (_structure: Array<Structure> | Structure, _room: Room) => boolean; };
	}
	instructions: {
		registerStructure(structure: StructureConstant, information: { structureRun: (_structure: Array<Structure> | Structure, _room: Room) => boolean; }): boolean;
	}
	_registerStructure(structure: StructureConstant, information: { structureRun: (_structure: Array<Structure> | Structure, _room: Room) => boolean; }): boolean {
		this.data.structureRun[structure] = information.structureRun;
		return true;
	}
	run(): void {
		global.infoSystem.Memory.Rooms.my.forEach((roomName: string) => {
			const room = Game.rooms[roomName];
			for (const structure of structureSingleList) if (room[structure] && this.data.structureRun[structure]) this.data.structureRun[structure]!(room[structure]!, room);
			for (const structures of structureMultipleList) {
				const _structures = (room as unknown as { [multipleStructureName: string]: Array<Structure> })[structures];
				if (_structures.length > 0 && this.data.structureRun[structures]) this.data.structureRun[structures]!(_structures, room);
			}
		});
	}
	constructor() {
		this.data = { structureRun: {} };
		this.instructions = {
			registerStructure: this._registerStructure
		};
	}
}
