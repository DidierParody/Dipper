export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: '18px 0', textAlign: 'center' }}>
      <p style={{ color: 'var(--muted)', margin: 0, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
        © {new Date().getFullYear()} Didier Torres Parody ·{' '}
        <a href="https://github.com/DidierParody">GitHub</a>
      </p>
    </footer>
  );
}
