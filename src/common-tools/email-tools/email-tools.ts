import { sendEmailUsingSES } from "../aws/ses-tools";

export async function sendEmail(props: { to: string; subject: string; text?: string; html?: string }) {
   return sendEmailUsingSES(props);
}
