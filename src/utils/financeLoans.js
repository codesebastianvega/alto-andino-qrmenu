export const colombiaToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const timestamp = date => `${date}T12:00:00-05:00`;

export function summarizeLoans(loans = [], payments = [], today = colombiaToday()) {
  return loans.map(loan => {
    const abonos = payments.filter(p => p.loan_id === loan.id).sort((a, b) => b.paid_on.localeCompare(a.paid_on) || b.created_at.localeCompare(a.created_at));
    const principalPaid = abonos.reduce((s, p) => s + Number(p.principal), 0);
    const interestPaid = abonos.reduce((s, p) => s + Number(p.interest), 0);
    const principalDue = loan.kind === 'loan' ? Math.max(0, Number(loan.amount) - principalPaid) : 0;
    const interestDue = loan.kind === 'loan' ? Math.max(0, Number(loan.interest_agreed) - interestPaid) : 0;
    const balanceDue = principalDue + interestDue;
    const status = loan.kind === 'contribution' ? 'Aporte' : balanceDue === 0 ? 'Saldado' : loan.due_on && loan.due_on < today ? 'Vencido' : 'Pendiente';
    return { ...loan, payments: abonos, principalPaid, interestPaid, principalDue, interestDue, balanceDue, status };
  });
}

export function financingEntries(loans = [], payments = []) {
  const ledger = [], expenses = [];
  for (const loan of loans) {
    const direct = loan.destination === 'direct_purchase';
    const entry = { id: `loan_${loan.id}`, timestamp: timestamp(loan.received_on), amount: Number(loan.amount), accountId: loan.account_id, accountName: direct ? 'Pago directo del prestamista' : loan.account_name, type: 'credit', category: loan.kind === 'loan' ? 'Préstamo recibido' : 'Aporte al negocio', concept: `${loan.lender}: ${loan.description || (direct ? 'Compra pagada directamente' : 'Ingreso al bolsillo')}`, source: 'financing' };
    ledger.push(entry);
    if (direct) {
      expenses.push({ id: `loan_expense_${loan.id}`, category: loan.expense_category, amount: Number(loan.amount), description: loan.description || 'Compra pagada por tercero', beneficiary: loan.lender, accountName: `Pago directo: ${loan.lender}`, date: timestamp(loan.received_on), receiptUrl: loan.receipt_url, source: 'financing' });
      ledger.push({ ...entry, id: `loan_purchase_${loan.id}`, type: 'debit', category: 'Compra pagada por tercero' });
    }
  }
  for (const p of payments) {
    const loan = loans.find(l => l.id === p.loan_id);
    ledger.push({ id: `loan_payment_${p.id}`, timestamp: timestamp(p.paid_on), type: 'debit', amount: Number(p.principal) + Number(p.interest), accountId: p.account_id, accountName: p.account_name, category: 'Devolución de préstamo', concept: `${loan?.lender || 'Prestamista'} · Capital $${p.principal} · Intereses $${p.interest}`, source: 'financing' });
    if (Number(p.interest) > 0) expenses.push({ id: `loan_interest_${p.id}`, date: timestamp(p.paid_on), category: 'Intereses de préstamos', financial_interest: true, description: `Intereses pagados a ${loan?.lender || 'prestamista'}`, amount: Number(p.interest), accountId: p.account_id, accountName: p.account_name, source: 'financing' });
  }
  return { ledger, expenses };
}

export function applyFinancingToAccounts(accounts, loans, payments, openingDate = null) {
  const cutoff = openingDate ? new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(openingDate)) : null;
  return accounts.map(account => {
    const received = loans.filter(l => l.destination === 'pocket' && l.account_id === account.id && (!cutoff || l.received_on >= cutoff)).reduce((s, l) => s + Number(l.amount), 0);
    const repaid = payments.filter(p => p.account_id === account.id && (!cutoff || p.paid_on >= cutoff)).reduce((s, p) => s + Number(p.principal) + Number(p.interest), 0);
    return { ...account, balance: Number(account.balance || 0) + received - repaid };
  });
}
