/**
 * Oylama için istemci taraflı KOORDİNASYON katmanı.
 *
 * Neden gerekli?
 * `votingService.voteForSubmission` bir Firestore `runTransaction` çağrısı
 * yapıyor. Transaction'lar (basit `setDoc`/`updateDoc`'ın aksine) yerel
 * önbelleğe anında yazılıp dinleyicilere "pending write" olarak yansımaz —
 * sonucu ancak sunucuyla round-trip tamamlanınca belli olur. Yani hiçbir ek
 * önlem alınmazsa:
 *   1) Butona basılınca UI, ağ yanıtı gelene kadar (yüzlerce ms) OLDUĞU
 *      GİBİ kalır — "anlık güncelleme" isteğini karşılamaz.
 *   2) `submissions.voteCount` bu dosyadan hiç yazılmıyor; ayrı bir Cloud
 *      Function tarafından `votes` koleksiyonu yeniden sayılarak
 *      hesaplanıyor (bkz. votingService.ts başlığı) — bu da ekstra bir
 *      gecikme katmanı demek.
 *   3) Kullanıcı arka arkaya farklı kartlara basarsa, her tıklama kendi
 *      transaction'ını başlatırsa (paralel), sonuç sırası ağın/Firestore'un
 *      insafına kalır — "sadece son tıklanan geçerli olsun" garanti edilmez.
 *
 * Bu modül, TEK bir challenge için tüm `useVoting` örnekleri arasında
 * paylaşılan, modül seviyesinde (React'ten bağımsız) bir durum tutarak şunu
 * sağlıyor:
 *
 *   - `activeTarget`: "kullanıcının bu challenge'da şu an oyu hangi
 *     submission'da görünüyor" sorusunun TEK ve paylaşılan cevabı. Bu değer
 *     ya bir kartın gerçek Firestore dinleyicisinden (`reportServerVote`)
 *     ya da anlık bir tıklamadan (`requestVote` → `applyOptimisticClick`)
 *     güncellenir; asla "bilinmiyor" durumuna dönmez (varsayılan: `null`,
 *     yani "henüz oy yok"), bu sayede bir sonraki tıklamada toggle/transfer
 *     kararı her zaman güncel bir referans noktasına göre verilir.
 *   - Butona basılır basılmaz (ağ beklenmeden) hem `activeTarget` hem de
 *     her kartın oy sayısı optimistic delta'sı (`countDeltas`) anında
 *     güncellenir.
 *   - Aynı anda tek bir gerçek `voteForSubmission` isteği yürür (`busy`
 *     kilidi). Bu istek sürerken gelen yeni tıklamalar iptal edilmez,
 *     sadece "bir sonraki gerçek istek bu olsun" diye kuyruğa yazılır
 *     (`pendingClick`) — kuyruk her zaman ÜZERİNE YAZILIR, yani araya kaç
 *     tıklama girerse girsin sonunda sadece EN SON tıklanan resim gerçek
 *     bir `voteForSubmission` çağrısı olarak sunucuya gider. Bu, oy
 *     geçişlerinin (transfer) idempotent olması sayesinde ara adımları
 *     atlamayı güvenli kılar: sırayla B, C'ye basılmışsa "B'ye oy ver, sonra
 *     C'ye taşı" ile doğrudan "C'ye oy ver" aynı nihai sunucu durumuna
 *     ulaşır.
 *   - Gerçek istek başarısız olursa (`voteForSubmission` reddederse), bu
 *     zincir başlamadan HEMEN ÖNCEki bilinen geçerli duruma (`chainBaseline`)
 *     dönülür ve o zincirde dokunulmuş sayaç delta'ları geri alınır — yani
 *     UI otomatik olarak son bilinen geçerli duruma döner (rollback).
 *   - `reportServerVote`, `busy` iken (yani kendi optimistic tahminimiz
 *     sürerken) gelen olası eski/yarışan sunucu bildirimlerini YOK SAYAR;
 *     böylece kendi tahminimizin üstüne, henüz güncel olmayan bir sunucu
 *     anlık görüntüsü binmez. `busy` değilken gelen bildirimler ise
 *     `activeTarget`'ı gerçek veriyle senkron tutar (ör. uygulama yeniden
 *     başlatıldığında ya da başka bir cihazdan oy değiştirildiğinde).
 *
 * `useVoting` bu modülü kullanarak "hangi karta oy verilmiş görünüyor"
 * bilgisini, `useLiveVoteCount` ise "her kartın sayısı ne kadar kaymış"
 * bilgisini okur. Firestore'dan gelen gerçek veriler her zaman nihai
 * otoritedir; bu modül sadece sunucu yanıtı gelene kadarki GÖRSEL boşluğu
 * dolduran, kendi kendini sürekli senkronize eden bir katmandır.
 */

type Listener = () => void;

interface Waiter {
  resolve: () => void;
  reject: (error: unknown) => void;
}

interface ChallengeVoteState {
  /** Kullanıcının bu challenge'daki oyu hangi submission'da görünüyor (yok ise `null`). */
  activeTarget: string | null;
  /** Şu an gerçek bir `voteForSubmission` isteği sürüyor mu. */
  busy: boolean;
  /** Bu zincir başlamadan hemen önceki `activeTarget` — hata durumunda buraya dönülür. */
  chainBaseline: string | null;
  /** `busy` iken gelen en son tıklamanın hedef submissionId'si. */
  pendingClick: string | null;
  /** `pendingClick` ile aynı anda kuyruğa yazılan, sonucu bekleyen çağıranlar. */
  pendingWaiters: Waiter[];
  /**
   * Bu zincirde optimistic delta uygulanmış submission id'leri → zincir
   * BAŞLAMADAN önceki (o an geçerli olan) delta değeri. Rollback bu
   * zincirin kattığı değişikliği geri almak için sıfıra değil, tam olarak
   * bu kayıtlı değere döner — böylece zincirden ÖNCE (ör. daha önce
   * başarıyla commit edilmiş bir işlemden) gelen meşru bir delta,
   * SONRAKİ ilgisiz bir işlemin başarısızlığında yanlışlıkla silinmez.
   */
  touchedBaselines: Map<string, number>;
  listeners: Set<Listener>;
}

const challengeStates = new Map<string, ChallengeVoteState>();

function getChallengeState(challengeId: string): ChallengeVoteState {
  let state = challengeStates.get(challengeId);

  if (!state) {
    state = {
      activeTarget: null,
      busy: false,
      chainBaseline: null,
      pendingClick: null,
      pendingWaiters: [],
      touchedBaselines: new Map(),
      listeners: new Set(),
    };
    challengeStates.set(challengeId, state);
  }

  return state;
}

function notifyChallenge(challengeId: string): void {
  getChallengeState(challengeId).listeners.forEach((listener) => listener());
}

// --- Oy sayısı (voteCount) için optimistic delta katmanı -----------------
//
// submissionId'ler uygulama genelinde tekil olduğundan bu kısım challenge'a
// göre değil doğrudan submissionId'ye göre tutuluyor; `useLiveVoteCount`
// hook'unun imzasını (`submissionId`, `initialCount`) değiştirmeden
// kullanılabilmesi için bilinçli bir tasarım tercihi.

const countDeltas = new Map<string, number>();
const countBaselines = new Map<string, number>();
const countListeners = new Map<string, Set<Listener>>();

function notifyCount(submissionId: string): void {
  countListeners.get(submissionId)?.forEach((listener) => listener());
}

function bumpDelta(submissionId: string, delta: number): void {
  const next = (countDeltas.get(submissionId) ?? 0) + delta;

  if (next === 0) {
    countDeltas.delete(submissionId);
    countBaselines.delete(submissionId);
  } else {
    countDeltas.set(submissionId, next);
  }

  notifyCount(submissionId);
}

function clearDelta(submissionId: string): void {
  const had = countDeltas.delete(submissionId);
  countBaselines.delete(submissionId);

  if (had) {
    notifyCount(submissionId);
  }
}

/**
 * Delta'yı doğrudan belirli bir değere ayarlar (rollback için). `bumpDelta`
 * göreli bir artış/azalış uygularken bu, MUTLAK bir değere döner — hatalı
 * bir zincirin başlamadan önceki tam delta durumunu geri yüklemek için
 * kullanılır.
 */
function setDeltaValue(submissionId: string, value: number): void {
  countBaselines.delete(submissionId);

  if (value === 0) {
    const had = countDeltas.delete(submissionId);

    if (had) {
      notifyCount(submissionId);
    }

    return;
  }

  countDeltas.set(submissionId, value);
  notifyCount(submissionId);
}

export function getCountDelta(submissionId: string): number {
  return countDeltas.get(submissionId) ?? 0;
}

export function subscribeCountDelta(
  submissionId: string,
  listener: Listener,
): () => void {
  let set = countListeners.get(submissionId);

  if (!set) {
    set = new Set();
    countListeners.set(submissionId, set);
  }

  set.add(listener);

  return () => {
    set?.delete(listener);

    if (set && set.size === 0) {
      countListeners.delete(submissionId);
    }
  };
}

/**
 * `useLiveVoteCount`, Firestore'dan (Cloud Function tarafından hesaplanmış)
 * TAZE bir `voteCount` aldığında bunu bildirmek için çağırır. Bu modül,
 * optimistic delta'nın uygulandığı andaki sunucu değerini "baseline" olarak
 * hatırlar; sunucudan bu baseline'dan FARKLI bir değer geldiğinde artık
 * Cloud Function bizim oyumuzu da hesaba katmış demektir — delta bırakılıp
 * kontrol tamamen sunucuya devredilir. Böylece delta sonsuza dek sunucu
 * değerinin üstüne eklenmiş kalmaz.
 */
export function reportServerCount(submissionId: string, count: number): void {
  if (!countDeltas.has(submissionId)) {
    return;
  }

  const baseline = countBaselines.get(submissionId);

  if (baseline === undefined) {
    countBaselines.set(submissionId, count);

    return;
  }

  if (count !== baseline) {
    clearDelta(submissionId);
  }
}

// --- Oy hedefi (hasVoted) için paylaşılan durum + kuyruklama -------------

export function getActiveTarget(challengeId: string): string | null {
  return getChallengeState(challengeId).activeTarget;
}

export function subscribeChallengeVote(
  challengeId: string,
  listener: Listener,
): () => void {
  const state = getChallengeState(challengeId);
  state.listeners.add(listener);

  return () => {
    state.listeners.delete(listener);
  };
}

/**
 * Bir kartın KENDİ Firestore dinleyicisinden gelen otoriter (sunucu)
 * bilgisini koordinatöre bildirir. Bir optimistic zincir sürerken (`busy`)
 * bilinçli olarak YOK SAYILIR — aksi halde henüz güncel olmayan bir
 * dinleyici anlık görüntüsü, az önce uygulanmış optimistic tahminimizin
 * üzerine yanlışlıkla yazabilirdi. Zincir bittiğinde `activeTarget` zaten
 * doğru sunucu sonucunu yansıtıyor olacağından, sıradaki dinleyici
 * bildirimi doğal olarak bunu doğrulayacaktır (no-op).
 */
export function reportServerVote(
  challengeId: string,
  submissionId: string,
  hasVoted: boolean,
): void {
  const state = getChallengeState(challengeId);

  if (state.busy) {
    return;
  }

  if (hasVoted) {
    if (state.activeTarget !== submissionId) {
      state.activeTarget = submissionId;
      notifyChallenge(challengeId);
    }

    return;
  }

  if (state.activeTarget === submissionId) {
    state.activeTarget = null;
    notifyChallenge(challengeId);
  }
}

function touch(state: ChallengeVoteState, submissionId: string): void {
  if (!state.touchedBaselines.has(submissionId)) {
    state.touchedBaselines.set(submissionId, countDeltas.get(submissionId) ?? 0);
  }
}

function applyOptimisticClick(
  state: ChallengeVoteState,
  challengeId: string,
  submissionId: string,
): void {
  // Tıklanan kart zaten aktif oy hedefiyse: geri al (toggle off).
  // Değilse: o karta taşı (ilk oy ya da transfer).
  const newTarget = state.activeTarget === submissionId ? null : submissionId;

  if (state.activeTarget && state.activeTarget !== newTarget) {
    touch(state, state.activeTarget);
    bumpDelta(state.activeTarget, -1);
  }

  if (newTarget && newTarget !== state.activeTarget) {
    touch(state, newTarget);
    bumpDelta(newTarget, 1);
  }

  state.activeTarget = newTarget;
  notifyChallenge(challengeId);
}

async function runChain(
  state: ChallengeVoteState,
  challengeId: string,
  performVote: (submissionId: string, challengeId: string) => Promise<void>,
): Promise<void> {
  state.busy = true;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const clickedId = state.pendingClick;

    if (!clickedId) {
      break;
    }

    const waiters = state.pendingWaiters;
    state.pendingClick = null;
    state.pendingWaiters = [];

    try {
      // eslint-disable-next-line no-await-in-loop
      await performVote(clickedId, challengeId);
      waiters.forEach((waiter) => waiter.resolve());
    } catch (error) {
      // Rollback: bu zincir başlamadan hemen önceki bilinen geçerli
      // duruma dön. Sayaç delta'ları da SIFIRA değil, zincir başlamadan
      // önceki tam değerlerine geri yüklenir — böylece bu zincirden önce
      // (başka, başarıyla commit edilmiş bir işlemden) gelen meşru bir
      // delta yanlışlıkla silinmez.
      state.activeTarget = state.chainBaseline;
      state.touchedBaselines.forEach((baseline, id) => setDeltaValue(id, baseline));
      state.touchedBaselines.clear();
      notifyChallenge(challengeId);

      waiters.forEach((waiter) => waiter.reject(error));

      // Bu istek sürerken kuyruğa yeni bir tıklama daha eklenmiş olabilir;
      // zincir kırıldığı için onu da aynı hatayla reddedip temizliyoruz.
      if (state.pendingClick) {
        const strandedWaiters = state.pendingWaiters;
        state.pendingClick = null;
        state.pendingWaiters = [];
        strandedWaiters.forEach((waiter) => waiter.reject(error));
      }

      state.busy = false;

      return;
    }
  }

  // Başarı: `activeTarget` zaten her tıklamada canlı olarak doğru nihai
  // değere güncellenmişti. Sayaç delta'ları kasıtlı olarak burada
  // TEMİZLENMİYOR — Cloud Function henüz `voteCount`'u yeniden
  // hesaplamamış olabilir; `reportServerCount` ile taze bir değer
  // geldiğinde kendiliğinden silinecekler.
  state.touchedBaselines.clear();
  state.busy = false;
}

/**
 * Bir "Oy Ver" butonuna basıldığında çağrılır.
 *
 * - Optimistic UI'ı ANINDA (senkron) günceller.
 * - Şu an başka bir istek sürmüyorsa gerçek Firestore çağrısını hemen başlatır.
 * - Sürüyorsa, bu tıklamayı "sıradaki gerçek istek" olarak kuyruğa yazar
 *   (öncekinin üzerine yazarak) ve zincir bittiğinde sonuçlanacak bir
 *   promise döner.
 */
export function requestVote(
  challengeId: string,
  submissionId: string,
  performVote: (submissionId: string, challengeId: string) => Promise<void>,
): Promise<void> {
  const state = getChallengeState(challengeId);
  const isStartingNewChain = !state.busy;

  if (isStartingNewChain) {
    state.chainBaseline = state.activeTarget;
  }

  applyOptimisticClick(state, challengeId, submissionId);

  return new Promise<void>((resolve, reject) => {
    state.pendingWaiters.push({ resolve, reject });
    state.pendingClick = submissionId;

    if (isStartingNewChain) {
      void runChain(state, challengeId, performVote);
    }
  });
}

/**
 * Sadece testler için: modül seviyesindeki paylaşılan durumu sıfırlar.
 */
export function __resetVoteCoordinatorForTests(): void {
  challengeStates.clear();
  countDeltas.clear();
  countBaselines.clear();
  countListeners.clear();
}
