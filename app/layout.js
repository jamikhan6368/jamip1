export const metadata = {
  title: "Runway Automation Backend",
  description: "Backend API for Runway Automation Pro"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "20px" }}>
        {children}
      </body>
    </html>
  );
}
