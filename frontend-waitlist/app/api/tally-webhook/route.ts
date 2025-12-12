import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { sendDiscordSignupNotification } from "@/lib/discord";

const MAX_REFERRAL_LENGTH = 100;

interface TallyField {
  key: string;
  label: string;
  type: string;
  value: string | string[] | number | null;
}

interface TallyWebhookPayload {
  eventId: string;
  eventType: string;
  createdAt: string;
  data: {
    responseId: string;
    submissionId: string;
    respondentId: string;
    formId: string;
    formName: string;
    createdAt: string;
    fields: TallyField[];
  };
}

function verifyTallySignature(payload: string, signature: string): boolean {
  const signingSecret = process.env.TALLY_SIGNING_SECRET;
  if (!signingSecret) {
    console.error("TALLY_SIGNING_SECRET not configured");
    return false;
  }

  const calculatedSignature = createHmac("sha256", signingSecret)
    .update(payload)
    .digest("base64");

  return signature === calculatedSignature;
}

function extractEmail(fields: TallyField[]): string | null {
  const emailField = fields.find(
    (field) =>
      field.type === "INPUT_EMAIL" ||
      field.label.toLowerCase().includes("email")
  );

  if (emailField?.value && typeof emailField.value === "string") {
    return emailField.value.trim().toLowerCase();
  }

  return null;
}

function extractReferral(fields: TallyField[]): string | null {
  const referralField = fields.find(
    (field) =>
      field.type === "HIDDEN_FIELDS" &&
      (field.label.toLowerCase() === "ref" ||
        field.label.toLowerCase().includes("referral"))
  );

  if (referralField?.value && typeof referralField.value === "string") {
    return referralField.value.trim().slice(0, MAX_REFERRAL_LENGTH);
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Read raw body for signature verification
    const rawBody = await request.text();

    // Verify Tally signature
    const signature = request.headers.get("tally-signature");
    if (!signature || !verifyTallySignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload: TallyWebhookPayload = JSON.parse(rawBody);

    // Validate event type
    if (payload.eventType !== "FORM_RESPONSE") {
      return NextResponse.json({ success: true, message: "Event ignored" });
    }

    const { fields } = payload.data;

    const email = extractEmail(fields);
    if (!email) {
      console.error(
        "No email found in Tally submission:",
        payload.data.submissionId
      );
      return NextResponse.json(
        { error: "Email field not found" },
        { status: 400 }
      );
    }

    const referral = extractReferral(fields);

    // Load Google credentials
    const credentialsBase64 = process.env.GOOGLE_CREDENTIALS;
    if (!credentialsBase64) {
      throw new Error("GOOGLE_CREDENTIALS environment variable is not set");
    }
    const credentials = JSON.parse(
      Buffer.from(credentialsBase64, "base64").toString("utf-8")
    );

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "A:C",
      valueInputOption: "RAW",
      requestBody: {
        values: [[email, new Date().toISOString(), referral ?? ""]],
      },
    });

    const appendedRow = getRowNumberFromRange(
      appendResponse.data.updates?.updatedRange
    );

    try {
      await sendDiscordSignupNotification({
        email,
        rowNumber: appendedRow,
        referral,
      });
    } catch (discordError) {
      console.error("Failed to send Discord notification:", discordError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tally webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

function getRowNumberFromRange(range?: string | null): number | null {
  if (!range) return null;

  const [startCell] = range.split(":");
  const cell = startCell.split("!").pop();
  if (!cell) return null;

  const match = cell.match(/(\d+)$/);
  return match ? Number(match[1]) : null;
}
