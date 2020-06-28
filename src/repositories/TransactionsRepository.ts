import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactionsIncome = await this.find({ type: 'income' });
    const transactionsOutcome = await this.find({ type: 'outcome' });

    const totalIncome = transactionsIncome.reduce(
      (total, income) => total + Number(income.value),
      0,
    );

    const totalOutcome = transactionsOutcome.reduce(
      (total, outcome) => total + Number(outcome.value),
      0,
    );

    const balance = {
      income: totalIncome,
      outcome: totalOutcome,
      total: totalIncome - totalOutcome,
    } as Balance;

    return balance;
  }
}

export default TransactionsRepository;
