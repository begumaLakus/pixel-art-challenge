import { AppAlert } from '@/src/components/ui/AppAlert';

import type { Submission } from '../submission/types/types';
import {
  REPORT_REASONS,
  blockUser,
  reportSubmission,
  type ReportReason,
} from './services/moderationService';

interface ModerationMenuOptions {
  submission: Pick<Submission, 'id' | 'challengeId' | 'userId'>;
  /** Şikayet gönderildikten sonra çizimi listeden gizlemek için. */
  onReported: () => void;
  /** Kullanıcı engellendikten sonra çağrılır. */
  onBlocked: () => void;
}

const submitReport = async (
  options: ModerationMenuOptions,
  reason: ReportReason,
): Promise<void> => {
  try {
    await reportSubmission({
      submissionId: options.submission.id,
      challengeId: options.submission.challengeId,
      reportedUserId: options.submission.userId,
      reason,
    });

    options.onReported();
    AppAlert.alert(
      'Şikayetin alındı',
      'Çizimi inceleyeceğiz. Teşekkürler, topluluğu güvende tutmamıza yardım ediyorsun.',
    );
  } catch (error) {
    console.error('Şikayet gönderilemedi:', error);

    // Aynı çizim ikinci kez şikayet edilirse kural reddeder; kullanıcıya
    // bunu "zaten bildirdin" diye açıklarız.
    const denied =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      String((error as { code: unknown }).code).includes('permission-denied');

    AppAlert.alert(
      denied ? 'Zaten bildirdin' : 'Şikayet gönderilemedi',
      denied
        ? 'Bu çizimi daha önce şikayet ettin.'
        : 'Birazdan tekrar dene.',
    );
  }
};

const confirmBlock = (options: ModerationMenuOptions): void => {
  AppAlert.alert(
    'Kullanıcıyı engelle',
    'Bu kullanıcının çizimlerini artık görmeyeceksin. Engeli profilinden kaldırabilirsin.',
    [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Engelle',
        style: 'destructive',
        onPress: async () => {
          try {
            await blockUser(options.submission.userId);
            options.onBlocked();
          } catch (error) {
            console.error('Kullanıcı engellenemedi:', error);
            AppAlert.alert('Engellenemedi', 'Birazdan tekrar dene.');
          }
        },
      },
    ],
  );
};

/**
 * Bir çizim için "şikayet et / kullanıcıyı engelle" menüsünü açar
 * (App Store Guideline 1.2: kullanıcı içeriğinde bildirme ve engelleme).
 * Düğmeler yığın hâlinde ters sırada gösterildiği için ilk sıradaki
 * "Vazgeç" en altta kalır.
 */
export const openModerationMenu = (options: ModerationMenuOptions): void => {
  AppAlert.alert('Bu çizim hakkında', undefined, [
    { text: 'Vazgeç', style: 'cancel' },
    { text: 'Kullanıcıyı engelle', style: 'destructive', onPress: () => confirmBlock(options) },
    {
      text: 'Şikayet et',
      onPress: () =>
        AppAlert.alert('Şikayet nedeni', 'Bu çizimde sorun nedir?', [
          { text: 'Vazgeç', style: 'cancel' },
          ...REPORT_REASONS.map((reason) => ({
            text: reason.label,
            onPress: () => {
              void submitReport(options, reason.id);
            },
          })),
        ]),
    },
  ]);
};
