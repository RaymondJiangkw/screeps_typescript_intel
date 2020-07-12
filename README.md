# Screeps-script Intelligence

> *Intelligence* is a framework which is intended to provide much convenience to the development of script for [*Screeps*](https://screeps.com).

[![Maintainability](https://api.codeclimate.com/v1/badges/ce3ef85bac7916ee1926/maintainability)](https://codeclimate.com/github/RaymondJiangkw/screeps_typescript_intel/maintainability)


## Table of Contents

- [Installation](#installation)
- [Features](#features)
- [Usage](#usage)
- [Documentation](#documentation)
- [Log](#log)

---

## Installation
```shell
$ yarn
```

## Features

*Intelligence* is a framework I write for game [*Screeps*](https://screeps.com).

My purpose is to make the development of AI system much more convenient.

What you should focus is the logic for *combating*, *trading*, *planning*, *detection* and etc.

What you should **NOT** focus is
- How to organize creeps so that they can work as a `team` or `quad`.
- How to organize tasks so that `High-level Tasks` guide `Low-level Tasks`.
- How to solve the issue and termination of tasks under certain conditions or *events*, including the death of creep.
- Where should I embed the code for `room planner` and `dynamic bodyparts`, so that they are decoupled from other modules.
- etc.

*Intelligence* wants to solve these for you, so that you can focus concentrically on your clever strategies instead of worrying about the details of running of system.

Admittedly, *Intelligence* is still under the development and I am still not a very experienced developer. There might be many bugs and inefficient stuff waiting for improvement. So, any kind of advice will be appreciated.

## Usage
> Dry Compile
```shell
$ rollup -c
```

> Compile and Upload
```shell
$ rollup -c --environment DEST:main
```

> Automatically re-run when source code changes
```shell
$ rollup -cw --environment DEST:main
```
## Documentation

- [Introduction](./docs/introduction.md)
- [Main Loop](./docs/main_loop.md)
- [Information System](./docs/infoSystem.md)

## Log

- 2020/07/12 Initialize *README.md* and plan for review of the whole process, `infoSystem` -> `taskSystem` -> `spawnSystem`.
