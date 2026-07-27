interface Props {
  enabled: boolean;
  onChange: () => void;
}

export default function ToggleSwitch({
  enabled,
  onChange,
}: Props) {
  return (
    <button
      onClick={onChange}
      className={`relative h-8 w-16 rounded-full transition-all duration-300
      ${
        enabled
          ? "bg-green-500"
          : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all duration-300
        ${
          enabled
            ? "left-9"
            : "left-1"
        }`}
      />
    </button>
  );
}