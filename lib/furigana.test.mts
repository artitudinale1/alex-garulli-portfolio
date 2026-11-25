import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { translationCatalog } from "./i18n/catalog.ts";
import { annotateJapaneseDate, parseFurigana, rubyPlain, uncoveredKanji } from "./i18n/furigana.ts";
import { japaneseDisclaimer, japaneseLanguageLabel, messagesFor } from "./i18n/messages.ts";
import { localeMetadata } from "./seo.ts";

const HAN = /\p{Script=Han}/u;

describe("furigana parsing", () => {
  it("keeps the base text and drops both the ruby markup and the reading", () => {
    const marked = "この<ruby>日本語版<rt>にほんごばん</rt></ruby>はAIです";
    assert.equal(rubyPlain(marked), "この日本語版はAIです");
    assert.equal(rubyPlain(marked).includes("にほんご"), false);
    assert.equal(rubyPlain(marked).includes("<rt>"), false);
    assert.equal(rubyPlain(marked).includes("<ruby>"), false);
    assert.deepEqual(parseFurigana(marked), [
      { type: "text", value: "この" },
      { type: "ruby", base: "日本語版", reading: "にほんごばん" },
      { type: "text", value: "はAIです" },
    ]);
  });

  it("leaves hiragana, katakana, English and unsafe markup as text", () => {
    const marked = "プロジェクトと<script>alert(1)</script>と<ruby>猫<rt>ねこ</rt></ruby>";
    assert.equal(rubyPlain(marked), "プロジェクトと<script>alert(1)</script>と猫");
    assert.equal(uncoveredKanji("プロジェクトとレベルとBeginner 3").length, 0);
    assert.deepEqual(uncoveredKanji(marked), []);
  });

  it("annotates the year and month counters in a Japanese date", () => {
    const marked = annotateJapaneseDate("2023年7月 – 現在");
    assert.equal(rubyPlain(marked), "2023年7月 – 現在");
    assert.equal(marked.includes("<ruby>年<rt>ねん</rt></ruby>"), true);
    assert.equal(marked.includes("<ruby>月<rt>がつ</rt></ruby>"), true);
    assert.equal(marked.includes("<ruby>現在<rt>げんざい</rt></ruby>"), true);
    assert.deepEqual(uncoveredKanji(marked), []);
  });
});

describe("Japanese kanji coverage", () => {
  it("annotates every kanji in the Japanese interface, disclaimer and catalog", () => {
    const visible = [
      ...Object.entries(messagesFor("ja"))
        .filter(([key]) => key !== "heroAlt")
        .map(([, value]) => value),
      japaneseDisclaimer.ja,
      japaneseLanguageLabel,
      ...translationCatalog.flatMap((item) => Object.values(item.translations["ja-JP"])),
    ];
    const missed = visible.flatMap((value) => uncoveredKanji(value).map((character) => `${character} in ${rubyPlain(value)}`));
    assert.deepEqual(missed, []);
  });

  it("keeps image alt text and metadata free of ruby markup", () => {
    const metadata = localeMetadata("ja");
    const plainFields = [metadata.title, metadata.description, metadata.openGraph?.title, metadata.openGraph?.description];
    for (const field of plainFields) {
      assert.equal(typeof field, "string");
      assert.equal(String(field).includes("<ruby"), false);
      assert.equal(String(field).includes("<rt"), false);
    }
    assert.equal(messagesFor("ja").heroAlt.includes("<ruby"), false);
    assert.equal(HAN.test(messagesFor("ja").heroAlt), true);
    assert.equal(rubyPlain(messagesFor("en").expertise).includes("<"), false);
    assert.equal(rubyPlain(messagesFor("it").expertise).includes("<"), false);
    for (const item of translationCatalog) {
      for (const value of Object.values(item.translations["it-IT"])) {
        assert.equal(value.includes("<ruby"), false);
      }
    }
  });

  it("does not let a catalog reading survive plain-text extraction", () => {
    const bio = translationCatalog.find((item) => item.contentType === "profile")?.translations["ja-JP"].bio ?? "";
    const plain = rubyPlain(bio);
    assert.equal(plain.includes("日本語"), true);
    assert.equal(plain.includes("にほんご"), false);
    assert.equal(plain.includes("<rt>"), false);
    assert.equal(plain.includes("ほんばん"), false);
  });
});
