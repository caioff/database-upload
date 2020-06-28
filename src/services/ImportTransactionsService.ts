import csvParse from 'csv-parse';
import fs from 'fs';
import Transaction from '../models/Transaction';
import { getRepository, getCustomRepository, In } from 'typeorm';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const file = fs.createReadStream(filePath);
    const parseConfig = csvParse({
      delimiter: ',',
      from_line: 2,
    });

    const resultParse = file.pipe(parseConfig);
    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    resultParse.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value) {
        return;
      }

      categories.push(category);
      transactions.push({
        title,
        type,
        value,
        category,
      });
    });

    await new Promise(resolve => resultParse.on('end', resolve));

    const categoriesRepository = getRepository(Category);
    const existentCategories = await categoriesRepository.find({
      where: { title: In(categories) },
    });

    const existentCategoriesTitles = existentCategories.map(
      existent => existent.title,
    );

    const addCategoriesTitles = categories
      .filter(catetory => !existentCategoriesTitles.includes(catetory))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoriesTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const transactionRepository = getCustomRepository(TransactionsRepository);
    const finalCategories = [...newCategories, ...existentCategories];

    const newTransactions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionRepository.save(newTransactions);
    await fs.promises.unlink(filePath);

    return newTransactions;
  }
}

export default ImportTransactionsService;
