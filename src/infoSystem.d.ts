type Constructor<T = {}> = new (...args: any[]) => T;
declare class CResourceInfo {
	resources: {
		[propName: string]: {
			[STRUCTURE_STORAGE]?: number,
			[STRUCTURE_TERMINAL]?: number,
			[STRUCTURE_FACTORY]?: number,
			[STRUCTURE_CONTAINER]?: number,
			[STRUCTURE_LAB]?: number
		}
	};
	_collectResourceInfo(room: Room): boolean;
	_refreshResourceInfo(room: Room): boolean;
}
declare class CEconomyInfo {
	economy: {
		[RESOURCE_ENERGY]: {
			"available": {
				"current": number,
				"total": number
			};
			/**
			 * Total Energy Stored / energyAvailableCapacity.
			 * Number of times to fill in completely.
			 */
			"storage": {
				[STRUCTURE_STORAGE]?: number,
				[STRUCTURE_TERMINAL]?: number,
				[STRUCTURE_FACTORY]?: number
			}
		};
	}
	_collectEconomyInfo(room: Room): boolean;
	_refreshEconomyInfo(room: Room): boolean;
}
declare class CStructureProdInfo {
	structures: {
		[STRUCTURE_CONTAINER]: {
			"input": Array<StructureContainer>,
			"output": Array<StructureContainer>,
			"map": { [id: string]: StructureContainer },
			/** Could be used as 'input' or 'output' */
			"central": Array<StructureContainer>
		},
		[STRUCTURE_LINK]: {
			"input": Array<StructureLink>,
			"output": Array<StructureLink>,
			"map": { [id: string]: StructureLink },
			/** Could be used as 'input' or 'output' */
			"central": Array<StructureLink>
		},
		[STRUCTURE_LAB]: {
			"input": Array<StructureLab>,
			"output": Array<StructureLab>
		},
	}
	_collectStructureProdInfo(room: Room): boolean;
	_refreshStructureProdInfo(room: Room): boolean;
}
declare class CDefenseInfo {
	defense: {
		[STRUCTURE_TOWER]: {
			status: "repair" | "attack" | "heal" | "idle",
			refillTowers: Array<StructureTower>
		}
	}
	_collectDefenseInfo(room: Room): boolean;
	_refreshDefenseInfo(room: Room): boolean;
}
declare class CPortalInfo {
	portals: Array<{ portal: StructurePortal, desti: RoomPosition | object }>
	_collectPortalInfo(room: Room): boolean;
	_refreshPortalInfo(room: Room): boolean;
}
declare class CControllerInfo {
	controller: {
		level: number,
		downgradeTick: number | null,
		reservedTick: number | null,
	}
	_collectControllerInfo(room: Room): boolean;
	_refreshControllerInfo(room: Room): boolean;
}
interface creepEvaluation {
	/** The higher, the more dangerous */
	danger: number,
	capacity: {
		dismantle: number,
		attack: number,
		rangedAttack: number,
		rangedMassAttack: number[],
		heal: number,
		rangedHeal: number
	},
	pos: RoomPosition,
	creep: Creep
}
declare class CCreepInfo {
	creeps: {
		live: Array<creepEvaluation>,
		spawning?: Array<creepEvaluation>
	}
	_collectCreepInfo(room: Room): boolean;
	_refreshCreepInfo(room: Room): boolean;
}
declare class RoomBase {
	room: Room;
	_callInternalMethod(key: string): boolean;
	refresh(): boolean;
}
declare class controlledRoom extends RoomBase implements CResourceInfo, CEconomyInfo, CDefenseInfo, CStructureProdInfo, CControllerInfo {
	_refreshResourceInfo(room: Room): boolean;
	_refreshEconomyInfo(room: Room): boolean;
	_refreshDefenseInfo(room: Room): boolean;
	_refreshStructureProdInfo(room: Room): boolean;
	_refreshControllerInfo(room: Room): boolean;
	resources: { [propName: string]: { storage?: number; terminal?: number; factory?: number; container?: number; lab?: number; }; };
	_collectResourceInfo(room: Room): boolean;
	economy: {
		energy: {
			available: { current: number; total: number; };
			/**
			 * Total Energy Stored / energyAvailableCapacity.
			 * Number of times to fill in completely.
			 */
			storage: { storage?: number; terminal?: number; factory?: number; };
		};
	};
	_collectEconomyInfo(room: Room): boolean;
	defense: { tower: { status: "repair" | "attack" | "heal" | "idle"; refillTowers: StructureTower[]; }; };
	_collectDefenseInfo(room: Room): boolean;
	structures: {
		container: {
			input: StructureContainer[]; output: StructureContainer[]; map: { [id: string]: StructureContainer; };
			/** Could be used as 'input' or 'output' */
			central: StructureContainer[];
		}; link: {
			input: StructureLink[]; output: StructureLink[];
			/** Could be used as 'input' or 'output' */
			central: StructureLink[]; map: { [id: string]: StructureLink }
		}; lab: { input: StructureLab[]; output: StructureLab[]; };
	};
	_collectStructureProdInfo(room: Room): boolean;
	controller: { level: number; downgradeTick: number; reservedTick: number; };
	_collectControllerInfo(room: Room): boolean;

}
declare class unownedRoom extends RoomBase implements CControllerInfo, CStructureProdInfo, CCreepInfo {
	_refreshControllerInfo(room: Room): boolean;
	_refreshStructureProdInfo(room: Room): boolean;
	_refreshCreepInfo(room: Room): boolean;
	controller: { level: number; downgradeTick: number; reservedTick: number; };
	_collectControllerInfo(room: Room): boolean;
	structures: {
		container: {
			input: StructureContainer[]; output: StructureContainer[]; map: { [id: string]: StructureContainer; };
			/** Could be used as 'input' or 'output' */
			central: StructureContainer[];
		}; link: {
			input: StructureLink[]; output: StructureLink[];
			/** Could be used as 'input' or 'output' */
			central: StructureLink[]; map: { [id: string]: StructureLink }
		}; lab: { input: StructureLab[]; output: StructureLab[]; };
	};
	_collectStructureProdInfo(room: Room): boolean;
	creeps: { live: creepEvaluation[]; spawning?: creepEvaluation[]; };
	_collectCreepInfo(room: Room): boolean;

}
declare class observedRoom extends RoomBase implements CStructureProdInfo, CCreepInfo, CPortalInfo {
	_refreshStructureProdInfo(room: Room): boolean;
	_refreshCreepInfo(room: Room): boolean;
	_refreshPortalInfo(room: Room): boolean;
	structures: {
		container: {
			input: StructureContainer[]; output: StructureContainer[]; map: { [id: string]: StructureContainer; };
			/** Could be used as 'input' or 'output' */
			central: StructureContainer[];
		}; link: {
			input: StructureLink[]; output: StructureLink[];
			/** Could be used as 'input' or 'output' */
			central: StructureLink[]; map: { [id: string]: StructureLink }
		}; lab: { input: StructureLab[]; output: StructureLab[]; };
	};
	_collectStructureProdInfo(room: Room): boolean;
	creeps: { live: creepEvaluation[]; spawning?: creepEvaluation[]; };
	_collectCreepInfo(room: Room): boolean;
	portals: { portal: StructurePortal; desti: RoomPosition | object; }[];
	_collectPortalInfo(room: Room): boolean;

}
declare class neutralRoom extends RoomBase implements CCreepInfo {
	_refreshCreepInfo(room: Room): boolean;
	creeps: { live: creepEvaluation[]; spawning?: creepEvaluation[]; };
	_collectCreepInfo(room: Room): boolean;

}
declare class hostileRoom extends RoomBase implements CResourceInfo, CEconomyInfo, CControllerInfo, CCreepInfo {
	_refreshResourceInfo(room: Room): boolean;
	_refreshEconomyInfo(room: Room): boolean;
	_refreshControllerInfo(room: Room): boolean;
	_refreshCreepInfo(room: Room): boolean;
	resources: { [propName: string]: { storage?: number; terminal?: number; factory?: number; container?: number; lab?: number; }; };
	_collectResourceInfo(room: Room): boolean;
	economy: {
		energy: {
			available: { current: number; total: number; };
			/**
			 * Total Energy Stored / energyAvailableCapacity.
			 * Number of times to fill in completely.
			 */
			storage: { storage?: number; terminal?: number; factory?: number; };
		};
	};
	_collectEconomyInfo(room: Room): boolean;
	controller: { level: number; downgradeTick: number; reservedTick: number; };
	_collectControllerInfo(room: Room): boolean;
	creeps: { live: creepEvaluation[]; spawning?: creepEvaluation[]; };
	_collectCreepInfo(room: Room): boolean;

}
