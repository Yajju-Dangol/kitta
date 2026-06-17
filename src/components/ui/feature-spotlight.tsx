"use client"

import { useState } from "react"
import { ArrowUpRight } from "lucide-react"

export function FeaturedSpotlight() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <section className="bg-black py-24 border-t border-zinc-900">
      <div className="max-w-6xl mx-auto px-6">
        <div
          className="group relative flex cursor-pointer flex-col items-center gap-8 md:flex-row md:items-start md:gap-12 lg:gap-16"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Left: Text Block */}
          <div className="relative z-10 flex w-full max-w-[320px] shrink-0 flex-col items-center text-center md:w-[300px] md:items-start md:text-left lg:w-[340px] lg:pt-4">
            {/* Label with animated line */}
            <div className="mb-6 flex items-center gap-3 md:mb-8 md:gap-4">
              <div
                className="h-px bg-[#10B981] transition-all duration-700"
                style={{
                  width: isHovered ? 48 : 32,
                  transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
              <span
                className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#10B981] transition-all duration-700 md:text-xs"
                style={{
                  letterSpacing: isHovered ? "0.3em" : "0.25em",
                  transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                Agentic Analysis
              </span>
            </div>

            {/* Title - responsive text sizes */}
            <h2 className="relative">
              <span
                className="block text-4xl font-bold tracking-tight text-white transition-all duration-700 sm:text-5xl md:text-5xl lg:text-6xl"
                style={{
                  transform: isHovered ? "translateY(-2px)" : "translateY(0)",
                  transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                Deep
              </span>
              <span
                className="block text-4xl font-bold tracking-tight text-white transition-all duration-700 sm:text-5xl md:text-5xl lg:text-6xl"
                style={{
                  transform: isHovered ? "translateX(12px)" : "translateX(0)",
                  transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                Synthesis
              </span>
            </h2>

            {/* Description - responsive spacing */}
            <p
              className="mt-6 max-w-[260px] text-sm leading-relaxed transition-all duration-700 md:mt-8 md:max-w-[260px] md:text-base lg:mt-10 lg:max-w-[280px]"
              style={{
                color: isHovered ? "hsl(var(--muted-foreground))" : "hsl(var(--muted-foreground) / 0.6)",
                transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              Where cutting-edge AI architecture meets the realities of the Nepal stock market.
            </p>

            {/* Minimal CTA - responsive spacing */}
            <div className="mt-6 flex items-center gap-4 md:mt-8 lg:mt-10">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 transition-all duration-500 md:h-11 md:w-11 lg:h-12 lg:w-12 bg-zinc-900"
                style={{
                  borderColor: isHovered ? "#10B981" : "hsl(var(--muted-foreground) / 0.3)",
                  backgroundColor: isHovered ? "#10B981" : "transparent",
                  color: isHovered ? "#000000" : "hsl(var(--foreground))",
                  transform: isHovered ? "scale(1.05)" : "scale(1)",
                  boxShadow: isHovered ? "0 8px 32px rgba(16, 185, 129, 0.2)" : "0 0 0 transparent",
                  transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <ArrowUpRight
                  className="h-3.5 w-3.5 transition-transform duration-500 md:h-4 md:w-4 text-zinc-300"
                  style={{
                    transform: isHovered ? "rotate(45deg)" : "rotate(0deg)",
                    color: isHovered ? "#000000" : "",
                    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />
              </div>
              <span
                className="text-[10px] font-medium uppercase tracking-widest text-zinc-300 transition-all duration-700 md:text-xs"
                style={{
                  opacity: isHovered ? 1 : 0.5,
                  transform: isHovered ? "translateX(0)" : "translateX(-8px)",
                  transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                  transitionDelay: isHovered ? "100ms" : "0ms",
                }}
              >
                Explore Features
              </span>
            </div>
          </div>

          {/* Right: Image Block */}
          <div
            className="relative transition-all duration-700 flex-1 flex justify-end"
            style={{
              transform: isHovered ? "translateX(4px) translateY(-4px)" : "translateX(0) translateY(0)",
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* Frame outline */}
            <div
              className="absolute -inset-3 border border-zinc-800 transition-all duration-700 md:-inset-4 rounded-xl"
              style={{
                borderColor: isHovered ? "rgba(16, 185, 129, 0.15)" : "transparent",
                transform: isHovered ? "scale(1.01)" : "scale(1)",
                transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />

            {/* Image container - responsive sizing */}
            <div className="relative h-[280px] w-full overflow-hidden sm:h-[320px] md:h-[400px] lg:h-[460px] rounded-xl border border-zinc-800 bg-zinc-900">
              <div
                className="absolute -inset-1 transition-all duration-700"
                style={{
                  boxShadow: isHovered ? "0 24px 64px rgba(16, 185, 129, 0.1)" : "0 0 0 transparent",
                  transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
              <img
                src="https://images.unsplash.com/photo-1642790106117-e829e14a795f?q=80&w=2130&auto=format&fit=crop"
                alt="AI Data Visualization"
                className="h-full w-full object-cover transition-all duration-1000 opacity-80"
                style={{
                  transform: isHovered ? "scale(1.03)" : "scale(1)",
                  filter: isHovered ? "brightness(1.1) contrast(1.1)" : "brightness(0.9) contrast(1)",
                  transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />

              <div
                className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent transition-opacity duration-700"
                style={{
                  opacity: isHovered ? 0.8 : 0.6,
                  transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />

              {/* Corner accents */}
              <div
                className="absolute left-2 top-2 h-5 w-px bg-[#10B981]/80 transition-all duration-500 md:left-3 md:top-3 md:h-6"
                style={{
                  opacity: isHovered ? 1 : 0,
                  transform: isHovered ? "scaleY(1)" : "scaleY(0)",
                  transformOrigin: "top",
                  transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                  transitionDelay: "50ms",
                }}
              />
              <div
                className="absolute left-2 top-2 h-px w-5 bg-[#10B981]/80 transition-all duration-500 md:left-3 md:top-3 md:w-6"
                style={{
                  opacity: isHovered ? 1 : 0,
                  transform: isHovered ? "scaleX(1)" : "scaleX(0)",
                  transformOrigin: "left",
                  transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                  transitionDelay: "100ms",
                }}
              />
              <div
                className="absolute bottom-2 right-2 h-5 w-px bg-[#10B981]/80 transition-all duration-500 md:bottom-3 md:right-3 md:h-6"
                style={{
                  opacity: isHovered ? 1 : 0,
                  transform: isHovered ? "scaleY(1)" : "scaleY(0)",
                  transformOrigin: "bottom",
                  transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                  transitionDelay: "150ms",
                }}
              />
              <div
                className="absolute bottom-2 right-2 h-px w-5 bg-[#10B981]/80 transition-all duration-500 md:bottom-3 md:right-3 md:w-6"
                style={{
                  opacity: isHovered ? 1 : 0,
                  transform: isHovered ? "scaleX(1)" : "scaleX(0)",
                  transformOrigin: "right",
                  transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                  transitionDelay: "200ms",
                }}
              />
            </div>

            {/* Index number */}
            <span
              className="absolute -bottom-6 right-0 font-mono text-xs text-zinc-600 transition-all duration-700 md:-bottom-8 md:text-sm"
              style={{
                opacity: isHovered ? 1 : 0.4,
                transform: isHovered ? "translateY(12px)" : "translateY(0)",
                transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              V2.0
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
