import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && total < value) {
      throw new AppError('You do not have enough balance.');
    }

    const categoryRepository = getRepository(Category);
    let existsCategory = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!existsCategory) {
      existsCategory = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(existsCategory);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: existsCategory,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
