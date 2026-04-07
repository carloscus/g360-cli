import chalk from 'chalk';

export const theme = {
  colors: {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#8B5CF6',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#06B6D4'
  },

  styles: {
    header: chalk.bold.cyan,
    success: chalk.green,
    error: chalk.red,
    warning: chalk.yellow,
    info: chalk.blue,
    muted: chalk.gray
  },

  format: {
    title: (text) => chalk.bold.cyan(`\n${text}\n`),
    section: (text) => chalk.bold.yellow(text),
    item: (text) => chalk.white(text),
    key: (text) => chalk.cyan(text),
    value: (text) => chalk.white(text)
  }
};
