import "@testing-library/jest-dom/vitest";
import { createElement } from "react";
import { vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({
    alt,
    src,
    unoptimized: _unoptimized,
    ...props
  }: {
    alt: string;
    src: string;
    unoptimized?: boolean;
    [key: string]: unknown;
  }) => createElement("img", { alt, src, ...props }),
}));
