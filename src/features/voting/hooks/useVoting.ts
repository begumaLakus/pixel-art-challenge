import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import {
    subscribeToSubmissionVoteCount,
    subscribeToVoteStatus,
    voteForSubmission,
} from '../services/votingService';
import {
    getActiveTarget,
    getCountDelta,
    reportServerCount,
    reportServerVote,
    requestVote,
    subscribeChallengeVote,
    subscribeCountDelta,
} from './voteCoordinator';

interface UseVotingResult {
  hasVoted: boolean;
  loading: boolean;
  voting: boolean;
  vote: () => Promise<void>;
}

/**
 * Oy verme hataları (kendi çizimine oy verme, ağ hatası vb.) ekranda
 * küçük bir "geliştirici modu" metniyle değil, uygulamanın geri
 * kalanıyla tutarlı `Alert.alert` diyaloğuyla gösteriliyor.
 *
 * OPTIMISTIC UI: `hasVoted`, `voteCoordinator`'ın bu challenge için
 * paylaşılan olarak tuttuğu `activeTarget` değerinden (`activeTarget ===
 * submissionId`) türetilir. Bu değer iki kaynaktan güncellenir:
 *   1) `subscribeToVoteStatus` ile Firestore'dan gerçek zamanlı okunan
 *      SUNUCU durumu — `reportServerVote` ile koordinatöre bildirilir.
 *   2) Butona basıldığı an, ağ yanıtı beklenmeden `requestVote`'un
 *      uyguladığı iyimser (optimistic) tahmin.
 *
 * Böylece buton ve "X oy" metni, ağ isteği ne kadar sürerse sürsün ANINDA
 * güncellenir. İşlem başarısız olursa `voteCoordinator` tüm optimistic
 * değişiklikleri geri alır (rollback) ve buradaki `catch` bloğu
 * kullanıcıya hatayı `Alert.alert` ile bildirir — UI otomatik olarak son
 * geçerli (sunucu) duruma döner.
 *
 * RACE CONDITION KORUMASI: Kullanıcı art arda farklı kartlara basarsa, her
 * tıklama kendi transaction'ını PARALEL başlatmaz — `voteCoordinator`
 * aynı anda tek bir gerçek istek yürütür ve araya giren tüm tıklamaları
 * "sadece en son tıklanan resim" kuralıyla tek bir sıradaki isteğe
 * indirger (bkz. `voteCoordinator.ts` başlığı). Burada sadece BU kartın
 * kendi tıklamasının ikinci kez tetiklenmesini (`voting` bayrağıyla)
 * engelliyoruz; farklı kartlara aynı anda basılabilmesi kasıtlı.
 */
export const useVoting = (
  submissionId: string,
  challengeId: string,
): UseVotingResult => {
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [activeTarget, setActiveTarget] = useState<string | null>(() =>
    getActiveTarget(challengeId),
  );

  useEffect(() => {
    setLoading(true);

    const unsubscribe = subscribeToVoteStatus(
      submissionId,
      challengeId,
      (voted) => {
        reportServerVote(challengeId, submissionId, voted);
        setLoading(false);
      },
      (err) => {
        console.error('Oy durumu dinlenirken hata oluştu:', err);
        setLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [submissionId, challengeId]);

  useEffect(() => {
    // Bu ya da başka bir kart (aynı challenge'daki) oy işlemini
    // başlatmış/bitirmiş olabilir; bu kartın görünümünü güncel tutmak
    // için challenge'ın paylaşılan koordinasyon durumunu dinle.
    setActiveTarget(getActiveTarget(challengeId));

    return subscribeChallengeVote(challengeId, () => {
      setActiveTarget(getActiveTarget(challengeId));
    });
  }, [challengeId]);

  const hasVoted = activeTarget === submissionId;

  const vote = async (): Promise<void> => {
    // Bu buton için zaten sürmekte olan bir istek varsa yenisini
    // başlatma; farklı kartların butonları bundan etkilenmez.
    if (voting) {
      return;
    }

    try {
      setVoting(true);

      // Gerçek sunucu isteği her koşulda `voteForSubmission`'ın kendi
      // toggle/transfer mantığına (Firestore'daki gerçek duruma göre)
      // tabidir — koordinatör sadece hangi karta tıklandığını iletir ve
      // ağ beklenmeden görünümü günceller.
      await requestVote(challengeId, submissionId, voteForSubmission);

      // `activeTarget`'ı burada elle güncellemiyoruz: `requestVote` zaten
      // anında (senkron) güncelledi; işlem bitince koordinatör kontrolü
      // Firestore dinleyicisine (artık zaten doğru veriyle) bırakır.
    } catch (err) {
      console.error('Oy verilemedi:', err);

      const message =
        err instanceof Error
          ? err.message
          : 'Oy verilirken bir hata oluştu.';

      Alert.alert('Oy Verilemedi', message);
    } finally {
      setVoting(false);
    }
  };

  return {
    hasVoted,
    loading,
    voting,
    vote,
  };
};

/**
 * Bir submission kartının oy sayısını canlı gösterir.
 *
 * Önceki davranış: kart, listeleme sorgusundan (bir kerelik `getDocs`)
 * gelen `voteCount` prop'unu sabit gösteriyordu; bu değer sadece ekran
 * yeniden odaklandığında (`useFocusEffect`) tazeleniyordu.
 *
 * Bu hook, `initialCount` ile anında (gecikmesiz) bir değer gösterip
 * arkadan `subscribeToSubmissionVoteCount` ile canlı sunucu değerine
 * geçiyor. Buna EK olarak: `voteCoordinator`'dan bu submission için aktif
 * bir optimistic delta (+1/-1) varsa bunu sunucu değerinin üstüne anında
 * uyguluyor — böylece "Oy Ver"e basıldığı an, Cloud Function'ın
 * `voteCount`'u yeniden hesaplamasını beklemeden sayı anında değişiyor.
 * Sunucudan (Cloud Function'ın hesapladığı) taze bir değer geldiğinde
 * delta kendiliğinden temizlenir (`reportServerCount`), yani sayı asla
 * çift sayılmaz ya da eski kalmaz.
 */
export const useLiveVoteCount = (
  submissionId: string,
  initialCount: number,
): number => {
  const [serverCount, setServerCount] = useState(initialCount);
  const [delta, setDelta] = useState(() => getCountDelta(submissionId));

  useEffect(() => {
    const unsubscribe = subscribeToSubmissionVoteCount(
      submissionId,
      (count) => {
        setServerCount(count);
        reportServerCount(submissionId, count);
      },
      (err) => {
        console.error('Oy sayısı dinlenirken hata oluştu:', err);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [submissionId]);

  useEffect(() => {
    setDelta(getCountDelta(submissionId));

    return subscribeCountDelta(submissionId, () => {
      setDelta(getCountDelta(submissionId));
    });
  }, [submissionId]);

  // Negatife düşmeyi engelle: ağ gecikmesi sırasında iki farklı optimistic
  // işlem üst üste binerse bile ekranda asla anlamsız bir sayı görünmez.
  return Math.max(0, serverCount + delta);
};
