/// <reference path="prototype.Room.resources.d.ts" />
import { getCacheExpiration } from "../utils/utils";
var roomResources: { [roomName: string]: { [resourceName: string]: Array<string> } } = {};
var roomResourcesExpiration: { [roomName: string]: number } = {};

var roomDroppedResources: { [roomName: string]: Array<string> } = {};
var roomDroppedResourcesExpiration: { [roomName: string]: number } = {};

const resourceMultipleList = [
	RESOURCE_ENERGY, RESOURCE_MIST, RESOURCE_BIOMASS, RESOURCE_METAL,
	RESOURCE_SILICON,
];
const resourceSingleList = [
	RESOURCE_HYDROGEN, RESOURCE_OXYGEN, RESOURCE_UTRIUM, RESOURCE_LEMERGIUM,
	RESOURCE_KEANIUM, RESOURCE_ZYNTHIUM, RESOURCE_CATALYST,
];
export function mountRoomResources() {
	Room.prototype._checkRoomResourceCache = function _checkRoomResourceCache() {
		if (!roomResourcesExpiration[this.name] || !roomResources[this.name] || roomResourcesExpiration[this.name] < Game.time) {
			roomResourcesExpiration[this.name] = Game.time + getCacheExpiration();
			const sources = this.find(FIND_SOURCES);
			const minerals = this.find(FIND_MINERALS);
			const deposits = this.find(FIND_DEPOSITS);
			var resources = ([] as Array<Source | Mineral | Deposit>).concat(sources, minerals, deposits);
			roomResources[this.name] = _.groupBy(resources, s => (s as Mineral).mineralType || (s as Deposit).depositType || "energy") as any;
			var i;
			for (i in roomResources[this.name]) {
				roomResources[this.name][i] = _.map(roomResources[this.name][i], r => (r as unknown as Source | Mineral | Deposit).id);
			}
		}
	}

	Room.prototype._checkRoomDroppedResourcesCache = function _checkRoomDroppedResourcesCache() {
		if (!roomDroppedResourcesExpiration[this.name] || !roomDroppedResources[this.name] || roomDroppedResourcesExpiration[this.name] < Game.time) {
			roomDroppedResourcesExpiration[this.name] = Game.time + getCacheExpiration(10, 3);
			roomDroppedResources[this.name] = this.find(FIND_DROPPED_RESOURCES) as any;
			roomDroppedResources[this.name] = _.map(roomDroppedResources[this.name], r => (r as unknown as Resource).id)
		}
	}

	resourceMultipleList.forEach(function (type) {
		Object.defineProperty(Room.prototype, type + "s", {
			get: function () {
				if (this["_" + type + "s"] && this["_" + type + "s_ts"] === Game.time) {
					return this["_" + type + "s"];
				} else {
					this._checkRoomResourceCache();
					if (roomResources[this.name][type]) {
						this["_" + type + "s_ts"] = Game.time;
						return this["_" + type + "s"] = _.filter(roomResources[this.name][type].map(Game.getObjectById), s => s);
					} else {
						this["_" + type + "s_ts"] = Game.time;
						return this["_" + type + "s"] = [];
					}
				}
			},
			set: function () { },
			enumerable: false,
			configurable: true,
		})
	})
	resourceSingleList.forEach(function (type) {
		Object.defineProperty(Room.prototype, type, {
			get: function () {
				if (this["_" + type] && this["_" + type + "_ts"] === Game.time) {
					return this["_" + type];
				} else {
					this._checkRoomResourceCache();
					if (roomResources[this.name][type]) {
						this["_" + type + "_ts"] = Game.time;
						return this["_" + type] = Game.getObjectById(roomResources[this.name][type][0]);
					} else {
						this["_" + type + "_ts"] = Game.time;
						return this["_" + type] = null;
					}
				}
			},
			set: function () { },
			enumerable: false,
			configurable: true,
		})
	})
	Object.defineProperty(Room.prototype, "mineral", {
		get: function () {
			if (this["_mineral"] && this["_mineral_ts"] === Game.time) {
				return this["_mineral"];
			} else {
				this["_mineral_ts"] = Game.time;
				for (var mineralType of resourceSingleList) {
					if (this[mineralType]) return this["_mineral"] = this[mineralType];
				}
				return this["_mineral"] = null;
			}
		},
		set: function () { },
		enumerable: false,
		configurable: true
	})

	Object.defineProperty(Room.prototype, "droppedResources", {
		get: function () {
			if (this["_droppedResources"] && this["_droppedResources_ts"] === Game.time) {
				return this["_droppedResources"];
			} else {
				this._checkRoomDroppedResourcesCache();
				if (roomDroppedResources[this.name]) {
					this["_droppedResources_ts"] = Game.time;
					return this["_droppedResources"] = _.filter(roomDroppedResources[this.name].map(Game.getObjectById), s => s);
				} else {
					this["_droppedResources_ts"] = Game.time;
					return this["_droppedResources"] = [];
				}
			}
		},
		set: function () { },
		enumerable: false,
		configurable: true
	})
	Object.defineProperty(Room.prototype, "droppedEnergys", {
		get: function () {
			if (this["_droppedEnergys"] && this["_droppedEnergys_ts"] === Game.time) {
				return this["_droppedEnergys"];
			}
			else {
				const _droppedEnergys = _.filter(this.droppedResources, r => (r as Resource).resourceType === RESOURCE_ENERGY);
				this["_droppedEnergys_ts"] = Game.time;
				return this["_droppedEnergys"] = _droppedEnergys;
			}
		},
		set: function () { },
		enumerable: false,
		configurable: true
	})
}
