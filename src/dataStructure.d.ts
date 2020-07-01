/**
 * Declaration of Priority Queue.
 */

declare abstract class PriorityQueue<T>{
	/**
	 * Place where data is stored.
	 */
	protected _mount: object;
	protected _array: Array<T>;
	protected _length: number;
	protected _parent: (index: number) => number | undefined;
	protected _leftSon: (index: number) => number | undefined;
	protected _rightSon: (index: number) => number | undefined;
	public get: () => T | undefined;
	public pop: () => T | undefined;
	public add: (item: T) => boolean;
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
	protected _mount: TreeMount<P, N>;
	protected _tree: ITreeStructure<N>;
	protected _inner_link_class: { new(...args: any[]): N };
	protected _extractNode: (path: Array<string>) => ITreeStructure<N> | undefined;
	protected _nextNodes: (path: Array<string>) => Array<ITreeStructure<N>> | undefined;
	public clearLeaf: (path: Array<string>) => boolean;
}

declare class TreePriorityQueue<P, N extends PriorityQueue<P>> extends Tree<P, N> {
	public addToLeaf: (item: P, path: Array<string>) => boolean;
	public getFromLeaf: (path: Array<string>) => P | undefined;
	public popFromLeaf: (path: Array<string>) => P | undefined;
}

declare class TreeArray<P> extends Tree<P, Array<P>> {
	public pushToLeaf: (item: P, path: Array<string>) => boolean;
	public getFromLeaf: (path: Array<string>) => Array<P> | undefined;
	public filterFromLeaf: (criterion: (item: P) => boolean, path: Array<string>) => boolean;
}
declare class TreeObject<P> extends Tree<P, { [propName: string]: P | undefined }>{
	/** This function can also be used to modify. */
	public addToLeaf: (item: P, path: Array<string>, key: string) => boolean;
	public getFromLeaf: (path: Array<string>, key: string) => P | undefined;
	public delFromLeaf: (path: Array<string>, key: string) => boolean;
}
