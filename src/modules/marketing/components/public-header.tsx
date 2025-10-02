\"use client\";
import Link from \"next/link\";
import { Button } from \"@/components/ui/button\";

export default function PublicHeader() {
    return (
        <header className=\"sticky top-0 z-40 w-full border-b border-yellow-400/20 bg-black/80 backdrop-blur\">
            <div className=\"mx-auto w-full max-w-6xl px-4 py-3 flex items-center justify-between\">
                <Link href=\"/\" className=\"flex items-center gap-2 text-yellow-300\">
                    <span className=\"text-xl\">🍌</span>
                    <span className=\"font-semibold tracking-wide\">Banana Generator</span>
                </Link>
                <nav className=\"hidden md:flex items-center gap-6 text-sm text-yellow-100/80\">
                    <Link href=\"#features\" className=\"hover:text-yellow-300 transition\">Features</Link>
                    <Link href=\"#why\" className=\"hover:text-yellow-300 transition\">Why Us</Link>
                    <Link href=\"#faq\" className=\"hover:text-yellow-300 transition\">FAQ</Link>
                </nav>
                <div className=\"flex items-center gap-2\">
                    <Link href=\"/login\">
                        <Button variant=\"outline\" className=\"border-yellow-400 text-yellow-300 hover:bg-yellow-400/10\">
                            Login
                        </Button>
                    </Link>
                    <Link href=\"/signup\">
                        <Button className=\"bg-yellow-400 text-black hover:bg-yellow-300\">Go Bananas</Button>
                    </Link>
                </div>
            </div>
        </header>
    );
}

