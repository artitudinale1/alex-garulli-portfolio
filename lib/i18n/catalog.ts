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
        bio: "本番のウェブアプリケーションを10年以上手がけてきたシニアフロントエンドエンジニアです。HTML、CSS/Sass、JavaScript、CMSのテンプレートから、React、TypeScript、Next.jsまで幅広く扱っています。\n\nDrupal、WordPress、Contentfulを含む従来型およびヘッドレスCMSに取り組み、RESTおよびGraphQL APIを連携しています。Contentful Certified Professionalでもあります。\n\nNode.js/Expressのマイクロサービスによるデータの集約と計算、再利用できるコンポーネント設計、自動テスト、アクセシビリティ、パフォーマンス最適化、AIを活用した開発の経験があります。\n\nコード以外では、漫画、アニメ、日本文化が好きで、現在日本語を勉強しています 🗻。猫も大好きです 🐱。このサイトに見慣れた顔があるのは、そのためかもしれません。",
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
          "企業向けの本番React、Next.js、TypeScriptアプリケーションの開発と保守を担当し、ヘッドレスCMS、REST、GraphQLのサービスを連携しています。デザイン、QA、バックエンドのエンジニアと協力して、再利用できるReactコンポーネントとStorybookの作例を作っています。LighthouseによるSSRとパフォーマンスの調査、ESLintとSonarQubeによるコードレビュー、Node.jsの保守とリリースも担当します。主な実績はDagrofa（Azure DevOps上のNext.jsと分離型Drupal）、FANUC、VisitDenmark、Rehlko / Kohler（Contentful）、CGIAR（DrupalとTwig）です。",
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
        role: "認定 Twilio ウェブデベロッパー",
        description:
          "AnyVanを含むTwilio Flexの実装で、ReactとReduxの機能、およびサーバーレスのNode.js APIを開発しました。Node.js、Express、Twilio Flex、Syncドキュメントを使った再利用可能なCanned Responsesプラグインを主導しました。CarFinance247では、CMS、データベース、フロントエンドにまたがるTwilio Flexの連携を担当しました。",
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
          "npmモジュールとして配布する再利用可能なReactコンポーネントライブラリを作り、Jest、Playwright、Cypress、Percyで自動テストを整備しました。顧客ポータルをAngularJSからReactとReduxへ移行しました。顧客とエネルギー資産のデータを集約し、顧客向けポータルの指標を計算するNode.js/ExpressのRESTマイクロサービスを3つ開発しました。",
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
          "ASP.NETからMagento 2へのeコマース移行でフロントエンド実装を主導し、デザイン仕様からレスポンシブなテンプレートとSassを開発しました。",
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
          "コミュニティ向けの地図アプリケーションをAngularJSで開発・保守し、研究データ用のDjangoバックエンドであるGeoKeyも支援しました。",
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
          "ロンドンでの契約フロントエンド開発。Kurt GeigerではレスポンシブなMagentoのeコマースを担当し、AnyVanではPugとSassを使ったJavaScriptのインターフェースを作りました。",
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
          "決定的な金融計算を行うReactとTypeScriptのアプリケーションです。AIを活用した開発とAIコパイロットで作り、Cloudflare Workerを連携し、自動テストを備え、GitHub Pagesで公開しています。",
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
          "LimeJumpの顧客ポータルをAngularJSからReactとReduxへ移行しました。エネルギー資産のデータを集約し、顧客ポータルに表示するエネルギーと財務の指標を計算するNode.js/Expressのマイクロサービスを3つ開発しました。",
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
          "npmモジュールとして配布する再利用可能なReactコンポーネントライブラリを作りました。Jestのユニットテスト、PlaywrightとCypressのエンドツーエンドテスト、GitHub Actionsに組み込んだPercyのビジュアルリグレッションテストを備えています。",
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
          "Drupalから分離したNext.jsフロントエンドの保守です。Node.jsの更新と本番リリースを含みます。",
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
          "Zingで主導した、定型返信のための再利用可能なTwilio Flexプラグインです。Node.js、Express、Syncドキュメントを使っています。",
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
        description: "Contentfulを連携した、選定済みの本番フロントエンドプロジェクトです。",
      },
    },
  },
];
