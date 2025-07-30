const FloatingBubbles = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Generate multiple bubbles */}
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="bubble" />
      ))}
    </div>
  );
};

export default FloatingBubbles;
