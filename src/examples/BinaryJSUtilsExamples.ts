import { BinaryJSUtils } from "../utils/BinaryJSUtils";

/**
 * Examples demonstrating the usage of BinaryJSUtils
 */
class BinaryJSUtilsExamples {
  /**
   * Date and Time Examples
   */
  static dateExamples() {
    const date = new Date("2024-03-15T14:30:00");

    // Format date
    console.log(
      "Formatted date:",
      BinaryJSUtils.formatDate(date, "YYYY-MM-DD HH:mm:ss")
    );
    // Output: 2024-03-15 14:30:00

    // Parse date
    const parsedDate = BinaryJSUtils.parseDate("2024-03-15", "YYYY-MM-DD");
    console.log("Parsed date:", parsedDate);
    // Output: Date object for March 15, 2024

    // Check date validity
    console.log("Is valid date:", BinaryJSUtils.isDateValid(date));
    // Output: true

    // Get relative time
    const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
    console.log("Relative time:", BinaryJSUtils.getRelativeTime(pastDate));
    // Output: 1h ago
  }

  /**
   * String Examples
   */
  static stringExamples() {
    const text = "Hello World! This is a test.";

    // Slugify
    console.log("Slugified:", BinaryJSUtils.slugify(text));
    // Output: hello-world-this-is-a-test

    // Truncate
    console.log("Truncated:", BinaryJSUtils.truncate(text, 10));
    // Output: Hello Worl...

    // Capitalize
    console.log("Capitalized:", BinaryJSUtils.capitalize("hello"));
    // Output: Hello

    // Generate ID
    console.log("Generated ID:", BinaryJSUtils.generateId("user_"));
    // Output: user_a1b2c3d4e
  }

  /**
   * Number Examples
   */
  static numberExamples() {
    const number = 1234567.89;

    // Format number
    console.log(
      "Formatted number:",
      BinaryJSUtils.formatNumber(number, {
        style: "currency",
        currency: "USD",
      })
    );
    // Output: $1,234,567.89

    // Clamp
    console.log("Clamped:", BinaryJSUtils.clamp(150, 0, 100));
    // Output: 100

    // Round to precision
    console.log("Rounded:", BinaryJSUtils.roundToPrecision(3.14159, 2));
    // Output: 3.14
  }

  /**
   * Array Examples
   */
  static arrayExamples() {
    const array = [1, 2, 3, 4, 5, 6, 7, 8];

    // Chunk
    console.log("Chunked:", BinaryJSUtils.chunk(array, 3));
    // Output: [[1, 2, 3], [4, 5, 6], [7, 8]]

    // Unique
    const duplicates = [1, 2, 2, 3, 3, 4];
    console.log("Unique:", BinaryJSUtils.unique(duplicates));
    // Output: [1, 2, 3, 4]

    // Shuffle
    console.log("Shuffled:", BinaryJSUtils.shuffle([1, 2, 3, 4, 5]));
    // Output: Random order of numbers
  }

  /**
   * Object Examples
   */
  static objectExamples() {
    const obj = {
      name: "John",
      age: 30,
      email: "john@example.com",
      address: {
        city: "New York",
        country: "USA",
      },
    };

    // Deep clone
    const cloned = BinaryJSUtils.deepClone(obj);
    console.log("Cloned:", cloned);
    // Output: Deep copy of the object

    // Pick
    console.log("Picked:", BinaryJSUtils.pick(obj, ["name", "age"]));
    // Output: { name: 'John', age: 30 }

    // Omit
    console.log("Omitted:", BinaryJSUtils.omit(obj, ["email"]));
    // Output: { name: 'John', age: 30, address: {...} }
  }

  /**
   * Performance Examples
   */
  static performanceExamples() {
    // Debounce
    const debouncedFn = BinaryJSUtils.debounce(() => {
      console.log("Debounced function called");
    }, 1000);

    // Throttle
    const throttledFn = BinaryJSUtils.throttle(() => {
      console.log("Throttled function called");
    }, 1000);

    // Memoize
    const fibonacci = (n: number): number => {
      if (n <= 1) return n;
      return fibonacci(n - 1) + fibonacci(n - 2);
    };
    const memoizedFib = BinaryJSUtils.memoize(fibonacci);
    console.log("Memoized fibonacci:", memoizedFib(10));
    // Output: 55 (cached for subsequent calls)
  }

  /**
   * Validation Examples
   */
  static validationExamples() {
    // Email validation
    console.log("Valid email:", BinaryJSUtils.isValidEmail("test@example.com"));
    // Output: true

    // URL validation
    console.log("Valid URL:", BinaryJSUtils.isValidURL("https://example.com"));
    // Output: true

    // Phone validation
    console.log(
      "Valid phone:",
      BinaryJSUtils.isValidPhoneNumber("+1 234 567 8900")
    );
    // Output: true
  }

  /**
   * File Examples
   */
  static fileExamples() {
    // Format file size
    console.log("File size:", BinaryJSUtils.formatFileSize(1500000));
    // Output: 1.43 MB

    // Get file extension
    console.log(
      "File extension:",
      BinaryJSUtils.getFileExtension("document.pdf")
    );
    // Output: pdf

    // Sanitize filename
    console.log(
      "Sanitized filename:",
      BinaryJSUtils.sanitizeFilename("My File (2024).pdf")
    );
    // Output: my_file_2024_pdf
  }

  /**
   * Color Examples
   */
  static colorExamples() {
    const color = "#FF5733";

    // Hex to RGB
    console.log("RGB:", BinaryJSUtils.hexToRGB(color));
    // Output: { r: 255, g: 87, b: 51 }

    // RGB to Hex
    console.log("Hex:", BinaryJSUtils.rgbToHex(255, 87, 51));
    // Output: #ff5733

    // Get contrast color
    console.log("Contrast color:", BinaryJSUtils.getContrastColor(color));
    // Output: #FFFFFF (white, because the input color is dark)
  }

  /**
   * Run all examples
   */
  static runAllExamples() {
    console.log("=== Date and Time Examples ===");
    this.dateExamples();

    console.log("\n=== String Examples ===");
    this.stringExamples();

    console.log("\n=== Number Examples ===");
    this.numberExamples();

    console.log("\n=== Array Examples ===");
    this.arrayExamples();

    console.log("\n=== Object Examples ===");
    this.objectExamples();

    console.log("\n=== Performance Examples ===");
    this.performanceExamples();

    console.log("\n=== Validation Examples ===");
    this.validationExamples();

    console.log("\n=== File Examples ===");
    this.fileExamples();

    console.log("\n=== Color Examples ===");
    this.colorExamples();
  }
}

// Run all examples
BinaryJSUtilsExamples.runAllExamples();
