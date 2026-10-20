import { json } from '@sveltejs/kit';
import { eventStudyEngine } from '#lib/server/engine/event-study.js';

export async function GET() {
  const metrics = await eventStudyEngine.getHistoricalPerformanceMetrics();
  return json(metrics);
}
