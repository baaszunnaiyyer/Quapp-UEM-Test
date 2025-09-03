// throttle.js

/**
 * Creates a throttled version of a function that only invokes the original
 * function at most once per specified limit of time.
 *
 * @param {Function} func - The function to throttle.
 * @param {number} limit - The number of milliseconds to throttle executions to.
 * @returns {Function} A throttled version of the given function.
 */
function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export default throttle;