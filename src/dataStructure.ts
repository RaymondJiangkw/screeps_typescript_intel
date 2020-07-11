import { Test } from "mocha";

/** This function is used to merge two array. The item which is in both @param array and @param source will only appears once in @returns. */
function mergeArray<T>(array: Array<T>, source: Array<T>): Array<T> {
	let ret: Array<T> = ([] as Array<T>).concat(array);
	for (let item of source) {
		if (ret.indexOf(item) < 0) ret.push(item);
	}
	return ret;
}

/**
 * This Priority Queue is min-heap.
 * The Root is the smallest.
 */
interface PriorityQueueMount<T> {
	_array: Array<T>;
}
export abstract class PriorityQueue<T>{
	_mount?: PriorityQueueMount<T>;
	_array: Array<T>;
	_length: number;
	abstract _priority(index: number): number;
	_parent(index: number): number | undefined {
		if (index === 0) return undefined;
		if (index % 2 === 0) return index / 2 - 1;
		else return (index - 1) / 2;
	}
	/** Swap will not check the legality of swapping operation. */
	_swap(index_A: number, index_B: number): boolean {
		const tmp: T = this._array[index_A];
		this._array[index_A] = this._array[index_B];
		this._array[index_B] = tmp;
		return true;
	}
	_leftSon(index: number): number | undefined {
		if (index * 2 + 1 >= this._length) return undefined;
		return index * 2 + 1;
	}
	_rightSon(index: number): number | undefined {
		if (index * 2 + 2 >= this._length) return undefined;
		return index * 2 + 2;
	}
	_shiftUp(index: number): boolean {
		const parent = this._parent(index);
		if (!parent) return true;
		if (this._priority(index) < this._priority(parent)) {
			this._swap(index, parent);
			return this._shiftUp(parent);
		}
		return true;
	}
	_shiftDown(index: number): boolean {
		let min_son: number = index;
		const left_son: number | undefined = this._leftSon(index);
		const right_son: number | undefined = this._rightSon(index);
		if (left_son && this._priority(left_son) < this._priority(min_son)) min_son = left_son;
		if (right_son && this._priority(right_son) < this._priority(min_son)) min_son = right_son;
		if (min_son !== index) {
			this._swap(index, min_son);
			return this._shiftDown(min_son);
		}
		return true;
	}
	_construct(): boolean {
		for (let i = this._length - 2; i >= 0; i--) this._shiftDown(i);
		return true;
	}
	get(): T | undefined {
		if (this._length > 0) return this._array[0];
		else return undefined;
	}
	pop(): T | undefined {
		if (this._length === 0) return undefined;
		const ret: T = this.get() as T;
		this._length--;
		if (this._length > 0) {
			this._array[0] = this._array[this._length];
			this._shiftDown(0);
		}
		return ret;
	}
	add(item: T): boolean {
		this._array[this._length] = item;
		this._length++;
		this._shiftUp(this._length - 1);
		return true;
	}
	empty(): boolean {
		return this._length === 0;
	}
	/** @param mount This is allowed to be undefined by default, which means that all the data will be mounted upon itself. */
	constructor(items: Array<T> = [], mount: object | undefined = undefined) {
		if (mount) {
			this._mount = mount as PriorityQueueMount<T>;
			// Take the case that some data is left into account.
			if (!this._mount._array || this._mount._array.length === 0) this._mount._array = items;
			else this._mount._array = mergeArray(this._mount._array, items);
			this._array = this._mount._array;
		} else this._array = items;
		this._length = this._array.length;
		this._construct();
	}
}

/** Due to some weired reasons of TypeScript, it will cause errors if directly refers to this variable. */
export const TREE_VALUE_VARIABLE_NAME = "mount_value_of_node";

interface ITreeStructure<T> {
	mount_value_of_node?: T;
	[key: string]: ITreeStructure<T> | T | undefined;
}

/** This interface is only used for noticing that it should be a collection of T, in whatever form. */
interface ITreeNode<T> {

}

interface TreeMount<P, N extends ITreeNode<P>> {
	_tree: ITreeStructure<N>;
}

/**
 * Notice: When using the Tree, you should avoid the path name {@link TREE_VALUE_VARIABLE_NAME}.
 * P: Type of single piece of Data.
 * N: Type of storing structure of P.
 */
export abstract class Tree<P, N extends ITreeNode<P>> {
	_mount?: TreeMount<P, N>;
	_tree: ITreeStructure<N>;
	_inner_link_class: { new(...args: any[]): N };
	/** @param mount This is allowed to be undefined by default, which means that all the data will be mounted upon itself. */
	constructor(link_class: { new(...args: any[]): N }, mount: object | undefined = undefined) {
		if (mount) {
			this._mount = mount as TreeMount<P, N>;
			// Since mount point could be Memory or Global, we should take the case that the data stored in it was not lost into account.
			if (!this._mount._tree) this._mount._tree = {};
			this._tree = this._mount._tree;
		} else this._tree = {};
		this._inner_link_class = link_class;
	}
	_extractNode(path: Array<string>): ITreeStructure<N> | undefined {
		let node: ITreeStructure<N> = this._tree;
		for (let key of path) {
			if (key === TREE_VALUE_VARIABLE_NAME) return undefined;
			if (!node[key]) node[key] = {};
			node = node[key] as ITreeStructure<N>;
		}
		return node;
	}
	_nextNodes(path: Array<string>): Array<ITreeStructure<N>>;
	_nextNodes(node: ITreeStructure<N>): Array<ITreeStructure<N>>;
	_nextNodes(path_or_node: Array<string> | ITreeStructure<N>): Array<ITreeStructure<N>> {
		let node: ITreeStructure<N> | undefined = undefined;
		if (Array.isArray(path_or_node)) {
			node = this._extractNode(path_or_node);
			if (node === undefined) return [];
		} else node = path_or_node;
		let ret: Array<ITreeStructure<N>> = [];
		for (let key in node) {
			if (key !== "mount_value_of_node") ret.push(node[key] as ITreeStructure<N>);
		}
		return ret;
	}
	subNodes(path: Array<string>): Array<string>;
	subNodes(node: ITreeStructure<N>): Array<string>;
	subNodes(path_or_node: Array<string> | ITreeStructure<N>): Array<string> {
		let node: ITreeStructure<N> | undefined = undefined;
		if (Array.isArray(path_or_node)) {
			node = this._extractNode(path_or_node);
			if (node === undefined) return [];
		} else node = path_or_node;
		let ret: Array<string> = [];
		for (let key in node) {
			if (key !== "mount_value_of_node") ret.push(key);
		}
		return ret;
	}
	clearLeaf(path: Array<string>, settings = { clearAll: false }): boolean {
		_.defaults(settings, { clearAll: false });
		let node = this._extractNode(path);
		if (node === undefined) return false;
		if (node["mount_value_of_node"]) delete node["mount_value_of_node"];
		if (settings.clearAll) for (let subNode in node) delete node[subNode];
		return true;
	}
}

export class TreePriorityQueue<P, N extends PriorityQueue<P>> extends Tree<P, N> {
	addToLeaf(item: P, path: Array<string>): boolean {
		let node = this._extractNode(path);
		if (node === undefined) return false;
		if (!node["mount_value_of_node"]) node["mount_value_of_node"] = new this._inner_link_class();
		return node["mount_value_of_node"].add(item);
	}
	getFromLeaf(path: Array<string>): P | undefined {
		let node = this._extractNode(path);
		if (node === undefined || !node["mount_value_of_node"]) return undefined;
		return node["mount_value_of_node"].get();
	}
	popFromLeaf(path: Array<string>): P | undefined {
		let node = this._extractNode(path);
		if (node === undefined || !node["mount_value_of_node"]) return undefined;
		return node["mount_value_of_node"].pop();
	}
}

export class TreeArray<P> extends Tree<P, Array<P>> {
	pushToLeaf(item: P, path: Array<string>): boolean {
		let node = this._extractNode(path);
		if (node === undefined) return false;
		if (!node["mount_value_of_node"]) node["mount_value_of_node"] = new this._inner_link_class();
		node["mount_value_of_node"].push(item);
		return true;
	}
	popFromLeaf(path: Array<string>): P | undefined {
		let node = this._extractNode(path);
		if (node === undefined || !node["mount_value_of_node"]) return undefined;
		return node["mount_value_of_node"].pop();
	}
	getFromLeaf(path: Array<string>): P | undefined {
		let node = this._extractNode(path);
		if (node === undefined || !node["mount_value_of_node"]) return undefined;
		return node["mount_value_of_node"][node["mount_value_of_node"].length - 1];
	}
	getAllFromLeaf(path: Array<string>): Array<P> {
		let node = this._extractNode(path);
		if (node === undefined || !node["mount_value_of_node"]) return [];
		return node["mount_value_of_node"];
	}
	filterFromLeaf(criterion: (item: P) => boolean, path: Array<string>): P[] {
		let node = this._extractNode(path);
		if (node === undefined || !node["mount_value_of_node"]) return [];
		return _.filter(node["mount_value_of_node"], criterion);
	}
	filterOneFromLeaf(criterion: (item: P) => boolean, path: Array<string>): P | undefined {
		let node = this._extractNode(path);
		if (node === undefined || !node["mount_value_of_node"]) return undefined;
		for (let item of node["mount_value_of_node"]) if (criterion(item)) return item;
		return undefined;
	}
	assignToLeaf(items: Array<P>, path: Array<string>): boolean {
		let node = this._extractNode(path);
		if (node === undefined) return false;
		node["mount_value_of_node"] = items;
		return true;
	}
	constructor(mount: object | undefined = undefined) {
		super(Array, mount);
	}
}

export class TreeObject<P> extends Tree<P, { [propName: string]: P }>{
	/** This function can also be used to modify. */
	addToLeaf(item: P, path: Array<string>, key: string): boolean {
		let node = this._extractNode(path);
		if (node === undefined) return false;
		if (!node["mount_value_of_node"]) node["mount_value_of_node"] = new this._inner_link_class();
		node["mount_value_of_node"][key] = item;
		return true;
	}
	getFromLeaf(path: Array<string>, key: string): P | undefined {
		let node = this._extractNode(path);
		if (node === undefined || !node["mount_value_of_node"]) return undefined;
		return node["mount_value_of_node"][key];
	}
	delFromLeaf(path: Array<string>, key: string): boolean {
		let node = this._extractNode(path);
		if (node === undefined || !node["mount_value_of_node"] || !node["mount_value_of_node"][key]) return false;
		delete node['mount_value_of_node'][key];
		return true;
	}
	assignToLeaf(items: { [propName: string]: P }, path: Array<string>): boolean {
		let node = this._extractNode(path);
		if (node === undefined) return false;
		node["mount_value_of_node"] = items;
		return true;
	}
	keys(path: Array<string>): string[];
	keys(node: ITreeStructure<{ [propName: string]: P }>): string[];
	keys(path_or_node: Array<string> | ITreeStructure<{ [propName: string]: P }>): string[] {
		let node: ITreeStructure<{ [propName: string]: P }> | undefined = undefined;
		if (Array.isArray(path_or_node)) {
			node = this._extractNode(path_or_node);
			if (node === undefined) return [];
		} else node = path_or_node;
		if (!node["mount_value_of_node"]) return [];
		let ret: Array<string> = [];
		for (let key in node["mount_value_of_node"]) ret.push(key);
		return ret;
	}
	constructor(mount: object | undefined = undefined) {
		super(Object as any, mount);
	}
}
