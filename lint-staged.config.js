module.exports = {
  '**/*.(ts|tsx|js)': (filenames) => [`yarn eslint --fix .`, `yarn prettier --write ${filenames.join(' ')}`],
  '**/*.+(css|scss|sass)': ['yarn lint:css'],
  // Format MarkDown and JSON
  '**/*.(md|json)': (filenames) => `yarn prettier --write ${filenames.join(' ')}`,
};
