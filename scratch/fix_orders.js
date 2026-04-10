import fs from 'fs';
const path = 'D:/BUSSINESS CHAN/CHAN/Programacion/alto-andino-qrmenu/src/pages/AdminOrders.jsx';
let content = fs.readFileSync(path, 'utf8');

const newBlock = `                               {activeMethods.length > 0 ? (
                                 activeMethods.map(m => (
                                   <button
                                     key={m.id}
                                     onClick={() => setSelectedPaymentMethod(m.id)}
                                     className={\`group relative flex items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all duration-300 \${
                                       selectedPaymentMethod === m.id 
                                         ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200 scale-[1.02]' 
                                         : 'bg-white border-neutral-100 text-neutral-400 hover:border-orange-200 hover:text-orange-500'
                                     }\`}
                                   >
                                     <Icon icon={m.icon || 'heroicons:banknotes'} className={\`text-xl transition-transform duration-300 \${selectedPaymentMethod === m.id ? 'scale-110' : 'group-hover:scale-110'}\`} />
                                     <span className="text-[11px] font-black uppercase tracking-wider">{m.name}</span>
                                     {selectedPaymentMethod === m.id && (
                                       <div className="absolute -top-1 -right-1 bg-white text-orange-500 rounded-full p-0.5 shadow-sm">
                                         <Icon icon="heroicons:check-circle-20-solid" />
                                       </div>
                                     )}
                                   </button>
                                 ))
                               ) : (
                                 <div className="col-span-2 py-4 text-center text-xs font-bold text-neutral-400 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                                   No hay métodos configurados
                                 </div>
                               )}`;

// Use a very specific regex to find the hardcoded payment methods array map block
const partialMatch = /\{\[\s+\{\s*id:\s*'cash'[\s\S]+?\}\)\}/;

if (partialMatch.test(content)) {
    content = content.replace(partialMatch, newBlock);
    fs.writeFileSync(path, content);
    console.log("AdminOrders.jsx updated successfully using regex");
} else {
    console.error("COULD NOT FIND THE HARDCODED BLOCK. Content length:", content.length);
    // Let's search for just the cash part
    if (content.includes("id: 'cash'")) {
        console.log("Found 'id: cash' but not the whole block. Trying more aggressive regex.");
        const aggressiveRegex = /\{\[\s*\{\s*id:\s*'cash'[\s\S]+?\}\s*\]\.map[\s\S]+?\}\)\}/;
        if (aggressiveRegex.test(content)) {
            content = content.replace(aggressiveRegex, newBlock);
            fs.writeFileSync(path, content);
            console.log("AdminOrders.jsx updated successfully using aggressive regex");
        } else {
            console.error("Aggressive regex failed too.");
        }
    }
}
