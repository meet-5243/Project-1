const NetBalance = require('../models/NetBalance');

/**
 * Updates the net balance between two users.
 * @param {ObjectId|string} payerId - The ID of the user who paid.
 * @param {ObjectId|string} debtorId - The ID of the user who owes money.
 * @param {number} amount - The amount owed.
 */
async function updateNetBalance(payerId, debtorId, amount) {
  const pId = payerId.toString();
  const dId = debtorId.toString();

  if (pId === dId) return; // Cannot owe oneself

  // Determine userA and userB based on lexicographical order of IDs
  const userA = pId < dId ? pId : dId;
  const userB = pId < dId ? dId : pId;

  // If userA is the payer, userB owes userA. 
  // Our convention: Positive netAmount means A owes B.
  // Negative netAmount means B owes A.
  // So if payer is userA, userB owes userA -> B owes A -> netAmount decreases (becomes more negative) by amount.
  // If payer is userB, userA owes userB -> A owes B -> netAmount increases by amount.
  
  const amountChange = (pId === userA) ? -amount : amount;

  let balance = await NetBalance.findOne({ userA, userB });
  if (balance) {
    balance.netAmount += amountChange;
    // We could choose to delete the document if netAmount === 0, but keeping it as 0 is fine for history/simplicity.
    await balance.save();
  } else {
    balance = new NetBalance({
      userA,
      userB,
      netAmount: amountChange
    });
    await balance.save();
  }
}

module.exports = { updateNetBalance };
