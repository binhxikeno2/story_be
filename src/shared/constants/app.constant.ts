export enum MessageCode {
  notFound = 'NOT_FOUND',
  badRequest = 'BAD_REQUEST',
  generalError = 'ERROR',
  expiredToken = 'EXPIRED_TOKEN',
  invalidToken = 'INVALID_TOKEN',
  badToken = 'BAD_TOKEN',
  invalidInput = 'INVALID_INPUT',
  wrongMailOrPassword = 'WRONG_MAIL_OR_PASSWORD',
  userNotFound = 'USER_NOT_FOUND',
  userExisted = 'USER_IS_EXISTED',
  cannotDelete = 'CANNOT_DELETE',
  crawlInProgress = 'CRAWL_INPROGRESS',
  categoryNotFound = 'CATEGORY_NOT_FOUND',
}

export const Message = {
  invalidInput: 'Input is invalid.',
  generalError: 'Something went wrong. Please try again later.',
  expiredToken: 'Token is expired.',
  badToken: 'Bad token.',
  notAllowedToUpload: 'NOT_ALLOWED_TO_UPLOAD',
  cannotDeleteParentRow: 'Cannot delete or update a parent row'
};

export const ErrorCode = {
  itemNotFound: 'ITEM_NOT_FOUND',
  itemExisting: 'ITEM_EXISTING',
  notAllowedToUpload: 'NOT_ALLOWED_TO_UPLOAD',
  insuranceCodeExisting: 'INSURANCE_CODE_EXISTING',
  invalidInsuranceCodeRange: 'INVALID_INSURANCE_CODE_RANGE',
};

export const RegularExpression = {
  mail: /^([a-z\d\+_\-]+)(\.[a-z\d\+_\-]+)*@([a-z\d\-]+\.)+[a-z]{2,6}$/i,
  zip: /^(\d{3})-(\d{4})$/,
  tel: /^[\d\-\+\(\)\*\#]{0,32}$/i,
  fullSize: /^[^ -~｡-ﾟ\x00-\x1f]+$/u,
  fullSizeKana: /^[ァ-ヶー\s]+$/u,
};

export const LengthConfig = {
  hash: 16,
};

export const TimeConfig = {
  accessToken: 60 * 60 * 24,  // 24 hours (24 * 60 * 60)
  refreshToken: 60 * 60 * 24 * 10, // 10 days (10 * 24 * 60 * 60) 
};
