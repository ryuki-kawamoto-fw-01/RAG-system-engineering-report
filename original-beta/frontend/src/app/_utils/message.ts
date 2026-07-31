import { MessageKey, MESSAGES } from '../_constants/messages';

// ユーザーに表示するメッセージを返す関数
export const getMessage = (messageId: MessageKey, ...values: string[]) => {
  let message = MESSAGES[messageId];

  if (values && values.length > 0) {
    // {0}, {1}... などのプレースホルダーを置き換える
    values.forEach((value, index) => {
      message = message.replaceAll(`{${index}}`, value);
    });
  }

  return message;
};
