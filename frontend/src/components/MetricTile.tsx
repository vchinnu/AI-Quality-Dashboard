export default function MetricTile({ title, data, onClick }: any) {
  // Enhanced color coding with 5 buckets
  const getColor = (score: number) => {
    if (score >= 80) return "#2E7D32"; // Dark Green - Excellent
    if (score >= 60) return "#4CAF50"; // Green - Good
    if (score >= 40) return "#FFC107"; // Amber - Fair
    if (score >= 20) return "#FF9800"; // Orange - Poor
    return "#D32F2F"; // Dark Red - Critical
  };

  // Calculate pass rate percentage
  const passRate = Math.round((data.passed / data.total) * 100);

  return (
    <div onClick={onClick} style={{
      background: getColor(passRate),
      padding: "6px",
      borderRadius: "6px",
      cursor: "pointer",
      color: "white",
      minWidth: "50px",
      width: "55px",
      textAlign: "center",
      boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
      transition: "all 0.2s ease",
      border: "1px solid transparent",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "scale(1.02)";
      e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "scale(1)";
      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.12)";
    }}>
      <div style={{ fontWeight: "600", marginBottom: "2px", fontSize: "9px" }}>{title}</div>
      <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "1px" }}>
        {passRate}%
      </div>
      <div style={{ fontSize: "7px", opacity: 0.9 }}>
        {data.passed}/{data.total}
      </div>
    </div>
  );
}