const WIZARD_ROW =
  "🧙‍♂️🧙‍♂️🧙‍♂️🧙‍♂️🧙‍♂️🧙‍♂️🧙‍♂️🧙‍♂️🧙‍♂️🧙‍♂️🧙‍♂️🧙‍♂️🧙‍♂️🧙‍♂️🧙‍♂️🧙‍♂️🧙‍♂️🧙‍♂️🧙‍♂️";

type DiscordSignupPayload = {
  email: string;
  rowNumber?: number | null;
  referral?: string | null;
};

function buildMessage({
  email,
  rowNumber,
  referral,
}: DiscordSignupPayload): string {
  const lines = [
    "BANG!",
    "",
    "ANOTHER PREDICTOOOOOR JOINED THE MAGIC GUILD OF FORESIGHT",
    WIZARD_ROW,
    "",
    "OMEN IS COMING TO RULE THE WORLD",
    "",
    `Email: ${email}`,
    `From row: ${rowNumber ?? "unknown"}`,
  ];

  if (referral) {
    lines.push(`Ref: ${referral}`);
  }

  lines.push("", WIZARD_ROW);

  return lines.join("\n");
}

export async function sendDiscordSignupNotification(
  payload: DiscordSignupPayload
) {
  const token = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_CHANNEL_ID;

  if (!token || !channelId) {
    console.warn("Discord notification skipped: missing env configuration.");
    return;
  }

  const message = buildMessage(payload);
  const response = await fetch(
    `https://discord.com/api/v10/channels/${channelId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: message }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Discord API error: ${response.status} ${response.statusText} - ${errorBody}`
    );
  }
}
