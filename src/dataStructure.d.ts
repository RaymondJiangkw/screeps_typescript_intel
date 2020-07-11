/**
 * Declaration of Priority Queue.
 */

declare abstract class PriorityQueue<T>{
	/**
	 * Place where data is stored.
	 */
	_mount?: object;
	_array: Array<T>;
	_length: number;
	_parent: (index: number) => number | undefined;
	_leftSon: (index: number) => number | undefined;
	_rightSon: (index: number) => number | undefined;
	get: () => T | undefined;
	pop: () => T | undefined;
	add: (item: T) => boolean;
	empty: () => boolean;
	_construct: () => boolean;
	_shiftUp: (index: number) => boolean;
	_shiftDown: (index: number) => boolean;
	_swap: (index_A: number, index_B: number) => boolean;
	/** This function is abstract, which needs to be realized. */
	_priority: (index: number) => number;
}

/**
 * Declaration of Tree.
 */
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
declare abstract class Tree<P, N extends ITreeNode<P>> {
	_mount?: TreeMount<P, N>;
	_tree: ITreeStructure<N>;
	_inner_link_class: { new(...args: any[]): N };
	_extractNode: (path: Array<string>) => ITreeStructure<N> | undefined;
	_nextNodes(path: Array<string>): Array<ITreeStructure<N>>;
	_nextNodes(node: ITreeStructure<N>): Array<ITreeStructure<N>>;
	_nextNodes(path_or_node: Array<string> | ITreeStructure<N>): Array<ITreeStructure<N>>;
	subNodes(path: Array<string>): Array<string>;
	subNodes(node: ITreeStructure<N>): Array<string>;
	subNodes(path_or_node: Array<string> | ITreeStructure<N>): Array<string>;
	clearLeaf: (path: Array<string>, settings: { clearAll: boolean }) => boolean;
}

declare class TreePriorityQueue<P, N extends PriorityQueue<P>> extends Tree<P, N> {
	addToLeaf: (item: P, path: Array<string>) => boolean;
	getFromLeaf: (path: Array<string>) => P | undefined;
	popFromLeaf: (path: Array<string>) => P | undefined;
}

declare class TreeArray<P> extends Tree<P, Array<P>> {
	pushToLeaf: (item: P, path: Array<string>) => boolean;
	popFromLeaf: (path: Array<string>) => P | undefined;
	assignToLeaf: (items: Array<P>, path: Array<string>) => boolean;
	getFromLeaf: (path: Array<string>) => P | undefined;
	getAllFromLeaf: (path: Array<string>) => P[];
	filterFromLeaf: (criterion: (item: P) => boolean, path: Array<string>) => P[];
	filterOneFromLeaf: (criterion: (item: P) => boolean, path: Array<string>) => P | undefined;
}
declare class TreeObject<P> extends Tree<P, { [propName: string]: P }>{
	/** This function can also be used to modify. */
	addToLeaf: (item: P, path: Array<string>, key: string) => boolean;
	assignToLeaf: (items: { [propName: string]: P }, path: Array<string>) => boolean;
	getFromLeaf: (path: Array<string>, key: string) => P | undefined;
	delFromLeaf: (path: Array<string>, key: string) => boolean;
	keys(path: Array<string>): string[];
	keys(node: ITreeStructure<{ [propName: string]: P }>): string[];
	keys(path_or_node: Array<string> | ITreeStructure<{ [propName: string]: P }>): string[];
}
