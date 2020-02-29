import * as gremlin from 'gremlin';

export interface HttpRequestResponse<T> {
   success: boolean;
   error?: HttpRequestError
   content?: T;
}

export interface HttpRequestError {
   code: number;
   message: string;
}

export interface VertexProperty {
   id: number, 
   label: string, 
   value: any, 
   properties?: gremlin.structure.Property[];
}