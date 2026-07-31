import { FaGithub, FaLinkedin } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-4 text-sm text-muted-foreground sm:flex-row">
        <p>Made with ❤️ by Mehmet Sayin</p>
        <nav aria-label="Footer navigation" className="flex items-center gap-4">
          <a
            href="https://github.com/sayinmehmet47"
            aria-label="GitHub profile"
            className="rounded-sm hover:text-foreground"
          >
            <FaGithub aria-hidden="true" size={25} />
          </a>
          <a
            href="https://www.linkedin.com/in/sayinmehmet/"
            aria-label="LinkedIn profile"
            className="rounded-sm hover:text-foreground"
          >
            <FaLinkedin aria-hidden="true" size={25} />
          </a>
        </nav>
      </div>
    </footer>
  );
}
