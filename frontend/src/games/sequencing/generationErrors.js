// Teacher-facing wording for sequencing generation failures. Never shows stack traces,
// provider names or the technical tail of a server message.

export function friendlyGenerationError(error) {
  const text = (error && error.message) || '';
  const status = error && error.status;

  // "Unable to generate all 5 sequencing questions. Successfully generated 3. Sequencing generation incomplete: ..."
  const lead = text.match(/^(Unable to generate all \d+ sequencing questions\.\s*Successfully generated \d+\.)/);
  if (lead) return `${lead[1]} Nothing was saved. Please try again, or request fewer questions.`;
  const counts = text.match(/requested=(\d+), valid=(\d+)/);
  if (counts) return `Unable to generate all ${counts[1]} sequencing questions. Successfully generated ${counts[2]}. Nothing was saved. Please try again, or request fewer questions.`;

  if (status === 503) {
    return /configuration|api[_ ]?key|credential/i.test(text)
      ? 'Content generation is currently unavailable. Please contact the administrator.'
      : 'AI content generation is temporarily unavailable. Please try again.';
  }
  if (status === 429) return 'AI content generation is busy right now. Please wait a moment and try again.';
  if (status >= 500) return 'Content generation failed unexpectedly. Please try again.';
  return text || 'Generation failed. Please try again.';
}
