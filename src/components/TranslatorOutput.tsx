import clsx from "clsx";
import Image from "next/image";
import { ReactNode } from "react";

type Position = "bottom-left" | "bottom-right";

interface TranslatorOutputProps {
  type: OutputType;
  position: Position;
  children: ReactNode;
}

export enum OutputType {
  STDOUT,
  STDERR,
}

export default function TranslatorOutput({
  type,
  position,
  children,
}: TranslatorOutputProps) {
  const iconSource: Record<OutputType, string> = {
    [OutputType.STDOUT]: "/stdout-icon.svg",
    [OutputType.STDERR]: "/stderr-icon.svg",
  };

  const titleText: Record<OutputType, string> = {
    [OutputType.STDOUT]: "STDOUT",
    [OutputType.STDERR]: "STDERR",
  };

  const backgroundColor: Record<OutputType, string> = {
    [OutputType.STDOUT]: "bg-green-100 border-green-500",
    [OutputType.STDERR]: "bg-red-100 border-red-500",
  };

  const positionClass =
    position === "bottom-left" ? "left-4 bottom-4" : "right-4 bottom-4";

  return (
    <div
      className={clsx(
        "fixed z-50 w-1/3 rounded-md border-l-4 shadow-lg p-4",
        backgroundColor[type],
        positionClass,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Image src={iconSource[type]} alt="" width={20} height={20} />
        <span className="font-semibold text-md">{titleText[type]}</span>
      </div>

      {/* Content body */}
      <div className="text-sm text-gray-700 wrap-break-word max-h-32 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
