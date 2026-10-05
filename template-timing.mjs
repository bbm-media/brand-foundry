// Opt-in timing metadata is stamped before HyperFrames parses a composition.
export function stampTiming(html, variables) {
  return html.replace(/<[^>]+data-duration-var="([a-zA-Z][\w]*)"[^>]*>/g, (tag, key) => {
    const value = Number(variables[key]);
    if (!Number.isFinite(value) || value < 2 || value > 120) throw new Error(`${key} must be between 2 and 120 seconds`);
    return tag.replace(/data-duration="[\d.]+"/, `data-duration="${value}"`);
  });
}
