import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from '../../../services/firebase/firestore';
import { auth } from '../../auth/services/authServices';

const VOTES_COLLECTION = 'votes';
const SUBMISSIONS_COLLECTION = 'submissions';

/**
 * NOT (optimistic UI): Bu dosyadaki fonksiyonlar SADECE Firestore ile
 * gerçek (nihai) veri durumundan sorumludur — hepsi ağ round-trip'i
 * bekleyen, senkron olmayan çağrılardır. Butona basılır basılmaz ekranın
 * ağ yanıtını beklemeden güncellenmesi, art arda farklı kartlara
 * basıldığında sadece en son tıklamanın geçerli sayılması ve başarısız
 * bir çağrıda UI'ın otomatik eski haline dönmesi (rollback), bu dosyanın
 * DEĞİL, `../hooks/voteCoordinator.ts`'nin sorumluluğundadır. Oradaki
 * katman bu dosyayı hiç değiştirmeden, üstüne ince bir istemci-taraflı
 * "iyimser durum" katmanı olarak sarmalar; buradaki her fonksiyon hâlâ
 * tek başına, doğrudan çağrılabilir ve doğru sonucu verir.
 */

/**
 * Bir kullanıcı aktif bir challenge içinde toplamda en fazla bu kadar
 * çizime oy verebilir.
 *
 * VERİ MODELİ: kullanıcının bir challenge'daki oyu TEK ve deterministik
 * bir doküman — `votes/{challengeId}_{userId}`. Bu kısıt artık iki
 * katmanda birden garanti altında:
 *  1) Client: `voteForSubmission` her zaman bu TEK dokümanı okuyup
 *     üzerine yazıyor (toggle/transfer), asla ikinci bir doküman
 *     oluşturmuyor.
 *  2) Sunucu: `firestore.rules`, bu koleksiyona sadece kendi
 *     `${challengeId}_${uid}` yoluna, sadece sahibinin yazabilmesine
 *     izin veriyor — client kodu atlanıp doğrudan Firestore SDK'siyle
 *     farklı bir yoldan (ör. rastgele bir doküman ID'siyle) ikinci bir
 *     oy oluşturulmaya çalışılsa bile sunucu bunu reddeder.
 *
 * ÖNEMLİ: `submissions/{id}.voteCount` artık bu dosyadan hiç
 * yazılMIYOR. Önceki sürüm bu sayacı client transaction'ı içinde
 * `increment(±1)` ile güncelliyordu — bu, kötü niyetli bir client'ın
 * Firestore SDK'sini doğrudan çağırıp sayacı istediği değere
 * ayarlayabilmesi anlamına geliyordu (rules'ta bunu tam güvenli
 * doğrulamak, iki ayrı dokümanın aynı transaction'ın parçası olduğunu
 * kanıtlamayı gerektirdiği için kırılgan). Artık `voteCount` SADECE
 * `functions/src/index.ts` içindeki `onVoteWritten` Cloud Function'ı
 * tarafından, `votes` koleksiyonundaki gerçek doküman sayısı yeniden
 * hesaplanarak (Admin SDK ile, Security Rules'u atlayarak) yazılıyor;
 * `firestore.rules` da submissions için `allow update: if false` ile
 * client'ın bu alana asla dokunamayacağını garanti ediyor.
 */
export const MAX_VOTES_PER_CHALLENGE = 1;

const buildVoteRef = (challengeId: string, userId: string) =>
  doc(db, VOTES_COLLECTION, `${challengeId}_${userId}`);

export const hasUserVoted = async (
  submissionId: string,
  challengeId: string,
): Promise<boolean> => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Kullanıcı oturumu bulunamadı.');
  }

  const voteSnapshot = await getDoc(buildVoteRef(challengeId, user.uid));

  if (!voteSnapshot.exists()) {
    return false;
  }

  return voteSnapshot.data()?.submissionId === submissionId;
};

/**
 * Bir submission kartı için kullanıcının oy durumunu gerçek zamanlı
 * izler. Kullanıcının bu challenge'daki tek oy dokümanı, hangi
 * submission'a bakıldığından bağımsız olarak AYNI dokümandır — yani bu
 * challenge'daki bütün kartlar aslında aynı dokümanı dinler, sadece her
 * biri kendi `submissionId`'siyle karşılaştırır. Oy başka bir karta
 * taşındığında (ya da geri alındığında), o dokümanı dinleyen HER kart
 * Firestore'dan gelen değişiklikle anında (ekstra bir "refresh" ya da
 * ekrana geri dönüş gerekmeden) güncellenir.
 */
export const subscribeToVoteStatus = (
  submissionId: string,
  challengeId: string,
  onChange: (hasVoted: boolean) => void,
  onError: (error: FirestoreError) => void,
): Unsubscribe => {
  const user = auth.currentUser;

  if (!user) {
    // Oturum yoksa dinlenecek bir şey yok; no-op unsubscribe döndür.
    return () => {};
  }

  return onSnapshot(
    buildVoteRef(challengeId, user.uid),
    (snapshot) => {
      onChange(
        snapshot.exists() && snapshot.data()?.submissionId === submissionId,
      );
    },
    onError,
  );
};

/**
 * Bir submission'ın canlı oy sayısını (`voteCount`) gerçek zamanlı
 * izler. Bu değer artık her zaman Cloud Function tarafından, `votes`
 * koleksiyonu baştan sayılarak hesaplanan güvenilir bir değerdir (bkz.
 * yukarıdaki modül notu ve `functions/src/index.ts` — `onVoteWritten`).
 */
export const subscribeToSubmissionVoteCount = (
  submissionId: string,
  onChange: (voteCount: number) => void,
  onError: (error: FirestoreError) => void,
): Unsubscribe =>
  onSnapshot(
    doc(db, SUBMISSIONS_COLLECTION, submissionId),
    (snapshot) => onChange((snapshot.data()?.voteCount as number) ?? 0),
    onError,
  );

/**
 * Bir çizime oy verir/oyu değiştirir/oyu geri alır — hepsi tek bir
 * fonksiyonda, çağrıldığı çizime ve kullanıcının o challenge'daki mevcut
 * oy durumuna göre:
 *
 * 1. Kullanıcı kendi çizimine oy veremez (client'taki bu kontrol sadece
 *    hızlı bir UX kısayolu — asıl garanti `firestore.rules`'ta: votes
 *    koleksiyonuna yazarken hedef submission'ın sahibi kontrol ediliyor).
 * 2. Kullanıcının bu çizime zaten oyu varsa: oy GERİ ALINIR (toggle off).
 * 3. Kullanıcının bu challenge'da BAŞKA bir çizime aktif oyu varsa: TEK
 *    oy dokümanı bu çizime (submissionId alanı güncellenerek) TAŞINIR.
 * 4. Kullanıcının bu challenge'da hiç oyu yoksa: oy dokümanı oluşturulur.
 *
 * `submissions.voteCount` burada HİÇ güncellenmiyor — bkz. modül başı
 * notu; sayaç tamamen sunucu tarafında (Cloud Function) hesaplanıyor.
 *
 * Tüm okuma/yazmalar (submission + tek oy dokümanı, sadece
 * DocumentReference'lar üzerinden) tek bir Firestore transaction'ı
 * içinde yapıldığı için, aynı kullanıcı çok hızlı art arda farklı
 * çizimlere basarsa bile Firestore çakışan transaction'ları otomatik
 * olarak yeniden dener; bir challenge'da asla 1'den fazla aktif oy
 * dokümanı oluşamaz.
 */
export const voteForSubmission = async (
  submissionId: string,
  challengeId: string,
): Promise<void> => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Kullanıcı oturumu bulunamadı.');
  }

  const myVoteRef = buildVoteRef(challengeId, user.uid);

  const submissionRef = doc(
    db,
    SUBMISSIONS_COLLECTION,
    submissionId,
  );

  await runTransaction(db, async (transaction) => {
    const submissionSnapshot = await transaction.get(submissionRef);

    if (!submissionSnapshot.exists()) {
      throw new Error('Gönderi bulunamadı.');
    }

    const submission = submissionSnapshot.data();

    // Kullanıcı kendi çizimine oy veremez.
    if (submission.userId === user.uid) {
      throw new Error(
        'Kendi eserinize oy veremezsiniz.',
      );
    }

    const myVoteSnapshot = await transaction.get(myVoteRef);
    const existingSubmissionId = myVoteSnapshot.exists()
      ? (myVoteSnapshot.data()?.submissionId as string | undefined)
      : undefined;

    // Aynı çizime tekrar basıldı: oyu geri al (toggle off).
    if (existingSubmissionId === submissionId) {
      transaction.delete(myVoteRef);

      return;
    }

    // Başka bir çizime oy veriliyor (ya ilk kez ya da transfer): tek oy
    // dokümanını bu çizime işaret edecek şekilde oluştur/taşı.
    transaction.set(
      myVoteRef,
      {
        submissionId,
        challengeId,
        userId: user.uid,
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
  });
};
