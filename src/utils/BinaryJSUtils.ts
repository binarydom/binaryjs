/**
 * Utility class for BinaryJS with high-performance methods
 */
export class BinaryJSUtils {
  private static instance: BinaryJSUtils;
  private cache: Map<string, any> = new Map();
  private memoizedFunctions: Map<string, Function> = new Map();

  private constructor() {}

  static getInstance(): BinaryJSUtils {
    if (!BinaryJSUtils.instance) {
      BinaryJSUtils.instance = new BinaryJSUtils();
    }
    return BinaryJSUtils.instance;
  }

  /**
   * Date and Time Utilities
   */
  static formatDate(date: Date, format: string = "YYYY-MM-DD"): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return format
      .replace("YYYY", String(year))
      .replace("MM", month)
      .replace("DD", day)
      .replace("HH", hours)
      .replace("mm", minutes)
      .replace("ss", seconds);
  }

  static parseDate(dateString: string, format: string = "YYYY-MM-DD"): Date {
    const parts = dateString.split(/[- :]/);
    const formatParts = format.split(/[- :]/);

    const dateObj: { [key: string]: number } = {};
    formatParts.forEach((part, index) => {
      dateObj[part] = parseInt(parts[index], 10);
    });

    return new Date(
      dateObj["YYYY"],
      dateObj["MM"] - 1,
      dateObj["DD"],
      dateObj["HH"] || 0,
      dateObj["mm"] || 0,
      dateObj["ss"] || 0
    );
  }

  static isDateValid(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }

  static getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "just now";
  }

  /**
   * String Utilities
   */
  static slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  static truncate(
    text: string,
    length: number,
    suffix: string = "..."
  ): string {
    if (text.length <= length) return text;
    return text.substring(0, length - suffix.length) + suffix;
  }

  static capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  static generateId(prefix: string = ""): string {
    return `${prefix}${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Number Utilities
   */
  static formatNumber(
    num: number,
    options: Intl.NumberFormatOptions = {}
  ): string {
    return new Intl.NumberFormat(undefined, options).format(num);
  }

  static clamp(num: number, min: number, max: number): number {
    return Math.min(Math.max(num, min), max);
  }

  static roundToPrecision(num: number, precision: number = 2): number {
    const factor = Math.pow(10, precision);
    return Math.round(num * factor) / factor;
  }

  /**
   * Array Utilities
   */
  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  static unique<T>(array: T[]): T[] {
    return Array.from(new Set(array));
  }

  static shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Object Utilities
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as any;
    }

    if (obj instanceof Array) {
      return obj.map((item) => this.deepClone(item)) as any;
    }

    if (obj instanceof Object) {
      const copy = {} as T;
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          copy[key] = this.deepClone(obj[key]);
        }
      }
      return copy;
    }

    return obj;
  }

  static pick<T extends object, K extends keyof T>(
    obj: T,
    keys: K[]
  ): Pick<T, K> {
    return keys.reduce(
      (result, key) => {
        if (key in obj) {
          result[key] = obj[key];
        }
        return result;
      },
      {} as Pick<T, K>
    );
  }

  static omit<T extends object, K extends keyof T>(
    obj: T,
    keys: K[]
  ): Omit<T, K> {
    const result = { ...obj };
    keys.forEach((key) => delete result[key]);
    return result as Omit<T, K>;
  }

  /**
   * Performance Utilities
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: Parameters<T>) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return function executedFunction(...args: Parameters<T>) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  static memoize<T extends (...args: any[]) => any>(
    func: T,
    keyFn?: (...args: Parameters<T>) => string
  ): T {
    const cache = new Map<string, ReturnType<T>>();
    return function memoizedFunction(...args: Parameters<T>): ReturnType<T> {
      const key = keyFn ? keyFn(...args) : JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key)!;
      }
      const result = func(...args);
      cache.set(key, result);
      return result;
    } as T;
  }

  /**
   * Validation Utilities
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    return phoneRegex.test(phone);
  }

  /**
   * File Utilities
   */
  static formatFileSize(bytes: number): string {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  static getFileExtension(filename: string): string {
    return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
  }

  static sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  }

  /**
   * Color Utilities
   */
  static hexToRGB(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  }

  static rgbToHex(r: number, g: number, b: number): string {
    return (
      "#" +
      [r, g, b]
        .map((x) => {
          const hex = x.toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        })
        .join("")
    );
  }

  static getContrastColor(hexColor: string): string {
    const { r, g, b } = this.hexToRGB(hexColor);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "#000000" : "#FFFFFF";
  }
}

// Example usage:
const utils = BinaryJSUtils.getInstance();

// Date formatting
const date = new Date();
console.log(BinaryJSUtils.formatDate(date, "YYYY-MM-DD HH:mm:ss"));

// String manipulation
const text = "Hello World";
console.log(BinaryJSUtils.capitalize(text));

// Number formatting
const number = 1234567.89;
console.log(
  BinaryJSUtils.formatNumber(number, { style: "currency", currency: "USD" })
);

// Array operations
const array = [1, 2, 3, 4, 5, 6, 7, 8];
console.log(BinaryJSUtils.chunk(array, 3));

// Performance optimization
const expensiveOperation = (n: number) => n * n;
const memoizedOperation = BinaryJSUtils.memoize(expensiveOperation);
console.log(memoizedOperation(5)); // Cached result on second call

// Color utilities
const color = "#FF5733";
console.log(BinaryJSUtils.hexToRGB(color));
console.log(BinaryJSUtils.getContrastColor(color));
