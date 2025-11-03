/**
 * Performance monitoring service để track metrics và performance
 * ✅ OPTIMIZATION: Monitor scheduler performance và identify bottlenecks
 */

interface PerformanceMetrics {
  [key: string]: number;
}

interface PerformanceTransaction {
  name: string;
  startTime: number;
  endTime?: number;
  metrics: PerformanceMetrics;
  errors: Array<{ error: any; timestamp: number }>;
  status?: 'ok' | 'error';
}

export class PerformanceMonitor {
  private static transactions = new Map<string, PerformanceTransaction>();
  private static globalMetrics = new Map<string, number[]>();
  
  /**
   * Start performance transaction
   */
  static start(name: string): PerformanceMonitorInstance {
    const transaction: PerformanceTransaction = {
      name,
      startTime: Date.now(),
      metrics: {},
      errors: []
    };
    
    const id = `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.transactions.set(id, transaction);
    
    return new PerformanceMonitorInstance(id, transaction);
  }
  
  /**
   * Record global metric
   */
  static recordGlobalMetric(name: string, value: number): void {
    if (!this.globalMetrics.has(name)) {
      this.globalMetrics.set(name, []);
    }
    
    const values = this.globalMetrics.get(name)!;
    values.push(value);
    
    // Keep last 100 values
    if (values.length > 100) {
      values.shift();
    }
  }
  
  /**
   * Get global metrics statistics
   */
  static getGlobalStats(): Record<string, {
    count: number;
    avg: number;
    min: number;
    max: number;
    latest: number;
  }> {
    const stats: Record<string, any> = {};
    
    for (const [name, values] of this.globalMetrics.entries()) {
      if (values.length === 0) continue;
      
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const latest = values[values.length - 1];
      
      stats[name] = {
        count: values.length,
        avg: Math.round(avg * 100) / 100,
        min,
        max,
        latest
      };
    }
    
    return stats;
  }
  
  /**
   * Get recent transactions
   */
  static getRecentTransactions(limit = 10): PerformanceTransaction[] {
    const transactions = Array.from(this.transactions.values())
      .sort((a, b) => (b.endTime || b.startTime) - (a.endTime || a.startTime))
      .slice(0, limit);
    
    return transactions;
  }
  
  /**
   * Cleanup old transactions
   */
  static cleanup(olderThanMs = 60 * 60 * 1000): void {
    const cutoff = Date.now() - olderThanMs;
    let cleaned = 0;
    
    for (const [id, transaction] of this.transactions.entries()) {
      const timestamp = transaction.endTime || transaction.startTime;
      if (timestamp < cutoff) {
        this.transactions.delete(id);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 [PERFORMANCE] Cleaned up ${cleaned} old transactions`);
    }
  }
  
  /**
   * Get summary report
   */
  static getSummary(): {
    activeTransactions: number;
    totalTransactions: number;
    globalMetrics: Record<string, any>;
    recentErrors: Array<{ transaction: string; error: any; timestamp: number }>;
  } {
    const activeTransactions = Array.from(this.transactions.values())
      .filter(t => !t.endTime).length;
    
    const recentErrors: Array<{ transaction: string; error: any; timestamp: number }> = [];
    for (const transaction of this.transactions.values()) {
      for (const error of transaction.errors) {
        recentErrors.push({
          transaction: transaction.name,
          error: error.error,
          timestamp: error.timestamp
        });
      }
    }
    
    // Sort by timestamp desc and take last 20
    recentErrors.sort((a, b) => b.timestamp - a.timestamp);
    recentErrors.splice(20);
    
    return {
      activeTransactions,
      totalTransactions: this.transactions.size,
      globalMetrics: this.getGlobalStats(),
      recentErrors
    };
  }
}

/**
 * Performance monitor instance cho một transaction
 */
export class PerformanceMonitorInstance {
  constructor(
    private id: string,
    private transaction: PerformanceTransaction
  ) {}
  
  /**
   * Record metric for this transaction
   */
  recordMetric(name: string, value: number): void {
    this.transaction.metrics[name] = value;
    PerformanceMonitor.recordGlobalMetric(name, value);
  }
  
  /**
   * Record error
   */
  recordError(error: any): void {
    this.transaction.errors.push({
      error,
      timestamp: Date.now()
    });
    this.transaction.status = 'error';
  }
  
  /**
   * Set transaction data
   */
  setData(key: string, value: any): void {
    this.transaction.metrics[key] = value;
  }
  
  /**
   * Set transaction status
   */
  setStatus(status: 'ok' | 'error'): void {
    this.transaction.status = status;
  }
  
  /**
   * End transaction
   */
  end(): void {
    this.transaction.endTime = Date.now();
    
    if (!this.transaction.status) {
      this.transaction.status = 'ok';
    }
    
    const duration = this.transaction.endTime - this.transaction.startTime;
    this.transaction.metrics['duration'] = duration;
    
    // Log transaction summary
    const errorCount = this.transaction.errors.length;
    const status = this.transaction.status;
    const emoji = status === 'ok' ? '✅' : '❌';
    
    console.log(`${emoji} [PERFORMANCE] Transaction '${this.transaction.name}' completed in ${duration}ms`, {
      status,
      errorCount,
      metrics: this.transaction.metrics
    });
  }
  
  /**
   * Get transaction data
   */
  getData(): PerformanceTransaction {
    return this.transaction;
  }
}

/**
 * Decorator để monitor function performance
 */
export function monitored(transactionName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const txName = transactionName || `${target.constructor.name}.${propertyKey}`;
    
    descriptor.value = async function (...args: any[]) {
      const monitor = PerformanceMonitor.start(txName);
      
      try {
        const result = await originalMethod.apply(this, args);
        monitor.setStatus('ok');
        return result;
      } catch (error) {
        monitor.recordError(error);
        throw error;
      } finally {
        monitor.end();
      }
    };
    
    return descriptor;
  };
}
