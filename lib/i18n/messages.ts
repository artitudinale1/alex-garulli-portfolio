import type { SiteLocale } from "./locales";

const messages = {
  en: {
    skip: "Skip to content",
    sections: "Page sections",
    languages: "Languages",
    expertise: "Expertise",
    projects: "Projects",
    experience: "Experience",
    certifications: "Certifications",
    contact: "Contact",
    blog: "Blog",
    expertiseHeading: "Technical expertise",
    expertiseIntro: "The tools and platforms I use to build production web applications.",
    projectsHeading: "Selected projects",
    projectsIntro: "Production work and a personal project, ordered as published.",
    featured: "Featured project",
    experienceHeading: "Professional experience",
    experienceIntro: "Most recent role first.",
    certificationsHeading: "Certifications",
    contactHeading: "Contact",
    contactIntro: "For frontend roles and project conversations.",
    email: "Email",
    linkedin: "LinkedIn",
    github: "GitHub",
    downloadCv: "Download CV",
    repository: "Repository",
    liveDemo: "Live demo",
    present: "Present",
    unavailableTitle: "Portfolio temporarily unavailable",
    unavailableBody:
      "The published profile, experience and projects could not be loaded. Please try again shortly.",
    heroAlt:
      "Illustration of Beta and Kamome with cherry blossoms, a torii, Mount Fuji and Tokyo Tower.",
  },
  it: {
    skip: "Vai al contenuto",
    sections: "Sezioni della pagina",
    languages: "Lingue",
    expertise: "Competenze",
    projects: "Progetti",
    experience: "Esperienza",
    certifications: "Certificazioni",
    contact: "Contatto",
    blog: "Blog",
    expertiseHeading: "Competenze tecniche",
    expertiseIntro: "Strumenti e piattaforme che uso per realizzare applicazioni web in produzione.",
    projectsHeading: "Progetti selezionati",
    projectsIntro: "Lavori in produzione e un progetto personale, nell'ordine di pubblicazione.",
    featured: "Progetto in evidenza",
    experienceHeading: "Esperienza professionale",
    experienceIntro: "Dal ruolo più recente.",
    certificationsHeading: "Certificazioni",
    contactHeading: "Contatto",
    contactIntro: "Per ruoli frontend e conversazioni sui progetti.",
    email: "Email",
    linkedin: "LinkedIn",
    github: "GitHub",
    downloadCv: "Scarica il CV",
    repository: "Repository",
    liveDemo: "Demo live",
    present: "Presente",
    unavailableTitle: "Portfolio temporaneamente non disponibile",
    unavailableBody:
      "Non è stato possibile caricare il profilo, l'esperienza e i progetti pubblicati. Riprova tra poco.",
    heroAlt:
      "Illustrazione di Beta e Kamome con fiori di ciliegio, un torii, il monte Fuji e la Tokyo Tower.",
  },
  ja: {
    skip: "<ruby>本文<rt>ほんぶん</rt></ruby>へ<ruby>移動<rt>いどう</rt></ruby>",
    sections: "ページ<ruby>内<rt>ない</rt></ruby>のセクション",
    languages: "<ruby>言語<rt>げんご</rt></ruby>",
    expertise: "<ruby>専門分野<rt>せんもんぶんや</rt></ruby>",
    projects: "プロジェクト",
    experience: "<ruby>経歴<rt>けいれき</rt></ruby>",
    certifications: "<ruby>資格<rt>しかく</rt></ruby>",
    contact: "<ruby>連絡先<rt>れんらくさき</rt></ruby>",
    blog: "ブログ",
    expertiseHeading: "<ruby>技術的<rt>ぎじゅつてき</rt></ruby>な<ruby>専門性<rt>せんもんせい</rt></ruby>",
    expertiseIntro:
      "<ruby>本番<rt>ほんばん</rt></ruby>のウェブアプリケーションを<ruby>作<rt>つく</rt></ruby>るために<ruby>使<rt>つか</rt></ruby>っているツールとプラットフォームです。",
    projectsHeading: "<ruby>主<rt>おも</rt></ruby>なプロジェクト",
    projectsIntro:
      "<ruby>公開順<rt>こうかいじゅん</rt></ruby>の<ruby>制作実績<rt>せいさくじっせき</rt></ruby>と<ruby>個人<rt>こじん</rt></ruby>プロジェクトです。",
    featured: "<ruby>注目<rt>ちゅうもく</rt></ruby>のプロジェクト",
    experienceHeading: "<ruby>職務経歴<rt>しょくむけいれき</rt></ruby>",
    experienceIntro:
      "<ruby>新<rt>あたら</rt></ruby>しい<ruby>役割<rt>やくわり</rt></ruby>から<ruby>順<rt>じゅん</rt></ruby>に<ruby>記載<rt>きさい</rt></ruby>しています。",
    certificationsHeading: "<ruby>資格<rt>しかく</rt></ruby>",
    contactHeading: "<ruby>連絡先<rt>れんらくさき</rt></ruby>",
    contactIntro:
      "フロントエンドの<ruby>役割<rt>やくわり</rt></ruby>やプロジェクトについてのご<ruby>相談<rt>そうだん</rt></ruby>はこちらから。",
    email: "メール",
    linkedin: "LinkedIn",
    github: "GitHub",
    downloadCv: "<ruby>履歴書<rt>りれきしょ</rt></ruby>をダウンロード",
    repository: "リポジトリ",
    liveDemo: "ライブデモ",
    present: "<ruby>現在<rt>げんざい</rt></ruby>",
    unavailableTitle: "ポートフォリオを<ruby>一時的<rt>いちじてき</rt></ruby>に<ruby>表示<rt>ひょうじ</rt></ruby>できません",
    unavailableBody:
      "<ruby>公開中<rt>こうかいちゅう</rt></ruby>のプロフィール、<ruby>経歴<rt>けいれき</rt></ruby>、プロジェクトを<ruby>読<rt>よ</rt></ruby>み<ruby>込<rt>こ</rt></ruby>めませんでした。しばらくしてからもう<ruby>一度<rt>いちど</rt></ruby>お<ruby>試<rt>ため</rt></ruby>しください。",
    heroAlt: "桜、鳥居、富士山、東京タワーと一緒に描かれたBetaとKamomeのイラスト。",
  },
} as const;

export const japaneseDisclaimer = {
  ja: "この<ruby>日本語版<rt>にほんごばん</rt></ruby>はAIを<ruby>使<rt>つか</rt></ruby>って<ruby>作成<rt>さくせい</rt></ruby>しました。<ruby>私<rt>わたし</rt></ruby>の<ruby>日本語<rt>にほんご</rt></ruby>レベルはBeginner 3です。まだ<ruby>勉強中<rt>べんきょうちゅう</rt></ruby>です！",
  en: "This Japanese version was created using AI. My current Japanese level is Beginner 3, and I'm still learning!",
} as const;

export const japaneseLanguageLabel = "<ruby>日本語<rt>にほんご</rt></ruby>";

export type Messages = (typeof messages)[SiteLocale];

export function messagesFor(locale: SiteLocale): Messages {
  return messages[locale];
}
