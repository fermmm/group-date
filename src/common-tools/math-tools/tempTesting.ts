import { DeviationAlgorithm, inequalityLevel, InequalitySettings } from './statistical-functions';

const settings: InequalitySettings = {
   algorithm: DeviationAlgorithm.MeanAbsoluteDeviation,
   minimum: 0,
};

const testList: Array<{ name: string; values: number[] }> = [
   { name: 'Sarasa1', values: [0, 5, 1] },
   { name: 'Sarasa2', values: [0, 0, 6] },
   { name: 'Sarasa3', values: [3, 3, 3] },
   { name: 'Sarasa4', values: [0, 0, 0] },
];

export function test() {
   console.log('');
   console.log('Algorithm: ' + Object.values(DeviationAlgorithm)[settings.algorithm]);
   testList.forEach(item => {
      console.log(`${item.name}: [${item.values}] Result:`, inequalityLevel(item.values, settings));
   });
}
