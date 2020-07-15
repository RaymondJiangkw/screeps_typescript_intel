/// <reference path="types.d.ts" />
/// <reference path="dataStructure.d.ts" />
/// <reference path="taskSystem.d.ts" />
import { log } from "./utils/utils";
import { TreeArray } from "./dataStructure";
import { InfoProcessor } from "./infoSystem";
import { spawnProcessor } from "./spawnSystem"
import { structureProcessor } from "./structureSystem"
import { CTaskControlUnit, CTaskCoreUnit, CTaskLoadUnit, statisticTaskLevel } from './taskSystem';
import { mountRoomCreeps } from "./mount/prototype.Room.Creeps"
import { mountRoomResources } from "./mount/prototype.Room.resources";
import { mountRoomStructures } from "./mount/prototype.Room.structures";
import { mountCreepTravelTo } from "./mount/prototype.Creep.travelTo";
import { mountCreepExtensions } from "./mount/prototype.Creep.extensions";
import taskSystemInit from "./taskSystem/mount";
import spawnSystemInit from "./spawnSystem/mount";
import structureSystemInit from "./structureSystem/mount"
export default function () {
	log("Remount Finish", ["notice", "global"]);
	initMemory();
	mountRoomCreeps();
	mountRoomResources();
	mountRoomStructures();
	mountCreepTravelTo();
	mountCreepExtensions();
	global.taskSystem = {
		Memory: {
			WareHouse: {},
			Roll: {},
			IdleCreeps: new TreeArray<Creep | PowerCreep>()
		},
		Processor: new CTaskCoreUnit(),
		Controller: new CTaskControlUnit(statisticTaskLevel),
		Loader: new CTaskLoadUnit()
	};
	global.infoSystem = {
		Memory: {
			Portals: {},
			Rooms: {
				my: [],
				hostile: [],
				observed: [],
				neutral: [],
				unowned: []
			},
		},
		Processor: new InfoProcessor()
	};
	global.spawnSystem = {
		Memory: {
			expected: {},
			current: {}
		},
		Processor: new spawnProcessor()
	};
	global.structureSystem = {
		Processor: new structureProcessor()
	}
	taskSystemInit();
	spawnSystemInit();
	structureSystemInit();
	global.tmp = {
		newSpawnedCreeps: []
	};
}

function initMemory() {
	if (!Memory.settings) Memory.settings = { logLevel: 0 };
}
