export default function Footer() {
     return (
          <footer className="h-12 bg-white border-t border-gray-200 flex items-center justify-center px-6">
               <p className="text-xs text-gray-400">
                    SIGEI &copy; {new Date().getFullYear()} &mdash; Valle Grande
               </p>
          </footer>
     );
}
