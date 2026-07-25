function App() {
  return (
    <main className="bg-black">
      <Hero />
      <Capabilities />
      <Footer />
    </main>
  );
}

window.App = App;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
