export interface ServerHandshakeResponse {
   versionIsCompatible: boolean;
   serverOperating: boolean;
   serverMessage?: string;
}
