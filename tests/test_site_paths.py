"""The portal homepage must keep assets and its home link under its own base."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin
import unittest

ROOT = Path(__file__).resolve().parents[1]


class PortalLinks(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = {}

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "link" and attrs.get("rel") in {"stylesheet", "icon"}:
            self.paths[attrs["rel"]] = attrs.get("href", "")
        if tag == "a" and "brand" in (attrs.get("class") or "").split():
            self.paths["home"] = attrs.get("href", "")


class PortableHomepageTest(unittest.TestCase):
    def test_spelling_has_a_generic_public_path_and_a_real_export(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn('href="/spelling/"', html)
        self.assertNotIn('/spelling-ea-ee/', html)
        self.assertTrue((ROOT / "spelling" / "index.html").is_file())
        self.assertTrue((ROOT / "spelling" / "audio" / "en-gb-v1" / "people.mp3").is_file())

    def test_assets_and_home_stay_with_the_portal_at_root_or_subpath(self):
        parser = PortalLinks()
        parser.feed((ROOT / "index.html").read_text(encoding="utf-8"))
        expected = {"stylesheet": "styles.css", "icon": "favicon.svg", "home": ""}
        self.assertEqual(set(parser.paths), set(expected))
        for base in ("https://example.test/", "https://example.test/catalog/"):
            for kind, relative in expected.items():
                with self.subTest(base=base, kind=kind):
                    self.assertEqual(urljoin(base, parser.paths[kind]), base + relative)
                    if relative:
                        self.assertTrue((ROOT / relative).is_file())


if __name__ == "__main__":
    unittest.main()
