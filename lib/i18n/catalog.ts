export const localizedFields = {
  profile: ["role", "bio"],
  experience: ["role", "description"],
  project: ["description"],
} as const;

export type ContentTypeId = keyof typeof localizedFields;
export type TargetLocale = "it-IT" | "ja-JP";

export type CatalogItem = {
  contentType: ContentTypeId;
  match: Record<string, string>;
  source: Record<string, string>;
  translations: Record<TargetLocale, Record<string, string>>;
};

const profileBio =
  "I'm a Senior Frontend Engineer with over 10 years of experience building production web applications, from HTML, CSS/Sass, JavaScript and CMS templating to React, TypeScript and Next.js.\n\nI work with traditional and headless CMS platforms, including Drupal, WordPress and Contentful, integrating REST and GraphQL APIs. I'm also a Contentful Certified Professional.\n\nMy experience includes Node.js/Express microservices for data aggregation and calculations, reusable component architecture, automated testing, accessibility, performance optimisation and AI-assisted development.\n\nOutside of coding, I\u2019m passionate about manga, anime and Japanese culture, and I\u2019m currently learning Japanese 🗻. I also love cats 🐱, which might explain a few familiar faces around this website!";

export const translationCatalog: CatalogItem[] = [
  {
    contentType: "profile",
    match: { fullName: "Alex Garulli" },
    source: {
      role: "Senior Frontend Engineer",
      bio: profileBio,
    },
    translations: {
      "it-IT": {
        role: "Ingegnere frontend senior",
        bio: "Sono un ingegnere frontend senior con oltre 10 anni di esperienza nella realizzazione di applicazioni web in produzione, da HTML, CSS/Sass, JavaScript e template per CMS fino a React, TypeScript e Next.js.\n\nLavoro con CMS tradizionali e headless, tra cui Drupal, WordPress e Contentful, e integro API REST e GraphQL. Sono anche Contentful Certified Professional.\n\nLa mia esperienza comprende microservizi Node.js/Express per l'aggregazione dei dati e i calcoli, architetture a componenti riutilizzabili, test automatizzati, accessibilità, ottimizzazione delle prestazioni e sviluppo assistito dall'AI.\n\nFuori dal codice, mi appassionano manga, anime e cultura giapponese, e sto studiando giapponese 🗻. Adoro anche i gatti 🐱, e questo spiega qualche presenza familiare su questo sito.",
      },
      "ja-JP": {
        role: "シニアフロントエンドエンジニア",
        bio: "<ruby>本番<rt>ほんばん</rt></ruby>のウェブアプリケーションを10<ruby>年<rt>ねん</rt></ruby><ruby>以上<rt>いじょう</rt></ruby><ruby>手<rt>て</rt></ruby>がけてきたシニアフロントエンドエンジニアです。HTML、CSS/Sass、JavaScript、CMSのテンプレートから、React、TypeScript、Next.jsまで<ruby>幅<rt>はば</rt></ruby><ruby>広<rt>ひろ</rt></ruby>く<ruby>扱<rt>あつか</rt></ruby>っています。\n\nDrupal、WordPress、Contentfulを<ruby>含<rt>ふく</rt></ruby>む<ruby>従来型<rt>じゅうらいがた</rt></ruby>およびヘッドレスCMSに<ruby>取<rt>と</rt></ruby>り<ruby>組<rt>く</rt></ruby>み、RESTおよびGraphQL APIを<ruby>連携<rt>れんけい</rt></ruby>しています。Contentful Certified Professionalでもあります。\n\nNode.js/Expressのマイクロサービスによるデータの<ruby>集約<rt>しゅうやく</rt></ruby>と<ruby>計算<rt>けいさん</rt></ruby>、<ruby>再利用<rt>さいりよう</rt></ruby>できるコンポーネント<ruby>設計<rt>せっけい</rt></ruby>、<ruby>自動<rt>じどう</rt></ruby>テスト、アクセシビリティ、パフォーマンス<ruby>最適化<rt>さいてきか</rt></ruby>、AIを<ruby>活用<rt>かつよう</rt></ruby>した<ruby>開発<rt>かいはつ</rt></ruby>の<ruby>経験<rt>けいけん</rt></ruby>があります。\n\nコード<ruby>以外<rt>いがい</rt></ruby>では、<ruby>漫画<rt>まんが</rt></ruby>、アニメ、<ruby>日本文化<rt>にほんぶんか</rt></ruby>が<ruby>好<rt>す</rt></ruby>きで、<ruby>現在<rt>げんざい</rt></ruby><ruby>日本語<rt>にほんご</rt></ruby>を<ruby>勉強<rt>べんきょう</rt></ruby>しています 🗻。<ruby>猫<rt>ねこ</rt></ruby>も<ruby>大<rt>だい</rt></ruby><ruby>好<rt>す</rt></ruby>きです 🐱。このサイトに<ruby>見<rt>み</rt></ruby><ruby>慣<rt>な</rt></ruby>れた<ruby>顔<rt>かお</rt></ruby>があるのは、そのためかもしれません。",
      },
    },
  },
  {
    contentType: "experience",
    match: { company: "FFW / JAKALA", role: "Senior Frontend Engineer", startDate: "2023-07-01" },
    source: {
      role: "Senior Frontend Engineer",
      description:
        "Develop and maintain production React, Next.js and TypeScript applications for enterprise clients, integrating headless CMS, REST and GraphQL services. Build reusable React components and Storybook examples with design, QA and backend engineers. Support SSR and performance debugging with Lighthouse, code review with ESLint and SonarQube, Node.js maintenance and releases. Selected work includes Dagrofa (Next.js and decoupled Drupal on Azure DevOps), FANUC, VisitDenmark, Rehlko / Kohler (Contentful) and CGIAR (Drupal and Twig).",
    },
    translations: {
      "it-IT": {
        role: "Ingegnere frontend senior",
        description:
          "Sviluppo e manutenzione di applicazioni React, Next.js e TypeScript in produzione per clienti enterprise, con integrazione di CMS headless e servizi REST e GraphQL. Realizzazione di componenti React riutilizzabili ed esempi Storybook insieme a design, QA e ingegneri backend. Supporto al debug di SSR e prestazioni con Lighthouse, code review con ESLint e SonarQube, manutenzione e rilasci Node.js. Tra i lavori selezionati: Dagrofa (Next.js e Drupal disaccoppiato su Azure DevOps), FANUC, VisitDenmark, Rehlko / Kohler (Contentful) e CGIAR (Drupal e Twig).",
      },
      "ja-JP": {
        role: "シニアフロントエンドエンジニア",
        description:
          "<ruby>企業<rt>きぎょう</rt></ruby><ruby>向<rt>む</rt></ruby>けの<ruby>本番<rt>ほんばん</rt></ruby>React、Next.js、TypeScriptアプリケーションの<ruby>開発<rt>かいはつ</rt></ruby>と<ruby>保守<rt>ほしゅ</rt></ruby>を<ruby>担当<rt>たんとう</rt></ruby>し、ヘッドレスCMS、REST、GraphQLのサービスを<ruby>連携<rt>れんけい</rt></ruby>しています。デザイン、QA、バックエンドのエンジニアと<ruby>協力<rt>きょうりょく</rt></ruby>して、<ruby>再利用<rt>さいりよう</rt></ruby>できるReactコンポーネントとStorybookの<ruby>作例<rt>さくれい</rt></ruby>を<ruby>作<rt>つく</rt></ruby>っています。LighthouseによるSSRとパフォーマンスの<ruby>調査<rt>ちょうさ</rt></ruby>、ESLintとSonarQubeによるコードレビュー、Node.jsの<ruby>保守<rt>ほしゅ</rt></ruby>とリリースも<ruby>担当<rt>たんとう</rt></ruby>します。<ruby>主<rt>おも</rt></ruby>な<ruby>実績<rt>じっせき</rt></ruby>はDagrofa（Azure DevOps<ruby>上<rt>じょう</rt></ruby>のNext.jsと<ruby>分離型<rt>ぶんりがた</rt></ruby>Drupal）、FANUC、VisitDenmark、Rehlko / Kohler（Contentful）、CGIAR（DrupalとTwig）です。",
      },
    },
  },
  {
    contentType: "experience",
    match: { company: "Zing", role: "Accredited Twilio Web Developer", startDate: "2022-05-01" },
    source: {
      role: "Accredited Twilio Web Developer",
      description:
        "Built React and Redux features and serverless Node.js APIs for Twilio Flex implementations, including AnyVan. Led a reusable Canned Responses plugin using Node.js, Express, Twilio Flex and Sync documents. Delivered Twilio Flex integration work for CarFinance247 across CMS, database and frontend services.",
    },
    translations: {
      "it-IT": {
        role: "Sviluppatore web Twilio accreditato",
        description:
          "Sviluppo di funzionalità React e Redux e di API Node.js serverless per implementazioni Twilio Flex, tra cui AnyVan. Guida di un plugin riutilizzabile Canned Responses con Node.js, Express, Twilio Flex e documenti Sync. Integrazione Twilio Flex per CarFinance247 tra CMS, database e servizi frontend.",
      },
      "ja-JP": {
        role: "<ruby>認定<rt>にんてい</rt></ruby> Twilio ウェブデベロッパー",
        description:
          "AnyVanを<ruby>含<rt>ふく</rt></ruby>むTwilio Flexの<ruby>実装<rt>じっそう</rt></ruby>で、ReactとReduxの<ruby>機能<rt>きのう</rt></ruby>、およびサーバーレスのNode.js APIを<ruby>開発<rt>かいはつ</rt></ruby>しました。Node.js、Express、Twilio Flex、Syncドキュメントを<ruby>使<rt>つか</rt></ruby>った<ruby>再利用可能<rt>さいりようかのう</rt></ruby>なCanned Responsesプラグインを<ruby>主導<rt>しゅどう</rt></ruby>しました。CarFinance247では、CMS、データベース、フロントエンドにまたがるTwilio Flexの<ruby>連携<rt>れんけい</rt></ruby>を<ruby>担当<rt>たんとう</rt></ruby>しました。",
      },
    },
  },
  {
    contentType: "experience",
    match: { company: "LimeJump", role: "Software Engineer", startDate: "2018-10-01" },
    source: {
      role: "Software Engineer",
      description:
        "Built a reusable React component library packaged as an npm module, with automated testing using Jest, Playwright, Cypress and Percy. Migrated the customer portal from AngularJS to React and Redux. Developed three Node.js/Express REST microservices for aggregating customer and energy-asset data and calculating metrics for the customer-facing portal.",
    },
    translations: {
      "it-IT": {
        role: "Ingegnere del software",
        description:
          "Realizzazione di una libreria di componenti React riutilizzabili distribuita come modulo npm, con test automatizzati Jest, Playwright, Cypress e Percy. Migrazione del portale clienti da AngularJS a React e Redux. Sviluppo di tre microservizi REST Node.js/Express per aggregare i dati di clienti e asset energetici e calcolare le metriche del portale rivolto ai clienti.",
      },
      "ja-JP": {
        role: "ソフトウェアエンジニア",
        description:
          "npmモジュールとして<ruby>配布<rt>はいふ</rt></ruby>する<ruby>再利用可能<rt>さいりようかのう</rt></ruby>なReactコンポーネントライブラリを<ruby>作<rt>つく</rt></ruby>り、Jest、Playwright、Cypress、Percyで<ruby>自動<rt>じどう</rt></ruby>テストを<ruby>整備<rt>せいび</rt></ruby>しました。<ruby>顧客<rt>こきゃく</rt></ruby>ポータルをAngularJSからReactとReduxへ<ruby>移行<rt>いこう</rt></ruby>しました。<ruby>顧客<rt>こきゃく</rt></ruby>とエネルギー<ruby>資産<rt>しさん</rt></ruby>のデータを<ruby>集約<rt>しゅうやく</rt></ruby>し、<ruby>顧客<rt>こきゃく</rt></ruby><ruby>向<rt>む</rt></ruby>けポータルの<ruby>指標<rt>しひょう</rt></ruby>を<ruby>計算<rt>けいさん</rt></ruby>するNode.js/ExpressのRESTマイクロサービスを3つ<ruby>開発<rt>かいはつ</rt></ruby>しました。",
      },
    },
  },
  {
    contentType: "experience",
    match: { company: "PrinterPix", role: "Web Developer", startDate: "2017-11-01" },
    source: {
      role: "Web Developer",
      description:
        "Led the frontend implementation of an e-commerce migration from ASP.NET to Magento 2, developing responsive templates and Sass from design specifications.",
    },
    translations: {
      "it-IT": {
        role: "Sviluppatore web",
        description:
          "Guida dell'implementazione frontend di una migrazione e-commerce da ASP.NET a Magento 2, con template responsive e Sass a partire dalle specifiche di design.",
      },
      "ja-JP": {
        role: "ウェブデベロッパー",
        description:
          "ASP.NETからMagento 2へのeコマース<ruby>移行<rt>いこう</rt></ruby>でフロントエンド<ruby>実装<rt>じっそう</rt></ruby>を<ruby>主導<rt>しゅどう</rt></ruby>し、デザイン<ruby>仕様<rt>しよう</rt></ruby>からレスポンシブなテンプレートとSassを<ruby>開発<rt>かいはつ</rt></ruby>しました。",
      },
    },
  },
  {
    contentType: "experience",
    match: { company: "Mapping for Change", role: "Frontend Developer", startDate: "2017-04-01" },
    source: {
      role: "Frontend Developer",
      description:
        "Built and maintained an AngularJS community mapping application and supported GeoKey, a Django backend for research data.",
    },
    translations: {
      "it-IT": {
        role: "Sviluppatore frontend",
        description:
          "Sviluppo e manutenzione di un'applicazione AngularJS di mappatura comunitaria e supporto a GeoKey, un backend Django per dati di ricerca.",
      },
      "ja-JP": {
        role: "フロントエンドデベロッパー",
        description:
          "コミュニティ<ruby>向<rt>む</rt></ruby>けの<ruby>地図<rt>ちず</rt></ruby>アプリケーションをAngularJSで<ruby>開発<rt>かいはつ</rt></ruby>・<ruby>保守<rt>ほしゅ</rt></ruby>し、<ruby>研究<rt>けんきゅう</rt></ruby>データ<ruby>用<rt>よう</rt></ruby>のDjangoバックエンドであるGeoKeyも<ruby>支援<rt>しえん</rt></ruby>しました。",
      },
    },
  },
  {
    contentType: "experience",
    match: { company: "Contractor", role: "Web Developer", startDate: "2014-08-01" },
    source: {
      role: "Web Developer",
      description:
        "Contract frontend work in London. At Kurt Geiger, delivered responsive Magento e-commerce development. At AnyVan, built JavaScript interfaces with Pug and Sass.",
    },
    translations: {
      "it-IT": {
        role: "Sviluppatore web",
        description:
          "Lavoro frontend in contratto a Londra. In Kurt Geiger, sviluppo e-commerce Magento responsive. In AnyVan, interfacce JavaScript con Pug e Sass.",
      },
      "ja-JP": {
        role: "ウェブデベロッパー",
        description:
          "ロンドンでの<ruby>契約<rt>けいやく</rt></ruby>フロントエンド<ruby>開発<rt>かいはつ</rt></ruby>。Kurt GeigerではレスポンシブなMagentoのeコマースを<ruby>担当<rt>たんとう</rt></ruby>し、AnyVanではPugとSassを<ruby>使<rt>つか</rt></ruby>ったJavaScriptのインターフェースを<ruby>作<rt>つく</rt></ruby>りました。",
      },
    },
  },
  {
    contentType: "project",
    match: { title: "InvestLab" },
    source: {
      description:
        "A React and TypeScript application with deterministic financial calculations, built with AI-assisted development and an AI copilot. It integrates a Cloudflare Worker, uses automated tests, and is deployed on GitHub Pages.",
    },
    translations: {
      "it-IT": {
        description:
          "Un'applicazione React e TypeScript con calcoli finanziari deterministici, realizzata con sviluppo assistito dall'AI e un copilota AI. Integra un Cloudflare Worker, usa test automatizzati ed è pubblicata su GitHub Pages.",
      },
      "ja-JP": {
        description:
          "<ruby>決定的<rt>けっていてき</rt></ruby>な<ruby>金融計算<rt>きんゆうけいさん</rt></ruby>を<ruby>行<rt>おこな</rt></ruby>うReactとTypeScriptのアプリケーションです。AIを<ruby>活用<rt>かつよう</rt></ruby>した<ruby>開発<rt>かいはつ</rt></ruby>とAIコパイロットで<ruby>作<rt>つく</rt></ruby>り、Cloudflare Workerを<ruby>連携<rt>れんけい</rt></ruby>し、<ruby>自動<rt>じどう</rt></ruby>テストを<ruby>備<rt>そな</rt></ruby>え、GitHub Pagesで<ruby>公開<rt>こうかい</rt></ruby>しています。",
      },
    },
  },
  {
    contentType: "project",
    match: { title: "LimeJump customer energy portal" },
    source: {
      description:
        "Migrated LimeJump's customer portal from AngularJS to React and Redux. Developed three Node.js/Express microservices to aggregate energy-asset data and calculate energy and financial metrics displayed in the customer portal.",
    },
    translations: {
      "it-IT": {
        description:
          "Migrazione del portale clienti di LimeJump da AngularJS a React e Redux. Sviluppo di tre microservizi Node.js/Express per aggregare i dati degli asset energetici e calcolare le metriche energetiche e finanziarie mostrate nel portale clienti.",
      },
      "ja-JP": {
        description:
          "LimeJumpの<ruby>顧客<rt>こきゃく</rt></ruby>ポータルをAngularJSからReactとReduxへ<ruby>移行<rt>いこう</rt></ruby>しました。エネルギー<ruby>資産<rt>しさん</rt></ruby>のデータを<ruby>集約<rt>しゅうやく</rt></ruby>し、<ruby>顧客<rt>こきゃく</rt></ruby>ポータルに<ruby>表示<rt>ひょうじ</rt></ruby>するエネルギーと<ruby>財務<rt>ざいむ</rt></ruby>の<ruby>指標<rt>しひょう</rt></ruby>を<ruby>計算<rt>けいさん</rt></ruby>するNode.js/Expressのマイクロサービスを3つ<ruby>開発<rt>かいはつ</rt></ruby>しました。",
      },
    },
  },
  {
    contentType: "project",
    match: { title: "LimeJump design system" },
    source: {
      description:
        "Built a reusable React component library packaged as an npm module, with Jest unit tests, Playwright and Cypress end-to-end tests, and Percy visual regression testing integrated into GitHub Actions.",
    },
    translations: {
      "it-IT": {
        description:
          "Libreria di componenti React riutilizzabili distribuita come modulo npm, con unit test Jest, test end-to-end Playwright e Cypress, e test di regressione visiva Percy integrati in GitHub Actions.",
      },
      "ja-JP": {
        description:
          "npmモジュールとして<ruby>配布<rt>はいふ</rt></ruby>する<ruby>再利用可能<rt>さいりようかのう</rt></ruby>なReactコンポーネントライブラリを<ruby>作<rt>つく</rt></ruby>りました。Jestのユニットテスト、PlaywrightとCypressのエンドツーエンドテスト、GitHub Actionsに<ruby>組<rt>く</rt></ruby>み<ruby>込<rt>こ</rt></ruby>んだPercyのビジュアルリグレッションテストを<ruby>備<rt>そな</rt></ruby>えています。",
      },
    },
  },
  {
    contentType: "project",
    match: { title: "Dagrofa" },
    source: {
      description:
        "Maintenance of a Next.js frontend decoupled from Drupal, including Node.js upgrades and production releases.",
    },
    translations: {
      "it-IT": {
        description:
          "Manutenzione di un frontend Next.js disaccoppiato da Drupal, inclusi aggiornamenti di Node.js e rilasci in produzione.",
      },
      "ja-JP": {
        description:
          "Drupalから<ruby>分離<rt>ぶんり</rt></ruby>したNext.jsフロントエンドの<ruby>保守<rt>ほしゅ</rt></ruby>です。Node.jsの<ruby>更新<rt>こうしん</rt></ruby>と<ruby>本番<rt>ほんばん</rt></ruby>リリースを<ruby>含<rt>ふく</rt></ruby>みます。",
      },
    },
  },
  {
    contentType: "project",
    match: { title: "Twilio Flex Canned Responses" },
    source: {
      description:
        "A reusable Twilio Flex plugin, led at Zing, for canned responses using Node.js, Express and Sync documents.",
    },
    translations: {
      "it-IT": {
        description:
          "Un plugin riutilizzabile per Twilio Flex, guidato in Zing, per le risposte predefinite, con Node.js, Express e documenti Sync.",
      },
      "ja-JP": {
        description:
          "Zingで<ruby>主導<rt>しゅどう</rt></ruby>した、<ruby>定型返信<rt>ていけいへんしん</rt></ruby>のための<ruby>再利用可能<rt>さいりようかのう</rt></ruby>なTwilio Flexプラグインです。Node.js、Express、Syncドキュメントを<ruby>使<rt>つか</rt></ruby>っています。",
      },
    },
  },
  {
    contentType: "project",
    match: { title: "Rehlko / Kohler" },
    source: {
      description: "Selected production frontend project integrating Contentful.",
    },
    translations: {
      "it-IT": {
        description: "Progetto frontend di produzione selezionato, con integrazione Contentful.",
      },
      "ja-JP": {
        description:
          "Contentfulを<ruby>連携<rt>れんけい</rt></ruby>した、<ruby>選定済み<rt>せんていずみ</rt></ruby>の<ruby>本番<rt>ほんばん</rt></ruby>フロントエンドプロジェクトです。",
      },
    },
  },
];
