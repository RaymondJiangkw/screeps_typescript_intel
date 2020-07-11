/// <reference path = "../types.d.ts" />
export function mountRoomCreeps() {
	Object.defineProperty(Room.prototype, "creeps", {
		get: function () {
			if (this["_creeps"] && this["_creeps_ts"] === Game.time) {
				return this["_creeps"];
			} else {
				this["_creeps_ts"] = Game.time;
				return this["_creeps"] = _.filter(Game.creeps, (creep) => creep.memory.home === this.name);
			}
		},
		set: function () { },
		enumerable: false,
		configurable: true,
	});
	Object.defineProperty(Room.prototype, "enemies", {
		get: function () {
			if (this["_enemies"] && this["_enemies_ts"] === Game.time) {
				return this["_enemies"];
			} else {
				this["_enemies_ts"] = Game.time;
				return this["_enemies"] = this.find(FIND_HOSTILE_CREEPS);
			}
		},
		set: function () { },
		enumerable: false,
		configurable: true
	});

}
