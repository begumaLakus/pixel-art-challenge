/**
 * Expo Push API ile bildirim gönderme yardımcıları. Ağ çağrısı hariç hepsi
 * saf fonksiyondur; `sendPushMessages` `fetch`'i parametre olarak alır.
 */
export interface PushMessage {
  to: string;
  title: string;
  body: string;
  sound: 'default';
  data?: Record<string, unknown>;
}

export interface PushContent {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/** Expo'nun tek istekte kabul ettiği en fazla mesaj sayısı. */
export const MAX_BATCH_SIZE = 100;

const EXPO_TOKEN_PATTERN = /^Expo(nent)?PushToken\[[^\]]+\]$/;

export const isExpoPushToken = (value: unknown): value is string =>
  typeof value === 'string' && EXPO_TOKEN_PATTERN.test(value);

export const chunk = <T>(items: readonly T[], size: number): T[][] => {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

/** Geçersiz biçimdeki token'ları eler ve her geçerli token için mesaj üretir. */
export const buildMessages = (
  tokens: readonly unknown[],
  content: PushContent,
): PushMessage[] =>
  Array.from(new Set(tokens.filter(isExpoPushToken))).map((token) => ({
    to: token,
    title: content.title,
    body: content.body,
    sound: 'default',
    ...(content.data ? { data: content.data } : {}),
  }));

/**
 * Expo'nun yanıtındaki (mesajlarla aynı sırada) kayıtlardan, artık geçerli
 * olmayan cihaz token'larını (`DeviceNotRegistered`) bulur; bunlar temizlenmeli.
 */
export const findInvalidTokens = (
  messages: readonly PushMessage[],
  tickets: unknown,
): string[] => {
  if (!Array.isArray(tickets)) {
    return [];
  }

  const invalid: string[] = [];

  tickets.forEach((ticket: unknown, index) => {
    const entry = ticket as
      | { status?: string; details?: { error?: string } }
      | undefined;

    if (
      entry?.status === 'error' &&
      entry.details?.error === 'DeviceNotRegistered' &&
      messages[index]
    ) {
      invalid.push(messages[index].to);
    }
  });

  return invalid;
};

/**
 * Mesajları 100'lük gruplar hâlinde gönderir. Bir grup başarısız olursa
 * (ağ/HTTP hatası) loglanır ve diğer gruplara devam edilir; asla throw etmez.
 * Temizlenmesi gereken (kayıtsız) token'ları döner.
 */
export const sendPushMessages = async (
  messages: readonly PushMessage[],
  fetchImpl: typeof fetch = fetch,
): Promise<string[]> => {
  const invalidTokens: string[] = [];

  for (const batch of chunk(messages, MAX_BATCH_SIZE)) {
    try {
      const response = await fetchImpl(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        console.error('Expo push isteği HTTP hatası:', response.status);
        continue;
      }

      const payload = (await response.json()) as { data?: unknown };

      invalidTokens.push(...findInvalidTokens(batch, payload.data));
    } catch (error) {
      console.error('Expo push isteği başarısız:', error);
    }
  }

  return invalidTokens;
};
