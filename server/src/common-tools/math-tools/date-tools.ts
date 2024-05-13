import * as moment from "moment";
import { YEAR_IN_SECONDS } from "./constants";

export function fromBirthDateToAge(birthDate: number): number {
   return Math.floor((moment().unix() - birthDate) / YEAR_IN_SECONDS);
}

export function fromAgeToBirthDate(age: number): number {
   return moment()
      .year(moment().year() - age - 1)
      .unix();
}
