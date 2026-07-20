import { TrendingUp } from "lucide-react";

export const CURRENCIES = [
  { code: "USD", symbol: "$", flag: "🇺🇸", rate: 1 },
  { code: "CAD", symbol: "C$", flag: "🇨🇦", rate: 1.35 },
  { code: "EUR", symbol: "€", flag: "🇪🇺", rate: 0.92 },
  { code: "GBP", symbol: "£", flag: "🇬🇧", rate: 0.79 },
  { code: "CNY", symbol: "¥", flag: "🇨🇳", rate: 7.2 },
  { code: "UGX", symbol: "USh", flag: "🇺🇬", rate: 3800 },
  { code: "KES", symbol: "KSh", flag: "🇰🇪", rate: 130 },
  { code: "RWF", symbol: "FRw", flag: "🇷🇼", rate: 1280 },
  { code: "CDF", symbol: "FC", flag: "🇨🇩", rate: 2750 },
  { code: "BIF", symbol: "FBu", flag: "🇧🇮", rate: 2850 },
  { code: "NGN", symbol: "₦", flag: "🇳🇬", rate: 1500 },
  { code: "TZS", symbol: "TSh", flag: "🇹🇿", rate: 2550 },
  { code: "ZAR", symbol: "R", flag: "🇿🇦", rate: 19 },
  { code: "GHS", symbol: "GH₵", flag: "🇬🇭", rate: 13 },
  { code: "ETB", symbol: "Br", flag: "🇪🇹", rate: 56 },
  { code: "XOF", symbol: "CFA", flag: "🇸🇳", rate: 600 },
  { code: "XAF", symbol: "FCFA", flag: "🇨🇲", rate: 600 },
  { code: "EGP", symbol: "E£", flag: "🇪🇬", rate: 48 },
  { code: "MAD", symbol: "DH", flag: "🇲🇦", rate: 10 },
  { code: "DZD", symbol: "DA", flag: "🇩🇿", rate: 135 },
  { code: "TND", symbol: "DT", flag: "🇹🇳", rate: 3.1 },
  { code: "LYD", symbol: "LD", flag: "🇱🇾", rate: 4.8 },
  { code: "ZMW", symbol: "ZK", flag: "🇿🇲", rate: 27 },
  { code: "AOA", symbol: "Kz", flag: "🇦🇴", rate: 830 },
  { code: "MZN", symbol: "MT", flag: "🇲🇿", rate: 64 },
  { code: "MWK", symbol: "MK", flag: "🇲🇼", rate: 1730 },
  { code: "MUR", symbol: "₨", flag: "🇲🇺", rate: 46 },
  { code: "NAD", symbol: "N$", flag: "🇳🇦", rate: 19 },
  { code: "MGA", symbol: "Ar", flag: "🇲🇬", rate: 4500 },
  { code: "GMD", symbol: "D", flag: "🇬🇲", rate: 67 },
  { code: "GNF", symbol: "FG", flag: "🇬🇳", rate: 8600 },
  { code: "SLL", symbol: "Le", flag: "🇸🇱", rate: 22000 },
  { code: "LRD", symbol: "L$", flag: "🇱🇷", rate: 194 },
  { code: "DJF", symbol: "Fdj", flag: "🇩🇯", rate: 178 },
  { code: "ERN", symbol: "Nfk", flag: "🇪🇷", rate: 15 },
  { code: "SDG", symbol: "SDG", flag: "🇸🇩", rate: 450 },
  { code: "SOS", symbol: "Sh", flag: "🇸🇴", rate: 571 },
  { code: "KMF", symbol: "CF", flag: "🇰🇲", rate: 453 },
  { code: "CVE", symbol: "Esc", flag: "🇨🇻", rate: 101 },
  { code: "STN", symbol: "Db", flag: "🇸🇹", rate: 22.5 },
  { code: "LSL", symbol: "L", flag: "🇱🇸", rate: 19 },
  { code: "SZL", symbol: "L", flag: "🇸🇿", rate: 19 },
];

export const CATEGORY_METADATA = [
  { 
    id: "fashion", label: "👕 Fashion & Apparel", hasPrice: true, hasCondition: true, hasColor: true,
    subs: ["Men's clothing", "Women's clothing", "Kids & baby wear", "Shoes & footwear", "Bags & accessories", "Watches & jewelry"] 
  },
  { 
    id: "electronics", label: "📱 Electronics & Music", hasPrice: true, hasCondition: true, hasColor: true,
    subs: ["Smartphones & tablets", "Laptops & computers", "Musical Instruments", "Accessories", "TVs & home entertainment", "Gaming", "Smart home devices"] 
  },
  { 
    id: "home", label: "🏠 Home & Living", hasPrice: true, hasCondition: true, hasColor: true,
    subs: ["Furniture", "Home décor", "Kitchen appliances", "Bedding & mattresses", "Lighting"] 
  },
  { 
    id: "groceries", label: "🍽️ Groceries & Food", hasPrice: true, hasCondition: false, hasColor: false,
    subs: ["Fresh food", "Packaged foods", "Beverages", "Baby food"] 
  },
  { 
    id: "beauty", label: "💄 Beauty & Personal Care", hasPrice: true, hasCondition: false, hasColor: true,
    subs: ["Skincare", "Haircare", "Cosmetics", "Perfumes", "Grooming kits"] 
  },
  { 
    id: "sports", label: "🏋️ Sports & Fitness", hasPrice: true, hasCondition: true, hasColor: true,
    subs: ["Gym equipment", "Sports gear", "Outdoor equipment"] 
  },
  { 
    id: "automotive", label: "🚗 Automotive", hasPrice: true, hasCondition: true, hasColor: true,
    subs: ["Car parts", "Motorbike parts", "Accessories (tyres, oils)"] 
  },
  { 
    id: "kids", label: "🧸 Toys, Kids & Baby", hasPrice: true, hasCondition: true, hasColor: true,
    subs: ["Toys & games", "Baby gear", "School supplies"] 
  },
  { 
    id: "pets", label: "🐶 Pets", hasPrice: true, hasCondition: false, hasColor: false,
    subs: ["Pet food", "Pet accessories", "Pet care"] 
  },
  { 
    id: "office", label: "🏢 Office & Business Supplies", hasPrice: true, hasCondition: true, hasColor: false,
    subs: ["Stationery", "Office furniture", "Printers & accessories"] 
  },
  { 
    id: "tools", label: "🔧 Tools & Industrial", hasPrice: true, hasCondition: true, hasColor: true,
    subs: ["Construction tools", "Electrical tools", "Safety equipment"] 
  },
  { 
    id: "digital", label: "💻 Digital Products", hasPrice: true, hasCondition: false, hasColor: false,
    subs: ["Software & licenses", "E-books", "Online courses", "Subscriptions", "Digital designs/templates"] 
  },
  { 
    id: "services", label: "🛠️ Services", hasPrice: false, hasCondition: false, hasColor: false,
    subs: [
      "🔌 Installation (CCTV, Solar, WiFi)", 
      "🧹 Cleaning (Home, Office)", 
      "🔧 Repair & Maintenance", 
      "🏗️ Construction & Technical", 
      "🚚 Logistics & Moving", 
      "📷 Professional (Photo, Design)", 
      "🧑‍🏫 Personal (Tutoring, Fitness)"
    ] 
  }
];

export const CATEGORIES = CATEGORY_METADATA.map(c => c.label);

export const CONDITIONS = ["Brand New", "Used - Like New", "Used - Good", "Used - Fair", "Refurbished"];

export const COMMON_COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Red", hex: "#EF4444" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Green", hex: "#10B981" },
  { name: "Yellow", hex: "#F59E0B" },
  { name: "Gray", hex: "#6B7280" },
  { name: "Silver", hex: "#C0C0C0" },
  { name: "Gold", hex: "#D4AF37" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Purple", hex: "#8B5CF6" },
  { name: "Orange", hex: "#F97316" },
];

export const ALL_COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman",
  "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar",
  "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe"
];