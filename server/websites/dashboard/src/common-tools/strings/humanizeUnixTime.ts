import moment from "moment";

export function humanizeSecondsAmount(time: number): string {
   return moment.duration(time, "seconds").locale("en").humanize();
}

export function humanizeUnixTimeStamp(time: number): string {
   return `${humanizeSecondsAmount(moment().unix() - time)} ago - ${moment
      .unix(time)
      .format("MMM DD YYYY - HH:mm:ss")}`;
}
