const GLOBAL_KEY = '__autopostvnContentPlanThrottle';

interface ThrottleState {
  chains: Map<string, Promise<void>>;
  lastCall: Map<string, number>;
}

function getState(): ThrottleState {
  const globalScope = globalThis as typeof globalThis & {
    [GLOBAL_KEY]?: ThrottleState;
  };

  if (!globalScope[GLOBAL_KEY]) {
    globalScope[GLOBAL_KEY] = {
      chains: new Map(),
      lastCall: new Map(),
    };
  }

  return globalScope[GLOBAL_KEY]!;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const DEFAULT_MIN_INTERVAL_MS = 30_000; // 30s giữa các lần lập kế hoạch

/**
 * Đảm bảo các request lập kế hoạch AI cách nhau tối thiểu một khoảng thời gian.
 * Giúp giảm nguy cơ bị Gemini trả về 429.
 */
export async function throttleContentPlanRequest(
  userId: string,
  minIntervalMs: number = DEFAULT_MIN_INTERVAL_MS
): Promise<void> {
  const state = getState();
  const previousChain = state.chains.get(userId) ?? Promise.resolve();

  let releaseChain!: () => void;
  const nextChain = new Promise<void>(resolve => {
    releaseChain = resolve;
  });
  state.chains.set(userId, previousChain.then(() => nextChain));

  await previousChain;

  const now = Date.now();
  const last = state.lastCall.get(userId) ?? 0;
  const waitTime = last + minIntervalMs - now;

  if (waitTime > 0) {
    await sleep(waitTime);
  }

  state.lastCall.set(userId, Date.now());
  releaseChain();
}
