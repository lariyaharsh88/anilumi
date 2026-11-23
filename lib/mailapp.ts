/**
 * The visitor's webmail, to open straight from the confirmation step: almost everyone who tapped "Open Gmail"
 * confirmed, almost nobody else did (Nov 2026: 22 of 140 confirmed). Gmail opens a search that covers Promotions
 * and Spam.
 */
const MAIL_APPS: [RegExp, string, string][] = [
  [/@(gmail|googlemail)\.com$/i, "Gmail", "https://mail.google.com/mail/u/0/#search/from%3Aanilumi.in+in%3Aanywhere"],
  [/@(outlook|hotmail|live|msn)\.[a-z.]+$/i, "Outlook", "https://outlook.live.com/mail/0/"],
  [/@(yahoo|ymail|rocketmail)\.[a-z.]+$/i, "Yahoo Mail", "https://mail.yahoo.com/"],
  [/@(icloud|me|mac)\.com$/i, "iCloud Mail", "https://www.icloud.com/mail"],
];
export const mailApp = (email: string) => MAIL_APPS.find(([re]) => re.test(email.trim())) ?? null;
