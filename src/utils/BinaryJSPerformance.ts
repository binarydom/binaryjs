export class BinaryJSPerformance {
  private static instance: BinaryJSPerformance;
  private metrics: Map<string, number[]> = new Map();
  private marks: Map<string, number> = new Map();
  private enabled: boolean = false;

  private constructor() {
    this.enable();
  }

  public static getInstance(): BinaryJSPerformance {
    if (!BinaryJSPerformance.instance) {
      BinaryJSPerformance.instance = new BinaryJSPerformance();
    }
    return BinaryJSPerformance.instance;
  }

  public enable(): void {
    this.enabled = true;
  }

  public disable(): void {
    this.enabled = false;
  }

  public mark(name: string): void {
    if (!this.enabled) return;
    this.marks.set(name, performance.now());
  }

  public measure(name: string, startMark: string, endMark: string): void {
    if (!this.enabled) return;

    const start = this.marks.get(startMark);
    const end = this.marks.get(endMark);

    if (start && end) {
      const duration = end - start;
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      this.metrics.get(name)!.push(duration);
    }
  }

  public getMetrics(): Map<
    string,
    {
      avg: number;
      min: number;
      max: number;
      count: number;
    }
  > {
    const result = new Map();

    for (const [name, durations] of this.metrics) {
      if (durations.length > 0) {
        result.set(name, {
          avg: durations.reduce((a, b) => a + b, 0) / durations.length,
          min: Math.min(...durations),
          max: Math.max(...durations),
          count: durations.length,
        });
      }
    }

    return result;
  }

  public clearMetrics(): void {
    this.metrics.clear();
    this.marks.clear();
  }

  public getPerformanceReport(): string {
    const metrics = this.getMetrics();
    let report = "BinaryJS Performance Report\n";
    report += "========================\n\n";

    for (const [name, stats] of metrics) {
      report += `${name}:\n`;
      report += `  Average: ${stats.avg.toFixed(2)}ms\n`;
      report += `  Min: ${stats.min.toFixed(2)}ms\n`;
      report += `  Max: ${stats.max.toFixed(2)}ms\n`;
      report += `  Count: ${stats.count}\n\n`;
    }

    return report;
  }

  // Component lifecycle tracking
  public trackComponentLifecycle(componentName: string): {
    startMount: () => void;
    endMount: () => void;
    startUpdate: () => void;
    endUpdate: () => void;
    startRender: () => void;
    endRender: () => void;
  } {
    return {
      startMount: () => this.mark(`${componentName}_mount_start`),
      endMount: () => {
        this.mark(`${componentName}_mount_end`);
        this.measure(
          `${componentName}_mount`,
          `${componentName}_mount_start`,
          `${componentName}_mount_end`
        );
      },
      startUpdate: () => this.mark(`${componentName}_update_start`),
      endUpdate: () => {
        this.mark(`${componentName}_update_end`);
        this.measure(
          `${componentName}_update`,
          `${componentName}_update_start`,
          `${componentName}_update_end`
        );
      },
      startRender: () => this.mark(`${componentName}_render_start`),
      endRender: () => {
        this.mark(`${componentName}_render_end`);
        this.measure(
          `${componentName}_render`,
          `${componentName}_render_start`,
          `${componentName}_render_end`
        );
      },
    };
  }

  // Memory usage tracking
  public trackMemoryUsage(): {
    start: () => void;
    end: () => void;
  } {
    return {
      start: () => {
        if (performance.memory) {
          this.mark("memory_start");
        }
      },
      end: () => {
        if (performance.memory) {
          this.mark("memory_end");
          this.measure("memory_usage", "memory_start", "memory_end");
        }
      },
    };
  }
}
