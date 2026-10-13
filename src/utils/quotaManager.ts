// Free usage quota tracking and smart pacing utility
export interface QuotaState {
  dailyUsed: number;
  dailyLimit: number;
  minuteUsed: number;
  minuteLimit: number;
  cooldownSeconds: number;
  lastRequestTime: number;
}

const STORAGE_KEY_DAILY_DATE = 'invoice_quota_daily_date';
const STORAGE_KEY_DAILY_COUNT = 'invoice_quota_daily_count';
const STORAGE_KEY_MINUTE_TIMESTAMPS = 'invoice_quota_minute_timestamps';

const DAILY_LIMIT = 1500;
const MINUTE_LIMIT = 15;

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function loadQuotaState(): QuotaState {
  const today = getTodayDateString();
  const savedDate = localStorage.getItem(STORAGE_KEY_DAILY_DATE);
  let dailyUsed = 0;

  if (savedDate === today) {
    dailyUsed = parseInt(localStorage.getItem(STORAGE_KEY_DAILY_COUNT) || '0', 10);
  } else {
    // New day reset
    localStorage.setItem(STORAGE_KEY_DAILY_DATE, today);
    localStorage.setItem(STORAGE_KEY_DAILY_COUNT, '0');
  }

  // Calculate minute used in rolling 60 seconds
  const now = Date.now();
  const rawTimestamps: number[] = JSON.parse(
    localStorage.getItem(STORAGE_KEY_MINUTE_TIMESTAMPS) || '[]'
  );
  const activeTimestamps = rawTimestamps.filter((t) => now - t < 60000);
  localStorage.setItem(STORAGE_KEY_MINUTE_TIMESTAMPS, JSON.stringify(activeTimestamps));

  return {
    dailyUsed,
    dailyLimit: DAILY_LIMIT,
    minuteUsed: activeTimestamps.length,
    minuteLimit: MINUTE_LIMIT,
    cooldownSeconds: 0,
    lastRequestTime: activeTimestamps.length > 0 ? Math.max(...activeTimestamps) : 0,
  };
}

export function recordQuotaRequest(): QuotaState {
  const today = getTodayDateString();
  const savedDate = localStorage.getItem(STORAGE_KEY_DAILY_DATE);
  let currentDaily = 0;

  if (savedDate === today) {
    currentDaily = parseInt(localStorage.getItem(STORAGE_KEY_DAILY_COUNT) || '0', 10);
  }
  currentDaily += 1;
  localStorage.setItem(STORAGE_KEY_DAILY_DATE, today);
  localStorage.setItem(STORAGE_KEY_DAILY_COUNT, currentDaily.toString());

  const now = Date.now();
  const rawTimestamps: number[] = JSON.parse(
    localStorage.getItem(STORAGE_KEY_MINUTE_TIMESTAMPS) || '[]'
  );
  const updatedTimestamps = [...rawTimestamps.filter((t) => now - t < 60000), now];
  localStorage.setItem(STORAGE_KEY_MINUTE_TIMESTAMPS, JSON.stringify(updatedTimestamps));

  return {
    dailyUsed: currentDaily,
    dailyLimit: DAILY_LIMIT,
    minuteUsed: updatedTimestamps.length,
    minuteLimit: MINUTE_LIMIT,
    cooldownSeconds: 0,
    lastRequestTime: now,
  };
}
