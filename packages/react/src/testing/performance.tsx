// reference: https://stevekinney.com/courses/react-performance/performance-testing-strategy

import { Profiler, type ProfilerOnRenderCallback } from 'react';
import { expect } from 'vitest';
import { render } from 'vitest-browser-react';

interface RenderMetrics {
  renderTime: number;
  commitTime: number;
  actualDuration: number;
  baseDuration: number;
  startTime: number;
}

export function measureRenderPerformance(component: React.ReactElement, testName: string): Promise<RenderMetrics> {
  return new Promise(resolve => {
    let metrics: RenderMetrics;

    const onRender: ProfilerOnRenderCallback = (_, phase, actualDuration, baseDuration, startTime, commitTime) => {
      if (phase === 'mount' || phase === 'update') {
        metrics = {
          renderTime: actualDuration,
          commitTime,
          actualDuration,
          baseDuration,
          startTime,
        };
      }
    };

    void render(
      <Profiler id={testName} onRender={onRender}>
        {component}
      </Profiler>,
    );

    setTimeout(() => resolve(metrics), 0);
  });
}

expect.extend({
  toRenderWithinTime(received: RenderMetrics, maxTime: number) {
    const pass = received.renderTime <= maxTime;

    return {
      message: () => `Expected component to render in ${maxTime}ms, but took ${received.renderTime.toFixed(2)}ms`,
      pass,
    };
  },

  toHaveMaxReRenders(received: number, maxRenders: number) {
    const pass = received <= maxRenders;

    return {
      message: () => `Expected component to re-render at most ${maxRenders} times, but re-rendered ${received} times`,
      pass,
    };
  },
});
