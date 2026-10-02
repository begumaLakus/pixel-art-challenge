import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

const FAKE_AUTH_INSTANCE = { __authInstance: true };

const FAKE_PERSISTENCE = { __persistence: true };

const mockPlatform = (t: any, os: string, storage: unknown = { __storage: true }) => {
  t.mock.module('react-native', {
    namedExports: { Platform: { OS: os } },
  });
  t.mock.module('@react-native-async-storage/async-storage', {
    defaultExport: storage,
  });
};

const mockFirebaseAuth = (
  t: any,
  overrides: Record<string, unknown> = {},
  platform = 'ios',
) => {
  mockPlatform(t, platform);
  t.mock.module('firebase/auth', {
    namedExports: {
      getAuth: () => FAKE_AUTH_INSTANCE,
      connectAuthEmulator: () => {},
      initializeAuth: () => FAKE_AUTH_INSTANCE,
      getReactNativePersistence: () => FAKE_PERSISTENCE,
      createUserWithEmailAndPassword: async () => ({
        user: { uid: 'u1', email: 'test@example.com' },
      }),
      signInWithEmailAndPassword: async () => ({
        user: { uid: 'u1', email: 'test@example.com' },
      }),
      signOut: async () => {},
      ...overrides,
    },
  });
};

const mockFirestore = (t: any, createUserProfileFn: (...args: unknown[]) => unknown) => {
  t.mock.module('../../../services/firebase/firebaseConfig', {
    namedExports: { firebaseApp: { __app: true } },
  });
  t.mock.module('../../../services/firebase/firestore', {
    namedExports: { createUserProfile: createUserProfileFn },
  });
};

describe('authServices.registerUser', () => {
  test('kullanıcı oluşturur ve dönen uid + email ile createUserProfile çağırır', async (t) => {
    const createUserProfileFn = t.mock.fn(async () => {});
    mockFirebaseAuth(t, {
      createUserWithEmailAndPassword: async (_auth: unknown, email: string) => ({
        user: { uid: 'u1', email },
      }),
    });
    mockFirestore(t, createUserProfileFn);

    const { registerUser } = await import(
      `./authServices.ts?case=register-${Date.now()}`
    );

    await registerUser('test@example.com', 'sifre123');

    assert.equal(createUserProfileFn.mock.calls.length, 1);
    const [uid, email] = createUserProfileFn.mock.calls[0].arguments;
    assert.equal(uid, 'u1');
    assert.equal(email, 'test@example.com');
  });

  test('credential.user.email null ise parametre olarak verilen email fallback olarak kullanılır', async (t) => {
    const createUserProfileFn = t.mock.fn(async () => {});
    mockFirebaseAuth(t, {
      createUserWithEmailAndPassword: async () => ({
        user: { uid: 'u2', email: null },
      }),
    });
    mockFirestore(t, createUserProfileFn);

    const { registerUser } = await import(
      `./authServices.ts?case=register-fallback-${Date.now()}`
    );

    await registerUser('fallback@example.com', 'sifre123');

    const [, email] = createUserProfileFn.mock.calls[0].arguments;
    assert.equal(email, 'fallback@example.com');
  });

  test('createUserProfile hata fırlatırsa registerUser de hatayı yukarı fırlatır', async (t) => {
    mockFirebaseAuth(t);
    mockFirestore(t, async () => {
      throw new Error('firestore yazma hatası');
    });

    const { registerUser } = await import(
      `./authServices.ts?case=register-error-${Date.now()}`
    );

    await assert.rejects(
      () => registerUser('test@example.com', 'sifre123'),
      /firestore yazma hatası/,
    );
  });
});

describe('authServices.loginUser / logoutUser', () => {
  test("loginUser trim edilmemiş parametreleri olduğu gibi signInWithEmailAndPassword'a iletir", async (t) => {
    const signInFn = t.mock.fn(async () => ({ user: { uid: 'u1' } }));
    mockFirebaseAuth(t, { signInWithEmailAndPassword: signInFn });
    mockFirestore(t, async () => {});

    const { loginUser } = await import(
      `./authServices.ts?case=login-${Date.now()}`
    );

    await loginUser('test@example.com', 'sifre123');

    assert.equal(signInFn.mock.calls.length, 1);
    const [, email, password] = signInFn.mock.calls[0].arguments;
    assert.equal(email, 'test@example.com');
    assert.equal(password, 'sifre123');
  });

  test("logoutUser signOut'u çağırır", async (t) => {
    const signOutFn = t.mock.fn(async () => {});
    mockFirebaseAuth(t, { signOut: signOutFn });
    mockFirestore(t, async () => {});

    const { logoutUser } = await import(
      `./authServices.ts?case=logout-${Date.now()}`
    );

    await logoutUser();
    assert.equal(signOutFn.mock.calls.length, 1);
  });
});


describe('authServices oturum kalıcılığı', () => {
  test('native platformda AsyncStorage kalıcılığıyla initializeAuth çağrılır', async (t) => {
    const storage = { __storage: 'async-storage' };
    const initializeAuthFn = t.mock.fn((..._args: unknown[]) => FAKE_AUTH_INSTANCE);
    const getAuthFn = t.mock.fn(() => ({ __getAuth: true }));
    const persistenceFn = t.mock.fn((_storage: unknown) => FAKE_PERSISTENCE);

    mockPlatform(t, 'ios', storage);
    t.mock.module('firebase/auth', {
      namedExports: {
        getAuth: getAuthFn,
        connectAuthEmulator: () => {},
        initializeAuth: initializeAuthFn,
        getReactNativePersistence: persistenceFn,
        createUserWithEmailAndPassword: async () => ({}),
        signInWithEmailAndPassword: async () => ({}),
        signOut: async () => {},
      },
    });
    mockFirestore(t, async () => {});

    const { auth } = await import(`./authServices.ts?case=native-${Date.now()}`);

    assert.equal(auth, FAKE_AUTH_INSTANCE);
    assert.equal(initializeAuthFn.mock.calls.length, 1);
    assert.equal(persistenceFn.mock.calls[0].arguments[0], storage);
    assert.deepEqual(initializeAuthFn.mock.calls[0].arguments[1], {
      persistence: FAKE_PERSISTENCE,
    });
    assert.equal(getAuthFn.mock.calls.length, 0);
  });

  test("web'de getAuth kullanılır, initializeAuth çağrılmaz", async (t) => {
    const initializeAuthFn = t.mock.fn(() => FAKE_AUTH_INSTANCE);
    const getAuthFn = t.mock.fn(() => ({ __web: true }));

    mockPlatform(t, 'web');
    t.mock.module('firebase/auth', {
      namedExports: {
        getAuth: getAuthFn,
        connectAuthEmulator: () => {},
        initializeAuth: initializeAuthFn,
        getReactNativePersistence: () => FAKE_PERSISTENCE,
        createUserWithEmailAndPassword: async () => ({}),
        signInWithEmailAndPassword: async () => ({}),
        signOut: async () => {},
      },
    });
    mockFirestore(t, async () => {});

    const { auth } = await import(`./authServices.ts?case=web-${Date.now()}`);

    assert.deepEqual(auth, { __web: true });
    assert.equal(initializeAuthFn.mock.calls.length, 0);
  });

  test('initializeAuth zaten çağrılmışsa (Fast Refresh) mevcut örneğe düşer', async (t) => {
    const existing = { __existing: true };

    mockPlatform(t, 'android');
    t.mock.module('firebase/auth', {
      namedExports: {
        getAuth: () => existing,
        connectAuthEmulator: () => {},
        initializeAuth: () => {
          throw new Error('auth/already-initialized');
        },
        getReactNativePersistence: () => FAKE_PERSISTENCE,
        createUserWithEmailAndPassword: async () => ({}),
        signInWithEmailAndPassword: async () => ({}),
        signOut: async () => {},
      },
    });
    mockFirestore(t, async () => {});

    const { auth } = await import(`./authServices.ts?case=refresh-${Date.now()}`);

    assert.equal(auth, existing);
  });
});
