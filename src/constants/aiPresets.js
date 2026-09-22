// Presets de avatares vectoriales SVG y personalidades para el Conserje de IA

export const AI_AVATAR_PRESETS = [
  {
    id: 'lumi_spark',
    name: 'Lumi Spark',
    tag: 'Oficial Aluna',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lumi_grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#10B981" />
          <stop offset="100%" stop-color="#047857" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="30" fill="url(#lumi_grad)" />
      <path d="M50 20 L58 42 L80 50 L58 58 L50 80 L42 58 L20 50 L42 42 Z" fill="#FDE047" />
      <circle cx="50" cy="50" r="10" fill="#FFFFFF" />
      <circle cx="70" cy="28" r="4" fill="#FDE047" />
      <circle cx="30" cy="72" r="3" fill="#FFFFFF" opacity="0.8" />
    </svg>`
  },
  {
    id: 'chef_asian',
    name: 'Boki / Chef Asiático',
    tag: 'Poke & Bento',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="chef_asian_grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#F97316" />
          <stop offset="100%" stop-color="#C2410C" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="30" fill="url(#chef_asian_grad)" />
      <!-- Bandana / Hachimaki -->
      <rect x="22" y="26" width="56" height="14" rx="4" fill="#FFFFFF" />
      <circle cx="50" cy="33" r="4" fill="#EF4444" />
      <!-- Face -->
      <ellipse cx="50" cy="54" rx="22" ry="20" fill="#FED7AA" />
      <!-- Eyes smiling -->
      <path d="M38 52 Q43 47 48 52" stroke="#431407" stroke-width="3" stroke-linecap="round" fill="none" />
      <path d="M52 52 Q57 47 62 52" stroke="#431407" stroke-width="3" stroke-linecap="round" fill="none" />
      <!-- Smile -->
      <path d="M43 62 Q50 69 57 62" stroke="#431407" stroke-width="2.5" stroke-linecap="round" fill="none" />
      <!-- Chopsticks icon in corner -->
      <line x1="72" y1="16" x2="84" y2="28" stroke="#FEF08A" stroke-width="2.5" stroke-linecap="round" />
      <line x1="76" y1="14" x2="88" y2="26" stroke="#FEF08A" stroke-width="2.5" stroke-linecap="round" />
    </svg>`
  },
  {
    id: 'chef_gourmet',
    name: 'Chef Ejecutivo',
    tag: 'Restaurantes',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="chef_gourmet_grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#1E293B" />
          <stop offset="100%" stop-color="#0F172A" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="30" fill="url(#chef_gourmet_grad)" />
      <!-- Chef Hat -->
      <path d="M35 34 C30 30, 30 18, 42 16 C46 12, 54 12, 58 16 C70 18, 70 30, 65 34 Z" fill="#FFFFFF" />
      <rect x="34" y="32" width="32" height="7" rx="2" fill="#E2E8F0" />
      <!-- Face -->
      <circle cx="50" cy="52" r="16" fill="#FCD34D" />
      <!-- Mustache -->
      <path d="M42 55 Q47 51 50 54 Q53 51 58 55 Q53 58 50 56 Q47 58 42 55 Z" fill="#78350F" />
      <!-- Eyes -->
      <circle cx="44" cy="48" r="2" fill="#1E293B" />
      <circle cx="56" cy="48" r="2" fill="#1E293B" />
      <!-- Jacket collar -->
      <path d="M32 78 L42 66 L58 66 L68 78 Z" fill="#FFFFFF" />
      <circle cx="50" cy="71" r="1.5" fill="#EF4444" />
    </svg>`
  },
  {
    id: 'panda_zen',
    name: 'Panda Bento',
    tag: 'Mascota Kawaii',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="panda_grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#38BDF8" />
          <stop offset="100%" stop-color="#0284C7" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="30" fill="url(#panda_grad)" />
      <!-- Ears -->
      <circle cx="33" cy="30" r="10" fill="#1E293B" />
      <circle cx="67" cy="30" r="10" fill="#1E293B" />
      <!-- Head -->
      <circle cx="50" cy="52" r="24" fill="#FFFFFF" />
      <!-- Eye patches -->
      <ellipse cx="40" cy="48" rx="6" ry="8" transform="rotate(-15 40 48)" fill="#1E293B" />
      <ellipse cx="60" cy="48" rx="6" ry="8" transform="rotate(15 60 48)" fill="#1E293B" />
      <!-- Eye shine -->
      <circle cx="41" cy="46" r="2" fill="#FFFFFF" />
      <circle cx="59" cy="46" r="2" fill="#FFFFFF" />
      <!-- Nose & Mouth -->
      <ellipse cx="50" cy="56" rx="3.5" ry="2.5" fill="#1E293B" />
      <path d="M47 60 Q50 63 53 60" stroke="#1E293B" stroke-width="1.8" stroke-linecap="round" fill="none" />
      <!-- Cheeks blush -->
      <circle cx="33" cy="56" r="3.5" fill="#F472B6" opacity="0.6" />
      <circle cx="67" cy="56" r="3.5" fill="#F472B6" opacity="0.6" />
    </svg>`
  },
  {
    id: 'friendly_bot',
    name: 'Cyber Bot',
    tag: 'Tecnológico',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bot_grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#6366F1" />
          <stop offset="100%" stop-color="#4338CA" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="30" fill="url(#bot_grad)" />
      <!-- Antenna -->
      <line x1="50" y1="18" x2="50" y2="28" stroke="#A5B4FC" stroke-width="3" stroke-linecap="round" />
      <circle cx="50" cy="16" r="4" fill="#38BDF8" />
      <!-- Head -->
      <rect x="26" y="28" width="48" height="40" rx="14" fill="#FFFFFF" />
      <!-- Screen visor -->
      <rect x="32" y="36" width="36" height="20" rx="8" fill="#0F172A" />
      <!-- Glowing Eyes -->
      <circle cx="42" cy="46" r="3" fill="#38BDF8" />
      <circle cx="58" cy="46" r="3" fill="#38BDF8" />
      <!-- Ear bolts -->
      <rect x="22" y="42" width="4" height="10" rx="2" fill="#CBD5E1" />
      <rect x="74" y="42" width="4" height="10" rx="2" fill="#CBD5E1" />
    </svg>`
  },
  {
    id: 'sommelier',
    name: 'Sommelier & Vinos',
    tag: 'Maridaje & Copas',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wine_grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#881337" />
          <stop offset="100%" stop-color="#4C0519" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="30" fill="url(#wine_grad)" />
      <!-- Wine Glass -->
      <path d="M38 28 C38 42, 46 48, 50 48 C54 48, 62 42, 62 28 Z" fill="#FFFFFF" opacity="0.2" stroke="#FECDD3" stroke-width="2" />
      <!-- Wine liquid inside -->
      <path d="M40 35 C42 43, 47 46, 50 46 C53 46, 58 43, 60 35 Z" fill="#E11D48" />
      <!-- Stem and base -->
      <line x1="50" y1="48" x2="50" y2="70" stroke="#FECDD3" stroke-width="2.5" />
      <path d="M40 70 L60 70" stroke="#FECDD3" stroke-width="3" stroke-linecap="round" />
      <!-- Sparkles -->
      <path d="M68 22 L71 27 L76 28 L71 31 L68 36 L66 31 L61 28 L66 27 Z" fill="#FDE047" />
    </svg>`
  }
];

export const AI_PERSONALITY_PRESETS = [
  {
    id: 'calido_amigable',
    name: 'Cálido y Amigable',
    badge: 'Recomendado',
    description: 'Trato cercano, jovial y muy empático. Ideal para conquistar clientes nuevos.',
    template: (assistantName, brandName) => 
      `Eres ${assistantName}, el conserje y anfitrión digital de ${brandName}. Tu trato es muy cálido, educado y entusiasta. Tu misión es guiar al cliente recomendándole los mejores platos de la carta según sus gustos o antojos.
Pregunta del cliente: "{{query}}".
Responde en un tono amigable, en máximo 2 o 3 líneas, destacando por qué le encantará la opción sugerida.`
  },
  {
    id: 'chef_gourmet',
    name: 'Chef Experto / Gourmet',
    badge: 'Artesanal & Calidad',
    description: 'Énfasis en los ingredientes, técnicas de cocina, frescura y sabor umami.',
    template: (assistantName, brandName) => 
      `Eres ${assistantName}, el Chef Asesor y experto culinario de ${brandName}. Valoras los ingredientes frescos, los sabores equilibrados y la técnica de cocina.
Pregunta del cliente: "{{query}}".
Recomienda el plato ideal explicando la combinación de sabores y su valor gastronómico en 2 o 3 líneas con estilo profesional.`
  },
  {
    id: 'saludable_fitness',
    name: 'Nutricional & Fitness',
    badge: 'Bowls & Vida Sana',
    description: 'Enfocado en equilibrio de macronutrientes, proteína, frescura y energía limpia.',
    template: (assistantName, brandName) => 
      `Eres ${assistantName}, especialista en nutrición y bienestar de ${brandName}. Ayudas a los clientes a elegir platos balanceados, ricos en proteína, fibra y vegetales frescos.
Pregunta del cliente: "{{query}}".
Sugiere la opción perfecta considerando aporte de energía, frescura y ligereza en máximo 2 o 3 líneas.`
  },
  {
    id: 'rapido_directo',
    name: 'Rápido & Dinámico',
    badge: 'Almuerzos & Delivery',
    description: 'Respuestas al grano, resolutivas y orientadas a pedir sin rodeos.',
    template: (assistantName, brandName) => 
      `Eres ${assistantName}, el asistente express de ${brandName}. Vas directo al punto con energía positiva para ayudar a pedir rápido.
Pregunta del cliente: "{{query}}".
Recomienda la opción más acertada y deliciosa en máximo 2 frases directas y apetitosas.`
  }
];
