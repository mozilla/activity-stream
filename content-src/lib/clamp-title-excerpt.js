/**
 * Adjusts the line-clamp of an excerpt to fill desired number of lines.
 *
 * This is a React callback ref that should be set on a title node with an
 * excerpt node as the next sibling -- both nodes should be styled to normally
 * clamp lines via CSS. The title node needs two data attributes to configure
 * how many lines the title can be and how many total lines with the excerpt.
 */
export function clampTitleExcerpt(title) {
  if (title) {
    // Make sure we have enough data to even clamp lines
    const excerpt = title.nextSibling;
    const {titleLines, totalLines} = title.dataset;
    if (excerpt && titleLines && totalLines) {
      // Set the appropriate clamp for excerpt if title uses fewer lines
      const lineHeight = global.getComputedStyle(title).lineHeight.slice(0, -2);
      const lines = title.clientHeight / lineHeight;
      if (lines < titleLines) {
        const clamp = totalLines - lines;
        excerpt.style.webkitLineClamp = `${clamp}`;

        // Override the CSS to allow larger-than-default clamp
        excerpt.style.maxHeight = "unset";

        return clamp;
      }
    }
  }
  return 0;
}
