/*
 * Paper Bros — store data
 * ------------------------------------------------------------------
 * This file holds every product, price and setting the public site shows.
 * Edit it from the admin page (admin.html), then use "Download data.js"
 * and replace this file in your website folder / GitHub repository.
 */
window.PB_CATEGORIES = {
  english: "English",
  sciences: "Sciences",
  maths: "Mathematics",
  commerce: "Commerce",
  cs: "Computer Science"
};

window.PB_TYPES = {
  topical: "Topical Past Papers",
  model: "Model Papers",
  notes: "Revision Notes",
  formulas: "Formula Sheet"
};

window.PB_DEFAULT_DATA = {
  "version": 1,
  "settings": {
    "brand": "Paper Bros",
    "orderEmail": "paperbrosofficial@gmail.com",
    "web3formsKey": "b7478cd7-5aee-46b7-9f23-93a62541073a",
    "hotline": "+880 1870479004",
    "whatsapp": "8801870479004",
    "instagram": "",
    "facebook": "",
    "location": "Dhaka, Bangladesh",
    "announcement": "Cash on Delivery all over Bangladesh  ·  Free shipping on orders over 2,500 BDT",
    "freeShippingThreshold": 2500,
    "deliveryInsideDhaka": 80,
    "deliveryOutsideDhaka": 150,
    "deliveryTime": "2–3 business days",
    "payment": { "cod": true, "bkashWhatsapp": true, "bkash": "", "nagad": "" },
    "adminPassHash": "e36f2edd7280ff872557cdcd0a6d8abff040ba047832f41c101f8bc4c70e7907"
  },
  "subjects": [
    { "id": "eng",   "name": "English Language",       "code": "1123", "category": "english",  "color": "#b45309" },
    { "id": "bio",   "name": "Biology",                "code": "5090", "category": "sciences", "color": "#15803d" },
    { "id": "phy",   "name": "Physics",                "code": "5054", "category": "sciences", "color": "#1d4ed8" },
    { "id": "chem",  "name": "Chemistry",              "code": "5070", "category": "sciences", "color": "#7c3aed" },
    { "id": "mathd", "name": "Mathematics D",          "code": "4024", "category": "maths",    "color": "#0f766e" },
    { "id": "addm",  "name": "Additional Mathematics", "code": "4037", "category": "maths",    "color": "#be123c" },
    { "id": "bus",   "name": "Business Studies",       "code": "7115", "category": "commerce", "color": "#c2410c" },
    { "id": "acc",   "name": "Accounting",             "code": "7707", "category": "commerce", "color": "#0369a1" },
    { "id": "eco",   "name": "Economics",              "code": "2281", "category": "commerce", "color": "#a16207" },
    { "id": "cs",    "name": "Computer Science",       "code": "2210", "category": "cs",       "color": "#334155" }
  ],
  "products": [
    { "id": "eng-mp1",   "image": "assets/covers/eng-mp1.jpg", "subject": "eng",   "type": "model",    "title": "English Model Paper 1", "paper": "Paper 1", "price": 2099, "oldPrice": 0, "badge": "",            "inStock": true, "desc": "Practice workbook: 20 Paper 1 (Reading) question papers in the Cambridge 1123 format, 2 hours each." },
    { "id": "eng-mp2",   "image": "assets/covers/eng-mp2.jpg", "subject": "eng",   "type": "model",    "title": "English Model Paper 2", "paper": "Paper 2", "price": 2099, "oldPrice": 0, "badge": "",            "inStock": true, "desc": "Practice workbook: 20 Paper 2 (Writing) question papers in the Cambridge 1123 format, 2 hours each." },
    { "id": "bio-p1",    "image": "assets/covers/bio-p1.jpg", "subject": "bio",   "type": "topical",  "title": "Biology P1",            "paper": "Paper 1", "price": 999,  "oldPrice": 0, "badge": "Bestseller",  "inStock": true, "desc": "Every Paper 1 MCQ from 2016–2026, sorted chapter by chapter with answers." },
    { "id": "bio-p2",    "image": "assets/covers/bio-p2.jpg", "subject": "bio",   "type": "topical",  "title": "Biology P2",            "paper": "Paper 2", "price": 1249, "oldPrice": 0, "badge": "",            "inStock": true, "desc": "Theory questions from 2016–2026 grouped by topic, with solutions." },
    { "id": "bio-notes", "image": "assets/covers/bio-notes.jpg", "subject": "bio",   "type": "notes",    "title": "Biology Notes",         "paper": "",        "price": 699,  "oldPrice": 0, "badge": "",            "inStock": true, "desc": "Concise, syllabus-aligned revision notes for the full Biology course." },
    { "id": "phy-p1",    "image": "assets/covers/phy-p1.jpg", "subject": "phy",   "type": "topical",  "title": "Physics P1",            "paper": "Paper 1", "price": 999,  "oldPrice": 0, "badge": "",            "inStock": true, "desc": "Every Paper 1 MCQ from 2016–2026, sorted chapter by chapter with answers." },
    { "id": "phy-p2",    "image": "assets/covers/phy-p2.jpg", "subject": "phy",   "type": "topical",  "title": "Physics P2",            "paper": "Paper 2", "price": 1249, "oldPrice": 0, "badge": "Bestseller",  "inStock": true, "desc": "Theory questions from 2016–2026 grouped by topic, with solutions." },
    { "id": "phy-notes", "image": "assets/covers/phy-notes.jpg", "subject": "phy",   "type": "notes",    "title": "Physics Notes",         "paper": "",        "price": 699,  "oldPrice": 0, "badge": "",            "inStock": true, "desc": "Concise, syllabus-aligned revision notes for the full Physics course." },
    { "id": "chem-p1",   "image": "assets/covers/chem-p1.jpg", "subject": "chem",  "type": "topical",  "title": "Chemistry P1",          "paper": "Paper 1", "price": 999,  "oldPrice": 0, "badge": "",            "inStock": true, "desc": "Every Paper 1 MCQ from 2016–2026, sorted chapter by chapter with answers." },
    { "id": "chem-p2",   "image": "assets/covers/chem-p2.jpg", "subject": "chem",  "type": "topical",  "title": "Chemistry P2",          "paper": "Paper 2", "price": 1249, "oldPrice": 0, "badge": "",            "inStock": true, "desc": "Theory questions from 2016–2026 grouped by topic, with solutions." },
    { "id": "chem-notes","image": "assets/covers/chem-notes.jpg", "subject": "chem",  "type": "notes",    "title": "Chemistry Notes",       "paper": "",        "price": 699,  "oldPrice": 0, "badge": "",            "inStock": true, "desc": "Concise, syllabus-aligned revision notes for the full Chemistry course." },
    { "id": "mathd-p1",  "image": "assets/covers/mathd-p1.jpg", "subject": "mathd", "type": "topical",  "title": "Maths D P1",            "paper": "Paper 1", "price": 1299, "oldPrice": 0, "badge": "",            "inStock": true, "desc": "Paper 1 questions from 2016–2026 sorted by topic, with worked solutions." },
    { "id": "mathd-p2",  "image": "assets/covers/mathd-p2.jpg", "subject": "mathd", "type": "topical",  "title": "Maths D P2",            "paper": "Paper 2", "price": 1299, "oldPrice": 0, "badge": "Bestseller",  "inStock": true, "desc": "Paper 2 questions from 2016–2026 sorted by topic, with worked solutions." },
    { "id": "mathd-f",   "image": "assets/covers/mathd-f.jpg", "subject": "mathd", "type": "formulas", "title": "Maths D Formulas",      "paper": "",        "price": 109,  "oldPrice": 0, "badge": "",            "inStock": true, "desc": "Every formula you need for Maths D on one quick-reference sheet." },
    { "id": "addm-p1",   "image": "assets/covers/addm-p1.jpg", "subject": "addm",  "type": "topical",  "title": "Add Maths P1",          "paper": "Paper 1", "price": 1349, "oldPrice": 0, "badge": "",            "inStock": true, "desc": "Paper 1 questions from 2016–2026 sorted by topic, with worked solutions." },
    { "id": "addm-p2",   "image": "assets/covers/addm-p2.jpg", "subject": "addm",  "type": "topical",  "title": "Add Maths P2",          "paper": "Paper 2", "price": 1349, "oldPrice": 0, "badge": "",            "inStock": true, "desc": "Paper 2 questions from 2016–2026 sorted by topic, with worked solutions." },
    { "id": "addm-f",    "image": "assets/covers/addm-f.jpg", "subject": "addm",  "type": "formulas", "title": "Add Maths Formulas",    "paper": "",        "price": 109,  "oldPrice": 0, "badge": "",            "inStock": true, "desc": "Every formula you need for Additional Maths on one quick-reference sheet." },
    { "id": "bus-p1",    "image": "assets/covers/bus-p1.jpg", "subject": "bus",   "type": "topical",  "title": "Business P1",           "paper": "Paper 1", "price": 1199, "oldPrice": 0, "badge": "",            "inStock": true, "desc": "Paper 1 questions from 2016–2026 grouped by topic, with model answers." },
    { "id": "bus-p2",    "image": "assets/covers/bus-p2.jpg", "subject": "bus",   "type": "topical",  "title": "Business P2",           "paper": "Paper 2", "price": 1199, "oldPrice": 0, "badge": "",            "inStock": true, "desc": "Paper 2 case-study questions from 2016–2026, with model answers." },
    { "id": "bus-notes", "image": "assets/covers/bus-notes.jpg", "subject": "bus",   "type": "notes",    "title": "Business Notes",        "paper": "",        "price": 699,  "oldPrice": 0, "badge": "",            "inStock": true, "desc": "Concise, syllabus-aligned revision notes for Business Studies." },
    { "id": "acc-p1",    "image": "assets/covers/acc-p1.jpg", "subject": "acc",   "type": "topical",  "title": "Accounting P1",         "paper": "Paper 1", "price": 1199, "oldPrice": 0, "badge": "",            "inStock": true, "desc": "Paper 1 MCQs from 2016–2026 sorted by topic, with answers." },
    { "id": "acc-p2",    "image": "assets/covers/acc-p2.jpg", "subject": "acc",   "type": "topical",  "title": "Accounting P2",         "paper": "Paper 2", "price": 1199, "oldPrice": 0, "badge": "",            "inStock": true, "desc": "Paper 2 structured questions from 2016–2026, with worked solutions." },
    { "id": "acc-notes", "image": "assets/covers/acc-notes.jpg", "subject": "acc",   "type": "notes",    "title": "Accounting Notes",      "paper": "",        "price": 699,  "oldPrice": 0, "badge": "",            "inStock": true, "desc": "Concise, syllabus-aligned revision notes for Accounting." },
    { "id": "eco-p1",    "image": "assets/covers/eco-p1.jpg", "subject": "eco",   "type": "topical",  "title": "Economics P1",          "paper": "Paper 1", "price": 1199, "oldPrice": 0, "badge": "",            "inStock": true, "desc": "Paper 1 MCQs from 2016–2026 sorted by topic, with answers." },
    { "id": "eco-p2",    "image": "assets/covers/eco-p2.jpg", "subject": "eco",   "type": "topical",  "title": "Economics P2",          "paper": "Paper 2", "price": 1199, "oldPrice": 0, "badge": "",            "inStock": true, "desc": "Paper 2 structured questions from 2016–2026, with model answers." },
    { "id": "eco-notes", "image": "assets/covers/eco-notes.jpg", "subject": "eco",   "type": "notes",    "title": "Economics Notes",       "paper": "",        "price": 799,  "oldPrice": 0, "badge": "",            "inStock": true, "desc": "Concise, syllabus-aligned revision notes for Economics." },
    { "id": "cs-p1",     "image": "assets/covers/cs-p1.jpg", "subject": "cs",    "type": "topical",  "title": "Comp Sci P1",           "paper": "Paper 1", "price": 1099, "oldPrice": 0, "badge": "",            "inStock": true, "desc": "Paper 1 theory questions from 2016–2026 sorted by topic, with answers." },
    { "id": "cs-p2",     "image": "assets/covers/cs-p2.jpg", "subject": "cs",    "type": "topical",  "title": "Comp Sci P2",           "paper": "Paper 2", "price": 1299, "oldPrice": 0, "badge": "",            "inStock": true, "desc": "Paper 2 problem-solving and programming questions, 2016–2026, with solutions." },
    { "id": "cs-notes",  "image": "assets/covers/cs-notes.jpg", "subject": "cs",    "type": "notes",    "title": "Comp Sci Notes",        "paper": "",        "price": 699,  "oldPrice": 0, "badge": "",            "inStock": true, "desc": "Concise, syllabus-aligned revision notes for Computer Science 2210." }
  ]
};
