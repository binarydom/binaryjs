export class BinaryJSHooks {
  useState<T>(initialValue: T): [T, (value: T) => void] {
    let value = initialValue;
    return [
      value,
      (newValue: T) => {
        value = newValue;
      },
    ];
  }

  useEffect(callback: () => void, deps: any[]): void {
    callback();
  }

  useMemo<T>(callback: () => T, deps: any[]): T {
    return callback();
  }

  useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T {
    return callback;
  }
}
