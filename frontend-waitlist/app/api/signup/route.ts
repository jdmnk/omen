import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { sendDiscordSignupNotification } from "@/lib/discord";

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Maximum email length (RFC 5321)
const MAX_EMAIL_LENGTH = 320;
const MAX_REFERRAL_LENGTH = 100;

/**
 * Sanitize email to prevent formula injection
 * Prefixes with single quote if starts with formula characters
 */
function sanitizeEmail(email: string): string {
  // Remove leading/trailing whitespace
  return email.trim().toLowerCase();

  // return `'${trimmed}`; // Add single quote to force text mode in Google Sheets
}

function sanitizeReferral(referral: unknown): string | null {
  if (!referral || typeof referral !== "string") {
    return null;
  }

  const trimmed = referral.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, MAX_REFERRAL_LENGTH);
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") {
    return false;
  }

  if (email.length > MAX_EMAIL_LENGTH) {
    return false;
  }

  return EMAIL_REGEX.test(email.trim());
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, referralSource } = body;

    // Validate email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Sanitize email to prevent formula injection
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedReferral = sanitizeReferral(referralSource);

    // Load credentials from environment variable (base64 encoded)
    const credentialsBase64 = process.env.GOOGLE_CREDENTIALS;
    if (!credentialsBase64) {
      throw new Error("GOOGLE_CREDENTIALS environment variable is not set");
    }
    const credentialsJson = Buffer.from(credentialsBase64, "base64").toString(
      "utf-8"
    );
    const credentials = JSON.parse(credentialsJson);

    // Authenticate with Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Get spreadsheet ID from environment variable
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Append email to the sheet
    // Column A: email, Column B: timestamp, Column C: referral
    // Using RAW mode to prevent formula execution, then formatting as text
    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "A:C", // Columns A through C
      valueInputOption: "RAW", // Use RAW to prevent formula execution
      requestBody: {
        values: [
          [sanitizedEmail, new Date().toISOString(), sanitizedReferral ?? ""],
        ], // Email, timestamp, referral source
      },
    });

    const appendedRow = getRowNumberFromRange(
      appendResponse.data.updates?.updatedRange
    );

    try {
      await sendDiscordSignupNotification({
        email: sanitizedEmail,
        rowNumber: appendedRow,
        referral: sanitizedReferral,
      });
    } catch (discordError) {
      console.error("Failed to send Discord notification:", discordError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving email to Google Sheets:", error);
    return NextResponse.json(
      { error: "Failed to save email" },
      { status: 500 }
    );
  }
}

function getRowNumberFromRange(range?: string | null): number | null {
  if (!range) {
    return null;
  }

  const [startCell] = range.split(":");
  const cell = startCell.split("!").pop();
  if (!cell) {
    return null;
  }

  const match = cell.match(/(\d+)$/);
  return match ? Number(match[1]) : null;
}
