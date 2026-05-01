"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

const T = {
  en: {
    dir: "ltr" as const,
    nav: { logo: "Qiyasi", demo: "Request Demo", login: "Merchant Login" },
    hero: {
      badge: "AI-Powered Size Intelligence",
      h1a: "Stop Guessing.",
      h1b_plain: "Size ",
      h1b_accent: "Intelligently.",
      sub: "The smart sizing layer for fashion brands. Help customers find their perfect fit — reduce returns, increase conversions, and build lasting trust.",
      cta1: "Request Demo →",
      cta2: "See How It Works",
      trust: "Trusted by 200+ fashion brands · No credit card required",
    },
    stats: {
      label: "Trusted Precision",
      items: [
        { val: "98%",    label: "Measurement accuracy" },
        { val: "−35%",   label: "Return rate reduction" },
        { val: "< 2min", label: "Integration time" },
        { val: "100%",   label: "Secure & encrypted" },
      ],
    },
    problem: {
      label: "The Problem",
      h2: "Sizing mistakes cost fashion brands thousands.",
      cards: [
        { title: "High Return Rates",         desc: "28% of fashion returns are size-related. Every return erodes your margin and customer trust." },
        { title: "Manual Measurement Errors", desc: "Generic charts ignore body shape, fit preference, and category-specific sizing data." },
        { title: "Poor Size Standardization", desc: "Inconsistent standards across brands leave customers confused and hesitant to buy." },
      ],
    },
    friction: {
      headline: "Fit and sizing are the biggest source of friction in fashion.",
      q1: "Unsure fit is the number one reason for purchase hesitancy.",
      q2: "Up to 70% of size-related queries are about fit and sizing uncertainty.",
      source1: "Industry Research, 2024",
      source2: "Fashion E-commerce Report",
    },
    solution: {
      label: "The Solution",
      h2: "Intelligent sizing, effortlessly integrated.",
      sub: "Four pillars. Zero friction. Works inside your existing store.",
      cards: [
        { title: "Smart Body Profile",     desc: "A 30-second visual quiz — no measuring tape. We build an accurate body profile from simple answers." },
        { title: "Intelligent Prediction", desc: "Our scoring engine processes body data, fit preferences, and your brand's exact size chart instantly." },
        { title: "Brand Size Mapping",     desc: "Every brand sizes differently. Qiyasi maps customer bodies to your specific size chart with precision." },
        { title: "Data-Driven Precision",  desc: "Confidence scores, alternative sizes, and continuous refinement — every recommendation gets smarter." },
      ],
    },
    smartSizing: {
      label: "Smart Sizing Profile",
      h2: "Two Products. One Perfect Fit.",
      badgeLabel: "Size",
      badgeSub: "Smart Sizing",
      sub: "Provide perfect size recommendations with confidence.",
      products: [
        { name: "Premium Silk Abaya",    sizeLabel: "Size: XL" },
        { name: "Classic Formal Shirt",  sizeLabel: "Size: L"  },
      ],
      profile1Label: "Body Profile",
      profile2Label: "Shirt Profile",
      profile1: [
        { key: "Bust",   val: "102cm" },
        { key: "Waist",  val: "85cm"  },
        { key: "Height", val: "165cm" },
      ],
      profile2: [
        { key: "Chest",  val: '40"' },
        { key: "Sleeve", val: '34"' },
        { key: "Neck",   val: '16"' },
      ],
    },
    preview: {
      label: "Product Preview",
      h2: "The experience your customers deserve.",
      sub: "Embedded directly in your product pages. Zero redirects.",
      caption: "Designed for precision. Built for scale.",
      step: "Step 3 of 5",
      q: "How would you describe your shoulder width?",
      opts: ["Narrow", "Average", "Broad"],
      result: "Your recommended size",
      size: "M",
      fit: "Regular Fit · High confidence",
      confidence: "94% match",
      found: "We found your size!",
      foundSub: "Based on your answers, your perfect size is M. You can now buy with confidence.",
      retake: "Retake quiz",
    },
    vision: {
      label: "Methodology",
      h2: "Our Measurement Philosophy",
      sub: "Systematic. Scientific. Continuously refined.",
      steps: [
        { title: "Structured Data Collection", desc: "Customers answer a visual quiz in under 30 seconds — no measuring tape, no friction, no guesswork." },
        { title: "Intelligent Processing",      desc: "Our engine estimates chest, waist, and hip measurements from height, weight, and body shape answers." },
        { title: "Accurate Output Modeling",    desc: "A scoring algorithm matches estimated body measurements against your exact brand size chart rows." },
        { title: "Continuous Optimization",     desc: "Each recommendation is scored for confidence and refined over time. Precision only improves." },
      ],
    },
    comparison: {
      label: "Why Different",
      h2: "Qiyasi vs. Traditional Sizing",
      qiyasi: "Qiyasi",
      traditional: "Traditional",
      rows: [
        "AI-Based Measurement",
        "Data-Driven Precision",
        "Scales to Any Store",
        "Standardized Results",
        "2-Minute Integration",
        "Continuous Improvement",
      ],
    },
    pricing: {
      label: "Pricing",
      badge: "MOST POPULAR",
      plan: "Qiyasi Pro",
      price: "$29",
      period: "/month",
      desc: "Everything included. No hidden fees.",
      features: [
        "Unlimited products & categories",
        "Your own private API key",
        "Works on Shopify, WordPress, or any HTML",
        "Custom size charts per category",
        "AI confidence scores + alternatives",
        "Priority email support",
        "14-day free trial included",
      ],
      cta: "Start Free Trial →",
      note: "Cancel anytime · No setup fees",
    },
    faq: {
      label: "FAQ",
      h2: "Common Questions",
      items: [
        { q: "How does Qiyasi determine the right size?",   a: "Customers answer a short visual quiz (height, weight, shoulders, belly, fit preference). Our engine estimates body measurements and scores them against your brand's size chart — no measuring tape needed." },
        { q: "Which platforms is it compatible with?",       a: "Any platform that supports HTML — Shopify, WooCommerce, Magento, or a fully custom store. Integration is two lines of code." },
        { q: "How long does integration take?",              a: "Under 2 minutes for most stores. Add two script tags to your product page template and you're live." },
        { q: "Is customer data stored or shared?",           a: "No personal data is stored. Body estimates are computed in real time and never saved to any database." },
        { q: "What if the recommendation is wrong?",         a: "Our engine achieves 98% accuracy. In rare cases, customers can retake the quiz. Contact support and we'll investigate any systematic issues." },
      ],
    },
    cta: {
      h2a: "Ready to eliminate",
      h2b: "sizing errors?",
      sub: "Book a 20-minute demo. See Qiyasi live on your store.",
      btn: "Book a Demo →",
      trust: ["14-day free trial", "No credit card", "Cancel anytime"],
    },
    demo: {
      label: "Get Early Access",
      h2: "See Qiyasi on your store.",
      sub: "Fill in the form and we'll set up a personalized demo within 24 hours.",
      name: "Full Name",
      namePlaceholder: "Ahmed Al-Rashidi",
      email: "Work Email",
      emailPlaceholder: "ahmed@yourstore.com",
      storeUrl: "Store URL",
      storeUrlPlaceholder: "https://yourstore.com",
      message: "Message (Optional)",
      messagePlaceholder: "Tell us about your store, product category, or any questions...",
      cta: "Request Demo →",
      note: "We'll reply within 24 hours. No spam, ever.",
      success: "Request received! We'll be in touch within 24 hours.",
      error: "Something went wrong. Please try again or email us at support@qiyasi.net",
      trust: [
        { icon: "⚡", text: "Setup takes under 10 minutes" },
        { icon: "🔒", text: "No credit card required" },
        { icon: "📈", text: "See ROI in your first week" },
      ],
    },
    advanced: {
      badge: "Advanced Feature",
      h2: "Extreme accuracy and deep understanding of every product",
      f1icon: "target",
      f1title: "Precise Size Accuracy",
      f1desc: "We go beyond standard measurements by understanding product details. For abayas, we focus precisely on the required comfort fit level. For dresses, we factor in fabric type and its effect on sizing to ensure a perfect match.",
      f2icon: "palette",
      f2title: "Fully Customizable",
      f2desc: "The tool adapts to your visual identity. Customize colors to perfectly match your store — making Qiyasi part of your brand, not just an external tool. All with smart size recommendation optimization.",
      wTitle: "Chiffon Abaya",
      wResultLabel: "Recommended Size",
      wConfLabel: "Confidence",
      wPatLabel: "Fit Pattern",
      wPatVal: "Regular",
      wAddBtn: "Add to Cart",
    },
    benefits: {
      h2a: "Better Sizing.",
      h2b: "Better Experiences",
      sub: "Equip your fashion brand with AI precision that improves shopper confidence and drives better sizing decisions.",
      cards: [
        { icon: "returns",    label: "Fewer Returns"      },
        { icon: "conversion", label: "Higher Conversion"  },
        { icon: "support",    label: "Less Support Needed"},
      ],
    },
    howItWorks: {
      label: "How It Works",
      h2: "How does it work?",
      sub: "Seamlessly integrate size recommendations into your product pages through a simple and intuitive user experience.",
      steps: [
        {
          title: "Integration",
          desc: "Once embedded, a \"What's my size?\" button will appear on your product detail pages.",
          icon: "cursor",
        },
        {
          title: "User Interaction",
          desc: "Customers click the button and a pop-up window guides them through the size selection process.",
          icon: "chat",
        },
        {
          title: "Size Recommendation",
          desc: "AI analyzes their data and provides an accurate size recommendation instantly.",
          icon: "target",
        },
      ],
    },
    journey: {
      label: "The Reality",
      h2: "Your customer loves the product. But hesitates at size.",
      sub: "This cycle repeats thousands of times every day across fashion stores worldwide.",
      steps: [
        { emoji: "🛍️", title: "Discovers Product",    desc: "Customer finds the perfect item and immediately wants to buy." },
        { emoji: "📋", title: "Opens Size Chart",      desc: "Generic chart with confusing numbers that don't match their reality." },
        { emoji: "🤔", title: "Fear Sets In",          desc: "\"What if it doesn't fit?\" The doubt begins. Confidence drops." },
        { emoji: "🛒", title: "Buys on a Gamble",      desc: "Hopes for the best. Places the order despite uncertainty." },
        { emoji: "📦", title: "Wrong Size Arrives",    desc: "Product arrives. Doesn't fit. Frustration and disappointment." },
        { emoji: "💔", title: "Trust Destroyed",       desc: "Return filed. Repeat purchase gone. Lifetime value: zero." },
      ],
      note: "This is 100% preventable. Every single time.",
    },
    marketStats: {
      label: "Market Data",
      h2: "The numbers don't lie.",
      sub: "Fashion e-commerce in the Gulf and Africa is growing fast — but sizing problems drain that growth every day.",
      items: [
        { to: 30,  prefix: "",  suffix: "%",   label: "Average return rate in fashion e-commerce" },
        { to: 70,  prefix: "",  suffix: "%",   label: "Of those returns caused by sizing issues" },
        { to: 800, prefix: "$", suffix: "B+",  label: "Lost globally to size-related returns yearly" },
        { to: 40,  prefix: "",  suffix: "%",   label: "Of shoppers abandon cart due to size uncertainty" },
      ],
    },
    roi: {
      label: "ROI Calculator",
      h2: "Calculate your monthly loss.",
      sub: "See exactly how much wrong sizing costs your store — then see what Qiyasi costs.",
      productsLabel:  "Products sold per month",
      priceLabel:     "Average product price ($)",
      returnRateLabel:"Your estimated return rate (%)",
      results: {
        revenue:     "Monthly Revenue",
        returns:     "Monthly Returns",
        sizeReturns: "Size-Related Returns",
        monthlyLoss: "Monthly Loss to Sizing",
        yearlyLoss:  "Yearly Loss",
        qiyasiCost:  "Qiyasi yearly cost",
        savings:     "Potential yearly savings",
      },
      note: "Based on industry average: 60% of returns are size-related.",
      cta: "Start recovering this revenue →",
    },
    trial: {
      label: "Free Trial",
      h2: "See the results with your own eyes.",
      sub: "14 days. Real integration. Real data. Zero commitment.",
      features: [
        "14-day free trial — no credit card needed",
        "Real integration on your live store",
        "Measure actual return rate reduction",
        "Cancel anytime, no questions asked",
      ],
      cta: "Start My Free 14 Days →",
      note: "Setup takes under 10 minutes.",
    },
    risk: {
      h2: "The only risk is doing nothing.",
      sub: "Every month without Qiyasi, your store continues losing thousands to preventable returns. The cost of inaction compounds daily.",
      cta: "Eliminate the risk now →",
    },
    support: {
      label: "We're With You",
      h2: "We care about your success.",
      sub: "Qiyasi isn't just software. It's a long-term partnership built around your store's growth.",
      items: [
        { icon: "⚡", title: "Fast Response",              desc: "We reply within hours, not days. Your questions matter and your time is valuable." },
        { icon: "🔧", title: "Direct Integration Support", desc: "We help you set up, configure, and optimize — step by step, at your pace." },
        { icon: "📈", title: "Growth Partnership",         desc: "We track your results with you and help you continuously improve performance." },
        { icon: "🛡️", title: "Always Available",           desc: "Ongoing support as your store scales. We grow alongside you, not away from you." },
      ],
    },
    footer: {
      tagline: "AI-powered sizing for fashion brands.",
      copy: "© 2025 Qiyasi. All rights reserved.",
      links: [
        { href: "/",           label: "Home"        },
        { href: "/#solution",  label: "How It Works"},
        { href: "/#demo",      label: "Demo"        },
        { href: "/pricing",    label: "Pricing"     },
        { href: "/faq",        label: "FAQ"         },
        { href: "/embed-demo", label: "Embed Demo"  },
      ],
    },
  },

  ar: {
    dir: "rtl" as const,
    nav: { logo: "قياسي", demo: "احجز عرضاً", login: "دخول التاجر" },
    hero: {
      badge: "ذكاء اصطناعي لتحديد المقاس",
      h1a: "توقف عن التخمين.",
      h1b_plain: "قِس ",
      h1b_accent: "بذكاء.",
      sub: "طبقة المقاسات الذكية لمتاجر الملابس. ساعد زبائنك في إيجاد المقاس المثالي — قلل المرتجعات، وزد المبيعات، وابنِ ثقة تدوم.",
      cta1: "← احجز عرضاً",
      cta2: "شاهد كيف يعمل",
      trust: "موثوق من أكثر من 200 علامة تجارية · بدون بطاقة ائتمان",
    },
    stats: {
      label: "أرقام تثبت الفرق",
      items: [
        { val: "98%",   label: "دقة القياس" },
        { val: "−35%",  label: "تراجع في المرتجعات" },
        { val: "< دق2", label: "وقت التكامل" },
        { val: "100%",  label: "آمن ومشفر" },
      ],
    },
    problem: {
      label: "المشكلة",
      h2: "أخطاء المقاسات تكلف متاجر الأزياء آلاف الدولارات.",
      cards: [
        { title: "معدلات إرجاع مرتفعة",    desc: "28% من مرتجعات الملابس سببها اختيار المقاس الخاطئ. كل عملية إرجاع تأكل هامش ربحك وثقة عميلك." },
        { title: "أخطاء القياس اليدوي",    desc: "الجداول التقليدية لا تأخذ في الاعتبار شكل الجسم أو تفضيلات الارتداء أو بيانات الفئة." },
        { title: "غياب التوحيد القياسي",   desc: "معايير غير موحّدة بين العلامات التجارية تجعل العملاء في حيرة وتثبّط قرار الشراء." },
      ],
    },
    friction: {
      headline: "المقاس وملاءمة القطعة هما المصدر الأكبر للتردد في عالم الموضة.",
      q1: "عدم التأكد من المقاس هو السبب الأول للتردد في قرار الشراء.",
      q2: "حتى 70% من استفسارات المقاسات تتعلق بعدم اليقين من ملاءمة القطعة.",
      source1: "أبحاث الصناعة، 2024",
      source2: "تقرير التجارة الإلكترونية في الموضة",
    },
    solution: {
      label: "الحل",
      h2: "مقاسات ذكية، تكامل سلس.",
      sub: "أربعة محاور. صفر عقبات. يعمل داخل متجرك الحالي.",
      cards: [
        { title: "ملف الجسم الذكي",              desc: "استبيان بصري قصير — بدون شريط قياس. نبني ملف جسم دقيق من إجابات بسيطة في 30 ثانية." },
        { title: "توقع ذكي للمقاس",              desc: "محركنا يعالج بيانات الجسم وتفضيلات الارتداء وجدول مقاسات علامتك التجارية فورياً." },
        { title: "ربط مقاسات العلامة التجارية", desc: "كل علامة تجارية لها نظام مقاسات مختلف. قياسي يربط جسم العميل بجدولك بدقة تامة." },
        { title: "دقة مبنية على البيانات",       desc: "درجات ثقة، مقاسات بديلة، وتحسين مستمر — كل توصية تصبح أذكى من السابقة." },
      ],
    },
    smartSizing: {
      label: "ملف المقاس الذكي",
      h2: "منتجان. مقاس واحد مثالي.",
      badgeLabel: "المقاس",
      badgeSub: "تحديد ذكي",
      sub: "توصيات مقاسات مثالية بثقة تامة.",
      products: [
        { name: "عباية حرير فاخرة",      sizeLabel: "المقاس: XL" },
        { name: "قميص رسمي كلاسيكي", sizeLabel: "المقاس: L"  },
      ],
      profile1Label: "ملف الجسم",
      profile2Label: "ملف القميص",
      profile1: [
        { key: "الصدر",  val: "102سم" },
        { key: "الخصر",  val: "85سم"  },
        { key: "الطول",  val: "165سم" },
      ],
      profile2: [
        { key: "الصدر",  val: '40"' },
        { key: "الكم",   val: '34"' },
        { key: "الرقبة", val: '16"' },
      ],
    },
    preview: {
      label: "معاينة المنتج",
      h2: "التجربة التي يستحقها زبائنك.",
      sub: "مدمج مباشرة في صفحات منتجاتك. بدون أي إعادة توجيه.",
      caption: "مصمم للدقة. مبني للنطاق الواسع.",
      step: "الخطوة 3 من 5",
      q: "كيف تصف عرض كتفيك؟",
      opts: ["ضيقة", "متوسطة", "عريضة"],
      result: "مقاسك الموصى به",
      size: "M",
      fit: "قصة عادية · ثقة عالية",
      confidence: "تطابق 94%",
      found: "وجدنا مقاسك!",
      foundSub: "بناءً على إجاباتك، المقاس الأمثل لك هو M. يمكنك الشراء الآن بثقة تامة.",
      retake: "إعادة الاختبار",
    },
    vision: {
      label: "المنهجية",
      h2: "فلسفتنا في القياس",
      sub: "منهجية. علمية. تتحسن باستمرار.",
      steps: [
        { title: "جمع بيانات منظّم",    desc: "يجيب الزبائن على استبيان بصري في أقل من 30 ثانية — بدون شريط قياس، بدون تعقيد، بدون تخمين." },
        { title: "معالجة ذكية",          desc: "محركنا يقدّر قياسات الصدر والخصر والورك من الطول والوزن وإجابات شكل الجسم." },
        { title: "نمذجة دقيقة للنتائج", desc: "خوارزمية التقييم تطابق القياسات المقدّرة مع صفوف جدول مقاسات علامتك التجارية بدقة." },
        { title: "تحسين مستمر",          desc: "كل توصية تُقيَّم بدرجة ثقة وتتحسن بمرور الوقت. الدقة تزداد مع كل استخدام." },
      ],
    },
    comparison: {
      label: "لماذا قياسي؟",
      h2: "قياسي مقابل الطرق التقليدية",
      qiyasi: "قياسي",
      traditional: "التقليدي",
      rows: [
        "قياس بالذكاء الاصطناعي",
        "دقة مبنية على البيانات",
        "يتكيف مع أي متجر",
        "نتائج موحّدة",
        "تكامل في دقيقتين",
        "تحسّن مستمر",
      ],
    },
    pricing: {
      label: "التسعير",
      badge: "الأكثر شيوعاً",
      plan: "Qiyasi Pro",
      price: "$29",
      period: "/شهر",
      desc: "كل الميزات مشمولة. بدون رسوم خفية.",
      features: [
        "منتجات وفئات غير محدودة",
        "مفتاح API خاص بمتجرك",
        "يعمل على Shopify وWordPress وأي HTML",
        "جداول مقاسات مخصصة لكل فئة",
        "درجات ثقة AI + مقاسات بديلة",
        "دعم بريد إلكتروني متقدم",
        "تجربة مجانية 14 يوماً مشمولة",
      ],
      cta: "ابدأ التجربة المجانية ←",
      note: "إلغاء في أي وقت · بدون رسوم تفعيل",
    },
    faq: {
      label: "الأسئلة الشائعة",
      h2: "أسئلة شائعة",
      items: [
        { q: "كيف يحدد قياسي المقاس الصحيح؟",            a: "يجيب الزبائن على استبيان بصري قصير (الطول، الوزن، عرض الكتف، البطن، تفضيل الارتداء). يقدّر محركنا قياسات الجسم ويقيّمها مقابل جدول مقاسات علامتك التجارية." },
        { q: "ما المنصات المدعومة؟",                       a: "أي منصة تدعم HTML — Shopify وWooCommerce وMagento وأي متجر مخصص. التكامل بسطرين من الكود فقط." },
        { q: "كم يستغرق التكامل؟",                        a: "أقل من دقيقتين لمعظم المتاجر. أضف وسمتي script في قالب صفحة المنتج وستكون جاهزاً." },
        { q: "هل يتم تخزين بيانات الزبائن أو مشاركتها؟", a: "لا يتم تخزين أي بيانات شخصية. تقديرات الجسم تُحسب في الوقت الفعلي ولا تُحفظ في أي قاعدة بيانات." },
        { q: "ماذا لو كانت التوصية خاطئة؟",               a: "يحقق محركنا دقة 98%. في حالات نادرة يمكن للزبائن إعادة الاختبار. تواصل مع الدعم وسنحقق في أي مشكلة منهجية." },
      ],
    },
    cta: {
      h2a: "جاهز للقضاء على",
      h2b: "أخطاء المقاسات؟",
      sub: "احجز جلسة تعريفية لمدة 20 دقيقة. شاهد قياسي على متجرك مباشرة.",
      btn: "← احجز عرضاً",
      trust: ["تجربة مجانية 14 يوماً", "بدون بطاقة ائتمان", "إلغاء في أي وقت"],
    },
    demo: {
      label: "احصل على الوصول المبكر",
      h2: "شاهد قياسي على متجرك.",
      sub: "أدخل بياناتك وسنتواصل معك خلال 24 ساعة لإعداد عرض مخصص لمتجرك.",
      name: "الاسم الكامل",
      namePlaceholder: "أحمد الرشيدي",
      email: "البريد الإلكتروني",
      emailPlaceholder: "ahmed@yourstore.com",
      storeUrl: "رابط المتجر",
      storeUrlPlaceholder: "https://yourstore.com",
      message: "رسالة (اختياري)",
      messagePlaceholder: "أخبرنا عن متجرك، الفئة التي تبيعها، أو أي استفسار...",
      cta: "← احجز عرضاً",
      note: "سنرد خلال 24 ساعة. لا رسائل مزعجة أبداً.",
      success: "تم الاستلام! سنتواصل معك خلال 24 ساعة.",
      error: "حدث خطأ، يرجى المحاولة مجدداً أو راسلنا على support@qiyasi.net",
      trust: [
        { icon: "⚡", text: "الإعداد في أقل من 10 دقائق" },
        { icon: "🔒", text: "بدون بطاقة ائتمان" },
        { icon: "📈", text: "عائد استثمار من الأسبوع الأول" },
      ],
    },
    advanced: {
      badge: "ميزة متقدمة",
      h2: "دقة متناهية وفهم عميق لكل منتج",
      f1icon: "target",
      f1title: "ضبط دقة المقاسات",
      f1desc: "نحن نتجاوز القياسات التقليدية عبر فهم تفاصيل المنتج. فبالنسبة للعبايات، نركز بدقة على مستوى الراحة (Comfort Fit) المطلوب، وبالنسبة للفساتين، نأخذ بعين الاعتبار نوع القماش وتأثيره على المقاس لضمان مطابقة مثالية.",
      f2icon: "palette",
      f2title: "قابل للتخصيص بالكامل",
      f2desc: "الأداة تتكيف مع هويتك البصرية. يمكنك تخصيص الألوان لتتطابق تماماً مع ألوان متجرك، ليصبح 'قياسي' جزءاً من براندك الخاص وليس مجرد أداة خارجية، كل هذا مع تحسين ذكي لتوصيات المقاس.",
      wTitle: "عباية شيفون",
      wResultLabel: "المقاس الموصى به",
      wConfLabel: "الثقة",
      wPatLabel: "نمط الارتداء",
      wPatVal: "عادي",
      wAddBtn: "أضف إلى السلة",
    },
    benefits: {
      h2a: "مقاسات أدق.",
      h2b: "تجارب أفضل",
      sub: "زوّد متجرك بدقة الذكاء الاصطناعي التي تعزز ثقة الزبائن وتحسّن قرارات الشراء.",
      cards: [
        { icon: "returns",    label: "مرتجعات أقل"       },
        { icon: "conversion", label: "تحويل أعلى"        },
        { icon: "support",    label: "دعم أقل"            },
      ],
    },
    howItWorks: {
      label: "كيف يعمل",
      h2: "كيف يعمل؟",
      sub: "قم بدمج توصيات المقاسات بسلاسة في صفحات منتجاتك من خلال تجربة مستخدم بسيطة وبديهية.",
      steps: [
        {
          title: "اندماج",
          desc: "بمجرد دمجها، سيظهر زر \"ما هو مقاسي؟\" على صفحة تفاصيل المنتج الخاصة بك.",
          icon: "cursor",
        },
        {
          title: "تفاعل المستخدم",
          desc: "ينقر العملاء على الزر، فتظهر نافذة منبثقة ترشدهم خلال عملية تحديد المقاس.",
          icon: "chat",
        },
        {
          title: "توصية بشأن المقاس",
          desc: "يقوم الذكاء الاصطناعي بتحليل بياناتهم ويقدم توصية دقيقة بشأن المقاس على الفور.",
          icon: "target",
        },
      ],
    },
    journey: {
      label: "الواقع",
      h2: "زبونك يحب المنتج. لكنه يتردد عند المقاس.",
      sub: "هذه الحلقة تتكرر آلاف المرات يومياً في متاجر الأزياء حول العالم.",
      steps: [
        { emoji: "🛍️", title: "يكتشف المنتج",        desc: "يجد الزبون القطعة المثالية ويريد الشراء فوراً." },
        { emoji: "📋", title: "يفتح جدول المقاسات",  desc: "جدول عام بأرقام مربكة لا تعكس قياساته الحقيقية." },
        { emoji: "🤔", title: "يصيبه الخوف",          desc: "\"ماذا لو لم يناسبني؟\" يبدأ الشك. تتراجع ثقته." },
        { emoji: "🛒", title: "يشتري على أمل",         desc: "يأمل في الأفضل. يضع طلبه رغم عدم اليقين." },
        { emoji: "📦", title: "يصل بمقاس خاطئ",      desc: "يصل المنتج. لا يناسبه. يبدأ الإحباط والخيبة." },
        { emoji: "💔", title: "الثقة تتهاوى",          desc: "طلب إرجاع. لا مشتريات مستقبلية. قيمة مدى الحياة: صفر." },
      ],
      note: "هذا قابل للمنع بنسبة 100%. في كل مرة.",
    },
    marketStats: {
      label: "أرقام السوق",
      h2: "الأرقام لا تكذب.",
      sub: "التجارة الإلكترونية للأزياء في الخليج وأفريقيا تنمو بسرعة — لكن مشاكل المقاسات تستنزف هذا النمو يومياً.",
      items: [
        { to: 30,  prefix: "",  suffix: "%",  label: "متوسط معدل الإرجاع في أزياء التجارة الإلكترونية" },
        { to: 70,  prefix: "",  suffix: "%",  label: "من تلك المرتجعات سببها مشكلة المقاس" },
        { to: 800, prefix: "$", suffix: "B+", label: "خسائر عالمية سنوية بسبب مرتجعات المقاسات" },
        { to: 40,  prefix: "",  suffix: "%",  label: "من المتسوقين يتخلون عن سلة الشراء بسبب المقاس" },
      ],
    },
    roi: {
      label: "حاسبة العائد",
      h2: "احسب خسارتك الشهرية.",
      sub: "شاهد بالضبط كم تكلفك المقاسات الخاطئة — ثم قارن بتكلفة قياسي.",
      productsLabel:  "المنتجات المباعة شهرياً",
      priceLabel:     "متوسط سعر المنتج ($)",
      returnRateLabel:"معدل الإرجاع التقديري (%)",
      results: {
        revenue:     "الإيراد الشهري",
        returns:     "إجمالي المرتجعات الشهرية",
        sizeReturns: "مرتجعات بسبب المقاس",
        monthlyLoss: "الخسارة الشهرية من المقاس",
        yearlyLoss:  "الخسارة السنوية",
        qiyasiCost:  "تكلفة قياسي سنوياً",
        savings:     "وفورات سنوية محتملة",
      },
      note: "تقدير بناءً على متوسط الصناعة: 60% من المرتجعات سببها المقاس.",
      cta: "← ابدأ استرداد هذه الإيرادات",
    },
    trial: {
      label: "تجربة مجانية",
      h2: "شاهد النتائج بعينيك.",
      sub: "14 يوماً. تكامل حقيقي. بيانات حقيقية. بدون التزام.",
      features: [
        "14 يوماً مجاناً — بدون بطاقة ائتمان",
        "تكامل حقيقي على متجرك المباشر",
        "قِس الانخفاض الفعلي في معدل الإرجاع",
        "إلغاء في أي وقت، بدون أي أسئلة",
      ],
      cta: "← ابدأ تجربتي المجانية لـ 14 يوماً",
      note: "الإعداد في أقل من 10 دقائق.",
    },
    risk: {
      h2: "الخطر الوحيد هو عدم فعل شيء.",
      sub: "كل شهر بدون قياسي، متجرك يواصل خسارة الآلاف في مرتجعات يمكن تجنبها. تكلفة التقاعس تتراكم يومياً.",
      cta: "← أزل الخطر الآن",
    },
    support: {
      label: "نحن معك",
      h2: "نهتم بنجاحك.",
      sub: "قياسي ليس مجرد برنامج. إنه شراكة طويلة الأمد مبنية حول نمو متجرك.",
      items: [
        { icon: "⚡", title: "استجابة سريعة",         desc: "نرد خلال ساعات لا أيام. أسئلتك مهمة ووقتك ثمين." },
        { icon: "🔧", title: "دعم تكامل مباشر",       desc: "نساعدك في الإعداد والتكوين والتحسين — خطوة بخطوة، وبإيقاعك." },
        { icon: "📈", title: "شراكة في النمو",         desc: "نتابع نتائجك معك ونساعدك على التحسين المستمر." },
        { icon: "🛡️", title: "متاح دائماً",            desc: "دعم مستمر مع نمو متجرك. نكبر معك، لا بعيداً عنك." },
      ],
    },
    footer: {
      tagline: "ذكاء اصطناعي لمقاسات علامات الموضة.",
      copy: "© 2025 قياسي. جميع الحقوق محفوظة.",
      links: [
        { href: "/",           label: "الرئيسية"        },
        { href: "/#solution",  label: "كيف يعمل"        },
        { href: "/#demo",      label: "الديمو"          },
        { href: "/pricing",    label: "التسعير"         },
        { href: "/faq",        label: "الأسئلة الشائعة" },
        { href: "/embed-demo", label: "عرض التضمين"    },
      ],
    },
  },
};

type Lang = "en" | "ar";

const DELAYS = ["delay-100", "delay-200", "delay-300", "delay-400"] as const;

const JOURNEY_BG   = ["bg-emerald-50 border-emerald-100","bg-blue-50 border-blue-100","bg-amber-50 border-amber-100","bg-orange-50 border-orange-100","bg-red-50 border-red-100","bg-rose-50 border-rose-100"] as const;
const JOURNEY_TEXT = ["text-emerald-600","text-blue-600","text-amber-600","text-orange-600","text-red-500","text-rose-600"] as const;

function CountUp({ to, duration = 2000, prefix = "", suffix = "" }: { to: number; duration?: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref  = useRef<HTMLSpanElement>(null);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || done.current) return;
      done.current = true;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - t0) / duration, 1);
        setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{prefix}{val}{suffix}</span>;
}

function CheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function LandingPage() {
  const [lang,       setLang]       = useState<Lang>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("qiyasi-lang");
      if (saved === "en" || saved === "ar") return saved;
    }
    return "en";
  });
  const [activeOpt,  setActiveOpt]  = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [openFaq,    setOpenFaq]    = useState<number | null>(null);
  const [form,       setForm]       = useState({ name: "", email: "", storeUrl: "", message: "" });
  const [formStatus,  setFormStatus]  = useState<"idle" | "loading" | "success" | "error">("idle");
  const [calcInputs,  setCalcInputs]  = useState({ products: 300, price: 350, returnRate: 20 });

  const t    = T[lang];
  const isAr = lang === "ar";

  const roiRevenue     = calcInputs.products * calcInputs.price;
  const roiReturns     = Math.round(calcInputs.products * calcInputs.returnRate / 100);
  const roiSizeReturns = Math.round(roiReturns * 0.6);
  const roiMonthlyLoss = roiSizeReturns * calcInputs.price;
  const roiYearlyLoss  = roiMonthlyLoss * 12;

  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("animate-fadeUp"); obs.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [lang]);

  async function handleDemoSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormStatus("loading");
    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setFormStatus("success");
      setForm({ name: "", email: "", storeUrl: "", message: "" });
    } catch { setFormStatus("error"); }
  }

  return (
    <div dir={t.dir} className="min-h-screen bg-white text-slate-900">

      {/* ── 1. NAV ── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
              <Image src="/logo2.jpeg" alt="Qiyasi" width={56} height={56} className="w-full h-full object-contain" />
            </div>
            <span className="font-black text-[#1E2235] text-2xl tracking-tight">{isAr ? "قياسي" : "Qiyasi"}</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm">
            <Link href="/"        className="text-slate-500 hover:text-slate-900 transition-colors font-medium">{isAr ? "الرئيسية"        : "Home"         }</Link>
            <a    href="#solution" className="text-slate-500 hover:text-slate-900 transition-colors font-medium">{isAr ? "كيف يعمل"        : "How It Works" }</a>
            <a    href="#demo"     className="text-slate-500 hover:text-slate-900 transition-colors font-medium">{isAr ? "الديمو"          : "Demo"         }</a>
            <Link href="/pricing" className="text-slate-500 hover:text-slate-900 transition-colors font-medium">{isAr ? "التسعير"         : "Pricing"      }</Link>
            <Link href="/faq"     className="text-slate-500 hover:text-slate-900 transition-colors font-medium">{isAr ? "الأسئلة الشائعة" : "FAQ"          }</Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { const next = isAr ? "en" : "ar"; localStorage.setItem("qiyasi-lang", next); setLang(next); setActiveOpt(null); setShowResult(false); setOpenFaq(null); }}
              className="text-xs font-bold text-slate-400 hover:text-slate-700 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition"
            >
              {isAr ? "EN" : "عربي"}
            </button>
            <Link href="/auth" className="hidden sm:block text-sm text-slate-500 hover:text-slate-900 font-medium px-3 py-1.5 border border-slate-200 rounded-lg transition">
              {t.nav.login}
            </Link>
            <a href="#demo" className="btn-indigo !py-2 !px-5 !text-sm">{t.nav.demo}</a>
          </div>
        </div>
      </nav>

      {/* ── 2. HERO ── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-[#F8F9FF]">
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 hero-grid pointer-events-none" />
        {/* Soft radial glow from top */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 55% at 50% -5%, rgba(79,70,229,0.09) 0%, transparent 65%)" }}
        />

        <div className="max-w-6xl mx-auto px-6 w-full py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

            {/* ── Left: Copy ── */}
            <div>
              <div className="hero-fade-1 inline-flex items-center gap-2 bg-white text-indigo-600 text-xs font-bold px-4 py-2 rounded-full mb-10 border border-indigo-100 shadow-sm">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                {t.hero.badge}
              </div>

              <h1 className="hero-fade-2 font-black tracking-tighter leading-[1.02] mb-7">
                <span className="block text-slate-900 text-6xl md:text-7xl lg:text-[84px]">{t.hero.h1a}</span>
                <span className="block text-6xl md:text-7xl lg:text-[84px]">
                  <span className="text-slate-900">{t.hero.h1b_plain}</span>
                  <span className="gradient-text">{t.hero.h1b_accent}</span>
                </span>
              </h1>

              <p className="hero-fade-3 text-slate-500 text-lg md:text-xl leading-relaxed max-w-xl mb-10"></p>

              <div className="hero-fade-4 flex flex-wrap gap-3 mb-9">
                <a href="#demo" className="btn-indigo text-base">{t.hero.cta1}</a>
                <a href="#solution" className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-xl px-8 py-3.5 font-semibold transition text-base shadow-sm">
                  {t.hero.cta2}
                </a>
              </div>
              <p className="hero-fade-4 text-slate-400 text-sm">{t.hero.trust}</p>
            </div>

            {/* ── Right: Floating Product Card ── */}
            <div className="flex justify-center lg:justify-end">
              <div className="animate-float w-full max-w-[340px] bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-[0_24px_64px_rgba(15,23,42,0.12),0_0_0_1px_rgba(15,23,42,0.03)]">

                {/* Product image */}
                <div className="relative h-60 overflow-hidden bg-[#EEF2FF]">
                  <img
                    src="/abaya.jpeg"
                    alt={isAr ? "عباية سوداء كلاسيكية" : "Classic Black Abaya"}
                    className="w-full h-full object-cover object-top"
                    onError={e => {
                      const img = e.currentTarget;
                      img.style.display = "none";
                      const parent = img.parentElement;
                      if (parent) {
                        const div = document.createElement("div");
                        div.className = "flex items-center justify-center h-full text-7xl";
                        div.textContent = "👗";
                        parent.appendChild(div);
                      }
                    }}
                  />
                  <div className="absolute top-3 left-3 bg-indigo-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full tracking-wide">
                    {isAr ? "جديد" : "NEW"}
                  </div>
                </div>

                {/* Product info */}
                <div className="p-5" dir={t.dir}>
                  <p className="text-slate-400 text-xs mb-1">{isAr ? "عبايات نسائية" : "Women's Abayas"}</p>
                  <h3 className="font-black text-slate-900 text-base mb-0.5">{isAr ? "عباية سوداء كلاسيكية" : "Classic Black Abaya"}</h3>
                  <p className="text-slate-500 text-sm font-semibold mb-5">{isAr ? "299 ر.س" : "$82.00"}</p>

                  <p className="text-xs text-slate-400 font-semibold mb-2.5">{isAr ? "المقاس:" : "Size:"}</p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {["XS", "S", "M", "L", "XL"].map(s => (
                      <button key={s} className={`w-10 h-10 rounded-xl border text-xs font-bold transition ${
                        s === "M" ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white"
                      }`}>{s}</button>
                    ))}
                  </div>

                  <button className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-3.5 rounded-xl transition shadow-sm shadow-indigo-100">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {isAr ? "احسب مقاسك" : "Find My Size"}
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section className="py-24 px-6" style={{ background: "linear-gradient(135deg, #1a0533 0%, #1e1b5e 50%, #0f0c3d 100%)" }}>
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-black text-5xl md:text-6xl tracking-tight mb-4" dir={t.dir}>
            <span style={{ color: "#f472b6" }}>{t.benefits.h2a}</span>
            <br />
            <span className="text-white">{t.benefits.h2b}</span>
          </h2>
          <p className="text-indigo-200 text-lg md:text-xl max-w-2xl mx-auto mb-16 leading-relaxed">{t.benefits.sub}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {t.benefits.cards.map((card) => (
              <div key={card.icon} className="rounded-2xl p-8 text-center" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                     style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
                  {card.icon === "returns" && (
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 15l-4 4-4-4M12 19V5M5 10l-2-2 2-2"/>
                    </svg>
                  )}
                  {card.icon === "conversion" && (
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                    </svg>
                  )}
                  {card.icon === "support" && (
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/>
                    </svg>
                  )}
                </div>
                <p className="text-white font-black text-xl">{card.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MERCHANT JOURNEY ── */}
      <section className="relative py-28 px-6 bg-white border-b border-slate-100 overflow-hidden">
        <div className="absolute inset-0 hero-grid pointer-events-none opacity-50" />
        <div className="relative max-w-6xl mx-auto">
          <p className="text-center text-indigo-600 text-xs font-bold uppercase tracking-[0.2em] mb-4">{t.journey.label}</p>
          <h2 className="text-center text-slate-900 font-black text-4xl md:text-5xl tracking-tight leading-tight mb-4 max-w-3xl mx-auto reveal">
            {t.journey.h2}
          </h2>
          <p className="text-center text-slate-400 text-lg mb-16 max-w-xl mx-auto reveal delay-100">{t.journey.sub}</p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
            {t.journey.steps.map((step, i) => (
              <div key={i} className={`relative flex flex-col items-center text-center p-5 rounded-2xl border reveal ${DELAYS[i % 4]} ${JOURNEY_BG[i]}`}>
                {i < t.journey.steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-300 font-black text-sm">→</div>
                )}
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl mb-3 border border-white">
                  {step.emoji}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${JOURNEY_TEXT[i]} opacity-70`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5 leading-snug">{step.title}</h4>
                <p className="text-slate-400 text-xs leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <p className={`text-center font-bold text-indigo-600 text-base reveal delay-300`}>{t.journey.note}</p>
        </div>
      </section>

      {/* ── MARKET STATS ── */}
      <section className="py-28 px-6 bg-[#F8F9FF] border-b border-slate-100">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-indigo-600 text-xs font-bold uppercase tracking-[0.2em] mb-4">{t.marketStats.label}</p>
          <h2 className="text-center text-slate-900 font-black text-4xl md:text-5xl tracking-tight mb-4 reveal">{t.marketStats.h2}</h2>
          <p className="text-center text-slate-400 text-lg mb-16 max-w-2xl mx-auto reveal delay-100">{t.marketStats.sub}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {t.marketStats.items.map((item, i) => (
              <div key={i} className={`text-center reveal ${DELAYS[i]}`}>
                <p className="text-indigo-600 text-5xl md:text-6xl font-black tracking-tight mb-3">
                  <CountUp to={item.to} prefix={item.prefix} suffix={item.suffix} />
                </p>
                <p className="text-slate-500 text-sm leading-relaxed">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="solution" className="py-28 px-6 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-indigo-600 text-xs font-black uppercase tracking-[0.2em] mb-4">{t.howItWorks.label}</p>
          <h2 className="text-slate-900 font-black text-4xl md:text-5xl tracking-tight mb-5 reveal">{t.howItWorks.h2}</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-20 reveal delay-100">{t.howItWorks.sub}</p>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
            <div className="hidden md:block absolute top-[72px] left-[20%] right-[20%] h-px border-t-2 border-dashed border-indigo-200 pointer-events-none" />

            {t.howItWorks.steps.map((step, i) => (
              <div key={i} className={`flex flex-col items-center text-center reveal ${["delay-100","delay-200","delay-300"][i]}`}>
                <div className="relative mb-8">
                  <div className="w-[100px] h-[100px] rounded-full bg-indigo-50 flex items-center justify-center mx-auto">
                    {step.icon === "cursor" && (
                      <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/>
                      </svg>
                    )}
                    {step.icon === "chat" && (
                      <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                      </svg>
                    )}
                    {step.icon === "target" && (
                      <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                      </svg>
                    )}
                  </div>
                  <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-indigo-700 text-white text-xs font-black flex items-center justify-center shadow-md">
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-slate-900 font-black text-xl mb-3">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── 4. PROBLEM ── */}
      <section className="py-28 px-6 bg-[#F8FAFC] border-b border-slate-100">
        <div className="max-w-6xl mx-auto">
          <p className="text-indigo-600 text-xs font-bold uppercase tracking-[0.2em] mb-4">{t.problem.label}</p>
          <h2 className="text-slate-900 font-black text-4xl md:text-5xl tracking-tight leading-tight mb-16 max-w-2xl">{t.problem.h2}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.problem.cards.map((card, i) => {
              const icons = [
                <svg key="r" className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z"/></svg>,
                <svg key="e" className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>,
                <svg key="s" className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
              ];
              return (
                <div key={i} className={`card-lift p-8 shadow-[0_4px_20px_rgba(15,23,42,0.05)] reveal ${DELAYS[i]}`}>
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center mb-6">{icons[i]}</div>
                  <h3 className="text-slate-900 font-bold text-lg mb-3">{card.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 4b. FRICTION / SOCIAL PROOF ── */}
      <section className="relative overflow-hidden">
        {/* Abstract fashion background — CSS only, no images, no faces */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              repeating-linear-gradient(
                135deg,
                transparent,
                transparent 4px,
                rgba(255,255,255,0.025) 4px,
                rgba(255,255,255,0.025) 8px
              ),
              linear-gradient(
                125deg,
                #C26B3A 0%,
                #CF8A5A 14%,
                #B8668A 30%,
                #8A6BAD 46%,
                #4A87B0 62%,
                #2A8A8E 78%,
                #1A5E72 100%
              )
            `,
          }}
        />
        {/* Gradient overlay for readability */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(10,10,20,0.32) 0%, rgba(10,10,20,0.52) 100%)" }}
        />
        {/* Subtle colour accent blobs */}
        <div
          className="absolute top-0 left-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,180,80,0.18) 0%, transparent 70%)", filter: "blur(60px)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(60,180,210,0.18) 0%, transparent 70%)", filter: "blur(60px)" }}
        />

        <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32">
          {/* Headline */}
          <h2 className="text-white font-black text-4xl md:text-5xl lg:text-[56px] leading-tight tracking-tight text-center mb-16 max-w-4xl mx-auto reveal">
            {t.friction.headline}
          </h2>

          {/* Quote cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 reveal delay-200">
            {/* Card 1 */}
            <div
              className="relative p-8 rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.10)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              <span
                className={`absolute top-3 font-black select-none pointer-events-none text-white/10 ${isAr ? "right-5" : "left-5"}`}
                style={{ fontSize: "96px", lineHeight: 1 }}
                aria-hidden="true"
              >
                "
              </span>
              <p className="relative text-white text-xl md:text-2xl font-light leading-relaxed tracking-wide pt-6">
                {t.friction.q1}
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/20" />
                <p className="text-white/45 text-xs font-semibold uppercase tracking-[0.18em] flex-shrink-0">
                  {t.friction.source1}
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div
              className="relative p-8 rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.10)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              <span
                className={`absolute top-3 font-black select-none pointer-events-none text-white/10 ${isAr ? "right-5" : "left-5"}`}
                style={{ fontSize: "96px", lineHeight: 1 }}
                aria-hidden="true"
              >
                "
              </span>
              <p className="relative text-white text-xl md:text-2xl font-light leading-relaxed tracking-wide pt-6">
                {t.friction.q2}
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/20" />
                <p className="text-white/45 text-xs font-semibold uppercase tracking-[0.18em] flex-shrink-0">
                  {t.friction.source2}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ── 5. SOLUTION ── */}
      <section className="py-28 px-6 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto">
          <p className="text-indigo-600 text-xs font-bold uppercase tracking-[0.2em] mb-4">{t.solution.label}</p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
            <h2 className="text-slate-900 font-black text-4xl md:text-5xl tracking-tight leading-tight max-w-xl">{t.solution.h2}</h2>
            <p className="text-slate-500 text-lg max-w-xs leading-relaxed">{t.solution.sub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {t.solution.cards.map((card, i) => {
              const bgs   = ["bg-indigo-50", "bg-blue-50", "bg-sky-50", "bg-violet-50"];
              const texts = ["text-indigo-600", "text-blue-600", "text-sky-600", "text-violet-600"];
              const icons = [
                <svg key="a" className={`w-5 h-5 ${texts[i]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
                <svg key="b" className={`w-5 h-5 ${texts[i]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>,
                <svg key="c" className={`w-5 h-5 ${texts[i]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>,
                <svg key="d" className={`w-5 h-5 ${texts[i]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/></svg>,
              ];
              return (
                <div key={i} className={`card-lift p-8 shadow-[0_4px_20px_rgba(15,23,42,0.05)] reveal ${DELAYS[i]}`}>
                  <div className={`w-11 h-11 rounded-xl ${bgs[i]} flex items-center justify-center mb-6`}>{icons[i]}</div>
                  <h3 className="text-slate-900 font-bold text-lg mb-3">{card.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>


      {/* ── ADVANCED FEATURE ── */}
      <section className="py-28 px-6 bg-[#F9FAFB] border-b border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${isAr ? "lg:grid-flow-col-dense" : ""}`}>

            {/* Left: Content */}
            <div className={`reveal ${isAr ? "lg:col-start-2" : ""}`}>
              <span className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-black px-4 py-2 rounded-full border border-indigo-100 mb-8">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {t.advanced.badge}
              </span>

              <h2 className="text-slate-900 font-black text-4xl md:text-5xl tracking-tight leading-tight mb-12">
                {t.advanced.h2}
              </h2>

              <div className="space-y-8">
                {/* Feature 1 */}
                <div className={`flex gap-4 ${isAr ? "flex-row-reverse text-right" : ""}`}>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-bold text-lg mb-2">{t.advanced.f1title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{t.advanced.f1desc}</p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className={`flex gap-4 ${isAr ? "flex-row-reverse text-right" : ""}`}>
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-bold text-lg mb-2">{t.advanced.f2title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{t.advanced.f2desc}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Animated Widget Mockup */}
            <div className={`flex justify-center reveal delay-200 ${isAr ? "lg:col-start-1" : ""}`}>
              <div className="w-full max-w-[340px] bg-white rounded-3xl shadow-[0_8px_48px_rgba(109,40,217,0.12)] border border-violet-100 overflow-hidden" dir={t.dir}>

                {/* Product name header */}
                <div className="px-6 pt-5 pb-4 border-b border-slate-100">
                  <h3 className="text-slate-900 font-black text-base leading-snug text-center">{t.advanced.wTitle}</h3>
                </div>

                {/* Animated result card */}
                <div className="px-5 py-5 w-card">

                  {/* Size block */}
                  <div className="rounded-2xl flex flex-col items-center justify-center py-9 mb-4"
                       style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
                    <span className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-3">
                      {t.advanced.wResultLabel}
                    </span>
                    <span className="text-white font-black leading-none"
                          style={{ fontSize: "88px", letterSpacing: "-0.02em" }}>
                      {isAr ? "م" : "M"}
                    </span>
                  </div>

                  {/* Info rows */}
                  <div className="border border-slate-100 rounded-xl overflow-hidden mb-4">
                    <div className={`flex items-center justify-between px-4 py-3 border-b border-slate-100 ${isAr ? "flex-row-reverse" : ""}`}>
                      <span className="text-slate-400 text-xs font-medium">{t.advanced.wConfLabel}</span>
                      <span className="text-indigo-600 font-black text-sm">95%</span>
                    </div>
                    <div className={`flex items-center justify-between px-4 py-3 ${isAr ? "flex-row-reverse" : ""}`}>
                      <span className="text-slate-400 text-xs font-medium">{t.advanced.wPatLabel}</span>
                      <span className="text-slate-700 font-bold text-sm">{t.advanced.wPatVal}</span>
                    </div>
                  </div>

                  {/* Add to cart */}
                  <button className="w-full py-3.5 rounded-xl font-black text-white text-sm bg-slate-900">
                    {t.advanced.wAddBtn}
                  </button>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── ROI CALCULATOR ── */}
      <section id="roi" className="py-28 px-6 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-indigo-600 text-xs font-bold uppercase tracking-[0.2em] mb-4">{t.roi.label}</p>
          <h2 className="text-center text-slate-900 font-black text-4xl md:text-5xl tracking-tight mb-4 reveal">{t.roi.h2}</h2>
          <p className="text-center text-slate-400 text-lg mb-14 max-w-2xl mx-auto reveal delay-100">{t.roi.sub}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 reveal delay-200">

            {/* Inputs */}
            <div className="bg-[#F8F9FF] border border-slate-200 rounded-2xl p-8">
              <h3 className="font-bold text-slate-900 text-base mb-7">{isAr ? "أدخل بيانات متجرك" : "Your Store Data"}</h3>
              <div className="space-y-7">
                {([
                  { key: "products"   as const, label: t.roi.productsLabel,   min: 10,  max: 5000, step: 10,  fmt: (v: number) => v.toString() },
                  { key: "price"      as const, label: t.roi.priceLabel,      min: 10,  max: 2000, step: 10,  fmt: (v: number) => `$${v}` },
                  { key: "returnRate" as const, label: t.roi.returnRateLabel, min: 1,   max: 60,   step: 1,   fmt: (v: number) => `${v}%` },
                ]).map(f => (
                  <div key={f.key}>
                    <div className={`flex justify-between items-center mb-3 ${isAr ? "flex-row-reverse" : ""}`}>
                      <label className="text-sm font-semibold text-slate-700">{f.label}</label>
                      <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{f.fmt(calcInputs[f.key])}</span>
                    </div>
                    <input
                      type="range" min={f.min} max={f.max} step={f.step}
                      value={calcInputs[f.key]}
                      onChange={e => setCalcInputs(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
                      className="w-full accent-indigo-600 h-2 rounded-full"
                    />
                    <div className={`flex justify-between text-xs text-slate-300 mt-1 ${isAr ? "flex-row-reverse" : ""}`}>
                      <span>{f.fmt(f.min)}</span><span>{f.fmt(f.max)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Results */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col" dir={t.dir}>
              <h3 className="font-bold text-slate-900 text-base mb-7">{isAr ? "تحليل التكاليف" : "Cost Analysis"}</h3>
              <div className="space-y-1 flex-1">
                {[
                  { label: t.roi.results.revenue,     val: `$${roiRevenue.toLocaleString()}`,                muted: true },
                  { label: t.roi.results.returns,     val: `${roiReturns} ${isAr ? "منتج" : "items"}`,       muted: true },
                  { label: t.roi.results.sizeReturns, val: `${roiSizeReturns} ${isAr ? "منتج" : "items"}`,   muted: true },
                  { label: t.roi.results.monthlyLoss, val: `$${roiMonthlyLoss.toLocaleString()}`,             muted: false },
                ].map((row, i) => (
                  <div key={i} className={`flex items-center justify-between py-3 border-b border-slate-50 ${isAr ? "flex-row-reverse" : ""}`}>
                    <span className={`text-sm ${row.muted ? "text-slate-400" : "text-slate-700 font-semibold"}`}>{row.label}</span>
                    <span className={`text-sm font-bold ${row.muted ? "text-slate-400" : "text-slate-900"}`}>{row.val}</span>
                  </div>
                ))}
                {/* Yearly loss - highlighted red */}
                <div className={`flex items-center justify-between py-3 bg-red-50 -mx-3 px-3 rounded-xl mt-2 ${isAr ? "flex-row-reverse" : ""}`}>
                  <span className="text-sm font-bold text-red-700">{t.roi.results.yearlyLoss}</span>
                  <span className="text-lg font-black text-red-600">${roiYearlyLoss.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-6 h-px bg-slate-100" />

              {/* Qiyasi cost */}
              <div className={`flex items-center justify-between py-3 ${isAr ? "flex-row-reverse" : ""}`}>
                <span className="text-sm text-slate-500">{t.roi.results.qiyasiCost}</span>
                <span className="text-sm font-black text-indigo-600">$120</span>
              </div>

              {/* Savings highlight */}
              <div className="bg-indigo-600 rounded-2xl p-5 text-center mt-2">
                <p className="text-indigo-200 text-xs font-semibold mb-1">{t.roi.results.savings}</p>
                <p className="text-white text-3xl font-black">${Math.max(0, roiYearlyLoss - 120).toLocaleString()}</p>
              </div>

              <a href="#demo" className="btn-indigo block text-center py-3.5 rounded-xl text-sm mt-4">{t.roi.cta}</a>
              <p className="text-center text-slate-400 text-xs mt-3">{t.roi.note}</p>
            </div>

          </div>
        </div>
      </section>


      {/* ── 14-DAY FREE TRIAL ── */}
      <section className="py-28 px-6 bg-[#EEF2FF] border-b border-indigo-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-indigo-500 text-xs font-bold uppercase tracking-[0.2em] mb-4">{t.trial.label}</p>
          <h2 className="text-slate-900 font-black text-4xl md:text-5xl tracking-tight mb-4 reveal">{t.trial.h2}</h2>
          <p className="text-slate-500 text-xl mb-12 reveal delay-100">{t.trial.sub}</p>
          <div className={`flex flex-col sm:flex-row flex-wrap justify-center gap-4 mb-12 reveal delay-200 ${isAr ? "sm:flex-row-reverse" : ""}`}>
            {t.trial.features.map((f, i) => (
              <div key={i} className={`flex items-center gap-2.5 text-slate-700 text-sm font-medium ${isAr ? "flex-row-reverse" : ""}`}>
                <CheckIcon className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
          <a href="#demo" className="btn-indigo text-base px-12 py-4 reveal delay-300">{t.trial.cta}</a>
          <p className="text-slate-400 text-sm mt-5 reveal delay-400">{t.trial.note}</p>
        </div>
      </section>

      {/* ── THE ONLY REAL RISK ── */}
      <section className="py-32 px-6 bg-slate-900 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-white font-black text-4xl md:text-5xl lg:text-6xl tracking-tighter leading-tight mb-6 reveal">
            {t.risk.h2}
          </h2>
          <p className="text-slate-400 text-xl leading-relaxed mb-12 max-w-2xl mx-auto reveal delay-100">{t.risk.sub}</p>
          <a href="#demo" className="btn-indigo text-base px-12 py-4 reveal delay-200">{t.risk.cta}</a>
        </div>
      </section>


      {/* ── 11. DEMO FORM ── */}
      <section id="demo" className="py-28 px-6 bg-[#F8FAFC] border-b border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-indigo-600 text-xs font-bold uppercase tracking-[0.2em] mb-4">{t.demo.label}</p>
              <h2 className="text-slate-900 font-black text-4xl md:text-5xl tracking-tight leading-tight mb-6">{t.demo.h2}</h2>
              <p className="text-slate-500 text-lg leading-relaxed mb-10">{t.demo.sub}</p>
              <div className="space-y-4">
                {t.demo.trust.map((item, i) => (
                  <div key={i} className={`flex items-center gap-3 text-slate-600 text-sm ${isAr ? "flex-row-reverse" : ""}`}>
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
              {formStatus === "success" ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">{isAr ? "تم إرسال طلبك!" : "Request Sent!"}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{t.demo.success}</p>
                </div>
              ) : (
                <form onSubmit={handleDemoSubmit} className="space-y-5" dir={t.dir}>
                  {[
                    { key: "name"     as const, label: t.demo.name,     placeholder: t.demo.namePlaceholder,     type: "text",  required: true },
                    { key: "email"    as const, label: t.demo.email,    placeholder: t.demo.emailPlaceholder,    type: "email", required: true },
                    { key: "storeUrl" as const, label: t.demo.storeUrl, placeholder: t.demo.storeUrlPlaceholder, type: "url",   required: true },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">{f.label}</label>
                      <input
                        type={f.type}
                        required={f.required}
                        value={form[f.key]}
                        onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white transition"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.demo.message}</label>
                    <textarea
                      rows={3}
                      value={form.message}
                      onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder={t.demo.messagePlaceholder}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white transition resize-none"
                    />
                  </div>
                  {formStatus === "error" && <p className="text-red-500 text-xs">{t.demo.error}</p>}
                  <button type="submit" disabled={formStatus === "loading"} className="w-full btn-indigo py-3.5 rounded-xl text-sm disabled:opacity-50">
                    {formStatus === "loading" ? (isAr ? "جارٍ الإرسال..." : "Sending...") : t.demo.cta}
                  </button>
                  <p className="text-center text-xs text-slate-400">{t.demo.note}</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 12. FINAL CTA ── */}
      <section className="py-36 px-6 bg-[#EEF2FF] text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-black text-5xl md:text-6xl tracking-tighter leading-tight mb-6 reveal">
            <span className="text-slate-900">{t.cta.h2a} </span>
            <span className="gradient-text">{t.cta.h2b}</span>
          </h2>
          <p className="text-slate-500 text-xl leading-relaxed mb-12 max-w-xl mx-auto reveal delay-100">{t.cta.sub}</p>
          <a href="#demo" className="btn-indigo text-lg px-12 py-4 reveal delay-200">{t.cta.btn}</a>
          <div className={`flex flex-wrap justify-center gap-8 mt-12 text-slate-400 text-sm reveal delay-300 ${isAr ? "flex-row-reverse" : ""}`}>
            {t.cta.trust.map((s, i) => <span key={i}>✓ {s}</span>)}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
              <Image src="/logo2.jpeg" alt="Qiyasi" width={36} height={36} className="w-full h-full object-contain" />
            </div>
            <span className="font-black text-[#1E2235] text-lg">{isAr ? "قياسي" : "Qiyasi"}</span>
            <span className="text-slate-400 text-sm">— {t.footer.tagline}</span>
          </div>
          <div className={`flex flex-wrap justify-center gap-6 text-sm text-slate-500 ${isAr ? "flex-row-reverse" : ""}`}>
            {t.footer.links.map(l => (
              <a key={l.href} href={l.href} className="hover:text-slate-900 transition-colors">{l.label}</a>
            ))}
          </div>
          <div className="flex gap-4 text-xs text-slate-400">
            <Link href="/terms"   className="hover:text-slate-700 transition-colors">{isAr ? "شروط الخدمة" : "Terms"}</Link>
            <Link href="/privacy" className="hover:text-slate-700 transition-colors">{isAr ? "الخصوصية"    : "Privacy"}</Link>
            <Link href="/refund"  className="hover:text-slate-700 transition-colors">{isAr ? "الاسترداد"   : "Refund"}</Link>
          </div>
        </div>
        <p className="text-center text-slate-300 text-xs pb-6">{t.footer.copy}</p>
      </footer>

    </div>
  );
}
