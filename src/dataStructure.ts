import { Test } from "mocha";

/**
 * This Priority Queue is min-heap.
 * The Root is the smallest.
 */
interface PriorityQueueMount<T> {
	_array: Array<T>;
}
abstract class PriorityQueue<T>{
	protected _mount: PriorityQueueMount<T>;
	protected _array: Array<T>;
	protected _length: number;
	protected abstract _priority: (index: number) => number;
	protected _parent(index: number): number | undefined {
		if (index === 0) return undefined;
		if (index % 2 === 0) return index / 2 - 1;
		else return (index - 1) / 2;
	}
	/** Swap will not check the legality of swapping operation. */
	protected _swap(index_A: number, index_B: number): boolean {
		const tmp: T = this._array[index_A];
		this._array[index_A] = this._array[index_B];
		this._array[index_B] = tmp;
		return true;
	}
	protected _leftSon(index: number): number | undefined {
		if (index * 2 + 1 >= this._length) return undefined;
		return index * 2 + 1;
	}
	protected _rightSon(index: number): number | undefined {
		if (index * 2 + 2 >= this._length) return undefined;
		return index * 2 + 2;
	}
	protected _shiftUp(index: number): boolean {
		const parent = this._parent(index);
		if (!parent) return true;
		if (this._priority(index) < this._priority(parent)) {
			this._swap(index, parent);
			return this._shiftUp(parent);
		}
		return true;
	}
	protected _shiftDown(index: number): boolean {
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
	protected _construct(): boolean {
		for (let i = this._length - 2; i >= 0; i--) this._shiftDown(i);
		return true;
	}
	public get(): T | undefined {
		if (this._length > 0) return this._array[0];
		else return undefined;
	}
	public pop(): T | undefined {
		if (this._length === 0) return undefined;
		const ret: T = this.get() as T;
		this._length--;
		if (this._length > 0) {
			this._array[0] = this._array[this._length];
			this._shiftDown(0);
		}
		return ret;
	}
	public add(item: T): boolean {
		this._array[this._length] = item;
		this._length++;
		this._shiftUp(this._length - 1);
		return true;
	}
	constructor(mount: object, items: Array<T> = []) {
		this._mount = mount as PriorityQueueMount<T>;
		this._mount._array = items;
		this._array = this._mount._array;
		this._length = items.length;
		this._construct();
	}
}

/** Due to some weired reasons of TypeScript, it will cause errors if directly refers to this variable. */
const TREE_VALUE_VARIABLE_NAME = "mount_value_of_node";

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
abstract class Tree<P, N extends ITreeNode<P>> {
	protected _mount: TreeMount<P, N>;
	protected _tree: ITreeStructure<N>;
	protected _inner_link_class: { new(...args: any[]): N };
	constructor(mount: object, link_class: { new(...args: any[]): N }) {
		this._mount = mount as TreeMount<P, N>;
		this._mount._tree = {};
		this._tree = this._mount._tree;
		this._inner_link_class = link_class;
	}
	protected _extractNode(path: Array<string>): ITreeStructure<N> | undefined {
		let node: ITreeStructure<N> = this._tree;
		for (let key of path) {
			if (key === TREE_VALUE_VARIABLE_NAME) return undefined;
			if (!node[key]) node[key] = {};
			node = node[key] as ITreeStructure<N>;
		}
		return node;
	}
	protected _nextNodes(path: Array<string>): Array<ITreeStructure<N>> | undefined {
		let node = this._extractNode(path);
		if (node === undefined) return undefined;
		let ret: Array<ITreeStructure<N>> = [];
		for (let key in node) {
			if (key !== "mount_value_of_node") ret.push(node[key] as ITreeStructure<N>);
		}
		return ret;
	}
	public clearLeaf(path: Array<string>): boolean {
		let node = this._extractNode(path);
		if (node === undefined || !node["mount_value_of_node"]) return false;
		delete node["mount_value_of_node"];
		return true;
	}
}

class TreePriorityQueue<P, N extends PriorityQueue<P>> extends Tree<P, N> {
	public addToLeaf(item: P, path: Array<string>): boolean {
		let node = this._extractNode(path);
		if (node === undefined) return false;
		if (!node["mount_value_of_node"]) node["mount_value_of_node"] = new this._inner_link_class();
		return node["mount_value_of_node"].add(item);
	}
	public getFromLeaf(path: Array<string>): P | undefined {
		let node = this._extractNode(path);
		if (node === undefined || !node["mount_value_of_node"]) return undefined;
		return node["mount_value_of_node"].get();
	}
	public popFromLeaf(path: Array<string>): P | undefined {
		let node = this._extractNode(path);
		if (node === undefined || !node["mount_value_of_node"]) return undefined;
		return node["mount_value_of_node"].pop();
	}
}

class TreeArray<P> extends Tree<P, Array<P>> {
	public pushToLeaf(item: P, path: Array<string>): boolean {
		let node = this._extractNode(path);
		if (node === undefined) return false;
		if (!node["mount_value_of_node"]) node["mount_value_of_node"] = new this._inner_link_class();
		node["mount_value_of_node"].push(item);
		return true;
	}
	public getFromLeaf(path: Array<string>): Array<P> | undefined {
		let node = this._extractNode(path);
		if (node === undefined || !node["mount_value_of_node"]) return undefined;
		return node["mount_value_of_node"];
	}
	public filterFromLeaf(criterion: (item: P) => boolean, path: Array<string>): boolean {
		let node = this._extractNode(path);
		if (node === undefined || !node["mount_value_of_node"]) return false;
		node["mount_value_of_node"] = _.filter(node["mount_value_of_node"], criterion);
		return true;
	}
}

class TreeObject<P> extends Tree<P, { [propName: string]: P | undefined }>{
	/** This function can also be used to modify. */
	public addToLeaf(item: P, path: Array<string>, key: string): boolean {
		let node = this._extractNode(path);
		if (node === undefined) return false;
		if (!node["mount_value_of_node"]) node["mount_value_of_node"] = new this._inner_link_class();
		node["mount_value_of_node"][key] = item;
		return true;
	}
	public getFromLeaf(path: Array<string>, key: string): P | undefined {
		let node = this._extractNode(path);
		if (node === undefined || !node["mount_value_of_node"]) return undefined;
		return node["mount_value_of_node"][key];
	}
	public delFromLeaf(path: Array<string>, key: string): boolean {
		let node = this._extractNode(path);
		if (node === undefined || !node["mount_value_of_node"] || !node["mount_value_of_node"][key]) return false;
		delete node['mount_value_of_node'][key];
		return true;
	}
}
