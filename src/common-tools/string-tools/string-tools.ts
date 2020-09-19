import { nanoid } from 'nanoid';

export function versionIsCompatible(current: string, required: string): boolean {
   for (let i = 0; i < required.length; i++) {
      if ((current[i] || 0) < required[i]) {
         return false;
      }

      if (current[i] > required[i]) {
         return true;
      }
   }

   return true;
}

export function generateId(): string {
   return nanoid();
}
