/**
 * Test Assertion Utilities
 */

export function assert(condition, message = 'Assertion failed') {
  if (!condition) {
    const err = new Error(message);
    err.name = 'AssertionError';
    throw err;
  }
}

export function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    const desc = message ? `${message} - ` : '';
    throw new Error(`${desc}Expected [${expected}] (type: ${typeof expected}) but got [${actual}] (type: ${typeof actual})`);
  }
}

export function assertDeepEqual(actual, expected, message = '') {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    const desc = message ? `${message} - ` : '';
    throw new Error(`${desc}Deep equality mismatch:\nExpected: ${expectedStr}\nActual:   ${actualStr}`);
  }
}

export function assertCloseTo(actual, expected, delta = 0.0001, message = '') {
  const diff = Math.abs(actual - expected);
  if (diff > delta) {
    const desc = message ? `${message} - ` : '';
    throw new Error(`${desc}Expected ${actual} to be close to ${expected} within delta ${delta} (diff: ${diff})`);
  }
}

export function assertIncludes(haystack, needle, message = '') {
  if (typeof haystack === 'string') {
    if (!haystack.includes(needle)) {
      const desc = message ? `${message} - ` : '';
      throw new Error(`${desc}Expected string to include [${needle}], but was: [${haystack}]`);
    }
  } else if (Array.isArray(haystack)) {
    if (!haystack.includes(needle)) {
      const desc = message ? `${message} - ` : '';
      throw new Error(`${desc}Expected array to include item [${needle}], but array contents were: [${haystack.join(', ')}]`);
    }
  } else {
    throw new Error(`assertIncludes unsupported target type: ${typeof haystack}`);
  }
}

export function assertThrows(fn, expectedRegexOrSubstr, message = '') {
  let threw = false;
  let actualErr = null;
  try {
    fn();
  } catch (err) {
    threw = true;
    actualErr = err;
  }
  if (!threw) {
    const desc = message ? `${message} - ` : '';
    throw new Error(`${desc}Expected function to throw error, but it returned successfully.`);
  }
  if (expectedRegexOrSubstr) {
    const msg = actualErr.message || String(actualErr);
    if (expectedRegexOrSubstr instanceof RegExp) {
      if (!expectedRegexOrSubstr.test(msg)) {
        throw new Error(`Expected error message to match ${expectedRegexOrSubstr}, but got: "${msg}"`);
      }
    } else {
      if (!msg.includes(expectedRegexOrSubstr)) {
        throw new Error(`Expected error message to contain "${expectedRegexOrSubstr}", but got: "${msg}"`);
      }
    }
  }
}
