import { sendEmailUsingSES } from "../aws/ses-tools";

export async function sendEmail(props: EmailSendProps) {
   return sendEmailUsingSES({
      from: `${props.senderName} <${process.env.EMAIL_SENDER}>`,
      ...props,
   });
}

export interface EmailSendProps {
   to: string;
   subject: string;
   senderName: string;
   text?: string;
   html?: string;
}
