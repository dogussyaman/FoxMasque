export function resolveAudioAssetUri(
  source: unknown,
  resolveAssetSource: (source: number) => { uri?: string } | null,
): string | null {
  if (typeof source === 'string') return source;
  if (typeof source === 'number') return resolveAssetSource(source)?.uri ?? null;
  return null;
}
