import fs from 'fs';
const path = 'D:/BUSSINESS CHAN/CHAN/Programacion/alto-andino-qrmenu/src/pages/AdminOrders.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /{selectedOrder\.status === 'waiting_payment'[\s\S]+?{selectedOrder\.status === 'new'/;

const correctedSection = `{selectedOrder.status === 'waiting_payment' && (
                      <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300">
                        <div className="p-4 bg-white rounded-[2rem] border border-orange-100 shadow-sm relative overflow-hidden">
                           <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
                           <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-3 px-1 text-center">Seleccionar Método de Pago</p>
                           <div className="grid grid-cols-2 gap-2">
                               {activeMethods.length > 0 ? (
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
                               )}
                           </div>
                        </div>
                        <button 
                          onClick={() => updateOrderStatus(selectedOrder.id, 'new', { payment_status: 'paid', payment_method: selectedPaymentMethod })} 
                          disabled={updatingStatus === selectedOrder.id}
                          className="h-16 w-full bg-neutral-900 hover:bg-black text-white font-black rounded-[1.5rem] transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] disabled:opacity-50"
                        >
                          {updatingStatus === selectedOrder.id 
                            ? <Icon icon="line-md:loading-loop" className="text-2xl" /> 
                            : <>MARCAR COMO PAGADO <Icon icon="heroicons:bolt-20-solid" className="text-orange-400 text-xl" /></>}
                        </button>
                      </div>
                    )}

                    {selectedOrder.status === 'new'`;

if (regex.test(content)) {
    content = content.replace(regex, correctedSection);
    fs.writeFileSync(path, content);
    console.log("AdminOrders.jsx COMPLETE section updated successfully");
} else {
    console.error("COULD NOT FIND THE WAITING_PAYMENT SECTION WITH BROAD REGEX");
}
