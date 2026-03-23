import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fafafa",
          backgroundImage: "linear-gradient(to bottom, #fafafa 0%, #f4f4f5 100%)",
        }}
      >
        {/* Main Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
            padding: "80px",
          }}
        >
          {/* Title */}
          <div
            style={{
              fontSize: "72px",
              fontWeight: "600",
              color: "#18181b",
              letterSpacing: "-0.02em",
              textAlign: "center",
            }}
          >
            Polititrack
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: "32px",
              fontWeight: "400",
              color: "#52525b",
              textAlign: "center",
              maxWidth: "800px",
            }}
          >
            Receipts-first civic clarity
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            fontSize: "20px",
            fontWeight: "400",
            color: "#71717a",
            letterSpacing: "0.05em",
          }}
        >
          polititrack
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

