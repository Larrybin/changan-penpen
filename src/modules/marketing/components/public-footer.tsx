import Link from "next/link";

export default function PublicFooter() {
    return (
        <footer className="border-t border-yellow-400/20 bg-black text-yellow-100">
            <div className="mx-auto w-full max-w-6xl px-4 py-10 grid gap-8 md:grid-cols-3">
                <div>
                    <div className="flex items-center gap-2 text-yellow-300 mb-2">
                        <span className="text-lg">🍌</span>
                        <span className="font-semibold">Banana Generator</span>
                    </div>
                    <p className="text-sm text-yellow-200/70">
                        AI image editing that keeps you the top banana.
                    </p>
                </div>
                <div>
                    <h4 className="font-semibold mb-2">Support</h4>
                    <ul className="space-y-1 text-sm text-yellow-200/80">
                        <li>
                            <Link href="#" className="hover:text-yellow-300">About</Link>
                        </li>
                        <li>
                            <Link href="#" className="hover:text-yellow-300">Contact</Link>
                        </li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-2">Legal</h4>
                    <ul className="space-y-1 text-sm text-yellow-200/80">
                        <li>
                            <Link href="#" className="hover:text-yellow-300">Privacy</Link>
                        </li>
                        <li>
                            <Link href="#" className="hover:text-yellow-300">Terms</Link>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-yellow-400/10 text-center text-xs py-4 text-yellow-200/60">
                © 2025 Banana Generator. All rights reserved.
            </div>
        </footer>
    );
}

