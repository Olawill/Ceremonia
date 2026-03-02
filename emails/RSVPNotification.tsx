interface Props {
  guestName: string;
  attendance: "yes" | "no";
  guests?: number;
  dietary?: string;
  bride: string;
  groom: string;
}

export function RSVPNotificationEmail({
  guestName,
  attendance,
  guests,
  dietary,
  bride,
  groom,
}: Props) {
  const attending = attendance === "yes";

  return (
    <div
      style={{
        fontFamily: "Georgia, serif",
        maxWidth: 560,
        margin: "0 auto",
        color: "#1a1a1a",
      }}
    >
      <div
        style={{
          borderBottom: "2px solid #D4AF37",
          paddingBottom: 16,
          marginBottom: 24,
        }}
      >
        <h1
          style={{ fontSize: 24, fontWeight: 400, color: "#8B6914", margin: 0 }}
        >
          New RSVP — {bride} & {groom}
        </h1>
      </div>

      <p style={{ fontSize: 16, lineHeight: 1.6 }}>
        <strong>{guestName}</strong> has {attending ? "accepted" : "declined"}{" "}
        your wedding invitation.
      </p>

      {attending && (
        <table
          style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  padding: "8px 0",
                  borderBottom: "1px solid #eee",
                  color: "#666",
                  width: 140,
                }}
              >
                Guests attending
              </td>
              <td
                style={{
                  padding: "8px 0",
                  borderBottom: "1px solid #eee",
                  fontWeight: 600,
                }}
              >
                {guests ?? 1}
              </td>
            </tr>
            {dietary && (
              <tr>
                <td style={{ padding: "8px 0", color: "#666" }}>
                  Dietary requirements
                </td>
                <td style={{ padding: "8px 0" }}>{dietary}</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <p style={{ marginTop: 32, fontSize: 12, color: "#999" }}>
        Sent by Ceremonia · Manage your RSVPs at app.ceremonia.app
      </p>
    </div>
  );
}
