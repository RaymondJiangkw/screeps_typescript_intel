## Design

*Intelligence* is currently designed to be composed of `5` systems, [`taskSystem`](taskSystem.md), [`spawnSystem`](spawnSystem.md), [`infoSystem`](infoSystem.md), `supplyDemandSystem`*(under development)* and `structureSystem`*(under development)*.
### InfoSystem
#### Function
> Collect information about all visible rooms for further usage.

👁️ means **always visible**.

`Rooms` include
- controlledRoom. `Room`, which is under your control. 👁️
- unownedRoom. `Room`, which has totally *clean* `controller`, no `owner` or anybody to `reserve` it.
- observedRoom. `Room`, which does not have `controller`, *highway room* or *central room*, or is under your `reservation`.
- neutralRoom. `Room`, which is under neutral players', including possibly some of your neighbours and players of your alliance, control.
- hostileRoom. `Room`, which is under your enemies' control.

`Information` include
- resourceInfo. `Information` about all kinds of `resources` you possess in one specific `room`. They can be stored in `storage`, `terminal`, `factory`, `container`, `lab` and etc.
- economyInfo. `Information`, which is used to assess the economic situation of one specific `room`. It includes data of *availableEnergy* and *storedEnergy*.
- structureProdInfo. `Information`, which is used to evaluate the functions of some specific `structures`, including `link` and `container`, and the spatial structure of some specific `structures`, such as `lab`.
- defenseInfo. `Information` about *defense* status, including situation of `towers`, of one specific `room`.
- portalInfo. `Information` about `portals` inside one specific `room`.
- controllerInfo. `Information` about `controller` of one specific `room`, including its *level*, its *downgradeTick* and *reservedTick*.
- creepInfo. `Information` about *live* and *spawning* `creeps`, including their ability to *attack*, *rangedAttack*, *rangedMassAttack*, *heal*, *rangedHeal*, and *dismantle*, their *pos* and a `number` indicating its *danger level*.

Every kind of `room` can take arbitrary combination of `information` to collect.

### SpawnSystem
#### Function
> Control the spawning and bodyparts of creeps.

`SpawnSystem` currently still depends on `role` and `quantity`.
- `Role` needs to be *registered* into the system, along with its *bodypart-deciding* function and *quantity-comparison* function.
- `Quantity` is collected based on the **demand** from `taskSystem` as *expectedCreeps*. The number of each `role` does **NOT** mean directly the *expected number* of *live* `creeps` of this `role`. It should be compared with the *real number* of *live* `creeps` of this `role` as *currentCreeps* to decide whether to spawn more.

### TaskSystem
#### Function
> Issue and Run the tasks taken by creeps or powerCreeps.
#### Task Piece
`Task` is generally divided into three categories.
- Basic *(low-level)*. These tasks can be performed by single `creep`. **Notice**: This does not mean it can only be received by one `creep`.
- Medium *(medium-level)*. These tasks should be performed by a group of `creeps`. **Notice**: These tasks have the ability to issue *Basic Tasks*.
- Advanced *(high-level)*. These tasks do not have specific `objects` to act upon. They only make the general decisions, and **lead** the *Medium Task* and *Basic Task*.

Each `Task` has its unique `id`, which is calculated based on its `data` to avoid **duplication**. Despite this, *salt* is added to allow for **duplication**.
#### Structure
`TaskSystem` is composed of `Processor`, which **receives** instructions, `Controller`, which **gives** instructions and `Loader`, which **loads** all necessary information.

##### Processor
###### Units
- Storage Unit. This Unit is responsible for storing all the tasks which still have room for being received.
- Run Unit. This Unit is responsible for running all the tasks which have been **at least** received by `1` `creep` based on the received instructions.
- Core Unit. This Unit is responsible for making the cooperation between *Storage Unit* and *Run Unit*. It directly have access to all *tasks waiting to be received*, all *tasks having been received by any* and all *creeps* and *powerCreeps*.

##### Controller
###### Units
- Record Unit. This Unit is responsible for recording some information during the whole running process, which is reserved for further usage, such as adjustment.
- Adjust Unit. This Unit directly adjusts the settings of *Issue Unit* and *Run Unit* based on the information collected in *Record Unit*.
- Issue Unit. This Unit statistically issue the tasks. It includes:
    - List. Scan at every tick. `Issue` the task if `condition` is satisfied.
    - Timer. Happen at specific tick.  Call the function to `issue` task.
    - Scheduler. Happen at some intervals. Call the function to `issue` task.
    - Watcher. Happen when some `event` occurs. Call the function to `issue` task.
- Run Unit. This Unit makes decision to select tasks to run.

##### Loader
`Loader` is used as a port to *register* and *unregister* `creeps` into and from the `taskSystem`.
