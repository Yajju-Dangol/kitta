'use client'

import React from 'react'
import { ChevronRight, Menu, X, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { cn } from '@/lib/utils'
import { useScroll } from 'framer-motion'

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: 'spring' as any,
                bounce: 0.3,
                duration: 1.5,
            },
        },
    },
}

interface HeroSectionProps {
  onEnterApp: () => void;
}

export function HeroSection({ onEnterApp }: HeroSectionProps) {
    return (
        <>
            <HeroHeader onEnterApp={onEnterApp} />
            <main className="overflow-hidden bg-[#000000] text-zinc-300">
                <section>
                    <div className="relative pt-32 pb-16">
                        <div className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,#000000_75%)]"></div>
                        <div className="mx-auto max-w-5xl px-6">
                            <div className="sm:mx-auto lg:mr-auto text-center lg:text-left">
                                <AnimatedGroup
                                    variants={{
                                        container: {
                                            visible: {
                                                transition: {
                                                    staggerChildren: 0.05,
                                                    delayChildren: 0.25,
                                                },
                                            },
                                        },
                                        ...transitionVariants,
                                    }}
                                >
                                    <div className="inline-flex items-center space-x-2 bg-zinc-900/50 border border-zinc-800 rounded-full px-3 py-1 mb-6">
                                      <span className="flex h-2 w-2 rounded-full bg-[#10B981] animate-pulse"></span>
                                      <span className="text-xs font-medium text-zinc-300 tracking-wide">Kitta v2.0 Live Beta</span>
                                    </div>
                                    <h1
                                        className="mt-2 max-w-3xl text-balance text-5xl font-bold tracking-tight text-zinc-100 md:text-7xl lg:mt-4 mx-auto lg:mx-0">
                                        Navigate NEPSE with <span className="text-[#10B981]">AI-Driven</span> Precision.
                                    </h1>
                                    <p
                                        className="mt-8 max-w-2xl text-pretty text-lg text-zinc-400 mx-auto lg:mx-0 leading-relaxed">
                                        Kitta is the ultimate autonomous analyst for the Nepal Stock Exchange. We synthesize real-time market data, institutional flows, and macro trends into actionable intelligence.
                                    </p>
                                    <div className="mt-12 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                                        <div
                                            key={1}
                                            className="bg-[#10B981]/10 rounded-[14px] border border-[#10B981]/30 p-0.5">
                                            <Button
                                                onClick={onEnterApp}
                                                size="lg"
                                                className="w-full sm:w-auto rounded-xl px-8 text-base bg-[#10B981] text-black hover:bg-[#10B981]/80 font-bold">
                                                <span className="text-nowrap">Enter Terminal</span>
                                            </Button>
                                        </div>
                                        <Button
                                            key={2}
                                            size="lg"
                                            variant="outline"
                                            className="w-full sm:w-auto h-[48px] rounded-xl px-8 text-base border-zinc-800 bg-transparent text-zinc-300 hover:bg-zinc-900 hover:text-white">
                                            <span className="text-nowrap">View Documentation</span>
                                        </Button>
                                    </div>
                                </AnimatedGroup>
                            </div>
                        </div>
                        <AnimatedGroup
                            variants={{
                                container: {
                                    visible: {
                                        transition: {
                                            staggerChildren: 0.05,
                                            delayChildren: 0.5,
                                        },
                                    },
                                },
                                ...transitionVariants,
                            }}>
                            <div className="relative mt-16 px-4 sm:px-6 lg:px-8 mx-auto max-w-6xl">
                                <div
                                    aria-hidden
                                    className="bg-gradient-to-b to-black absolute inset-0 z-10 from-transparent from-55%"
                                />
                                <div className="relative mx-auto overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl shadow-[#10B981]/5 ring-1 ring-white/10">
                                    <img
                                        className="aspect-[16/9] relative rounded-xl object-cover border border-zinc-900"
                                        src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070&auto=format&fit=crop"
                                        alt="Kitta Dashboard Interface"
                                        width="2700"
                                        height="1440"
                                    />
                                    {/* Abstract Overlay to simulate our dark UI */}
                                    <div className="absolute inset-0 bg-black/40 mix-blend-multiply rounded-xl"></div>
                                </div>
                            </div>
                        </AnimatedGroup>
                    </div>
                </section>
                
                {/* Logo cloud section */}
                <section className="bg-black pb-24 pt-10">
                    <div className="group relative m-auto max-w-5xl px-6">
                        <div className="text-center mb-8 text-xs font-semibold tracking-widest uppercase text-zinc-600">
                          Data & Infrastructure Partners
                        </div>
                        <div className="mx-auto grid max-w-2xl grid-cols-2 md:grid-cols-4 items-center justify-items-center gap-x-12 gap-y-8 opacity-60 grayscale transition-all duration-500 hover:grayscale-0 hover:opacity-100 sm:gap-x-16 sm:gap-y-14">
                            <div className="flex font-mono text-xl font-bold items-center space-x-2 text-white">
                              <Activity className="w-6 h-6 text-[#10B981]" /> <span>NEPSE</span>
                            </div>
                            <div className="flex font-mono text-xl font-bold items-center space-x-2 text-white">
                              <span>OpenAI</span>
                            </div>
                            <div className="flex font-mono text-xl font-bold items-center space-x-2 text-white">
                              <span>Supabase</span>
                            </div>
                            <div className="flex font-mono text-xl font-bold items-center space-x-2 text-white">
                              <span>Vercel</span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    )
}

const menuItems = [
    { name: 'Terminal', href: '#' },
    { name: 'Macro Models', href: '#' },
    { name: 'Watchlist', href: '#' },
    { name: 'Research', href: '#' },
]

export const HeroHeader = ({ onEnterApp }: { onEnterApp: () => void }) => {
    const [menuState, setMenuState] = React.useState(false)
    const [scrolled, setScrolled] = React.useState(false)

    const { scrollYProgress } = useScroll()

    React.useEffect(() => {
        const unsubscribe = scrollYProgress.on('change', (latest) => {
            setScrolled(latest > 0.05)
        })
        return () => unsubscribe()
    }, [scrollYProgress])

    return (
        <header>
            <nav
                data-state={menuState ? 'active' : 'closed'}
                className={cn('group fixed top-0 z-50 w-full border-b border-transparent transition-all duration-300', scrolled && 'bg-black/80 backdrop-blur-md border-zinc-800')}>
                <div className="mx-auto max-w-6xl px-6 transition-all duration-300">
                    <div className="relative flex flex-wrap items-center justify-between gap-6 py-4 lg:gap-0">
                        <div className="flex w-full items-center justify-between gap-12 lg:w-auto">
                            <button
                                onClick={onEnterApp}
                                aria-label="home"
                                className="flex items-center space-x-2 text-white font-bold text-xl tracking-tight">
                                <span className="text-[#10B981]">Kitta.</span>
                            </button>

                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden text-zinc-300">
                                <Menu className="group-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                            </button>

                            <div className="hidden lg:block">
                                <ul className="flex gap-8 text-sm font-medium">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <button
                                                onClick={onEnterApp}
                                                className="text-zinc-400 hover:text-white transition-colors duration-150">
                                                <span>{item.name}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="bg-zinc-950 group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-2xl border border-zinc-800 p-6 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0">
                            <div className="lg:hidden">
                                <ul className="space-y-6 text-base font-medium">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <button
                                                onClick={onEnterApp}
                                                className="text-zinc-400 hover:text-white block duration-150 w-full text-left">
                                                <span>{item.name}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                                <Button
                                    onClick={onEnterApp}
                                    variant="outline"
                                    size="sm"
                                    className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                                    <span>Log In</span>
                                </Button>
                                <Button
                                    onClick={onEnterApp}
                                    size="sm"
                                    className="bg-[#10B981] text-black hover:bg-[#10B981]/80 font-bold">
                                    <span>Launch App</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}
