interface Room {
	_checkRoomResourceCache: () => void;
	_checkRoomDroppedResourcesCache: () => void;
	"energys": Array<Source>,
	"mists": Array<Deposit>,
	"biomasss": Array<Deposit>,
	"metals": Array<Deposit>,
	"silicons": Array<Deposit>,
	"H": Mineral | null,
	"O": Mineral | null,
	"U": Mineral | null,
	"L": Mineral | null,
	"K": Mineral | null,
	"Z": Mineral | null,
	"X": Mineral | null,
	"mineral": Mineral | null,
	"droppedResources": Array<Resource>,
	"droppedEnergys": Array<Resource>
}
