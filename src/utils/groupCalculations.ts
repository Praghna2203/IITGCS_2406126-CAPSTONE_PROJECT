import { GroupExpense, Settlement, GroupBalance, GroupMember } from '../types';

export interface Balance {
  [userId: string]: number;
}

export interface DetailedBalance {
  userId: string;
  name: string;
  owes: { [toUserId: string]: number };
  owedBy: { [fromUserId: string]: number };
  netBalance: number;
}

export const calculateGroupBalances = (
  members: GroupMember[],
  expenses: GroupExpense[],
  settlements: Settlement[]
): GroupBalance[] => {
  const balances: { [userId: string]: number } = {};
  
  // Initialize balances
  members.forEach(member => {
    balances[member.userId] = 0;
  });

  // Process expenses
  expenses.forEach(expense => {
    // Person who paid gets credited
    if (balances[expense.paidBy] !== undefined) {
      balances[expense.paidBy] += expense.amount;
    }
    
    // Each person's share gets debited
    expense.splits.forEach(split => {
      if (balances[split.userId] !== undefined) {
        balances[split.userId] -= split.amount;
      }
    });
  });

  // Process settlements
  settlements.forEach(settlement => {
    if (balances[settlement.fromUserId] !== undefined) {
      balances[settlement.fromUserId] += settlement.amount;
    }
    if (balances[settlement.toUserId] !== undefined) {
      balances[settlement.toUserId] -= settlement.amount;
    }
  });

  // Convert to GroupBalance format with settlements breakdown
  return members.map(member => {
    const memberBalance = balances[member.userId] || 0;
    const settlements: { [userId: string]: number } = {};
    
    // Calculate what this member owes to each other member
    members.forEach(otherMember => {
      if (member.userId !== otherMember.userId) {
        const otherBalance = balances[otherMember.userId] || 0;
        
        if (memberBalance < 0 && otherBalance > 0) {
          // This member owes money and the other member is owed money
          const settlement = Math.min(Math.abs(memberBalance), otherBalance);
          if (settlement > 0) {
            settlements[otherMember.userId] = settlement;
          }
        }
      }
    });

    return {
      userId: member.userId,
      name: member.name,
      balance: memberBalance,
      settlements
    };
  });
};

export const getDetailedBalances = (
  members: GroupMember[],
  expenses: GroupExpense[],
  settlements: Settlement[]
): DetailedBalance[] => {
  const balances: { [userId: string]: number } = {};
  const owesMatrix: { [userId: string]: { [toUserId: string]: number } } = {};
  
  // Initialize
  members.forEach(member => {
    balances[member.userId] = 0;
    owesMatrix[member.userId] = {};
  });

  // Process expenses to build detailed owe relationships
  expenses.forEach(expense => {
    const paidBy = expense.paidBy;
    const totalAmount = expense.amount;
    
    expense.splits.forEach(split => {
      if (split.userId !== paidBy) {
        // This person owes the payer
        if (!owesMatrix[split.userId][paidBy]) {
          owesMatrix[split.userId][paidBy] = 0;
        }
        owesMatrix[split.userId][paidBy] += split.amount;
      }
    });
  });

  // Process settlements to reduce owe amounts
  settlements.forEach(settlement => {
    const from = settlement.fromUserId;
    const to = settlement.toUserId;
    const amount = settlement.amount;
    
    if (owesMatrix[from][to]) {
      owesMatrix[from][to] = Math.max(0, owesMatrix[from][to] - amount);
    }
  });

  // Calculate net balances and detailed relationships
  return members.map(member => {
    const userId = member.userId;
    const owes: { [toUserId: string]: number } = {};
    const owedBy: { [fromUserId: string]: number } = {};
    let netBalance = 0;

    // What this member owes to others
    Object.entries(owesMatrix[userId] || {}).forEach(([toUserId, amount]) => {
      if (amount > 0) {
        owes[toUserId] = amount;
        netBalance -= amount;
      }
    });

    // What others owe to this member
    members.forEach(otherMember => {
      const amount = owesMatrix[otherMember.userId]?.[userId] || 0;
      if (amount > 0) {
        owedBy[otherMember.userId] = amount;
        netBalance += amount;
      }
    });

    return {
      userId,
      name: member.name,
      owes,
      owedBy,
      netBalance: Math.round(netBalance * 100) / 100 // Round to 2 decimal places
    };
  });
};

export const getSettlementSuggestions = (
  members: GroupMember[],
  expenses: GroupExpense[],
  settlements: Settlement[]
): Array<{ from: string; to: string; amount: number; fromName: string; toName: string }> => {
  const detailedBalances = getDetailedBalances(members, expenses, settlements);
  const suggestions: Array<{ from: string; to: string; amount: number; fromName: string; toName: string }> = [];

  detailedBalances.forEach(balance => {
    Object.entries(balance.owes).forEach(([toUserId, amount]) => {
      if (amount > 0) {
        const toMember = members.find(m => m.userId === toUserId);
        suggestions.push({
          from: balance.userId,
          to: toUserId,
          amount: Math.round(amount * 100) / 100,
          fromName: balance.name,
          toName: toMember?.name || 'Unknown'
        });
      }
    });
  });

  return suggestions.sort((a, b) => b.amount - a.amount);
};