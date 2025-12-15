/**
 * Validation utilities for prediction poll creation
 * Handles UTF-8 byte counting for multi-language support
 */

/**
 * Calculate UTF-8 byte length of a string
 * @param str String to measure
 * @returns Byte length in UTF-8 encoding
 */
export function getUTF8ByteLength(str: string): number {
  return new TextEncoder().encode(str).length;
}

/**
 * Validate question text (max 200 bytes)
 * @param question Question text
 * @returns Validation result with error message if invalid
 */
export function validateQuestion(question: string): {
  isValid: boolean;
  error?: string;
  byteLength: number;
} {
  const byteLength = getUTF8ByteLength(question);

  if (byteLength === 0) {
    return {
      isValid: false,
      error: "Question cannot be empty",
      byteLength,
    };
  }

  if (byteLength > 200) {
    return {
      isValid: false,
      error: `Question is too long (${byteLength}/200 bytes)`,
      byteLength,
    };
  }

  return { isValid: true, byteLength };
}

/**
 * Validate rules text (max 1000 bytes)
 * @param rules Rules description
 * @returns Validation result with error message if invalid
 */
export function validateRules(rules: string): {
  isValid: boolean;
  error?: string;
  byteLength: number;
} {
  const byteLength = getUTF8ByteLength(rules);

  if (byteLength === 0) {
    return {
      isValid: false,
      error: "Rules cannot be empty",
      byteLength,
    };
  }

  if (byteLength > 1000) {
    return {
      isValid: false,
      error: `Rules are too long (${byteLength}/1000 bytes)`,
      byteLength,
    };
  }

  return { isValid: true, byteLength };
}

/**
 * Validate source URL (max 200 bytes)
 * @param source Source URL
 * @returns Validation result with error message if invalid
 */
export function validateSource(source: string): {
  isValid: boolean;
  error?: string;
  byteLength: number;
} {
  const byteLength = getUTF8ByteLength(source);

  if (byteLength > 200) {
    return {
      isValid: false,
      error: `Source is too long (${byteLength}/200 bytes)`,
      byteLength,
    };
  }

  return { isValid: true, byteLength };
}

/**
 * Validate all sources array (max 3 sources)
 * @param sources Array of source URLs
 * @returns Validation result with error message if invalid
 */
export function validateSources(sources: string[]): {
  isValid: boolean;
  error?: string;
} {
  const filteredSources = sources.filter((s) => s.trim() !== "");

  if (filteredSources.length > 3) {
    return {
      isValid: false,
      error: "Maximum 3 sources allowed",
    };
  }

  for (let i = 0; i < filteredSources.length; i++) {
    const validation = validateSource(filteredSources[i]);
    if (!validation.isValid) {
      return {
        isValid: false,
        error: `Source ${i + 1}: ${validation.error}`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Get warning message if text uses non-ASCII characters
 * @param charLength Character count
 * @param byteLength Byte count
 * @returns Warning message or null
 */
export function getNonASCIIWarning(
  charLength: number,
  byteLength: number
): string | null {
  // If byte length is significantly larger than char length, text contains multi-byte chars
  if (byteLength > charLength * 1.2) {
    const ratio = (byteLength / charLength).toFixed(1);
    return `⚠️ Using non-ASCII characters (${ratio}x byte/char ratio)`;
  }
  return null;
}
