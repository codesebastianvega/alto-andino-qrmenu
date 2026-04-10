import fs from 'fs';
const path = 'D:/BUSSINESS CHAN/CHAN/Programacion/alto-andino-qrmenu/src/pages/AdminOrders.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /\}\)\s*\n\s*disabled=\{updatingStatus === selectedOrder\.id\}/;

const fixedPart = `                               )}
                            </div>
                         </div>
                         <button 
                           onClick={() => updateOrderStatus(selectedOrder.id, 'new', { payment_status: 'paid', payment_method: selectedPaymentMethod })} 
                           disabled={updatingStatus === selectedOrder.id}`;

if (regex.test(content)) {
    content = content.replace(regex, fixedPart);
    fs.writeFileSync(path, content);
    console.log("AdminOrders.jsx RESTORED and fixed successfully");
} else {
    console.error("Could not find the broken part with regex");
    // Fallback: search for just the disabled line
    const disabledLineMatch = /\n\s*disabled=\{updatingStatus === selectedOrder\.id\}/;
    if (disabledLineMatch.test(content)) {
         console.log("Found disabled line, attempting fallback fix");
         content = content.replace(disabledLineMatch, '\n                           onClick={() => updateOrderStatus(selectedOrder.id, "new", { payment_status: "paid", payment_method: selectedPaymentMethod })}\n                           disabled={updatingStatus === selectedOrder.id}');
         // This is a partial fix, we still need the closing divs
         fs.writeFileSync(path, content);
    }
}
