/// <reference path="types.d.ts" />
/// <reference path="dataStructure.d.ts" />
/// <reference path="taskSystem.d.ts" />
import { TreeArray } from "./dataStructure"
import { CTaskControlUnit, CTaskCoreUnit, CTaskLoadUnit, TreeLevel } from './taskSystem'
/** @todo */
const statisticTaskLevel = new TreeLevel();
export default function () {
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
}
