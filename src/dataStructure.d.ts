/**
 * Declaration of Priority Queue.
 */

declare abstract class PriorityQueue<T>{
	/**
	 * Place where data is stored.
	 */
	protected _mount?: object;
	protected _array: Array<T>;
	protected _length: number;
	protected _parent: (index: number) => number | undefined;
	protected _leftSon: (index: number) => number | undefined;
	protected _rightSon: (index: number) => number | undefined;
	public get: () => T | undefined;
	public pop: () => T | undefined;
	public add: (item: T) => boolean;
	public empty: () => boolean;
	protected _construct: () => boolean;
	protected _shiftUp: (index: number) => boolean;
	protected _shiftDown: (index: number) => boolean;
	protected _swap: (index_A: number, index_B: number) => boolean;
	/** This function is abstract, which needs to be realized. */
	protected _priority: (index: number) => number;
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
	public addToLeaf: (item: P, path: Array<string>) => boolean;
	public getFromLeaf: (path: Array<string>) => P | undefined;
	public popFromLeaf: (path: Array<string>) => P | undefined;
}

declare class TreeArray<P> extends Tree<P, Array<P>> {
	public pushToLeaf: (item: P, path: Array<string>) => boolean;
	public popFromLeaf: (path: Array<string>) => P | undefined;
	public assignToLeaf: (items: Array<P>, path: Array<string>) => boolean;
	public getFromLeaf: (path: Array<string>) => P | undefined;
	public getAllFromLeaf: (path: Array<string>) => P[];
	public filterFromLeaf: (criterion: (item: P) => boolean, path: Array<string>) => P[];
	public filterOneFromLeaf: (criterion: (item: P) => boolean, path: Array<string>) => P | undefined;
}
declare class TreeObject<P> extends Tree<P, { [propName: string]: P }>{
	/** This function can also be used to modify. */
	public addToLeaf: (item: P, path: Array<string>, key: string) => boolean;
	public assignToLeaf: (items: { [propName: string]: P }, path: Array<string>) => boolean;
	public getFromLeaf: (path: Array<string>, key: string) => P | undefined;
	public delFromLeaf: (path: Array<string>, key: string) => boolean;
	public keys(path: Array<string>): string[];
	public keys(node: ITreeStructure<{ [propName: string]: P }>): string[];
	public keys(path_or_node: Array<string> | ITreeStructure<{ [propName: string]: P }>): string[];
}
