import chalk from 'chalk';

export const presenter = {
  formatTree(items, prefix = '', isLast = true) {
    return items.map((item, index) => {
      const isLastItem = index === items.length - 1;
      const connector = isLastItem ? '└── ' : '├── ';
      return `${prefix}${connector}${item}`;
    }).join('\n');
  },

  formatList(items, columns = 2) {
    const rows = [];
    for (let i = 0; i < items.length; i += columns) {
      const row = items.slice(i, i + columns);
      rows.push(row.join('\t'));
    }
    return rows.join('\n');
  },

  formatJson(data) {
    return JSON.stringify(data, null, 2);
  }
};
