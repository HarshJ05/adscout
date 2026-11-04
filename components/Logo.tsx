/** Brand mark: the nine-block grid Jaipur's walled city was planned on, with the central block highlighted. */
export function Logo({ size = 22 }: { size?: number }) {
  const cells = [0, 1, 2];
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden focusable="false">
      {cells.map((r) =>
        cells.map((c) => (
          <rect
            key={`${r}${c}`}
            x={1 + c * 7}
            y={1 + r * 7}
            width="6"
            height="6"
            rx="1.2"
            fill={r === 1 && c === 1 ? '#F7A8B8' : 'currentColor'}
            opacity={r === 1 && c === 1 ? 1 : 0.92}
          />
        ))
      )}
    </svg>
  );
}
