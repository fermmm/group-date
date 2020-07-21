import { process, structure } from 'gremlin';

export interface GremlinResponse {
   value: any;
   done: boolean;
}

export interface VertexProperty {
   id: number;
   label: string;
   value: any;
   properties?: structure.Property[];
}

export type GremlinValueType =
   | string
   | number
   | boolean
   | string[]
   | number[]
   | boolean[]
   | Map<any, GremlinValueType>
   | Array<Map<any, GremlinValueType>>;

export type Traversal = process.Statics<process.GraphTraversal> & process.Traversal & process.GraphTraversal;

export type SupportedGremlinTypes = number | string | boolean;
