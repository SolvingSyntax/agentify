/** Floating orb with spinning rings, shown beside page titles. */
export function Orb3D() {
  return (
    <div aria-hidden className="orb-scene hidden md:block">
      <div className="orb-core" />
      <div className="orb-ring orb-ring-a" />
      <div className="orb-ring orb-ring-b" />
      <div className="orb-ring orb-ring-c" />
    </div>
  );
}
