import { astroModelerThemes } from "../data/themeConfig";
import { EventType } from "../types";
import { eventThemes } from "../eventTheme";

interface ThemeSelectionProps {
  eventType: EventType;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export default function ThemeSelection({
  eventType,
  value,
  onChange,
  error,
}: ThemeSelectionProps) {
  const theme = eventThemes[eventType];
  return (
    <div className={`mt-12 border-t ${theme.border} pt-10`}>
      <h3 className="text-2xl font-bold text-slate-900">Prototype Theme</h3>

      <p className={`mt-2 font-medium ${theme.text}`}>
        Select exactly one theme for your physical structural prototype.
      </p>

      <div className="mt-8 space-y-5">
        {astroModelerThemes.map((prototype) => {
          const selected = value === prototype.id;

          return (
            <button
              key={prototype.id}
              type="button"
              onClick={() => onChange(prototype.id)}
              className={`
  w-full
  rounded-2xl
  border-2
  p-6
  text-left
  transition-all
  duration-300
  ${
    selected
      ? `${theme.border} ${theme.light} shadow-lg`
      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
  }
`}
            >
              <div className="flex justify-between gap-5">
                <div className="flex-1">
                  <h4
                    className={`text-2xl font-bold ${
                      selected ? theme.text : "text-slate-900"
                    }`}
                  >
                    {prototype.title}
                  </h4>

                  <p className={`mt-1 font-semibold ${theme.text}`}>
                    {prototype.subtitle}
                  </p>

                  <p className="mt-4 text-slate-600 leading-7">
                    {prototype.description}
                  </p>
                </div>

                <div className="flex-shrink-0 pt-1">
                  <div
                    className={`
  flex
  h-8
  w-8
  items-center
  justify-center
  rounded-full
  border-2
  transition-all
  ${selected ? `${theme.bg} ${theme.border}` : "border-slate-400"}
`}
                  >
                    {selected && (
                      <span className="text-white text-sm font-bold">✓</span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  );
}
