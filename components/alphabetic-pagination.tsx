"use client"

import { Button } from "@/components/ui/button"

interface AlphabeticPaginationProps {
  activeLetter: string | null
  onLetterChange: (letter: string | null) => void
}

export function AlphabeticPagination({ activeLetter, onLetterChange }: AlphabeticPaginationProps) {
  const letters = [
    "All",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
  ]

  return (
    <div className="flex flex-wrap gap-1 my-4">
      {letters.map((letter) => (
        <Button
          key={letter}
          variant={activeLetter === (letter === "All" ? null : letter) ? "default" : "outline"}
          className={`min-w-9 px-2 ${activeLetter === (letter === "All" ? null : letter) ? "bg-green-600 hover:bg-green-700" : ""}`}
          onClick={() => onLetterChange(letter === "All" ? null : letter)}
        >
          {letter}
        </Button>
      ))}
    </div>
  )
}
