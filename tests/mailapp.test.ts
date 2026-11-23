import { test } from "node:test";
import assert from "node:assert/strict";
import { mailApp } from "../lib/mailapp";

test("the confirmation step opens the visitor's own webmail", () => {
  assert.equal(mailApp("someone@gmail.com")?.[1], "Gmail");
  assert.equal(mailApp(" Someone@GoogleMail.com ")?.[1], "Gmail");
  assert.equal(mailApp("a@outlook.in")?.[1], "Outlook");
  assert.equal(mailApp("a@hotmail.co.uk")?.[1], "Outlook");
  assert.equal(mailApp("a@yahoo.co.in")?.[1], "Yahoo Mail");
  assert.equal(mailApp("a@icloud.com")?.[1], "iCloud Mail");
  assert.equal(mailApp("a@company.com"), null);
  assert.match(mailApp("a@gmail.com")![2], /in%3Aanywhere/); // Promotions and Spam included
});
