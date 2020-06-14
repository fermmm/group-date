import { DeviationAlgorithm, inequalityLevel, InequalitySettings } from './statistical-functions';

const settings: InequalitySettings = {
   algorithm: DeviationAlgorithm.StandardDeviation,
   baseAmount: 2,
};

const testList: Array<{ name: string; values: number[] } | string> = [
   { name: 'Max', values: [0, 0, 6] },
   { name: 'Min', values: [3, 3, 3] },
   { name: 'Cuadrado', values: [2, 2, 2, 2] },
   { name: 'Cuadrado full', values: [3, 3, 3, 3] },
   { name: 'Pentágono full', values: [4, 4, 4, 4, 4] },
   { name: 'Grande full', values: [7, 7, 6, 5, 5, 5, 4, 4, 4, 4] },
   '',
   { name: 'Cuadrado con 1 de mas', values: [2, 2, 2, 3, 3] },
   { name: 'Cuadrado con 2 de mas', values: [4, 3, 3, 2, 2, 2] },
   { name: 'Cuadrado full con 1 de mas', values: [3, 3, 4, 4, 2] },
   { name: 'Pentágono full con 1 de mas', values: [4, 4, 4, 5, 5, 2] },
   { name: 'Grande full con 1 de mas', values: [8, 7, 6, 5, 5, 5, 5, 4, 4, 4, 2] },
];

/**
 * Idea: Tal vez lo que importa sea que la desigualdad mejore y no lograr una desigualdad especifica
 * Problema: Hay una que es inaceptable, debería poder encontrar al menos esa.
 */

export function test() {
   console.log('');
   console.log('Algorithm: ' + Object.values(DeviationAlgorithm)[settings.algorithm]);
   console.log('Base amount: ' + settings.baseAmount);
   console.log('');
   testList.forEach(item => {
      if (typeof item !== 'string') {
         console.log(`${item.name}: [${item.values}] Result:`, inequalityLevel(item.values, settings));
      } else {
         console.log(item);
      }
   });
}
