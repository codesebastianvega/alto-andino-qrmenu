import fs from 'fs';
const path = 'D:/BUSSINESS CHAN/CHAN/Programacion/alto-andino-qrmenu/src/pages/AdminOrders.jsx';
let content = fs.readFileSync(path, 'utf8');

const brokenPart = `                               } 
                          disabled={updatingStatus === selectedOrder.id}`;

const fixedPart = `                               }
                            </div>
                         </div>
                         <button 
                           onClick={() => updateOrderStatus(selectedOrder.id, 'new', { payment_status: 'paid', payment_method: selectedPaymentMethod })} 
                           disabled={updatingStatus === selectedOrder.id}`;

if (content.includes(brokenPart)) {
    content = content.replace(brokenPart, fixedPart);
    fs.writeFileSync(path, content);
    console.log("AdminOrders.jsx fixed successfully");
} else {
    console.error("Could not find the broken part");
}
