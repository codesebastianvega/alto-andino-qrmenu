export default function HeroHeadline() {
  return (
    <section aria-labelledby="home-headline" className="mb-3 md:mb-4">
      <h1
        id="home-headline"
        tabIndex="-1"
        className="text-[22px] md:text-3xl font-semibold tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(47,65,49,.3)] rounded"
        style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
      >
        <span className="sr-only">Alto Andino</span>
        <span
          className="bg-gradient-to-r from-[#203628] to-[#5f8a74] bg-clip-text text-transparent"
          style={{ textShadow: '0 1px 0 rgba(0,0,0,.18)' }}
        >
          Comer sano
        </span>{" "}
        nunca fue tan fácil
      </h1>
      <p className="headline-sub text-sm md:text-base text-zinc-600">
        Ingredientes locales y de temporada · Pet friendly
      </p>
    </section>
  );
}
