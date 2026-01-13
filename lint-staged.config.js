module.exports = {
  '**/*.(ts|tsx|js)': (filenames) => {
    // Filter out dist files
    const filtered = filenames.filter((file) => !file.includes('/dist/') && !file.includes('\\dist\\'));
    if (filtered.length === 0) {
      return [];
    }

    return [`yarn eslint --fix ${filtered.join(' ')}`, `yarn prettier --write ${filtered.join(' ')}`];
  },
  '**/*.+(css|scss|sass)': ['yarn lint:css'],
  // Format MarkDown and JSON
  '**/*.(md|json)': (filenames) => {
    // Filter out dist files
    const filtered = filenames.filter((file) => !file.includes('/dist/') && !file.includes('\\dist\\'));
    if (filtered.length === 0) {
      return [];
    }

    return `yarn prettier --write ${filtered.join(' ')}`;
  },
};
