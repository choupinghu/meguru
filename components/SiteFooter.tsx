/** The Sanrio disclaimer and Geolonia map attribution, shared across every route. */
export default function SiteFooter() {
  return (
    <footer>
      <span>
        Made with <span className="mark">巡</span> Meguru — a working
        prototype, seeded with representative charms.
      </span>
      <span>
        &quot;Hello Kitty&quot; and &quot;Gotochi Kitty&quot; are trademarks
        of Sanrio Co., Ltd. Meguru is an independent collector&apos;s
        catalogue and is not affiliated with or endorsed by Sanrio.
      </span>
      <span>Map geometry &copy; Geolonia (MIT).</span>
    </footer>
  );
}
