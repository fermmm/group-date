import * as gremlin from 'gremlin';

export interface GremlinResponse {
   value: any;
   done: boolean;
}

export interface VertexProperty {
   id: number, 
   label: string, 
   value: any, 
   properties?: gremlin.structure.Property[];
}

export type GremlinValueType = string | number | boolean | string[] | number[] | boolean[] | Map<any, GremlinValueType> | Array<Map<any, GremlinValueType>>;

export type GraphTraversalSource = gremlin.process.GraphTraversalSource;
export type GraphTraversal = gremlin.process.GraphTraversal;
export type Traversal = GraphTraversalSource | GraphTraversal;

export type UserFromDatabase = Map<'profile' | 'questions',Map<any, GremlinValueType>>;