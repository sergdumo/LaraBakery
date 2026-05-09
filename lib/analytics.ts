import { logEvent as fbLogEvent } from "firebase/analytics";
import { getAnalyticsInstance } from "./firebase";

export async function logEvent(name: string, params?: Record<string, unknown>) {
  const analytics = await getAnalyticsInstance();
  if (analytics) fbLogEvent(analytics, name, params);
}
