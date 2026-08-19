import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  __resetVoteCoordinatorForTests,
  getActiveTarget,
  getCountDelta,
  reportServerCount,
  reportServerVote,
  requestVote,
} from './voteCoordinator.ts';

/**
 * `voteCoordinator` saf (Firestore/React'ten bağımsız) bir modül olduğu
 * için burada gerçek Firebase/servis çağrısı yerine sahte bir
 * `performVote` fonksiyonu enjekte ediyoruz — testler sadece
 * koordinasyon mantığını (optimistic state, kuyruklama, rollback,
 * delta temizliği, sunucu senkronizasyonu) doğruluyor.
 *
 * Modül seviyesindeki paylaşılan durum testler arası sızmasın diye her
 * testte `__resetVoteCoordinatorForTests()` ile sıfırlanıyor.
 */

describe('voteCoordinator.requestVote — anlık optimistic güncelleme', () => {
  test('ilk oy: performVote çağrılmadan ÖNCE bile activeTarget ve delta anında uygulanır', async () => {
    __resetVoteCoordinatorForTests();

    let resolvePerformVote: () => void = () => {};
    const performVote = () =>
      new Promise<void>((resolve) => {
        resolvePerformVote = resolve;
      });

    const promise = requestVote('challenge1', 'subA', performVote);

    // Ağ isteği henüz sonuçlanmadı ama optimistic state zaten güncel.
    assert.equal(getActiveTarget('challenge1'), 'subA');
    assert.equal(getCountDelta('subA'), 1);

    resolvePerformVote();
    await promise;

    // Başarıyla bitince `activeTarget` KALICI olarak sonucu yansıtır
    // (sıradaki tıklamanın toggle/transfer kararı buna göre verilir).
    assert.equal(getActiveTarget('challenge1'), 'subA');
    // Sayaç delta'sı ise sunucudan taze veri gelene kadar KASITLI olarak kalır.
    assert.equal(getCountDelta('subA'), 1);
  });

  test('toggle off: zaten oy verilmiş karta tekrar tıklama oyu geri alır', async () => {
    __resetVoteCoordinatorForTests();

    const performVote = async () => {};

    await requestVote('challenge1', 'subA', performVote);
    assert.equal(getActiveTarget('challenge1'), 'subA');

    let resolvePerformVote: () => void = () => {};
    const secondPerformVote = () =>
      new Promise<void>((resolve) => {
        resolvePerformVote = resolve;
      });

    const promise = requestVote('challenge1', 'subA', secondPerformVote);

    assert.equal(getActiveTarget('challenge1'), null);
    assert.equal(getCountDelta('subA'), 0);

    resolvePerformVote();
    await promise;
    assert.equal(getActiveTarget('challenge1'), null);
  });

  test("transfer: A oyluyken B'ye tıklama A -1 B +1 uygular", async () => {
    __resetVoteCoordinatorForTests();

    // "A oyluyken" senaryosu: A'nın oyu bu testten ÖNCE (ör. sunucu
    // dinleyicisinden) zaten onaylanmış, hiçbir optimistic delta
    // uygulanmamış saf bir başlangıç durumu.
    reportServerVote('challenge1', 'subA', true);
    assert.equal(getActiveTarget('challenge1'), 'subA');
    assert.equal(getCountDelta('subA'), 0);

    let resolveSecond: () => void = () => {};
    const second = () =>
      new Promise<void>((resolve) => {
        resolveSecond = resolve;
      });

    const secondPromise = requestVote('challenge1', 'subB', second);

    assert.equal(getActiveTarget('challenge1'), 'subB');
    assert.equal(getCountDelta('subA'), -1);
    assert.equal(getCountDelta('subB'), 1);

    resolveSecond();
    await secondPromise;
    assert.equal(getActiveTarget('challenge1'), 'subB');
  });
});

describe('voteCoordinator.requestVote — race condition / son tıklama kazanır', () => {
  test('bir istek sürerken art arda 3 farklı karta basılırsa sadece 1 ilk + 1 son gerçek çağrı gider', async () => {
    __resetVoteCoordinatorForTests();

    const calls: string[] = [];
    let resolveFirstCall: () => void = () => {};

    const performVote = async (submissionId: string) => {
      calls.push(submissionId);

      if (calls.length === 1) {
        // İlk çağrıyı elle kontrol edebilmek için bekletiyoruz.
        await new Promise<void>((resolve) => {
          resolveFirstCall = resolve;
        });
      }
    };

    const p1 = requestVote('challenge1', 'subA', performVote);
    // İlk istek (subA) hâlâ "in-flight" iken art arda B ve C'ye basılıyor.
    const p2 = requestVote('challenge1', 'subB', performVote);
    const p3 = requestVote('challenge1', 'subC', performVote);

    // Optimistic görünüm anında son tıklamayı (C) yansıtmalı.
    assert.equal(getActiveTarget('challenge1'), 'subC');

    // Henüz sadece ilk (subA) gerçek çağrı gitmiş olmalı.
    assert.deepEqual(calls, ['subA']);

    resolveFirstCall();
    await Promise.all([p1, p2, p3]);

    // subB hiç sunucuya gitmemeli (kuyrukta üzerine yazıldı); sadece
    // subA (ilk, zaten başlamıştı) ve subC (son, kazanan) gerçek çağrı aldı.
    assert.deepEqual(calls, ['subA', 'subC']);
    assert.equal(getActiveTarget('challenge1'), 'subC');
  });

  test("kuyruğa giren tüm süperseded tıklamaların promise'i final sonuçla birlikte çözülür", async () => {
    __resetVoteCoordinatorForTests();

    let resolveFirstCall: () => void = () => {};
    const performVote = async (submissionId: string) => {
      if (submissionId === 'subA') {
        await new Promise<void>((resolve) => {
          resolveFirstCall = resolve;
        });
      }
    };

    const p1 = requestVote('challenge1', 'subA', performVote);
    const p2 = requestVote('challenge1', 'subB', performVote);
    const p3 = requestVote('challenge1', 'subC', performVote);

    resolveFirstCall();

    // Süperseded olan subB'nin promise'i de subC'nin gerçek isteğiyle
    // birlikte başarıyla çözülmeli (hata fırlatmamalı).
    await assert.doesNotReject(Promise.all([p1, p2, p3]));
  });
});

describe('voteCoordinator.requestVote — hata durumunda rollback', () => {
  test('performVote reddederse tüm optimistic değişiklikler geri alınır ve promise reddedilir', async () => {
    __resetVoteCoordinatorForTests();

    const error = new Error('Kendi eserinize oy veremezsiniz.');
    const performVote = async () => {
      throw error;
    };

    await assert.rejects(
      () => requestVote('challenge1', 'subA', performVote),
      error,
    );

    assert.equal(getActiveTarget('challenge1'), null);
    assert.equal(getCountDelta('subA'), 0);
  });

  test('rollback, zincir başlamadan önceki gerçek duruma (başka bir submission olsa bile) döner', async () => {
    __resetVoteCoordinatorForTests();

    // Önce gerçekten subA'ya oy verilmiş olsun.
    await requestVote('challenge1', 'subA', async () => {});
    assert.equal(getActiveTarget('challenge1'), 'subA');

    // Şimdi subB'ye geçmeye çalışırken sunucu reddetsin (örn. kendi eseri).
    const error = new Error('Kendi eserinize oy veremezsiniz.');
    await assert.rejects(
      () => requestVote('challenge1', 'subB', async () => {
        throw error;
      }),
      error,
    );

    // Rollback: subA hâlâ aktif oy olarak kalmalı, subB'ye hiç geçilmemiş gibi.
    assert.equal(getActiveTarget('challenge1'), 'subA');
    assert.equal(getCountDelta('subA'), 1);
    assert.equal(getCountDelta('subB'), 0);
  });

  test('zincirdeki ikinci (kuyruklanmış) istek başarısız olursa kuyruktaki bekleyenler de reddedilir', async () => {
    __resetVoteCoordinatorForTests();

    let resolveFirstCall: () => void = () => {};
    const error = new Error('ağ hatası');

    const performVote = async (submissionId: string) => {
      if (submissionId === 'subA') {
        await new Promise<void>((resolve) => {
          resolveFirstCall = resolve;
        });

        return;
      }

      throw error;
    };

    const p1 = requestVote('challenge1', 'subA', performVote);
    const p2 = requestVote('challenge1', 'subB', performVote);

    resolveFirstCall();

    await p1; // subA gerçekten başarıyla gitti.
    await assert.rejects(() => p2, error);

    // subB başarısız olduğu için rollback: zincir başlamadan önceki
    // (yani challenge1 için hiç oy yokken) duruma dönülür — subA'nın
    // "gerçekten" gitmiş olması bu senaryoda basitleştirme gereği geri
    // alınıyor; sonraki gerçek Firestore dinleyicisi bildirimi
    // (`reportServerVote`) durumu kendiliğinden yeniden düzeltecektir.
    assert.equal(getActiveTarget('challenge1'), null);
    assert.equal(getCountDelta('subB'), 0);
  });
});

describe('voteCoordinator.reportServerVote — sunucu senkronizasyonu', () => {
  test('boştayken (busy=false) gelen sunucu bildirimi activeTarget\'ı günceller', () => {
    __resetVoteCoordinatorForTests();

    reportServerVote('challenge1', 'subA', true);
    assert.equal(getActiveTarget('challenge1'), 'subA');

    reportServerVote('challenge1', 'subA', false);
    assert.equal(getActiveTarget('challenge1'), null);
  });

  test('busy iken gelen sunucu bildirimi yok sayılır (optimistic tahmin ezilmez)', async () => {
    __resetVoteCoordinatorForTests();

    let resolvePerformVote: () => void = () => {};
    const performVote = () =>
      new Promise<void>((resolve) => {
        resolvePerformVote = resolve;
      });

    const promise = requestVote('challenge1', 'subA', performVote);
    assert.equal(getActiveTarget('challenge1'), 'subA');

    // Örn. eski bir listener callback'i, tıklamadan önceki hâli bildiriyor.
    reportServerVote('challenge1', 'subA', false);
    assert.equal(getActiveTarget('challenge1'), 'subA');

    resolvePerformVote();
    await promise;
  });
});

describe('voteCoordinator.reportServerCount — delta kendi kendini temizler', () => {
  test('delta aktifken sunucudan farklı bir değer gelirse delta temizlenir', async () => {
    __resetVoteCoordinatorForTests();

    const performVote = async () => {};
    await requestVote('challenge1', 'subA', performVote);

    assert.equal(getCountDelta('subA'), 1);

    // İlk gözlem: delta aktifken gelen ilk değer "baseline" olarak
    // kaydedilir, henüz temizlenmez (Cloud Function muhtemelen henüz
    // koşmadı).
    reportServerCount('subA', 5);
    assert.equal(getCountDelta('subA'), 1);

    // Aynı değer tekrar gelirse hâlâ temizlenmemeli.
    reportServerCount('subA', 5);
    assert.equal(getCountDelta('subA'), 1);

    // Cloud Function koşup gerçek (bizim oyumuzu da içeren) değeri
    // yazınca delta bırakılır.
    reportServerCount('subA', 6);
    assert.equal(getCountDelta('subA'), 0);
  });

  test('aktif delta yokken çağrılması hiçbir şeyi değiştirmez', () => {
    __resetVoteCoordinatorForTests();

    reportServerCount('subZ', 42);
    assert.equal(getCountDelta('subZ'), 0);
  });
});
