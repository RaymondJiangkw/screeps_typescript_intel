/// <reference path="../types.d.ts" />
/**
 * 在绘制控制台信息时使用的颜色
 * @author HoPGoldy
 */
export const colors: { [name in Colors]: string } = {
	red: '#ef9a9a',
	green: '#6b9955',
	yellow: '#c5c599',
	blue: '#8dc5e3'
}

/**
 * 在绘制控制台信息时默认的信息类型
 * {@link infoType}
 */
export const typeInfo: Array<infoType> = ["debug", "warning", "notice"];

/**
 * 在绘制控制台信息时默认的颜色
 */
export const colorInfo: { [name in infoType]: Colors | null } = {
	"debug": null,
	"warning": "yellow",
	"notice": "red"
}

/**
 * 在绘制控制台信息时默认的等级
 */
export const levelInfo: { [name in infoType]: number } = {
	"debug": 1,
	"warning": 0,
	"notice": 100
}

export const bodypartBaseData: { [bodypart in BodyPartConstant]: { [behavior: string]: number | number[] } } = {
	"move": {
		"fatigue": 2 // Points.
	},
	"work": {
		"harvest": [2, 1], // Units. [Source, Mineral/Deposite]
		"build": 5, //Units
		"repair": 100, // Hits
		"dismantle": 50, // Hits
		"upgradeController": 1 // Unit
	},
	"carry": {
		"capacity": 50 // Unit
	},
	"attack": {
		"attack": 30 // Hits
	},
	"ranged_attack": {
		"rangedAttack": 10, // Hits
		"rangedMassAttack": [10, 4, 1] // Hits
	},
	"heal": {
		"heal": 12, // Hits
		"rangedHeal": 4 // Hits
	},
	"claim": {
		"reserveController": 1, // Ticks.
		"attackController": [300, 1], // Ticks. [Hostile, Neutral]
	},
	"tough": {

	}
}

export const compoundEffects: { [bodypart in BodyPartConstant]: { [behavior: string]: { [compound: string]: number } } } = {
	"move": {
		"fatigue": {
			"ZO": 2,
			"ZHO2": 3,
			"XZHO2": 4
		}
	},
	"attack": {
		"attack": {
			"UH": 2,
			"UH2O": 3,
			"XUH2O": 4
		}
	},
	"work": {
		"harvest": {
			"UO": 3,
			"UHO2": 5,
			"XUHO2": 7
		},
		"repair": {
			"LH": 1.5,
			"LH2O": 1.8,
			"XLH2O": 2
		},
		"build": {
			"LH": 1.5,
			"LH2O": 1.8,
			"XLH2O": 2
		},
		"dismantle": {
			"ZH": 2,
			"ZH2O": 3,
			"XZH2O": 4
		},
		"upgradeController": {
			"GH": 1.5,
			"GH2O": 1.8,
			"XGH2O": 2
		}
	},
	"carry": {
		"capcity": {
			"KH": 2,
			"KH2O": 3,
			"XKH2O": 4
		}
	},
	"ranged_attack": {
		"rangedAttack": {
			"KO": 2,
			"KHO2": 3,
			"XKHO2": 4
		},
		"rangedMassAttack": {
			"KO": 2,
			"KHO2": 3,
			"XKHO2": 4
		}
	},
	"heal": {
		"heal": {
			"LO": 2,
			"LHO2": 3,
			"XLHO2": 4
		},
		"rangedHeal": {
			"LO": 2,
			"LHO2": 3,
			"XLHO2": 4
		}
	},
	"tough": {
		"damage": {
			"GO": 0.7,
			"GHO2": 0.5,
			"XGHO2": 0.3
		}
	},
	"claim": {

	}
}

/** Constants of refreshing interval of room information */
export const roomInfoRefreshInterval = {
	"resource": 2,
	"economy": 2,
	"structure": 500,
	"defense": 2,
	"portal": 500,
	"controller": 500,
	"creep": 2
}

/** The Interval between the spawn of two Creeps */
export const spawnInterval = 50;

export const structureMultipleList = [
	STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_ROAD, STRUCTURE_WALL,
	STRUCTURE_RAMPART, STRUCTURE_KEEPER_LAIR, STRUCTURE_PORTAL, STRUCTURE_LINK,
	STRUCTURE_TOWER, STRUCTURE_LAB, STRUCTURE_CONTAINER, STRUCTURE_POWER_BANK,
];

export const structureSingleList = [
	STRUCTURE_OBSERVER, STRUCTURE_POWER_SPAWN, STRUCTURE_EXTRACTOR, STRUCTURE_NUKER,
	STRUCTURE_CONTROLLER, STRUCTURE_FACTORY, // STRUCTURE_STORAGE, STRUCTURE_TERMINAL,
];
