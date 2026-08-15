export interface DiscordWebhookPayload {
  content?: string;
  embeds?: {
    title?: string;
    description?: string;
    color?: number;
    fields?: {
      name: string;
      value: string;
      inline?: boolean;
    }[];
    timestamp?: string;
    footer?: {
      text: string;
      icon_url?: string;
    };
  }[];
}

export const sendDiscordLog = async (webhookUrl: string, payload: DiscordWebhookPayload): Promise<boolean> => {
  if (!webhookUrl || typeof webhookUrl !== 'string' || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to send discord log:', error);
    return false;
  }
};

export const COLORS = {
  INFO: 0x3b82f6, // Blue
  SUCCESS: 0x10b981, // Green
  WARNING: 0xf59e0b, // Amber
  DANGER: 0xef4444, // Red
  PURPLE: 0x8b5cf6,
};
