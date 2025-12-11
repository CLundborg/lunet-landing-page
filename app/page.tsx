import Image from "next/image";

export default function Home() {
  return (
    <main style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Welcome to Our Landing Page</h1>
      <p>We are launching soon!</p>
      <Image src="/logo.png" alt="Logo" width={100} height={100} />
    </main>
  );
}
