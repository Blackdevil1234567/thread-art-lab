import { Palette } from "lucide-react";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const threadColors = [
  { name: "Cyan", value: "#00F5FF" },
  { name: "Magenta", value: "#FF00FF" },
  { name: "Yellow", value: "#FFD700" },
  { name: "Purple", value: "#B864FF" },
  { name: "Green", value: "#00FF9F" },
  { name: "Orange", value: "#FF6B35" },
];

export const ColorPicker = ({ color, onChange }: ColorPickerProps) => {
  return (
    <div>
      <label className="text-sm font-medium mb-2 flex items-center gap-2">
        <Palette className="h-4 w-4" />
        Thread Color
      </label>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {threadColors.map((c) => (
          <button
            key={c.value}
            onClick={() => onChange(c.value)}
            className={`h-12 rounded-lg border-2 transition-all hover:scale-110 ${
              color === c.value ? "border-primary shadow-glow-magenta" : "border-transparent"
            }`}
            style={{ backgroundColor: c.value }}
            title={c.name}
          />
        ))}
      </div>
      <input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded-lg cursor-pointer border border-border bg-card"
      />
    </div>
  );
};
