export default function ScriptVault() {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>📝 Script Vault</h1>
      <p style={{ color: '#8888aa', fontSize: 13, marginBottom: 24 }}>
        Your generated scripts will appear here after you run the pipeline.
      </p>
      <div className="card" style={{ textAlign: 'center', padding: 60, color: '#8888aa' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🗄️</div>
        <div style={{ fontSize: 16 }}>No scripts yet — go to Content Lab and generate your first one!</div>
      </div>
    </div>
  )
}
