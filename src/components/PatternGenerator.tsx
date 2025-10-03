import { Button } from "@/components/ui/button";
import { Sparkles, Hexagon, Star, Circle } from "lucide-react";
import { toast } from "sonner";

interface Pin {
  x: number;
  y: number;
  id: string;
}

interface Thread {
  from: string;
  to: string;
  color: string;
  width: number;
}

interface PatternGeneratorProps {
  pins: Pin[];
  onGenerate: (threads: Thread[]) => void;
  selectedColor: string;
  threadWidth: number;
}

export const PatternGenerator = ({ pins, onGenerate, selectedColor, threadWidth }: PatternGeneratorProps) => {
  const generateSpiral = () => {
    if (pins.length < 4) {
      toast.error("Need at least 4 pins to generate a pattern");
      return;
    }

    const newThreads: Thread[] = [];
    const step = Math.floor(pins.length / 4);

    for (let i = 0; i < pins.length; i++) {
      const targetIndex = (i + step) % pins.length;
      newThreads.push({
        from: pins[i].id,
        to: pins[targetIndex].id,
        color: selectedColor,
        width: threadWidth,
      });
    }

    onGenerate(newThreads);
    toast.success("Spiral pattern generated!");
  };

  const generateStar = () => {
    if (pins.length < 5) {
      toast.error("Need at least 5 pins to generate a star");
      return;
    }

    const newThreads: Thread[] = [];
    const step = Math.floor(pins.length / 2);

    for (let i = 0; i < pins.length; i++) {
      const targetIndex = (i + step) % pins.length;
      newThreads.push({
        from: pins[i].id,
        to: pins[targetIndex].id,
        color: selectedColor,
        width: threadWidth,
      });
    }

    onGenerate(newThreads);
    toast.success("Star pattern generated!");
  };

  const generateWeb = () => {
    if (pins.length < 6) {
      toast.error("Need at least 6 pins to generate a web");
      return;
    }

    const newThreads: Thread[] = [];
    const centerIndex = Math.floor(pins.length / 2);

    // Connect all pins to center
    for (let i = 0; i < pins.length; i++) {
      if (i !== centerIndex) {
        newThreads.push({
          from: pins[i].id,
          to: pins[centerIndex].id,
          color: selectedColor,
          width: threadWidth,
        });
      }
    }

    // Connect adjacent pins
    for (let i = 0; i < pins.length; i++) {
      const nextIndex = (i + 1) % pins.length;
      newThreads.push({
        from: pins[i].id,
        to: pins[nextIndex].id,
        color: selectedColor,
        width: threadWidth,
      });
    }

    onGenerate(newThreads);
    toast.success("Web pattern generated!");
  };

  const generateRandom = () => {
    if (pins.length < 4) {
      toast.error("Need at least 4 pins to generate a pattern");
      return;
    }

    const newThreads: Thread[] = [];
    const connectionCount = Math.min(pins.length * 2, 100);

    for (let i = 0; i < connectionCount; i++) {
      const fromIndex = Math.floor(Math.random() * pins.length);
      const toIndex = Math.floor(Math.random() * pins.length);

      if (fromIndex !== toIndex) {
        newThreads.push({
          from: pins[fromIndex].id,
          to: pins[toIndex].id,
          color: selectedColor,
          width: threadWidth,
        });
      }
    }

    onGenerate(newThreads);
    toast.success("Random pattern generated!");
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4" />
        Pattern Generator
      </label>
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={generateSpiral} variant="outline" size="sm">
          <Circle className="mr-2 h-3 w-3" />
          Spiral
        </Button>
        <Button onClick={generateStar} variant="outline" size="sm">
          <Star className="mr-2 h-3 w-3" />
          Star
        </Button>
        <Button onClick={generateWeb} variant="outline" size="sm">
          <Hexagon className="mr-2 h-3 w-3" />
          Web
        </Button>
        <Button onClick={generateRandom} variant="outline" size="sm">
          <Sparkles className="mr-2 h-3 w-3" />
          Random
        </Button>
      </div>
    </div>
  );
};
