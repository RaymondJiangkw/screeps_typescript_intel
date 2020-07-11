/// <reference path="types.d.ts" />
/// <reference path="dataStructure.d.ts" />
/// <reference path="taskSystem.d.ts" />
import { log } from "./utils/utils";
import { TreeArray } from "./dataStructure";
import { addToPortal, refreshInfoSystem } from "./infoSystem";
import { CTaskControlUnit, CTaskCoreUnit, CTaskLoadUnit, statisticTaskLevel } from './taskSystem';
import { mountRoomResources } from "./mount/prototype.Room.resources";
import { mountRoomStructures } from "./mount/prototype.Room.structures";
import { mountCreepTravelTo } from "./mount/prototype.Creep.travelTo";
export default function () {
	log("Remount Finish", ["global", "mount"], "red");
	mountRoomResources();
	mountRoomStructures();
	mountCreepTravelTo();
	global.taskSystem = {
		Memory: {
			WareHouse: {},
			Roll: {},
			IdleCreeps: new TreeArray<Creep | PowerCreep>()
		},
		Processor: new CTaskCoreUnit(),
		Controller: new CTaskControlUnit(statisticTaskLevel),
		Loader: new CTaskLoadUnit()
	}
	global.infoSystem = {
		Portals: {},
		Rooms: {},
		instructions: {
			addToPortal: addToPortal,
			refresh: refreshInfoSystem
		}
	}
}
