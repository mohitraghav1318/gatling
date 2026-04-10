import { Resend } from 'resend';

const resend = new Resend('re_3MEgrKCR_8vZnsE7DwViHXjrzP62fk5cw');

resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'mohitraghav1318@gmail.com',
  subject: 'Hello World',
  html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
});
