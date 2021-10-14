import moment from "moment";

export function humanizeSecondsAmount(time: number): string {
   return moment.duration(time, "seconds").locale("en").humanize();
}

export function humanizeUnixTimeStamp(time: number): string {
   return `${humanizeSecondsAmount(moment().unix() - time)} - ${moment
      .unix(time)
      .format("DD MMM YYYY")}`;
}
