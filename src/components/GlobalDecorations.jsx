import AAImage from "./ui/AAImage";

const decorations = [
  {
    src: "/decor-tl.png",
    className: "fixed -top-10 -left-12 w-48 opacity-20 -z-10 pointer-events-none",
  },
  {
    src: "/decor-tr.png",
    className: "fixed -top-16 -right-16 w-56 opacity-20 -z-10 pointer-events-none",
  },
  {
    src: "/decor-bl.png",
    className: "fixed -bottom-12 -left-10 w-40 opacity-20 -z-10 pointer-events-none",
  },
  {
    src: "/decor-br.png",
    className: "fixed -bottom-20 -right-14 w-64 opacity-25 -z-10 pointer-events-none",
  },
];

export default function GlobalDecorations() {
  return (
    <div aria-hidden="true">
      {decorations.map((dec) => (
        <AAImage key={dec.src} src={dec.src} alt="" className={dec.className} />
      ))}
    </div>
  );
}
