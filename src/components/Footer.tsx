export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid #1c2438', padding: '20px 32px', textAlign: 'center' }}>
      <p style={{ color: '#5b6a8f', margin: 0, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12.5 }}>
        © {new Date().getFullYear()} Didier Torres Parody ·{' '}
        <a href="https://github.com/DidierParody" style={{ color: '#5b6a8f' }}>GitHub</a>
      </p>
    </footer>
  );
}
