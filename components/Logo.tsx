/** Brand mark: a nine-block city grid with the centre block highlighted (a nod to Jaipur's planned walled city). */
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
            fill={r === 1 && c === 1 ? '#5FF0B2' : 'currentColor'}
            opacity={r === 1 && c === 1 ? 1 : 0.92}
          />
        ))
      )}
    </svg>
  );
}
