export default function Footer() {
  return (
    <footer style={{ borderTop: '2px dashed var(--muted)', padding: '18px 0', textAlign: 'center' }}>
      <p style={{ color: 'var(--muted)', margin: 0 }}>
        © {new Date().getFullYear()} Didier Torres Parody ·{' '}
        <a href="https://github.com/DidierParody">GitHub</a>
      </p>
    </footer>
  );
}
