interface Room {
	_checkRoomCache: () => void;
	_checkRuinCache: () => void;
	_checkBuildCache: () => void;
	_checkRepairCache: () => void;
	_checkHostileStructureCache: () => void;
	"spawns": Array<StructureSpawn>,
	"extensions": Array<StructureExtension>,
	"roads": Array<StructureRoad>,
	"constructedWalls": Array<StructureWall>,
	"ramparts": Array<StructureRampart>,
	"keeperLairs": Array<StructureKeeperLair>,
	"portals": Array<StructurePortal>,
	"links": Array<StructureLink>,
	"towers": Array<StructureTower>,
	"observer": StructureObserver | null,
	"powerBanks": Array<StructurePowerBank>,
	"powerSpawn": StructurePowerSpawn | null,
	"extractor": StructureExtractor | null,
	"labs": Array<StructureLab>,
	"containers": Array<StructureContainer>,
	"nuker": StructureNuker | null,
	"factory": StructureFactory | null,
	"buildTargets": Array<ConstructionSite>,
	"repairTargets": Array<Structure>,
	"ruins": Array<Ruin>,
	"hostileStructures": Array<Structure>
}
