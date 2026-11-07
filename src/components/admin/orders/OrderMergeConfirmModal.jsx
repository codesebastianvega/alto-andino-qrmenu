import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify-icon/react';
import { Modal } from '../ui';

export const OrderMergeConfirmModal = ({
  isOpen,
  onClose,
  mergeSourceOrder,
  mergeTargetOrder,
  onConfirmMerge
}) => {
  return (
    <AnimatePresence>
      {isOpen && mergeSourceOrder && mergeTargetOrder && (
        <Modal onClose={onClose}>
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon icon="solar:globus-bold-duotone" className="text-4xl text-brand-primary animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">¿Consolidar Pedidos?</h3>
            <p className="text-gray-500 font-medium leading-relaxed mb-8">
              Estás a punto de fusionar el pedido de <span className="text-gray-900 font-bold">{mergeSourceOrder.customer_name || 'Mesa ' + mergeSourceOrder.restaurant_tables?.table_number}</span> dentro de <span className="text-gray-900 font-bold">{mergeTargetOrder.customer_name || 'Mesa ' + mergeTargetOrder.restaurant_tables?.table_number}</span>.
              <br /><br />
              Los items del primer pedido se sumarán a la cuenta del segundo y el primer pedido será eliminado.
            </p>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  onConfirmMerge(mergeSourceOrder, mergeTargetOrder);
                  onClose();
                }}
                className="w-full py-4 bg-brand-primary text-white rounded-2xl font-black shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                SÍ, CONSOLIDAR CUENTAS
              </button>
              <button 
                onClick={onClose}
                className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-bold hover:bg-gray-100 transition-all"
              >
                CANCELAR
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AnimatePresence>
  );
};

export default OrderMergeConfirmModal;
