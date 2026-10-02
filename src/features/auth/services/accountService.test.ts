import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

const FAKE_USER = { email: 'a@b.co' };

const mockModules = (
  t: any,
  options: {
    user: unknown;
    reauth?: (...args: unknown[]) => Promise<void>;
    requestDeletion?: () => Promise<void>;
    logout?: () => Promise<void>;
  },
) => {
  t.mock.module('firebase/auth', {
    namedExports: {
      EmailAuthProvider: {
        credential: (email: string, password: string) => ({ email, password }),
      },
      reauthenticateWithCredential: options.reauth ?? (async () => {}),
    },
  });
  t.mock.module('../../../services/firebase/functions', {
    namedExports: { requestAccountDeletion: options.requestDeletion ?? (async () => {}) },
  });
  t.mock.module('./authServices', {
    namedExports: {
      auth: { currentUser: options.user },
      logoutUser: options.logout ?? (async () => {}),
    },
  });
};

describe('deleteAccount', () => {
  test('oturum yoksa hiçbir şey çağrılmadan hata fırlatır', async (t) => {
    const requestDeletion = t.mock.fn(async () => {});
    mockModules(t, { user: null, requestDeletion });
    const { deleteAccount } = await import(`./accountService.ts?case=nouser-${Date.now()}`);

    await assert.rejects(() => deleteAccount('sifre'), /Kullanıcı oturumu bulunamadı/);
    assert.equal(requestDeletion.mock.calls.length, 0);
  });

  test('önce şifreyle yeniden doğrular, sonra sunucuyu çağırır, sonra çıkış yapar', async (t) => {
    const order: string[] = [];
    const credentials: unknown[] = [];

    mockModules(t, {
      user: FAKE_USER,
      reauth: async (_user, credential) => {
        order.push('reauth');
        credentials.push(credential);
      },
      requestDeletion: async () => {
        order.push('delete');
      },
      logout: async () => {
        order.push('logout');
      },
    });
    const { deleteAccount } = await import(`./accountService.ts?case=ok-${Date.now()}`);

    await deleteAccount('gizli-sifre');

    assert.deepEqual(order, ['reauth', 'delete', 'logout']);
    assert.deepEqual(credentials[0], { email: 'a@b.co', password: 'gizli-sifre' });
  });

  test('yeniden doğrulama başarısızsa (yanlış şifre) sunucu çağrılmaz', async (t) => {
    const requestDeletion = t.mock.fn(async () => {});
    mockModules(t, {
      user: FAKE_USER,
      reauth: async () => {
        throw Object.assign(new Error('x'), { code: 'auth/invalid-credential' });
      },
      requestDeletion,
    });
    const { deleteAccount } = await import(`./accountService.ts?case=wrongpw-${Date.now()}`);

    await assert.rejects(() => deleteAccount('yanlis'));
    assert.equal(requestDeletion.mock.calls.length, 0);
  });

  test('çıkış hatası silme işlemini başarısız saydırmaz', async (t) => {
    mockModules(t, {
      user: FAKE_USER,
      logout: async () => {
        throw new Error('zaten çıkış yapılmış');
      },
    });
    const { deleteAccount } = await import(`./accountService.ts?case=logout-${Date.now()}`);

    await assert.doesNotReject(() => deleteAccount('sifre'));
  });
});
