export interface HandshakeParams {
   version: string;
}

export interface ServerHandshakeResponse {
   versionIsCompatible: boolean;
   serverOperating: boolean;
   serverMessage?: string;
}
