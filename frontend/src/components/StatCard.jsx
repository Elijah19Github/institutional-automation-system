function StatCard({ title, value, color }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "8px",
        minWidth: "180px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
        borderLeft: `6px solid ${color}`,
      }}
    >
      <h4 style={{ margin: 0, color: "#555" }}>{title}</h4>
      <h2 style={{ marginTop: "10px" }}>{value}</h2>
    </div>
  );
}

export default StatCard;
