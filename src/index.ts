import * as webjsx from "webjsx";

type ParamsFromPattern<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ParamsFromPattern<Rest>]: string }
    : T extends `${string}:${infer Param}`
    ? { [K in Param]: string }
    : {};

/**
 * Converts URL pattern to regex and extracts parameter names
 */
function parsePattern(pattern: string): {
  regex: RegExp;
  paramNames: string[];
} {
  const paramNames: string[] = [];
  const regexString = pattern
    .replace(/\/$/, "") // Remove trailing slash
    .replace(/:[^/]+/g, (match) => {
      const paramName = match.slice(1);
      paramNames.push(paramName);
      return "([^/]+)";
    });

  return {
    regex: new RegExp(`^${regexString}$`),
    paramNames,
  };
}

/**
 * Extracts and decodes query parameters from URL
 */
function parseQueryString(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const result: Record<string, string> = {};

  params.forEach((value, key) => {
    result[decodeURIComponent(key)] = decodeURIComponent(value);
  });

  return result;
}

/**
 * Extracts parameters from URL based on pattern match
 */
function extractParams<Pattern extends string>(
  pattern: Pattern,
  match: RegExpMatchArray,
  paramNames: string[]
): ParamsFromPattern<Pattern> {
  const params: Record<string, string> = {};

  paramNames.forEach((name, index) => {
    const value = match[index + 1];
    if (value) {
      params[name] = decodeURIComponent(value);
    }
  });

  return params as ParamsFromPattern<Pattern>;
}

/**
 * Normalizes a URL path by:
 * 1. Removing multiple consecutive slashes
 * 2. Preserving trailing slash if present
 */
function normalizePath(path: string): string {
  try {
    // Remove multiple consecutive slashes but preserve trailing
    const hasTrailingSlash = path.endsWith("/");
    const normalized = path.replace(/\/{2,}/g, "/").replace(/\/$/, "");
    return hasTrailingSlash ? normalized + "/" : normalized;
  } catch {
    return "";
  }
}

/**
 * Matches current URL against a pattern and renders component if matched
 */
export function match<Pattern extends string>(
  pattern: Pattern,
  render: (
    params: ParamsFromPattern<Pattern>,
    query: Record<string, string>
  ) => webjsx.VNode
): webjsx.VNode | undefined {
  try {
    // Normalize paths - preserve trailing slash status
    const currentPath = normalizePath(window.location.pathname);
    const patternPath = normalizePath(pattern);
    const currentSearch = window.location.search;

    // Early return if trailing slash status doesn't match
    if (currentPath.endsWith("/") !== patternPath.endsWith("/")) {
      return undefined;
    }

    // Remove trailing slashes for regex matching
    const pathForMatching = currentPath.replace(/\/$/, "");
    const patternForMatching = patternPath.replace(/\/$/, "");

    // Parse pattern and try to match
    const { regex, paramNames } = parsePattern(patternForMatching);
    const match = pathForMatching.match(regex);

    if (!match) {
      return undefined;
    }

    // Extract and decode parameters
    const params = extractParams(pattern, match, paramNames);

    // Parse query string
    const query = parseQueryString(currentSearch);

    // Render component with extracted data
    try {
      return render(params, query);
    } catch (error) {
      console.error("Error rendering route:", error);
      return undefined;
    }
  } catch (error) {
    console.error("Error matching route:", error);
    return undefined;
  }
}

export type { VNode } from "webjsx";
