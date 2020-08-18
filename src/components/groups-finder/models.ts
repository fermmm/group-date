/*
 *    // TODO: Problema: Si cambio "Match" por "SeenMatch" al crear el grupo, entonces como entran 
      nuevos usuarios con el grupo ya creado si no se vuelve a computar, lo que se podría hacer es 
      crear una nueva búsqueda pero para meter usuarios nuevos en grupos ya creados
 */

export interface UserAndItsMatches {
   user: string;
   matches: string;
}

export interface SizeRestriction {
   minimumSize?: number;
   maximumSize?: number;
}

export interface GroupSlotConfig extends SizeRestriction {
   amount: number;
}

export enum GroupQuality {
   Bad,
   Good,
}
