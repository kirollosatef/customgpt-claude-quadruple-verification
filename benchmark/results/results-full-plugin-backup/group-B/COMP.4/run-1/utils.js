function slugify(text) {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, "-").replace(/[^\w\-]+/g, "").replace(/\-\-+/g, "-");
}

function truncate(str, maxLen, suffix = "...") {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - suffix.length) + suffix;
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

function retry(fn, maxAttempts = 3, delay = 1000) {
  return async function(...args) {
    for (let i = 0; i < maxAttempts; i++) {
      try { return await fn(...args); }
      catch (err) { if (i === maxAttempts - 1) throw err; await new Promise(r => setTimeout(r, delay)); }
    }
  };
}

module.exports = { slugify, truncate, deepMerge, retry };
