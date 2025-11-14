import Image from "next/image";

export function Logo() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Image src="/logo.svg" alt="Logo" width={37} height={37} />
    </div>
  );
}
